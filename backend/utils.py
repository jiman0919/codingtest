import os
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import get_db
from models.tables import User, Token
from dotenv import load_dotenv
from typing import Tuple, Optional

KST = timezone(timedelta(hours=9))

def to_kst(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    # DB에 UTC naive로 저장되어 있으므로, tz가 없으면 UTC로 가정 후 KST로 변환
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(KST)

#"""
#[ 이 파일은 인증 및 보안 유틸을 위한 모듈입니다 ]

# 비밀번호 해싱 및 검증: get_password_hash(), verify_password()
# JWT Access / Refresh 생성: create_access_token(), create_refresh_token()
# 인증 유저 추출: get_current_user()

#[ 사용 방법 예시 ]
#from utils import get_password_hash, create_access_token, get_current_user
#"""

# 환경 변수 로딩
load_dotenv()

# JWT 토큰 생성 및 검증에 사용할 보안 키 및 알고리즘
#.env에 SECRET_KEY= ???? 설정해줘야 함
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY가 설정되지 않았습니다. 환경변수를 확인하세요.")
ALGORITHM = "HS256"

# 토큰 유효 시간 설정
ACCESS_TOKEN_EXPIRE_MINUTES = 60
REFRESH_TOKEN_EXPIRE_DAYS = 7

# 비밀번호 해시를 위한 bcrypt 설정
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 방식의 인증 토큰 헤더 정의 (FastAPI용)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# 비밀번호를 bcrypt로 해시하여 저장
def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


# 사용자가 입력한 비밀번호가 DB에 저장된 해시와 일치하는지 확인
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


# Access Token 생성 함수 (JWT)
# 유저 정보를 담아 유효한 토큰을 생성합니다.
def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# Refresh Token 생성 함수 (JWT)
# 토큰을 발급하고, 만료시각도 반환합니다.
def create_refresh_token(data: dict) -> Tuple[str, datetime]:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return token, expire


# JWT 토큰을 디코딩하여 payload를 반환합니다.
# 디코딩 실패 시 None 반환
def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


# Access Token의 만료시각(datetime)을 계산하여 반환
def get_token_expiry(minutes: int = ACCESS_TOKEN_EXPIRE_MINUTES) -> datetime:
    return datetime.utcnow() + timedelta(minutes=minutes)
    
# Refresh Token 전용 디코딩 함수
def decode_refresh_token(token: str) -> dict:
    """
    Refresh 토큰을 디코딩하여 payload 추출
    유효하지 않으면 401 예외 발생
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Refresh 토큰이 유효하지 않습니다.")


# 인증된 사용자 정보 추출
# - 헤더의 토큰을 디코딩하고
# - DB에 있는 유효한 refresh token과 비교
# - 만료 여부도 확인
def get_current_user_from_refresh_token(request: Request, db: Session = Depends(get_db)) -> User:
    """
    Authorization 헤더에 있는 Refresh Token으로 사용자 인증 처리
    1. 토큰 존재 여부 확인
    2. 디코딩 후 payload에서 username 추출
    3. DB에서 사용자 조회 및 저장된 refresh 토큰과 일치 여부 확인
    4. 토큰 만료 여부 확인
    """
    # 예: Authorization: Bearer <refresh_token>
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="인증 토큰이 필요합니다")

    token = auth_header.split(" ")[1]  # "Bearer xxx" → "xxx"

    # 토큰 디코딩 및 사용자 정보 추출
    payload = decode_refresh_token(token)
    username = payload.get("sub")
    if not username:
        raise HTTPException(status_code=401, detail="토큰에 사용자 정보 없음")

    # 사용자 조회
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자 없음")

    # DB에 저장된 유효한 refresh token인지 확인
    token_entry = db.query(Token).filter(Token.user_id == user.id, Token.is_valid == True).first()
    if not token_entry or token != token_entry.refresh_token:
        raise HTTPException(status_code=401, detail="유효하지 않은 리프레시 토큰입니다.")

    # 토큰 만료 확인
    if token_entry.expired_at < datetime.utcnow():
        raise HTTPException(status_code=401, detail="토큰이 만료되었습니다.")

    return user
    
# 인증 유틸 함수: get_current_user
def get_current_user(
    token: str = Depends(oauth2_scheme),  # Authorization: Bearer <access_token> 자동 추출
    db: Session = Depends(get_db)         # DB 세션 의존성 주입
) -> User:
    """
    Access Token 기반 사용자 인증 함수

    [동작 흐름]
    1. FastAPI의 OAuth2PasswordBearer 의존성으로부터 Authorization 헤더에서 Access Token 추출
    2. JWT 토큰을 디코딩하여 payload 내부의 사용자 정보(sub = username) 추출
    3. 해당 username으로 DB에서 사용자 정보 조회
    4. 유저 객체(User)를 반환 → 라우터의 Depends()로 사용 가능

    [용도]
    - 로그인이 필요한 API에서 현재 로그인된 사용자를 추출하는 데 사용
    - 예: 강좌 생성, 과제 제출 등 Access Token 기반 보호가 필요한 기능

    [비교: get_current_user vs get_current_user_from_access_token]
    ┌──────────────────────────────┬────────────────────────────────────┐
    │ get_current_user             │ get_current_user_from_access_token │
    ├──────────────────────────────┼────────────────────────────────────┤
    │ Access Token 기반            │ Refresh Token 기반                 │
    │ 일반 인증 보호 라우터에 사용 │ 로그인 유지 / 재발급 기능에        │
    │                              │ 사용                               │
    └──────────────────────────────┴────────────────────────────────────┘
    [예외 처리]
    - 토큰 디코딩 실패 → 401 (유효하지 않은 토큰)
    - 사용자 정보 누락 → 401
    - DB에 사용자 없음 → 404
    """

    # Access Token 디코딩 시 실패하면 None 반환
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다.")

    # payload에서 사용자명 추출
    username = payload.get("sub")
    if not username:
        raise HTTPException(status_code=401, detail="토큰에 사용자 정보 없음")

    # 사용자 DB 조회
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자 없음")

    return user
    
    
#역할 검사 함수
def verify_professor(user: User):
    if user.role != "professor":
        raise HTTPException(status_code=403, detail="교수만 접근 가능한 기능입니다.")
        
def verify_student(user: User):
    if user.role != "student":
        raise HTTPException(status_code=403, detail="학생만 접근 가능한 기능입니다.")
        
def require_student(current_user = Depends(get_current_user)):
    verify_student(current_user)  # 권한 체크
    return current_user

def require_professor(current_user = Depends(get_current_user)):
    verify_professor(current_user)  # 권한 체크
    return current_user

# 관리자 역할 검사/요구
def verify_admin(user: User):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="관리자만 접근 가능합니다.")

def require_admin(current_user = Depends(get_current_user)):
    verify_admin(current_user)  # 권한 체크
    return current_user
