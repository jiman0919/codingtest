import logging
import asyncio
import json
import textwrap
from typing import List, Optional, Any

from fastapi import FastAPI, HTTPException, Depends, Header, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from database import Base, engine, get_db
from models.tables import User, Enrollment, Course, Problem
from models.tables import TestCase, Submission, SubmissionTestCaseResult
from utils import get_current_user, get_password_hash, verify_student, require_student, to_kst
from models.submission import SubmissionRequest, SubmissionResponse, SubmitRequest
from database import get_db

from services.judge0_client import Judge0Client
from routers import courses, auth, admin, student_courses, problems, student_problems, submissions_confirm, problem_bank
from schemas import SubmissionStudentOut


Base.metadata.create_all(bind=engine)
load_dotenv()

print(" 테이블 생성 완료")

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.DEBUG) # DEBUG로 변경했던 것을 다시 INFO로 돌려놓았습니다. 필요시 DEBUG로 변경하여 사용하세요.


# --- 강좌 언어 ↔ Judge0 language_id 매핑(필요시 보강) ---
LANGUAGE_ID_GROUPS = {
    "python": {70, 71},  # 예) Python 2/3, 3.10+, 3.11+ 등
    "java":   {62},        # 예) Java 11/13/15 등
    "c":      {48, 49, 50},              # 예) C (GCC 9.x/11.x 등)
}

def _normalize_lang(s: str) -> str:
    return (s or "").strip().lower()

def _is_language_match(course_lang: str, language_id: int) -> bool:
    key = _normalize_lang(course_lang)
    group = LANGUAGE_ID_GROUPS.get(key)
    if group is None:
        # 강좌 언어가 매핑에 없으면 ‘미지원 언어’로 취급
        return False
    return language_id in group


app = FastAPI(title="Judge Yeon API")

# ✨👇 이 부분이 수정되었습니다!
origins = [
    "https://hcodetest.com",
    "http://localhost:3000",
    "http://hcodetest.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, # "*" 대신 origins 변수를 사용합니다.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

judge0_client = Judge0Client()

app.include_router(admin.router)
app.include_router(auth.router)
app.include_router(courses.router)
app.include_router(student_courses.router)
app.include_router(problems.router)
app.include_router(student_problems.router)
app.include_router(submissions_confirm.router)
app.include_router(problem_bank.router)

@app.get("/")
async def root():
    return {"message": "Judge Yeon API"}

@app.get("/health")
async def health_check():
    judge0_status = await judge0_client.test_connection()
    return {
        "api": "ok",
        "judge0": "connected" if judge0_status else "disconnected",
        "message": "Judge0가 연결되지 않았습니다. Docker 컨테이너를 시작하세요." if not judge0_status else "모든 서비스가 정상입니다."
    }


@app.post("/professor/reset-password/{student_id}")
def reset_student_password(
    student_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # 1. 현재 사용자가 교수인지 확인
    if current_user.role != "professor":
        raise HTTPException(status_code=403, detail="권한이 없습니다.")

    # 2. 초기화 대상 학생 조회
    student = db.query(User).filter(User.id == student_id, User.role == "student").first()
    if not student:
        raise HTTPException(status_code=404, detail="해당 학생이 존재하지 않습니다.")

    # 3. 해당 학생이 교수의 강의에 소속되어 있는지 확인
    enrollment = db.query(Enrollment).join(Course).filter(
        Enrollment.user_id == student_id,
        Course.user_id == current_user.id
    ).first()
    if not enrollment:
        raise HTTPException(status_code=403, detail="해당 학생은 교수님의 강의에 소속되어 있지 않습니다.")

    # 4. 비밀번호를 기본값으로 초기화 ("changeme123" 등)
    student.password_hash = get_password_hash("000000")
    db.commit()

    # 5. 초기화 완료 메시지 반환
    return {"message": f"{student.username} 학생의 비밀번호가 초기화되었습니다."}
        
@app.post("/submit", response_model=SubmissionResponse)
async def submit_code(submission: SubmissionRequest, current_user=Depends(get_current_user)):
    try:
        client = Judge0Client()
        result = await client.submit_code(
            source_code=submission.source_code,
            language_id=submission.language_id,
            stdin=submission.stdin or ""
        )
    except Exception as e:
        return {
            "status_id": 13,  # 내부 오류용 임의 코드(원하면 다른 값으로)
            "status": {"id": 13, "description": "Internal Error"},
            "stdout": None,
            "stderr": str(e),
            "compile_output": None,
            "time": None,
            "memory": None,
        }

    # --- 결과 정규화: 항상 같은 키가 존재하도록 채워줌 ---
    status = result.get("status") or {}
    result["status_id"] = result.get("status_id") or status.get("id")
    result.setdefault("stdout", None)
    result.setdefault("stderr", None)
    result.setdefault("compile_output", None)
    result.setdefault("time", None)
    result.setdefault("memory", None)

    return result
    
@app.post("/submit-testcases", response_model=SubmissionStudentOut)
async def submit_testcases(
    payload: SubmitRequest,
    current_user = Depends(require_student),   # 승인된 학생만 제출
    db: Session = Depends(get_db),
):
    # 1) 문제 확인
    problem: Problem = db.query(Problem).filter(Problem.id == payload.problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="문제를 찾을 수 없습니다.")
        
    # 1-1) 강좌 조회 및 언어 일치 검사
    course = db.query(Course).filter(Course.id == problem.course_id).first()
    if not _is_language_match(course.language, payload.language_id):
        raise HTTPException(
            status_code=400,
            detail=f"강좌 언어({course.language})와 제출 언어(language_id={payload.language_id})가 일치하지 않습니다."
        )

    # 2) 수강 승인 확인
    approved = (
        db.query(Enrollment)
        .filter(
            Enrollment.user_id == current_user.id,
            Enrollment.course_id == problem.course_id,
            Enrollment.status == "approved",
        )
        .first()
    )
    if not approved:
        raise HTTPException(status_code=403, detail="해당 강좌에 승인된 학생만 제출할 수 있습니다.")

    # 3) 중복 제출 차단(정책: 1회 제출)
    already = (
        db.query(Submission)
        .filter(Submission.user_id == current_user.id, Submission.problem_id == problem.id)
        .first()
    )
    if already:
        raise HTTPException(status_code=200, detail="이미 이 문제를 제출했습니다.")

    # 4) 테스트케이스 조회
    testcases: List[TestCase] = db.query(TestCase).filter(TestCase.problem_id == problem.id).all()
    if not testcases:
        raise HTTPException(status_code=400, detail="테스트케이스가 없습니다.")

    # 4-1) 강좌 조회(언어 확인용)
    course = db.query(Course).filter(Course.id == problem.course_id).first()

    # 5) TC별 실행/비교
    client = Judge0Client()
    results = []
    all_passed = True

    def build_python_wrapper(user_code: str, func_name: str, raw_input: str) -> str:
        return f'''
{user_code}

def __parse_args(s):
    import json, ast
    s = s.strip()
    try:
        obj = json.loads(s)
        if isinstance(obj, list):
            return obj
    except Exception:
        pass
    parts = s.split()
    conv = []
    for p in parts:
        try:
            conv.append(ast.literal_eval(p)); continue
        except Exception:
            try:
                conv.append(int(p)); continue
            except Exception:
                try:
                    conv.append(float(p)); continue
                except Exception:
                    conv.append(p)
    return conv

_args = __parse_args({raw_input!r})
print({func_name}(*_args))
'''.lstrip()

    for tc in testcases:
        source_to_run = payload.source_code
        stdin_to_use = ""

        if course and (course.language or "").lower().startswith("python"):
            source_to_run = build_python_wrapper(
                user_code=payload.source_code,
                func_name=problem.function_name,
                raw_input=tc.input or ""
            )
        else:
            stdin_to_use = tc.input or ""

        run = await client.submit_code(
            source_code=source_to_run,
            language_id=payload.language_id,
            stdin=stdin_to_use
        )
        actual = (run.get("stdout") or "").strip()
        expected = (tc.expected_output or "").strip()

        passed = (actual == expected)
        if not passed:
            all_passed = False

        results.append({
            "input": tc.input,
            "expected": expected,
            "actual": actual,
            "passed": passed,
        })

    # 6) 점수 계산(전부 통과 시 문제 점수, 아니면 0)
    final_score = problem.score if all_passed else 0

    # 7) DB 저장 (Submission 1건 + TC 결과 N건)
    sub = Submission(
        user_id=current_user.id,
        problem_id=problem.id,
        code=payload.source_code,
        is_correct=all_passed,
        score=final_score,
    )
    db.add(sub)
    db.flush()  # sub.id 확보

    for r in results:
        db.add(SubmissionTestCaseResult(
            submission_id=sub.id,
            testcase_input=r["input"],
            expected_output=r["expected"],
            actual_output=r["actual"],
            passed=r["passed"],
        ))

    db.commit()
    db.refresh(sub)

    # 8) 학생에게는 최소 정보만 반환
    return SubmissionStudentOut(
        problem_id=problem.id,
        is_submitted=True,
        submitted_at=to_kst(sub.submitted_at),
    )




@app.get("/submission/{token}")
async def get_submission(token: str):
    try:
        result = await judge0_client.get_submission(token)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/languages")
async def get_languages():
    try:
        languages = await judge0_client.get_languages()
        return languages
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)