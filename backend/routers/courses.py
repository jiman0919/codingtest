from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import List

from models.tables import Course, User, Enrollment, Submission, SubmissionTestCaseResult
from schemas import CourseCreate, CourseUpdate, CourseOut, EnrollmentOut
from utils import get_current_user, verify_professor
from database import get_db

router = APIRouter(
    prefix="/courses",
    tags=["Courses"]
)

@router.get("/", response_model=List[CourseOut])
def list_my_courses(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    verify_professor(current_user)

    courses = (
        db.query(Course)
          .filter(Course.user_id == current_user.id)
          .all()
    )

    # approved 인원수를 강좌별로 한 번에 집계 (N+1 제거)
    course_ids = [c.id for c in courses]
    counts = {}
    if course_ids:
        counts = dict(
            db.query(Enrollment.course_id, func.count(Enrollment.id))
              .filter(
                  Enrollment.status == "approved",
                  Enrollment.course_id.in_(course_ids),
              )
              .group_by(Enrollment.course_id)
              .all()
        )

    course_list = [
        CourseOut(
            id=c.id,
            name=c.name,
            language=c.language,
            max_students=c.max_students,
            current_students=counts.get(c.id, 0),
        )
        for c in courses
    ]
    return course_list
    
@router.post("/", response_model=CourseOut)
def create_course(
    course: CourseCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    verify_professor(current_user)

    new_course = Course(
        name=course.name,
        language=(course.language or "").strip().lower(),
        max_students=course.max_students,
        user_id=current_user.id
    )
    db.add(new_course)
    db.commit()
    db.refresh(new_course)
    return new_course

@router.delete("/{course_id}", response_model=CourseOut, status_code=status.HTTP_200_OK)
def delete_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # 교수인지 확인
    verify_professor(current_user)

    # 강좌 존재 여부 확인
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="강좌를 찾을 수 없습니다.")

    # 본인 소유 강좌인지 확인
    if course.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="본인의 강좌만 삭제할 수 있습니다.")

    # 삭제
    db.delete(course)
    db.commit()

    return course


@router.get("/{course_id}", response_model=CourseOut)
def get_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    verify_professor(current_user)

    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="강좌를 찾을 수 없습니다.")
    if course.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="해당 강좌에 접근할 수 없습니다.")
    return course

@router.put("/{course_id}", response_model=CourseOut)
def update_course(
    course_id: int,
    course_update: CourseUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    verify_professor(current_user)

    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # 수정할 필드만 반영
    if course_update.name is not None:
        course.name = course_update.name
    if course_update.language is not None:
        course.language = (course_update.language or "").strip().lower()
    if course_update.max_students is not None:
        course.max_students = course_update.max_students

    db.commit()
    db.refresh(course)
    return course

@router.get("/{course_id}/enrollments", response_model=List[EnrollmentOut])
def get_enrollments_for_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    수강 신청 목록 조회 API
    """
    verify_professor(current_user)

    # 강좌 존재 및 소유 여부 확인
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="강좌를 찾을 수 없습니다.")
    if course.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="해당 강좌에 접근 권한이 없습니다.")

    # 수강 신청 목록 조회
    enrollments = (
        db.query(Enrollment)
        .join(User, Enrollment.user_id == User.id)
        .filter(Enrollment.course_id == course_id)
        .with_entities(
            Enrollment.id.label("id"),
            Enrollment.user_id,
            User.name,
            User.username,
            Enrollment.course_id,
            Enrollment.status
        )
        .order_by(User.username.asc())
        .all()
    )

    return enrollments
    
@router.put("/{course_id}/enrollments/{enrollment_id}/approve")
def approve_enrollment(
    course_id: int,
    enrollment_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    수강 신청 승인 API
    """
    verify_professor(current_user)

    # 강좌 존재 및 소유 여부 확인
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="강좌를 찾을 수 없습니다.")
    if course.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="해당 강좌에 대한 권한이 없습니다.")

    # 수강 신청 존재 여부 확인
    enrollment = db.query(Enrollment).filter(
        Enrollment.id == enrollment_id,
        Enrollment.course_id == course_id
    ).first()

    if not enrollment:
        raise HTTPException(status_code=404, detail="수강 신청 정보를 찾을 수 없습니다.")

    if enrollment.status == "approved":
        raise HTTPException(status_code=400, detail="이미 승인된 신청입니다.")

    # 승인 처리
    enrollment.status = "approved"
    db.commit()

    return {"message": "수강 신청이 승인되었습니다."}


@router.put("/{course_id}/enrollments/{enrollment_id}/reject")
def reject_enrollment(
    course_id: int,
    enrollment_id: int,
    delete_submissions: bool = False,   # ?delete_submissions=true 면 제출까지 삭제
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    verify_professor(current_user)

    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="강좌를 찾을 수 없습니다.")
    if course.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="해당 강좌에 대한 권한이 없습니다.")

    enrollment = db.query(Enrollment).filter(
        Enrollment.id == enrollment_id,
        Enrollment.course_id == course_id,
    ).first()
    if not enrollment:
        raise HTTPException(status_code=404, detail="수강 신청 정보를 찾을 수 없습니다.")

    student_id = enrollment.user_id

    if delete_submissions:
        # 1) 이 강좌의 문제 id 목록
        problem_ids = [pid for (pid,) in db.query(Problem.id)
                       .where(Problem.course_id == course_id).all()]

        if problem_ids:
            # 2) 이 학생의 해당 강좌 제출 id 목록
            sub_ids = [sid for (sid,) in db.query(Submission.id)
                       .where(Submission.user_id == student_id,
                              Submission.problem_id.in_(problem_ids)).all()]

            if sub_ids:
                # 3) TC 결과 먼저 삭제 (FK 안전)
                db.query(SubmissionTestCaseResult)\
                  .where(SubmissionTestCaseResult.submission_id.in_(sub_ids))\
                  .delete(synchronize_session=False)

                # 4) 제출 삭제
                db.query(Submission)\
                  .where(Submission.id.in_(sub_ids))\
                  .delete(synchronize_session=False)

    # 5) 마지막으로 수강신청 레코드 삭제 (상태와 무관)
    db.delete(enrollment)
    db.commit()

    return {"message": "수강 신청(또는 승인)이 삭제되었습니다.",
            "delete_submissions": delete_submissions}

    