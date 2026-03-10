from pydantic import BaseModel, Field, validator, constr, ConfigDict
from typing import Optional, List, Union
from datetime import datetime

#-------------------------------------------------------------------#
# 사용자 회원가입 요청 스키마
# professor와 student 공통으로 사용하며, role에 따라 유효성 분기
class UserRegister(BaseModel):
    username: str = Field(..., min_length=4, max_length=30)
    password: str = Field(..., min_length=8)
    confirm_password: constr(min_length=8)
    name: str = Field(..., min_length=1)
    role: str = Field(..., pattern="^(student|professor|admin)$") # 역할: student 또는 professor

    # student일 경우 username이 9자리 숫자(학번)인지 검사
    @validator("username")
    def validate_username(cls, v, values):
        role = values.get("role")
        if role == "student":
            if not (v.isdigit() and len(v) == 9):
                raise ValueError("학생 username은 9자리 숫자 학번이어야 합니다.")
        return v

# 로그인 요청 시 사용하는 스키마
# username과 password를 받아 로그인 시도합니다.
# 교수/학생 구분 없이 공통 사용합니다.
class LoginRequest(BaseModel):
    username: str = Field(..., description="사용자 ID (학번 또는 교수 ID)")
    password: str = Field(..., min_length=4, description="비밀번호 (8자 이상)")

# 로그인 성공 시 클라이언트에게 전달되는 토큰 응답 형식
# Access Token은 Authorization 헤더에 사용하고, Refresh Token은 저장해두었다가 Access 재발급 시 사용합니다.
class TokenResponse(BaseModel):
    access_token: str = Field(..., description="JWT 형식의 Access Token (15분 유효)")
    refresh_token: str = Field(..., description="JWT 형식의 Refresh Token (7일 이상 유효)")
    token_type: str = Field(default="bearer", description="고정값: bearer")
    expires_in: int = Field(..., description="Access Token 만료까지 남은 시간 (초 단위)")
    role: str

# 교수 또는 관리자가 특정 학생의 비밀번호를 '0000'으로 초기화할 때 사용
# 대상 학생의 username(=학번)을 입력받습니다.
class PasswordResetRequest(BaseModel):
    username: str = Field(..., min_length=9, max_length=9, description="비밀번호를 초기화할 학생의 학번 (9자리 숫자)")

# 교수 또는 관리자가 특정 학생의 비밀번호를 '0000'으로 초기한 후 변경때 사용
class PasswordChangeRequest(BaseModel):
    current_password: str = Field(..., min_length=4)
    new_password: str = Field(..., min_length=8)
    confirm_new_password: str = Field(..., min_length=8)
    
#----------------------------------------------------------------------#

# 강좌 생성 요청 모델
class CourseCreate(BaseModel):
    name: str = Field(..., min_length=1)  # 강좌명
    language: str = Field(..., min_length=1)  # 사용 언어 (예: python)
    max_students: int = Field(..., gt=0)  # 최대 수강 인원
    
# 강좌 수정 요청 모델
class CourseUpdate(BaseModel):
    name: Optional[str] = None  # 강좌명 (선택 수정)
    language: Optional[str] = None  # 사용 언어 (선택 수정)
    max_students: Optional[int] = None  # 최대 수강 인원 (선택 수정)

    model_config = ConfigDict(from_attributes=True)

#강좌 조회 응답 모델
class CourseOut(BaseModel):
    id: int
    name: str
    language: str
    max_students: int
    current_students: int = 0

    model_config = ConfigDict(from_attributes=True)
        
#강좌 조회 응답 모델 (학생용)
class CourseStudentOut(BaseModel):
    id: int
    name: str # 강좌명
    professor_name: str # 교수명
    language: str
    max_students: int
    current_students: int = 0

    model_config = ConfigDict(from_attributes=True)
        
#강좌 수강 신청 상태 응답 모델 (학생용)
class EnrollmentStatusOut(BaseModel):
    course_id: int
    course_name: str
    language: str
    status: str  # "pending", "approved", "rejected"

    model_config = ConfigDict(from_attributes=True)

# 수강 신청 요청 모델
class EnrollmentRequest(BaseModel):
    course_id: int  # 신청할 강좌 ID
    
# 수강 신청 조회 응답 모델 (교수용)
class EnrollmentOut(BaseModel):
    id: int  # 신청 ID
    user_id: int  # 신청한 학생의 ID
    name: str  # 학생 이름
    username: str  # 학번 (학생 로그인 ID)
    course_id: int  # 신청한 강좌 ID
    status: str  # "pending", "approved" 등

    model_config = ConfigDict(from_attributes=True)


# 문제 생성 요청 모델
class ProblemCreate(BaseModel):
    title: str  # 문제 제목
    description: str  # 문제 설명
    function_name: Optional[str] = None  # 함수 이름
    default_code: str  # 기본 코드
    examples : List["TestCaseCreate"] = Field(default_factory = list)
    score: int  # 배점
    course_id: int  # 소속 강좌 ID
    testcases: List["TestCaseCreate"] = Field(default_factory = list)

# 문제 수정 요청 모델
class ProblemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    function_name: Optional[str] = None
    default_code: Optional[str] = None
    examples: Optional[List["TestCaseCreate"]] = None
    testcases: Optional[List["TestCaseUpdate"]] = None

# 문제 조회 응답 모델 (교수용)
class ProblemOut(BaseModel):
    id: int
    title: str
    description: str
    function_name: Optional[str]
    default_code: str
    examples: List["TestCaseOut"]
    score: int
    course_id: int
    testcases: List["TestCaseOut"]

    model_config = ConfigDict(from_attributes=True)
        
# 문제 삭제 응답 모델
class ProblemDeleteOut(BaseModel):
    id: int
    title: str
    
# 문제 은행 목록 응답 모델
class ProblemBankItemListOut(BaseModel):
    id: int
    title: str
    author_name: str
    language: Optional[str] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# 문제 은행 테스트케이스 모델
class ProblemBankTestCaseOut(BaseModel):
    order: int
    input: str
    expected_output: str
    
    model_config = ConfigDict(from_attributes=True)

# 문제 은행 상세 조회 모델
class ProblemBankItemDetailOut(BaseModel):
    id: int
    title: str
    author_name: str
    language: Optional[str] = None
    description: Optional[str] = None
    function_name: Optional[str] = None
    default_code: Optional[str] = None
    example_input: List[str] = []
    example_output: Optional[str] = None
    score: Optional[int] = None
    testcases: List[ProblemBankTestCaseOut] = []
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

# 문제 목록 응답 모델 (학생용)
class ProblemListOut(BaseModel):
    id: int
    title: str
    score: int

    model_config = ConfigDict(from_attributes=True)

# 문제 상세 응답 모델 (학생용)
class ProblemStudentOut(BaseModel):
    id: int
    title: str
    description: str
    default_code: str
    examples: List["TestCaseOut"]
    score: int
    language: str

    model_config = ConfigDict(from_attributes=True)

# 테스트케이스 생성 요청 모델
class TestCaseCreate(BaseModel):
    input: Union[str, List[str]]
    expected_output: str
    
    @validator("input", pre=True)
    def _normalize_input(cls, v):
        if isinstance(v, list):
            return "\n".join(str(x).strip() for x in v)
        return "" if v is None else str(v)

# 테스트케이스 수정 요청 모델
class TestCaseUpdate(BaseModel):
    input: Union[str, List[str], None] = None
    expected_output: Optional[str] = None

    @validator("input", pre=True)
    def _normalize_input_update(cls, v):
        if v is None:
            return None                     # 라우터에서 건드리지 않음
        if isinstance(v, list):
            return "\n".join(str(x).strip() for x in v)
        return str(v)


# 테스트케이스 조회 응답 모델
class TestCaseOut(BaseModel):
    id: Optional[int] = None
    input: str
    expected_output: str

    model_config = ConfigDict(from_attributes=True)

# 제출 테스트케이스별 결과 응답 모델
class SubmissionTestCaseResultOut(BaseModel):
    testcase_input: str
    expected_output: str
    actual_output: str
    passed: bool

    model_config = ConfigDict(from_attributes=True)

# 제출 정보 응답 모델 (교수용)
class SubmissionOut(BaseModel):
    id: int
    user_id: int  # 제출한 유저 ID
    problem_id: int
    code: str
    is_correct: bool
    score: Optional[int]
    submitted_at: datetime
    testcase_results: List["SubmissionTestCaseResultOut"]

    model_config = ConfigDict(from_attributes=True)

# 제출 정보 응답 모델 (학생용)
class SubmissionStudentOut(BaseModel):
    problem_id: int
    is_submitted: bool
    submitted_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)
        
# 학생별 총점 응답 모델
class StudentScoreOut(BaseModel):
    user_id: int            # 학생의 ID
    name: str               # 학생 이름
    username: str           # 학번이나 유저명
    total_score: int        # 해당 강의에서 획득한 총점

    model_config = ConfigDict(from_attributes=True)

# 학생의 문제별 결과 및 점수 응답 모델        
class StudentProblemScoreOut(BaseModel):
    problem_id: int
    problem_title: str
    is_correct: bool
    score: int
    submitted_at: Optional[datetime]


class SubmissionTestCaseDetailOut(BaseModel):
    # 테스트케이스별 상세(필수 항목만)
    testcase_input: str
    expected_output: str
    actual_output: str
    passed: bool

    model_config = ConfigDict(from_attributes=True)

#제출 상세 정보 조회
class SubmissionProfessorDetailOut(BaseModel):
    # 제출 메타
    id: int
    problem_id: int
    problem_title: str
    problem_score: int
    function_name: Optional[str]
    # 제출 코드/채점 결과
    source_code: str
    is_correct: bool
    score: Optional[int]
    submitted_at: datetime
    # 테스트케이스 상세 목록
    testcase_results: List[SubmissionTestCaseDetailOut]

    model_config = ConfigDict(from_attributes=True)
    
# 제출 초기화 모델
class ResetRequestOut(BaseModel):
    course_id: int
    problem_id: int
    student_id: int
    requested_at: datetime

        
# Pydantic v2 forward refs
ProblemCreate.model_rebuild()
ProblemUpdate.model_rebuild()
ProblemOut.model_rebuild()
ProblemStudentOut.model_rebuild()
SubmissionOut.model_rebuild()
SubmissionProfessorDetailOut.model_rebuild()

