from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.tables import User
from schemas import UserRegister
from utils import require_admin, get_password_hash

router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)

@router.get("/professors")
def get_all_professors(
    db: Session = Depends(get_db),
    current_admin = Depends(require_admin)
):
    return db.query(User).filter(User.role == "professor").all()

@router.get("/students")
def get_all_students(
    db: Session = Depends(get_db),
    current_admin = Depends(require_admin)
):
    return db.query(User).filter(User.role == "student").all()

@router.post("/professors")
def create_professor_account(
    data: UserRegister,
    db: Session = Depends(get_db),
    current_admin = Depends(require_admin)
):
    if data.role != "professor":
        raise HTTPException(status_code=400, detail="교수 계정만 생성할 수 있습니다.")
    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(status_code=400, detail="이미 존재하는 교수입니다.")

    new_user = User(
        username=data.username,
        password_hash=get_password_hash(data.password),
        name=data.name,
        role="professor"
    )
    db.add(new_user)
    db.commit()
    return {"message": "교수 계정 생성 완료"}

@router.delete("/professors/{username}")
def delete_professor(
    username: str,
    db: Session = Depends(get_db),
    current_admin = Depends(require_admin)
):
    user = db.query(User).filter(User.username == username, User.role == "professor").first()
    if not user:
        raise HTTPException(status_code=404, detail="해당 교수를 찾을 수 없습니다.")
    db.delete(user)
    db.commit()
    return {"message": "교수 계정 삭제 완료"}

@router.delete("/students/{username}")
def delete_student(
    username: str,
    db: Session = Depends(get_db),
    current_admin = Depends(require_admin)
):
    user = db.query(User).filter(User.username == username, User.role == "student").first()
    if not user:
        raise HTTPException(status_code=404, detail="해당 학생을 찾을 수 없습니다.")
    db.delete(user)
    db.commit()
    return {"message": "학생 계정 삭제 완료"}

@router.post("/professors/{username}/reset-password")
def reset_professor_password(
    username: str,
    db: Session = Depends(get_db),
    current_admin = Depends(require_admin)
):
    professor = db.query(User).filter(User.username == username, User.role == "professor").first()
    if not professor:
        raise HTTPException(status_code=404, detail="해당 교수 계정을 찾을 수 없습니다.")

    professor.password_hash = get_password_hash("0000")
    db.commit()
    return {"message": f"교수 '{username}'의 비밀번호를 '0000'으로 초기화했습니다."}
