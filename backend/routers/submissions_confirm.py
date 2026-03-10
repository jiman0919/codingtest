from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, case

from database import get_db
from models.tables import Course, User, Enrollment, Problem, Submission, SubmissionResetRequest
from schemas import StudentScoreOut,StudentProblemScoreOut, SubmissionProfessorDetailOut, SubmissionTestCaseDetailOut
from utils import require_professor, to_kst
import csv, io

router = APIRouter(tags=["submissions-confirm"])

@router.get("/courses/{course_id}/students/scores", response_model=List[StudentScoreOut])
def list_students_with_total_score(
    course_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_professor),
):
    # 강좌 소유 확인
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="강좌를 찾을 수 없습니다.")
    if course.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="해당 강좌에 접근할 수 없습니다.")

    # 승인된 수강생 기준으로, 강좌 내 모든 문제를 OUTER JOIN
    # 각 문제별로 정답이면 Problem.score, 아니면 0 → 전부 합산
    rows = (
        db.query(
            User.id.label("user_id"),
            User.name.label("name"),
            User.username.label("username"),
            func.coalesce(
                func.sum(
                    case(
                        (Submission.is_correct == True, Problem.score),
                        else_=0,
                    )
                ),
                0,
            ).label("total_score"),
        )
        .join(Enrollment, Enrollment.user_id == User.id)
        .outerjoin(Problem, Problem.course_id == course_id)
        .outerjoin(
            Submission,
            and_(
                Submission.user_id == User.id,
                Submission.problem_id == Problem.id,
            ),
        )
        .filter(
            Enrollment.course_id == course_id,
            Enrollment.status == "approved",
        )
        .group_by(User.id, User.name, User.username)
        .order_by(User.username.asc())
        .all()
    )

    return [
        StudentScoreOut(
            user_id=r.user_id,
            name=r.name,
            username=r.username,
            total_score=int(r.total_score or 0),
        )
        for r in rows
    ]

@router.get(
    "/courses/{course_id}/students/{student_id}/problems",
    response_model=List[StudentProblemScoreOut],
)
def list_student_problem_scores(
    course_id: int,
    student_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_professor),
):
    # 1) 강좌 소유 확인
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="강좌를 찾을 수 없습니다.")
    if course.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="해당 강좌에 접근할 수 없습니다.")

    # 2) (선택) 학생이 해당 강좌 승인 상태인지 확인
    enrollment = (
        db.query(Enrollment)
        .filter(
            Enrollment.course_id == course_id,
            Enrollment.user_id == student_id,
            Enrollment.status == "approved",
        )
        .first()
    )
    if not enrollment:
        raise HTTPException(status_code=404, detail="해당 강좌의 승인된 학생이 아닙니다.")

    # 3) 강좌의 모든 문제 LEFT JOIN 학생 제출(없으면 NULL)
    rows = (
        db.query(
            Problem.id.label("problem_id"),
            Problem.title.label("problem_title"),
            Problem.score.label("problem_score"),
            Submission.is_correct.label("is_correct"),
            Submission.submitted_at.label("submitted_at"),
        )
        .outerjoin(
            Submission,
            and_(
                Submission.problem_id == Problem.id,
                Submission.user_id == student_id,
            ),
        )
        .filter(Problem.course_id == course_id)
        .order_by(Problem.id.asc())
        .all()
    )

    result: List[StudentProblemScoreOut] = []
    for r in rows:
        # 제출이 없거나(is_correct is None) 오답(False) ⇒ 0점
        is_correct = bool(r.is_correct) if r.is_correct is not None else False
        per_problem_score = int(r.problem_score or 0) if is_correct else 0

        result.append(
            StudentProblemScoreOut(
                problem_id=r.problem_id,
                problem_title=r.problem_title,
                is_correct=is_correct,           # 제출 없으면 False
                score=per_problem_score,         # 정답이면 배점, 아니면 0
                submitted_at=to_kst(r.submitted_at),     # 제출 없으면 None
            )
        )
    return result
    
@router.get(
    "/courses/{course_id}/students/{student_id}/problems/{problem_id}/submission",
    response_model=SubmissionProfessorDetailOut
)
def get_submission_detail(
    course_id: int,
    student_id: int,
    problem_id: int,
    db: Session = Depends(get_db),
    _prof = Depends(require_professor),  # 교수 권한만 접근
):
    # 1) 문제가 해당 강좌 소속인지 확인
    problem = db.query(Problem).filter(
        Problem.id == problem_id,
        Problem.course_id == course_id
    ).first()
    if not problem:
        raise HTTPException(status_code=404, detail="해당 강좌의 문제가 아닙니다.")

    # 2) 해당 학생의 제출 조회 (정책: 1회 제출)
    submission = db.query(Submission).filter(
        Submission.user_id == student_id,
        Submission.problem_id == problem_id
    ).first()
    if not submission:
        raise HTTPException(status_code=404, detail="이 학생의 제출 내역이 없습니다.")

    # 3) 테스트케이스 결과 정렬(보기 좋게 id 오름차순)
    tc_results = sorted(submission.testcase_results, key=lambda r: r.id)

    # 4) 응답 구성(필수 + function_name)
    return SubmissionProfessorDetailOut(
        id=submission.id,
        problem_id=problem.id,
        problem_title=problem.title,
        problem_score=problem.score,
        function_name=problem.function_name,
        source_code=submission.code,
        is_correct=submission.is_correct,
        score=submission.score,
        submitted_at=to_kst(submission.submitted_at),
        testcase_results=[
            SubmissionTestCaseDetailOut(
                testcase_input=r.testcase_input,
                expected_output=r.expected_output,
                actual_output=r.actual_output,
                passed=r.passed,
            )
            for r in tc_results
        ],
    )

@router.post("/{course_id}/students/{student_id}/problems/{problem_id}/reset-submission")
def reset_submission_only_if_requested(
    course_id: int,
    student_id: int,
    problem_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_professor),
):
    # 강좌 소유자 검증
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course or course.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="해당 강좌 접근 권한이 없습니다.")

    # 문제 소속 검증
    problem = db.query(Problem).filter(
        Problem.id == problem_id,
        Problem.course_id == course_id
    ).first()
    if not problem:
        raise HTTPException(status_code=404, detail="강좌에 속한 문제가 아닙니다.")

    # 학생의 '요청' 존재 여부 확인 (없으면 거부)
    req = db.query(SubmissionResetRequest).filter(
        and_(
            SubmissionResetRequest.course_id == course_id,
            SubmissionResetRequest.problem_id == problem_id,
            SubmissionResetRequest.student_id == student_id,
        )
    ).first()
    if not req:
        raise HTTPException(
            status_code=409,
            detail="학생의 초기화 요청이 필요합니다. (요청이 접수되어야 초기화할 수 있습니다.)"
        )

    # 실제 제출 삭제(하드삭제)
    submission = db.query(Submission).filter(
        Submission.user_id == student_id,
        Submission.problem_id == problem_id
    ).first()

    if submission:
        db.delete(submission)
        db.commit()

    # 요청 레코드 제거(소비)
    db.delete(req)
    db.commit()

    return {
        "message": "제출을 초기화했습니다. 학생은 다시 제출할 수 있습니다.",
        "student_id": student_id,
        "problem_id": problem_id,
    }
    
@router.get("/courses/{course_id}/students/scores/export.csv")
def export_course_students_scores_csv(
    course_id: int,
    db: Session = Depends(get_db),
    prof = Depends(require_professor),
):
    # 1) 강좌 소유 교수 확인
    course = (
        db.query(Course)
        .filter(Course.id == course_id, Course.user_id == prof.id)
        .first()
    )
    if not course:
        raise HTTPException(status_code=403, detail="해당 강좌의 소유 교수가 아닙니다.")

    # 2) 학번 오름차순으로 학생 총점 집계 (미제출=0점)
    rows = (
        db.query(
            User.name.label("student_name"),
            User.username.label("student_username"),
            func.coalesce(
                func.sum(
                    case(
                        (Submission.is_correct == True, Problem.score),
                        else_=0,
                    )
                ),
                0,
            ).label("total_score"),
        )
        .join(Enrollment, Enrollment.user_id == User.id)
        .outerjoin(
            Submission,
            Submission.user_id == User.id,
        )
        .outerjoin(
            Problem,
            and_(Problem.id == Submission.problem_id, Problem.course_id == course_id),
        )
        .filter(Enrollment.course_id == course_id, Enrollment.status == "approved")
        .group_by(User.id, User.name, User.username)
        .order_by(User.username.asc())
        .all()
    )

    # 3) CSV 생성 (가로 헤더, 한글 컬럼명)
    buf = io.StringIO()
    w = csv.writer(buf, lineterminator="\n", quoting=csv.QUOTE_ALL)
    w.writerow(["강좌명", "학생이름", "학생아이디(학번)", "총점"])

    for r in rows:
        w.writerow([course.name or "", r.student_name or "", r.student_username or "", int(r.total_score or 0)])

    csv_bytes = buf.getvalue().encode("utf-8-sig")  # 엑셀 한글 OK
    filename = f"course{course_id}_students_scores.csv"
    return Response(
        content=csv_bytes,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename=\"{filename}\"'}
    )
    


@router.get("/courses/{course_id}/students/{student_id}/submissions/export.csv")
def export_student_all_submissions_csv(
    course_id: int,
    student_id: int,
    include_unsubmitted: bool = True,
    db: Session = Depends(get_db),
    prof = Depends(require_professor),
):
    # 소유 교수 확인
    course = db.query(Course).filter(Course.id == course_id, Course.user_id == prof.id).first()
    if not course:
        raise HTTPException(status_code=403, detail="해당 강좌의 소유 교수가 아닙니다.")

    # 학생/문제/제출 조회
    student = db.query(User).filter(User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="학생을 찾을 수 없습니다.")

    problems = (
        db.query(Problem)
        .filter(Problem.course_id == course_id)
        .order_by(Problem.id.asc())
        .all()
    )
    subs = (
        db.query(Submission)
        .join(Problem, Submission.problem_id == Problem.id)
        .filter(Submission.user_id == student_id, Problem.course_id == course_id)
        .all()
    )
    sub_by_pid = {s.problem_id: s for s in subs}
    if not problems:
        raise HTTPException(status_code=404, detail="이 강좌에는 문제가 없습니다.")
    if not sub_by_pid and not include_unsubmitted:
        raise HTTPException(status_code=404, detail="이 학생의 제출 내역이 없습니다.")

    import csv, io
    buf = io.StringIO()
    w = csv.writer(buf, lineterminator="\n", quoting=csv.QUOTE_ALL)

    # 사람이 읽기 쉬운 가로 헤더
    w.writerow([
        "학번", "이름",
        "문제ID", "문제제목", "함수명", "문제배점",
        "제출ID", "제출시각(KST)", "제출여부", "전체통과", "획득점수",
        "TC#", "입력", "예상출력", "실제출력", "통과",
        "source_code"  # 첫 행만 채움
    ])

    for prob in problems:
        sub = sub_by_pid.get(prob.id)

        if sub is None:
            if not include_unsubmitted:
                continue
            # 미제출: TC 정보 없이 한 줄만
            w.writerow([
                student.username or student_id,
                student.name or "",
                prob.id, prob.title or "", prob.function_name or "", prob.score,
                "", "", "FALSE", "", "",
                "", "", "", "", "",
                ""  # source_code 없음
            ])
            continue

        tc_results = sorted(sub.testcase_results, key=lambda r: r.id)
        wrote_code = False
        if not tc_results:
            # TC가 없으면 한 줄만
            w.writerow([
                student.username or student_id,
                student.name or "",
                prob.id, prob.title or "", prob.function_name or "", prob.score,
                sub.id, to_kst(sub.submitted_at).isoformat(), "TRUE",
                "TRUE" if sub.is_correct else "FALSE",
                sub.score if sub.score is not None else "",
                "", "", "", "", "",
                sub.code or ""
            ])
            continue

        for i, r in enumerate(tc_results, start=1):
            w.writerow([
                student.username or student_id,
                student.name or "",
                prob.id, prob.title or "", prob.function_name or "", prob.score,
                sub.id, to_kst(sub.submitted_at).isoformat(), "TRUE",
                "TRUE" if sub.is_correct else "FALSE",
                sub.score if sub.score is not None else "",
                i,
                r.testcase_input or "",
                r.expected_output or "",
                r.actual_output or "",
                "TRUE" if r.passed else "FALSE",
                (sub.code or "") if not wrote_code else ""  # 첫 행만 코드 채움
            ])
            wrote_code = True

    csv_bytes = buf.getvalue().encode("utf-8-sig")  # 엑셀 한글 OK
    filename = f"submissions_course{course_id}_student{student_id}.csv"
    return Response(
        content=csv_bytes,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename=\"{filename}\"'}
    )



