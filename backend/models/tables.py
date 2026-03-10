from sqlalchemy import Column, Integer, String, ForeignKey, Text, DateTime, Boolean, UniqueConstraint
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime, timezone

# 유저 테이블 (학생, 교수 통합)
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)  # 기본 키
    username = Column(String, unique=True, nullable=False)  # 로그인 ID (중복 불가)
    password_hash = Column(String, nullable=False)  # 암호화된 비밀번호
    name = Column(String, nullable=False)  # 이름
    role = Column(String, nullable=False)  # 역할 구분: "student" 또는 "professor"

    # 관계: 교수가 개설한 강좌
    courses = relationship("Course", back_populates="user", cascade = "all, delete-orphan")
    # 관계: 학생이 수강 신청한 강좌
    enrollments = relationship("Enrollment", back_populates="user")
    # 관계: 유저가 제출한 문제들
    submissions = relationship("Submission", back_populates="user",cascade = "all, delete-orphan")
    # 관계 : 한 사용자는 여러 토큰을 가질 수 있음 (1:N)(추가)
    tokens = relationship("Token", back_populates="user", passive_deletes=True)
    
    owned_bank_items = relationship(
        "ProblemBankItem",
        foreign_keys="ProblemBankItem.created_by",  # ProblemBankItem.created_by를 통해 연결
        back_populates="owner",                      # ProblemBankItem.owner 와 짝맞춤
        passive_deletes=True,                        # DB ondelete=SET NULL 존중 (실제 삭제는 DB가 처리)
    )
    
# 토큰 테이블 (로그인 인증, 권한구분, 로그아웃: Access/Refresh 토큰 관리용 - Refresh Token만 저장하여 세션을 추적)(추가)
class Token(Base):
    __tablename__ = "tokens"

    id = Column(Integer, primary_key=True, index=True)  # 토큰 고유 ID (Primary Key)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)  # 토큰 소유자 (users 테이블 외래키)
    refresh_token = Column(Text, nullable=False)  # JWT 형식의 Refresh Token (Access는 저장 X)
    issued_at = Column(DateTime, default=datetime.utcnow)  # 토큰 발급 시각
    expired_at = Column(DateTime, nullable=False)  # 토큰 만료 시각 (Refresh 기준)
    is_valid = Column(Boolean, default=True)  # 유효한 토큰 여부 (False면 로그아웃/폐기됨)

    # 관계 : 이 토큰이 연결된 사용자 객체
    user = relationship("User", back_populates="tokens")
    
# 강좌 테이블
class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)  # 강좌 ID
    name = Column(String, nullable=False)  # 강좌명
    language = Column(String, nullable=False)  # 사용 언어 (ex. python, java)
    max_students = Column(Integer, nullable=False)  # 최대 수강 인원
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))  # 강좌 개설 교수의 ID

    # 관계: 교수 유저와 연결
    user = relationship("User", back_populates="courses")
    # 관계: 수강 신청 목록(cascade= 강좌 삭제되면 수강 중인 학생도 삭제
    enrollments = relationship("Enrollment", back_populates="course", cascade = "all, delete-orphan")
    # 관계 : 문제 목록(cascade 강좌 삭제시 문제도 삭제)
    problems = relationship("Problem", back_populates="course",cascade = "all, delete-orphan")


# 수강 신청 테이블
class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, index=True)  # 수강 신청 ID
    user_id = Column(Integer, ForeignKey("users.id"))  # 수강 신청한 학생 ID
    course_id = Column(Integer, ForeignKey("courses.id"))  # 신청한 강좌 ID
    status = Column(String, nullable=False, default="pending")  # 승인 상태: "pending" 또는 "approved"

    # 관계: 신청한 학생 유저와 연결
    user = relationship("User", back_populates="enrollments")
    # 관계: 신청한 강좌와 연결
    course = relationship("Course", back_populates="enrollments")


# 문제 테이블
class Problem(Base):
    __tablename__ = "problems"

    id = Column(Integer, primary_key=True, index=True)  # 문제 ID
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"))  # 소속된 강좌 ID
    title = Column(String, nullable=False)  # 문제 제목
    description = Column(Text, nullable=False)  # 문제 설명
    function_name = Column(String, nullable=True)  # 함수 이름 (ex. def solution)
    default_code = Column(Text, nullable=False)  # 기본 제공 코드
    examples_json = Column(Text, nullable=False, default="[]")
    score = Column(Integer, nullable=False)  # 배점

    # 관계: 문제 소속 강좌와 연결
    course = relationship("Course", back_populates="problems")
    # 관계: 제출 결과와 연결
    submissions = relationship("Submission", back_populates="problem", cascade="all, delete")
    # 관계: 문제 삭제 시 테스트케이스도 삭제
    testcases = relationship("TestCase", back_populates="problem", cascade="all, delete")
    # 관계: 문제 은행과 연결
    bank_item_id = Column(Integer, ForeignKey("problem_bank_items.id", ondelete="SET NULL"), nullable=True)


# 테스트케이스 테이블
class TestCase(Base):
    __tablename__ = "testcases"

    id = Column(Integer, primary_key=True, index=True)  # 테스트케이스 ID
    problem_id = Column(Integer, ForeignKey("problems.id", ondelete="CASCADE"), nullable=False)  # 문제 ID
    input = Column(Text, nullable=False)  # 테스트 입력값
    expected_output = Column(Text, nullable=False)  # 기대 출력값

    # 관계: 소속 문제와 연결
    problem = relationship("Problem", back_populates="testcases")


# 제출 테이블
class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)  # 제출 ID
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)  # 제출한 유저 ID
    problem_id = Column(Integer, ForeignKey("problems.id"), nullable=False)  # 문제 ID
    code = Column(Text, nullable=False)  # 제출한 코드
    is_correct = Column(Boolean, nullable=False)  # 정답 여부
    score = Column(Integer, nullable=True)  # 점수 (정답일 경우)
    submitted_at = Column(DateTime, default=datetime.utcnow)  # 제출 시각

    # 관계: 유저, 문제와 연결
    user = relationship("User", back_populates="submissions")
    problem = relationship("Problem", back_populates="submissions")
    # 관계: 테스트케이스 제출 결과와 연결
    testcase_results = relationship("SubmissionTestCaseResult", back_populates="submission", cascade = "all, delete")
    
# 제출 초기화 테이블
class SubmissionResetRequest(Base):
    __tablename__ = "submission_reset_requests"
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    problem_id = Column(Integer, ForeignKey("problems.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    requested_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        # 한 학생이 같은 문제에 대해 요청은 1개만 존재하도록 보장
        UniqueConstraint("course_id", "problem_id", "student_id", name="uq_reset_req_cps"),
    )

# 테스트케이스별 결과 테이블
class SubmissionTestCaseResult(Base):
    __tablename__ = "submission_testcase_results"

    id = Column(Integer, primary_key=True, index=True)  # 결과 ID
    submission_id = Column(Integer, ForeignKey("submissions.id"), nullable=False)  # 소속된 제출 ID
    testcase_input = Column(Text, nullable=False)  # 테스트케이스 입력
    expected_output = Column(Text, nullable=False)  # 기대 출력
    actual_output = Column(Text, nullable=False)  # 실제 실행 결과
    passed = Column(Boolean, nullable=False)  # 통과 여부

    # 관계: 소속된 제출과 연결
    submission = relationship("Submission", back_populates="testcase_results")
    
#문제 은행 테이블
class ProblemBankItem(Base):
    __tablename__ = "problem_bank_items"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)

    language = Column(String, nullable=False)          # "c" | "python" | "java"
    function_name = Column(String, nullable=True)      # python일 때만 의미
    default_code = Column(Text, nullable=True)

    # 예시 입/출력: example_input은 JSON 문자열로 저장
    example_input = Column(Text, nullable=True)        # '["3 5", "10 2"]'
    example_output = Column(Text, nullable=True)

    score = Column(Integer, nullable=False, default=0) # 상세에 점수 안 보여도 컬럼 유지

    # 작성자/메타
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    owner = relationship(
        "User",
        foreign_keys=[created_by],           
        back_populates="owned_bank_items",   
        lazy="joined",
    )

    # 소프트 삭제 메타
    is_deleted = Column(Boolean, nullable=False, default=False)
    deleted_at = Column(DateTime, nullable=True)
    deleted_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    testcases = relationship("ProblemBankTestCase", back_populates="bank_item", cascade="all, delete-orphan")

#문제 은행 테스트케이스 테이블
class ProblemBankTestCase(Base):
    __tablename__ = "problem_bank_testcases"

    id = Column(Integer, primary_key=True, index=True)
    bank_item_id = Column(Integer, ForeignKey("problem_bank_items.id", ondelete="CASCADE"), index=True, nullable=False)
    input = Column(Text, nullable=False)               # 서버에서 '\n'.join 정규화
    expected_output = Column(Text, nullable=False)
    order = Column(Integer, nullable=False, default=1)

    bank_item = relationship("ProblemBankItem", back_populates="testcases")
