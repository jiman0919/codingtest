from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Literal
import json

from database import get_db
from utils import get_current_user, verify_professor, to_kst
from models.tables import ProblemBankItem, ProblemBankTestCase, User, Problem, TestCase, Course
from schemas import (
    ProblemBankItemListOut,
    ProblemBankItemDetailOut,
    ProblemBankTestCaseOut,
    ProblemOut,
)

router = APIRouter(prefix="/bank", tags=["Problem Bank"])

Lang = Literal["c", "python", "java"]

@router.get("/mine", response_model=List[ProblemBankItemListOut])
def list_my_bank_items(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):

    verify_professor(current_user)

    rows = (
        db.query(
            ProblemBankItem.id,
            ProblemBankItem.title,
            ProblemBankItem.language,
            ProblemBankItem.created_at,
        )
        .filter(ProblemBankItem.created_by == current_user.id)
        .order_by(ProblemBankItem.created_at.desc())
        .all()
    )
    author_name = current_user.name or "탈퇴한 사용자"
    return [
        ProblemBankItemListOut(
            id=r.id,
            title=r.title,
            author_name=author_name,
            language=r.language,
            created_at=to_kst(r.created_at),
        )
        for r in rows
    ]



@router.get("/others", response_model=List[ProblemBankItemListOut])
def list_others_bank_items(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    
    verify_professor(current_user)

    rows = (
        db.query(
            ProblemBankItem.id,
            ProblemBankItem.title,
            ProblemBankItem.language,
            ProblemBankItem.created_at,
            User.name.label("author_name"),
        )
        .outerjoin(User, User.id == ProblemBankItem.created_by)
        .filter(
            or_(
                ProblemBankItem.created_by != current_user.id,
                ProblemBankItem.created_by.is_(None),
            )
        )
        .order_by(ProblemBankItem.created_at.desc())
        .all()
    )
    return [
        ProblemBankItemListOut(
            id=r.id,
            title=r.title,
            author_name=(r.author_name or "탈퇴한 사용자"),
            language=r.language,
            created_at=to_kst(r.created_at),
        )
        for r in rows
    ]



@router.get("/{bank_item_id}", response_model=ProblemBankItemDetailOut)
def get_bank_item_detail(
    bank_item_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    
    verify_professor(current_user)

    row = (
        db.query(ProblemBankItem, User.name.label("author_name"))
        .outerjoin(User, User.id == ProblemBankItem.created_by)
        .filter(ProblemBankItem.id == bank_item_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="문제은행 항목이 없습니다.")
    item, author_name = row

    tcs = (
        db.query(ProblemBankTestCase)
        .filter(ProblemBankTestCase.bank_item_id == bank_item_id)
        .order_by(ProblemBankTestCase.order.asc())
        .all()
    )
    try:
        ex_inputs = json.loads(item.example_input) if item.example_input else []
    except Exception:
        ex_inputs = []

    return ProblemBankItemDetailOut(
        id=item.id,
        title=item.title,
        author_name=(author_name or "탈퇴한 사용자"),
        language=item.language,
        description=item.description,
        function_name=item.function_name,
        default_code=item.default_code,
        example_input=ex_inputs,
        example_output=item.example_output,
        score=item.score,
        testcases=[
            ProblemBankTestCaseOut(order=tc.order, input=tc.input, expected_output=tc.expected_output)
            for tc in tcs
        ],
        created_at=to_kst(item.created_at),
        updated_at=to_kst(item.updated_at),
    )
    
@router.post("/problems/import", response_model=ProblemOut)
def import_problem_from_bank(
    course_id: int = Query(..., description="가져올 대상 강좌 ID"),
    bank_item_id: int = Query(..., description="문제은행 아이템 ID"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """
    문제은행 항목을 강좌로 '가져오기'.
    - 코스에 Problem만 새로 생성하고, bank_item_id로 원본 은행 항목을 연결
    - 은행(ProblemBankItem/ProblemBankTestCase)은 수정/삭제하지 않음
    """
    # 1) 권한/소유 검증
    verify_professor(current_user)
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="강좌를 찾을 수 없습니다.")
    if course.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="해당 강좌에 문제를 추가할 권한이 없습니다.")

    bank = db.query(ProblemBankItem).filter(
        ProblemBankItem.id == bank_item_id
    ).first()
    if not bank:
        raise HTTPException(status_code=404, detail="문제은행 항목이 없습니다.")

    # 2) 예시 입력/출력 구성
    #   - bank.example_input: JSON 문자열(예: '["3 5","10 2"]') 또는 None
    #   - bank.example_output: 문자열(예: "8") 또는 None
    try:
        example_inputs = json.loads(bank.example_input) if bank.example_input else []
        if not isinstance(example_inputs, list):
            example_inputs = []
    except Exception:
        example_inputs = []

    example_output = bank.example_output or ""

    examples_json = json.dumps([
        {"input": s, "expected_output": example_output}
        for s in example_inputs
    ])

    # 3) Problem 생성
    new_problem = Problem(
        title=bank.title or "",
        description=bank.description or "",
        function_name=bank.function_name,        # python 문제라면 있음
        default_code=bank.default_code or "",
        examples_json=examples_json,             # 프론트/응답에서 examples로 변환해 사용
        score=bank.score or 0,
        course_id=course.id,
        bank_item_id=bank.id,                    # 원본 은행 항목으로 연결 (은행은 변경 없음)
    )
    db.add(new_problem)
    db.flush()  # new_problem.id 확보

    # 4) 테스트케이스 복사(은행 → 문제)
    bank_tcs = db.query(ProblemBankTestCase).filter(
        ProblemBankTestCase.bank_item_id == bank.id
    ).order_by(ProblemBankTestCase.order.asc()).all()

    for tc in bank_tcs:
        db.add(TestCase(
            problem_id=new_problem.id,
            input=tc.input,
            expected_output=tc.expected_output,
        ))

    db.commit()
    db.refresh(new_problem)

    # 5) 응답 가공: examples_json → examples
    try:
        examples = json.loads(new_problem.examples_json or "[]")
    except Exception:
        examples = []

    # Pydantic 모델의 alias/extra 필드 처리 방식에 맞추어 속성 주입
    new_problem.examples = [
        {"input": e.get("input", ""), "expected_output": e.get("expected_output", "")}
        for e in examples
    ]
    return new_problem




@router.delete("/{bank_item_id}")
def delete_bank_item_hard(
    bank_item_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    
    verify_professor(current_user)

    item = db.query(ProblemBankItem).filter(ProblemBankItem.id == bank_item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="문제은행 항목이 없습니다.")
    if item.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="본인이 만든 항목만 삭제할 수 있습니다.")

    db.query(ProblemBankTestCase).filter(
        ProblemBankTestCase.bank_item_id == bank_item_id
    ).delete(synchronize_session=False)
    db.delete(item)
    db.commit()
    return {"message": "문제은행 항목을 삭제했습니다."}
