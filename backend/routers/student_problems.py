from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from utils import get_current_user, require_student, to_kst
from database import get_db
from models.tables import Course, Enrollment, Problem, User, SubmissionResetRequest, Submission, SubmissionResetRequest
from schemas import ProblemListOut, ProblemStudentOut, ResetRequestOut, SubmissionStudentOut
from datetime import datetime, timezone
from typing import List
import json

router = APIRouter(
    prefix="/student/courses",
    tags=["Student-Problems"]
)

@router.get("/{course_id}/problems", response_model=List[ProblemListOut])
def get_problems_for_student_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_student)
):
    # 1. 강좌 존재 여부 확인
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="강좌를 찾을 수 없습니다.")

    # 2. 수강 신청 여부 확인
    enrollment = db.query(Enrollment).filter(
        Enrollment.course_id == course_id,
        Enrollment.user_id == current_user.id,
        Enrollment.status == "approved"
    ).first()
    if not enrollment:
        raise HTTPException(status_code=403, detail="이 강좌에 접근할 권한이 없습니다.")

    # 3. 문제 목록 조회
    problems = db.query(Problem).filter(Problem.course_id == course_id).all()
    return problems

@router.get("/problems/{problem_id}", response_model=ProblemStudentOut)
def get_problem_detail_for_student(
    problem_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_student),
):
    # 1. 문제 가져오기
    problem = db.query(Problem).filter(Problem.id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="문제를 찾을 수 없습니다.")

    # 2. 수강 여부 확인
    enrollment = db.query(Enrollment).filter(
        Enrollment.course_id == problem.course_id,
        Enrollment.user_id == current_user.id,
        Enrollment.status == "approved"
    ).first()
    if not enrollment:
        raise HTTPException(status_code=403, detail="해당 문제에 접근할 권한이 없습니다.")
    
    examples = json.loads(problem.examples_json or "[]")
    problem.examples = [
        {"input": e["input"], "expected_output": e["expected_output"]}
        for e in examples
    ]
    
    course = db.query(Course).filter(Course.id == problem.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="문제의 강좌를 찾을 수 없습니다.")
    problem.language = course.language
    
    # 3. 테스트케이스 없이 문제 정보만 응답
    return problem
    
@router.post("/problems/{problem_id}/request-reset", response_model=ResetRequestOut)
def request_reset_for_problem(
    problem_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_student),
):

    # 문제/강좌 확인
    problem = db.query(Problem).filter(Problem.id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="문제를 찾을 수 없습니다.")
    course = db.query(Course).filter(Course.id == problem.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="강좌를 찾을 수 없습니다.")

    # 실제 제출이 있을 때만 요청 의미 있음
    exists = db.query(Submission).filter(
        Submission.user_id == current_user.id,
        Submission.problem_id == problem_id,
    ).first()
    if not exists:
        raise HTTPException(status_code=400, detail="삭제할 제출 기록이 없습니다.")

    # 중복 요청 방지: 있으면 시간만 최신으로 갱신
    req = db.query(SubmissionResetRequest).filter(
        and_(
            SubmissionResetRequest.course_id == course.id,
            SubmissionResetRequest.problem_id == problem_id,
            SubmissionResetRequest.student_id == current_user.id,
        )
    ).first()

    now = datetime.now(timezone.utc)
    if req:
        req.requested_at = now
    else:
        req = SubmissionResetRequest(
            course_id=course.id,
            problem_id=problem_id,
            student_id=current_user.id,
            requested_at=now,
        )
        db.add(req)

    db.commit()
    db.refresh(req)

    return ResetRequestOut(
        course_id=req.course_id,
        problem_id=req.problem_id,
        student_id=req.student_id,
        requested_at=req.requested_at,
    )
    
@router.get("/{course_id}/problems/submission-status", response_model=List[SubmissionStudentOut])
def list_submission_status_for_student(
    course_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_student),
):
    # 1) 강좌 확인
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="강좌를 찾을 수 없습니다.")

    # 2) 수강 승인 확인
    enrollment = db.query(Enrollment).filter(
        Enrollment.course_id == course_id,
        Enrollment.user_id == current_user.id,
        Enrollment.status == "approved"
    ).first()
    if not enrollment:
        raise HTTPException(status_code=403, detail="이 강좌에 접근할 권한이 없습니다.")

    # 3) 강좌의 모든 문제 LEFT JOIN 현재 학생 제출
    rows = (
        db.query(
            Problem.id.label("problem_id"),
            Submission.submitted_at.label("submitted_at"),
        )
        .outerjoin(
            Submission,
            and_(
                Submission.problem_id == Problem.id,
                Submission.user_id == current_user.id,
            ),
        )
        .filter(Problem.course_id == course_id)
        .order_by(Problem.id.asc())
        .all()
    )

    # 4) is_submitted / submitted_at(KST) 구성
    return [
        SubmissionStudentOut(
            problem_id=r.problem_id,
            is_submitted=(r.submitted_at is not None),
            submitted_at=(to_kst(r.submitted_at) if r.submitted_at else None),
        )
        for r in rows
    ]
