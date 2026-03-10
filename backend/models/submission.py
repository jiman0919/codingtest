from pydantic import BaseModel
from typing import Optional, Any, List
from .tables import TestCase

class SubmissionRequest(BaseModel): #코드 실행 요청
    problem_id: int
    source_code: str
    language_id: int
    stdin: str

class StatusInfo(BaseModel): #Judge0 상태
    id: int
    description: str

class SubmissionResponse(BaseModel): #코드 실행 응답
    token: Optional[str] = None    
    status_id: Optional[int] = None
    status: Optional[StatusInfo] = None
    stdout: Optional[str] = None
    stderr: Optional[str] = None
    compile_output: Optional[str] = None
    time: Optional[str] = None
    memory: Optional[int] = None
    created_at: Optional[str] = None
    finished_at: Optional[str] = None
    exit_code: Optional[int] = None
    exit_signal: Optional[int] = None
    message: Optional[str] = None
    wall_time: Optional[str] = None
    
    # Judge0에서 받은 원본 응답을 그대로 전달하기 위한 필드
    class Config:
        extra = "allow"  # 추가 필드 허용
    
class SubmitRequest(BaseModel): #테스트 케이스 채점 요청
    problem_id: int
    source_code: str
    language_id: int