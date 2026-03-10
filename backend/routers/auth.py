from fastapi import APIRouter, Depends, HTTPException, Request, Header
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from models.tables import User, Token
from schemas import UserRegister, LoginRequest, TokenResponse, PasswordChangeRequest
from utils import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    get_current_user,
    get_current_user_from_refresh_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)
from database import get_db
import os

router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)

@router.post("/admin/bootstrap")
def bootstrap_admin(
    data: UserRegister,
    db: Session = Depends(get_db),
    bootstrap_token: str = Header(..., alias="X-Admin-Bootstrap-Token"),
):
    """
    관리자 최초 1회 생성 엔드포인트
    - 전제: .env에 ADMIN_BOOTSTRAP_TOKEN 이 설정되어 있어야 함
    - 헤더: X-Admin-Bootstrap-Token: <ADMIN_BOOTSTRAP_TOKEN>
    - 동작: 현재 DB에 admin 이 0명일 때만 생성 허용
    """
    env_token = os.getenv("ADMIN_BOOTSTRAP_TOKEN")
    if not env_token:
        raise HTTPException(status_code=500, detail="ADMIN_BOOTSTRAP_TOKEN이 설정되지 않았습니다.")
    if bootstrap_token != env_token:
        raise HTTPException(status_code=403, detail="부트스트랩 토큰이 올바르지 않습니다.")

    # 이미 관리자 존재하면 차단
    exists = db.query(User).filter(User.role == "admin").first()
    if exists:
        raise HTTPException(status_code=403, detail="관리자 계정은 이미 존재합니다.")

    # 요청 스키마는 UserRegister 재사용 (role 검사)
    if data.role != "admin":
        raise HTTPException(status_code=400, detail="role은 반드시 'admin' 이어야 합니다.")

    # 비밀번호 확인(선호에 따라 엄격히)
    if data.password != data.confirm_password:
        raise HTTPException(status_code=400, detail="비밀번호와 비밀번호 확인이 일치하지 않습니다.")

    # username 중복 방지
    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(status_code=400, detail="해당 username은 이미 존재합니다.")

    new_admin = User(
        username=data.username,
        password_hash=get_password_hash(data.password),
        name=data.name,
        role="admin"
    )
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)

    return {"message": "관리자 계정이 생성되었습니다.", "username": new_admin.username}

@router.post("/admin/login", response_model=TokenResponse)
def admin_login(data: LoginRequest, db: Session = Depends(get_db)):
    """
    관리자 전용 로그인
    - role == 'admin' 인 사용자만 허용
    """
    user = db.query(User).filter(User.username == data.username).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="아이디 또는 비밀번호가 올바르지 않습니다.")
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="관리자 계정이 아닙니다.")

    # 기존 Refresh 토큰 무효화
    db.query(Token).filter(Token.user_id == user.id).update({"is_valid": False})

    # 새 토큰 발급
    access_token = create_access_token(data={"sub": user.username})
    refresh_token, expire = create_refresh_token(data={"sub": user.username})

    db.add(Token(
        user_id=user.id,
        refresh_token=refresh_token,
        is_valid=True,
        expired_at=expire
    ))
    db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        role=user.role
    )


@router.post("/register")
def register_user(data: UserRegister, db: Session = Depends(get_db)):
    """
    학생 회원가입 API

    [제약 조건]
    - role은 무조건 "student"만 허용
    - username은 9자리 숫자 (학번)
    - 비밀번호와 확인 비밀번호 일치
    - 이미 존재하는 username 금지
    """
    
    # 1. role 이중 검사 (professor 우회 방지)
    if data.role != "student":
        raise HTTPException(status_code=403, detail="학생만 회원가입이 가능합니다.")

    # 2. username 학번 형식 이중 검사
    if not (data.username.isdigit() and len(data.username) == 9):
        raise HTTPException(status_code=400, detail="학번은 9자리 숫자여야 합니다.")

    # 3. 비밀번호 확인
    #if data.password != data.confirm_password:
        #raise HTTPException(status_code=400, detail="비밀번호와 비밀번호 확인이 일치하지 않습니다.")

    # 4. 중복 사용자 검사
    existing = db.query(User).filter(User.username == data.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="이미 존재하는 사용자입니다.")

    hashed_pw = get_password_hash(data.password)
    new_user = User(
        username=data.username,
        password_hash=hashed_pw,
        name=data.name,
        role="student"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "학생 계정이 성공적으로 등록되었습니다."}

@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    """
    사용자 로그인 처리:
    - 사용자 인증
    - 기존 Refresh Token 무효화
    - Access/Refresh Token 새로 생성 및 응답
    """
    
    #1. 사용자 존재 여부 확인
    user = db.query(User).filter(User.username == data.username).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="아이디 또는 비밀번호가 올바르지 않습니다.")

    #2. 기존 Refresh Token 모두 무효화
    db.query(Token).filter(Token.user_id == user.id).update({"is_valid": False})

    #3.  새 토큰 생성
    access_token = create_access_token(data={"sub": user.username})
    refresh_token, expire = create_refresh_token(data={"sub": user.username})

    #4. DB에 새 Refresh Token 저장
    new_token = Token(
        user_id=user.id,
        refresh_token=refresh_token,
        is_valid=True,
        expired_at=expire
    )
    db.add(new_token)
    db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        role=user.role
    )

@router.post("/refresh-token")
def refresh_access_token(current_user = Depends(get_current_user_from_refresh_token)):
    """
    유효한 Refresh Token을 통해 새로운 Access Token을 발급합니다.
    """
    
    access_token = create_access_token(data={"sub": current_user.username})
    return JSONResponse(content={"access_token": access_token})

@router.post("/logout")
def logout(current_user = Depends(get_current_user_from_refresh_token), db: Session = Depends(get_db)):
    """
    현재 로그인된 사용자의 Refresh Token을 만료 처리합니다.
    """
    token_entry = db.query(Token).filter(
        Token.user_id == current_user.id,
        Token.is_valid == True
    ).first()

    if not token_entry:
        raise HTTPException(status_code=400, detail="로그아웃할 수 있는 유효한 토큰이 없습니다.")

    token_entry.is_valid = False
    db.commit()

    return {"message": f"{current_user.username} 로그아웃 완료"}

@router.patch("/change-password")
def change_password(
    payload: PasswordChangeRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="현재 비밀번호가 일치하지 않습니다.")

    if payload.new_password != payload.confirm_new_password:
        raise HTTPException(status_code=400, detail="새 비밀번호와 확인이 일치하지 않습니다.")

    current_user.password_hash = get_password_hash(payload.new_password)
    db.commit()

    return {"message": "비밀번호가 성공적으로 변경되었습니다."}
