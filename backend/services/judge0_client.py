import httpx
import asyncio
import base64
from typing import Optional
import os

class Judge0Client:
    def __init__(self, base_url: str = "https://judge.hcodetest.com"):
        self.base_url = base_url
        self.rapidapi_key = os.getenv("RAPIDAPI_KEY", "")
        self.use_rapidapi = bool(self.rapidapi_key)
        
        if self.use_rapidapi:
            self.base_url = "https://judge0-ce.p.rapidapi.com"
            self.headers = {
                "X-RapidAPI-Key": self.rapidapi_key,
                "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
                "Content-Type": "application/json"
            }
        else:
            self.headers = {"Content-Type": "application/json"}

    async def submit_code(self, source_code: str, language_id: int, stdin: str = "") -> dict:
        submission_data = {
            "source_code": base64.b64encode(source_code.encode()).decode(),
            "language_id": language_id,
            "stdin": base64.b64encode(stdin.encode()).decode() if stdin else ""
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/submissions?base64_encoded=true&wait=true",
                    json=submission_data,
                    headers=self.headers,
                    timeout=30.0
                )
                
                response.raise_for_status()
                result = response.json()
                
                # Base64 디코딩
                if result.get("stdout"):
                    result["stdout"] = base64.b64decode(result["stdout"]).decode()
                if result.get("stderr"):
                    result["stderr"] = base64.b64decode(result["stderr"]).decode()
                if result.get("compile_output"):
                    result["compile_output"] = base64.b64decode(result["compile_output"]).decode()
                    
                return result
                
        except httpx.ConnectError:
            if self.use_rapidapi:
                raise Exception("RapidAPI Judge0 연결 실패. API 키를 확인하세요.")
            else:
                raise Exception("로컬 Judge0 서버에 연결할 수 없습니다. Docker 컨테이너가 실행 중인지 확인하세요.")
        except httpx.TimeoutException:
            raise Exception("Judge0 요청 시간 초과")
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 401:
                raise Exception("Judge0 API 인증 실패. API 키를 확인하세요.")
            elif e.response.status_code == 429:
                raise Exception("API 호출 한도 초과. 잠시 후 다시 시도하세요.")
            else:
                raise Exception(f"Judge0 API 오류: {e.response.status_code}")
        except Exception as e:
            raise Exception(f"Judge0 실행 중 오류: {str(e)}")

    async def get_submission(self, token: str) -> dict:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/submissions/{token}?base64_encoded=true",
                    headers=self.headers,
                    timeout=10.0
                )
                
                response.raise_for_status()
                result = response.json()
                
                # Base64 디코딩
                if result.get("stdout"):
                    result["stdout"] = base64.b64decode(result["stdout"]).decode()
                if result.get("stderr"):
                    result["stderr"] = base64.b64decode(result["stderr"]).decode()
                if result.get("compile_output"):
                    result["compile_output"] = base64.b64decode(result["compile_output"]).decode()
                    
                return result
                
        except Exception as e:
            raise Exception(f"제출 결과 조회 실패: {str(e)}")

    async def get_languages(self) -> list:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/languages",
                    headers=self.headers,
                    timeout=10.0
                )
                
                response.raise_for_status()
                return response.json()
                
        except Exception as e:
            # Judge0 연결 실패 시 기본 언어 목록 반환
            return [
                #{"id": 63, "name": "JavaScript (Node.js 12.14.0)"},
                {"id": 71, "name": "Python (3.8.1)"},
                {"id": 62, "name": "Java (OpenJDK 13.0.1)"},
                {"id": 54, "name": "C++ (GCC 9.2.0)"},
                {"id": 50, "name": "C (GCC 9.2.0)"}
            ]

    async def test_connection(self) -> bool:
        """Judge0 연결 테스트"""
        try:
            await self.get_languages()
            return True
        except:
            return False