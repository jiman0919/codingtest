from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload
from typing import List

from database import get_db
from models.tables import Course, Enrollment, User
from schemas import CourseStudentOut, EnrollmentRequest,  EnrollmentStatusOut
from utils import get_current_user, verify_student

router = APIRouter(
    prefix="/student",
    tags=["Student - Courses"]
)


# 1. 수강 가능한 전체 강좌 목록 조회
@router.get("/courses", response_model=List[CourseStudentOut])
def list_all_courses(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    verify_student(current_user)

    # 교수(User) 관계를 미리 로딩하여 추가 SELECT 방지
    courses = (
        db.query(Course)
          .options(joinedload(Course.user))
          .all()
    )

    # approved 상태를 강좌별로 한 번에 집계(N+1 제거)
    counts = dict(
        db.query(Enrollment.course_id, func.count(Enrollment.id))
          .filter(Enrollment.status == "approved")
          .group_by(Enrollment.course_id)
          .all()
    )
    
    results = []

    for course in courses:
        results.append(CourseStudentOut(
            id=course.id,
            name=course.name,
            professor_name= course.user.name,
            language=course.language,
            max_students=course.max_students,
            current_students=counts.get(course.id, 0)
        ))

    return results

# 2. 수강 신청
@router.post("/enroll")
def enroll_course(
    payload: EnrollmentRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    verify_student(current_user)

    # 이미 신청했는지 확인
    existing = db.query(Enrollment).filter(
        Enrollment.user_id == current_user.id,
        Enrollment.course_id == payload.course_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="이미 신청한 강좌입니다.")
    
    # 총 신청 수 제한 적용: pending + approved
    course = db.query(Course).filter(Course.id == payload.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="강좌를 찾을 수 없습니다.")

    total_applicants = db.query(Enrollment).filter(
        Enrollment.course_id == payload.course_id,
        Enrollment.status.in_(["pending", "approved"])
    ).count()

    if total_applicants >= course.max_students * 2:
        raise HTTPException(status_code=400, detail="신청이 마감되었습니다.")

    new_enroll = Enrollment(
        user_id=current_user.id,
        course_id=payload.course_id,
        status="pending"
    )
    db.add(new_enroll)
    db.commit()

    return {"message": "수강 신청이 완료되었습니다. 교수의 승인을 기다려주세요."}


# 3. 강좌 목록 상태 조회
@router.get("/my_courses", response_model=List[EnrollmentStatusOut])
def list_my_course_status(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    verify_student(current_user)

    enrollments = (
        db.query(Enrollment)
        .join(Course, Enrollment.course_id == Course.id)
        .filter(Enrollment.user_id == current_user.id)
        .all()
    )

    results = [
        EnrollmentStatusOut(
            course_id=e.course.id,
            course_name=e.course.name,
            language=e.course.language,
            status=e.status
        )
        for e in enrollments
    ]
    return results

