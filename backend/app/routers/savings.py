from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import date
from decimal import Decimal
from app.database import get_db
from app.models import SavingsGoal, User
from app.schemas import (
    SavingsGoalCreate,
    SavingsGoalUpdate,
    SavingsGoalContribution,
    SavingsGoalResponse,
)
from app.auth import get_current_user

router = APIRouter(prefix="/api/savings", tags=["savings"])


def enrich_savings_goal(goal: SavingsGoal) -> SavingsGoalResponse:
    pct = (
        float((goal.current_amount / goal.target_amount) * 100)
        if goal.target_amount > 0
        else 0.0
    )
    rem = max(Decimal("0.00"), goal.target_amount - goal.current_amount)
    return SavingsGoalResponse(
        id=goal.id,
        user_id=goal.user_id,
        name=goal.name,
        target_amount=goal.target_amount,
        current_amount=goal.current_amount,
        target_date=goal.target_date,
        description=goal.description,
        created_at=goal.created_at,
        progress_percentage=round(min(100.0, pct), 1),
        remaining_amount=rem,
    )


@router.get("", response_model=List[SavingsGoalResponse])
def get_savings_goals(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goals = (
        db.query(SavingsGoal)
        .filter(SavingsGoal.user_id == current_user.id)
        .order_by(SavingsGoal.target_date.asc())
        .all()
    )
    return [enrich_savings_goal(g) for g in goals]


@router.post("", response_model=SavingsGoalResponse, status_code=status.HTTP_201_CREATED)
def create_savings_goal(
    goal_in: SavingsGoalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goal = SavingsGoal(
        user_id=current_user.id,
        name=goal_in.name.strip(),
        target_amount=goal_in.target_amount,
        current_amount=goal_in.current_amount,
        target_date=goal_in.target_date,
        description=goal_in.description.strip() if goal_in.description else None,
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return enrich_savings_goal(goal)


@router.post("/{goal_id}/contribute", response_model=SavingsGoalResponse)
def contribute_to_goal(
    goal_id: int,
    contrib: SavingsGoalContribution,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goal = db.query(SavingsGoal).filter(
        SavingsGoal.id == goal_id,
        SavingsGoal.user_id == current_user.id
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Savings goal not found.")

    goal.current_amount += contrib.amount
    db.commit()
    db.refresh(goal)
    return enrich_savings_goal(goal)


@router.put("/{goal_id}", response_model=SavingsGoalResponse)
def update_savings_goal(
    goal_id: int,
    goal_in: SavingsGoalUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goal = db.query(SavingsGoal).filter(
        SavingsGoal.id == goal_id,
        SavingsGoal.user_id == current_user.id
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Savings goal not found.")

    update_data = goal_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        if field == "name" and val is not None:
            val = val.strip()
        if field == "description" and val is not None:
            val = val.strip()
        setattr(goal, field, val)

    db.commit()
    db.refresh(goal)
    return enrich_savings_goal(goal)


@router.delete("/{goal_id}")
def delete_savings_goal(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goal = db.query(SavingsGoal).filter(
        SavingsGoal.id == goal_id,
        SavingsGoal.user_id == current_user.id
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Savings goal not found.")

    db.delete(goal)
    db.commit()
    return {"message": "Savings goal deleted successfully."}
