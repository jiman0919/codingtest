from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import List

from database import get_db
from models.tables import Problem, TestCase, Course, User, ProblemBankItem, ProblemBankTestCase
from schemas import ProblemCreate, ProblemOut, ProblemListOut, ProblemUpdate, ProblemDeleteOut, TestCaseCreate, TestCaseOut
from utils import get_current_user, verify_professor
import json

router = APIRouter(
    prefix="/problems",
    tags=["Problems"]
)

@router.get("/courses/{course_id}/problems/list", response_model=List[ProblemListOut])
def list_problems_for_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    verify_professor(current_user)

    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="강좌를 찾을 수 없습니다.")
    if course.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="해당 강좌에 대한 접근 권한이 없습니다.")

    problems = db.query(Problem).filter(Problem.course_id == course_id).all()
    return problems
 
@router.post("/", response_model=ProblemOut)
def create_problem(
    problem_data: ProblemCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    verify_professor(current_user)

    # 강좌 확인/소유자 검증
    course = db.query(Course).filter(Course.id == problem_data.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="강좌를 찾을 수 없습니다.")
    if course.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="해당 강좌에 문제를 추가할 수 없습니다.")

    # 파이썬이면 함수명 필수
    if (course.language or "").lower().strip() == "python" and not (problem_data.function_name or "").strip():
        raise HTTPException(status_code=422, detail="파이썬 문제는 함수 이름이 필요합니다.")

    # 예시/테스트케이스 유효성
    if not problem_data.examples:
        raise HTTPException(status_code=422, detail="예시는 최소 1개 이상이어야 합니다.")
    for i, ex in enumerate(problem_data.examples, 1):
        if not (ex.input or "").strip():
            raise HTTPException(status_code=422, detail=f"{i}번 예시 입력이 비었습니다.")
        if not (ex.expected_output or "").strip():
            raise HTTPException(status_code=422, detail=f"{i}번 예시의 예상 출력이 비었습니다.")

    if not problem_data.testcases:
        raise HTTPException(status_code=422, detail="테스트케이스는 최소 1개 이상이어야 합니다.")
    for i, tc in enumerate(problem_data.testcases, 1):
        if not (tc.input or "").strip():
            raise HTTPException(status_code=422, detail=f"{i}번 테스트케이스 입력이 비었습니다.")
        if not (tc.expected_output or "").strip():
            raise HTTPException(status_code=422, detail=f"{i}번 테스트케이스의 예상 출력이 비었습니다.")

    try:
        # 문제 생성 (예시는 examples_json으로 저장)
        new_problem = Problem(
            title=problem_data.title,
            description=problem_data.description,
            function_name=problem_data.function_name,
            default_code=problem_data.default_code,
            examples_json=json.dumps(
                [{"input": ex.input, "expected_output": ex.expected_output} for ex in problem_data.examples]
            ),
            score=problem_data.score,
            course_id=course.id,
        )
        db.add(new_problem)
        db.flush()  # PK 확보

        # 테스트케이스 생성
        for case in problem_data.testcases:
            db.add(TestCase(
                problem_id=new_problem.id,
                input=case.input,                 # validator에서 이미 문자열 정규화됨
                expected_output=case.expected_output,
            ))
            
        # ---[문제은행 자동 생성]---
        language = (course.language or "").strip().lower()
        examples_list = [ex.input for ex in problem_data.examples]
        first_output = problem_data.examples[0].expected_output if problem_data.examples else None
    
        bank_item = ProblemBankItem(
            title=new_problem.title,
            description=new_problem.description,
            language=language,
            function_name=new_problem.function_name,
            default_code=new_problem.default_code,
            example_input=json.dumps(examples_list),
            example_output=first_output,
            score=new_problem.score,
            created_by=current_user.id,
        )
        db.add(bank_item)
        db.flush()
    
        for idx, case in enumerate(problem_data.testcases, start=1):
            db.add(ProblemBankTestCase(
                bank_item_id=bank_item.id,
                input=case.input,
                expected_output=case.expected_output,
                order=idx,
            ))
    
        new_problem.bank_item_id = bank_item.id
        # ---[/문제은행 자동 생성]---

        db.commit()
        db.refresh(new_problem)

        # 응답: examples_json → examples (임시 속성) 후 ORM 객체 반환
        new_problem.examples = [
            {"input": e["input"], "expected_output": e["expected_output"]}
            for e in json.loads(new_problem.examples_json or "[]")
        ]
        return new_problem

    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"DB 처리 중 오류가 발생했습니다: {e}")

@router.get("/{problem_id}", response_model=ProblemOut)
def get_problem_detail(
    problem_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    verify_professor(current_user)

    problem = db.query(Problem).filter(Problem.id == problem_id).first()
        
    if not problem:
        raise HTTPException(status_code=404, detail="문제를 찾을 수 없습니다.")

    course = db.query(Course).filter(Course.id == problem.course_id).first()
    if course.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="이 문제에 접근할 권한이 없습니다.")

    examples = json.loads(problem.examples_json or "[]")
    problem.examples = [
        {"input": e["input"], "expected_output": e["expected_output"]}
        for e in examples
    ]
    
    return problem

    
@router.put("/{problem_id}", response_model=ProblemOut)
def update_problem(
    problem_id: int,
    problem_data: ProblemUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    verify_professor(current_user)

    problem = db.query(Problem).filter(Problem.id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="문제를 찾을 수 없습니다.")

    course = db.query(Course).filter(Course.id == problem.course_id).first()
    if course.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="수정 권한이 없습니다.")

    # 파이썬이면 함수명 필수 (수정 시에도 동일)
    final_fn = problem_data.function_name if problem_data.function_name is not None else problem.function_name
    if (course.language or "").lower().strip() == "python" and not ((final_fn or "").strip()):
        raise HTTPException(status_code=422, detail="파이썬 문제는 함수 이름이 필요합니다.")

    # 일반 필드 업데이트 (examples/testcases 제외)
    for field, value in problem_data.dict(exclude_unset=True, exclude={"examples", "testcases"}).items():
        setattr(problem, field, value)

    # 예시 교체(examples_json)
    if problem_data.examples is not None:
        if not problem_data.examples:
            raise HTTPException(status_code=422, detail="예시는 최소 1개 이상이어야 합니다.")
        for i, ex in enumerate(problem_data.examples, 1):
            if not (ex.input or "").strip():
                raise HTTPException(status_code=422, detail=f"{i}번 예시 입력이 비었습니다.")
            if not (ex.expected_output or "").strip():
                raise HTTPException(status_code=422, detail=f"{i}번 예시의 예상 출력이 비었습니다.")
        problem.examples_json = json.dumps(
            [{"input": ex.input, "expected_output": ex.expected_output} for ex in problem_data.examples]
        )

    # 테스트케이스 교체
    if problem_data.testcases is not None:
        db.query(TestCase).filter(TestCase.problem_id == problem.id).delete()
        for tc_data in problem_data.testcases:
            db.add(TestCase(
                problem_id=problem.id,
                input=tc_data.input,
                expected_output=tc_data.expected_output
            ))
            
    # ---[문제은행 동기화]---
    bank = None
    if problem.bank_item_id:
        bank = db.query(ProblemBankItem).filter(
            ProblemBankItem.id == problem.bank_item_id
        ).first()
    
    language = (course.language or "").strip().lower()
    
    # 최신 examples 기준으로 example_input / example_output 생성
    examples = json.loads(problem.examples_json or "[]")
    example_inputs = [e.get("input", "") for e in examples]
    example_output = (examples[0].get("expected_output") if examples else None)
    
    def _replace_bank_tcs(bank_id: int, incoming_tcs):
        db.query(ProblemBankTestCase).filter(
            ProblemBankTestCase.bank_item_id == bank_id
        ).delete(synchronize_session=False)
        for idx, tc in enumerate(incoming_tcs, start=1):
            db.add(ProblemBankTestCase(
                bank_item_id=bank_id,
                input=tc.input,
                expected_output=tc.expected_output,
                order=idx,
            ))
    
    if bank:
        if bank.created_by == current_user.id:
            # 내 소유 → 동기화
            bank.title = problem.title
            bank.description = problem.description
            bank.language = language
            bank.function_name = problem.function_name
            bank.default_code = problem.default_code
            bank.score = problem.score
            bank.example_input = json.dumps(example_inputs)
            bank.example_output = example_output
            if problem_data.testcases is not None:
                _replace_bank_tcs(bank.id, problem_data.testcases)
        else:
            # 남 소유 → 자동 포크(fork-on-write)
            new_bank = ProblemBankItem(
                title=problem.title,
                description=problem.description,
                language=language,
                function_name=problem.function_name,
                default_code=problem.default_code,
                example_input=json.dumps(example_inputs),
                example_output=example_output,
                score=problem.score,
                created_by=current_user.id,
            )
            db.add(new_bank)
            db.flush()
            if problem_data.testcases is not None:
                _replace_bank_tcs(new_bank.id, problem_data.testcases)
            problem.bank_item_id = new_bank.id
    else:
        # 연결된 은행이 없을 때 → 새로 생성
        new_bank = ProblemBankItem(
            title=problem.title,
            description=problem.description,
            language=language,
            function_name=problem.function_name,
            default_code=problem.default_code,
            example_input=json.dumps(example_inputs),
            example_output=example_output,
            score=problem.score,
            created_by=current_user.id,
        )
        db.add(new_bank)
        db.flush()
        if problem_data.testcases is not None:
            _replace_bank_tcs(new_bank.id, problem_data.testcases)
        problem.bank_item_id = new_bank.id
    # ---[/문제은행 동기화]---
    
    db.commit()
    db.refresh(problem)
    
    # examples_json → examples (응답용)
    examples_list = json.loads(problem.examples_json or "[]")
    examples_out = [
        TestCaseOut(input=e.get("input",""), expected_output=e.get("expected_output",""))
        for e in examples_list
    ]
    setattr(problem, "examples", examples_out)
    
    # testcases 관계도 붙여주기 (정렬 필요시 order 추가)
    tcs = db.query(TestCase).filter(TestCase.problem_id == problem.id).all()
    setattr(problem, "testcases", tcs)
    
    return problem   # 이제 ProblemOut에 맞게 직렬화됨

    
@router.delete("/{problem_id}", response_model=ProblemDeleteOut)
def delete_problem(
    problem_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    verify_professor(current_user)

    # 문제 조회
    problem = db.query(Problem).filter(Problem.id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="문제를 찾을 수 없습니다.")

    # 강좌 소유자 확인
    course = db.query(Course).filter(Course.id == problem.course_id).first()
    if course.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="삭제 권한이 없습니다.")
    
    # 삭제 전, 반환용으로 따로 복사
    deleted_problem = {
        "id": problem.id,
        "title": problem.title,
    }

    # 연관된 테스트케이스 삭제
    db.query(TestCase).filter(TestCase.problem_id == problem_id).delete()

    # 문제 삭제
    db.delete(problem)
    db.commit()

    return deleted_problem