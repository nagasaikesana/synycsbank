from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.transaction import (
    DepositRequest,
    TransactionResponse,
    TransferRequest,
    WithdrawRequest,
)
from app.services.transaction_service import TransactionService

router = APIRouter(prefix="/accounts/{account_id}", tags=["Transactions"])


@router.post("/deposit", response_model=TransactionResponse)
async def deposit(account_id: int, data: DepositRequest, db: AsyncSession = Depends(get_db)):
    service = TransactionService(db)
    return await service.deposit(account_id, data.amount, description=data.description)


@router.post("/withdraw", response_model=TransactionResponse)
async def withdraw(account_id: int, data: WithdrawRequest, db: AsyncSession = Depends(get_db)):
    service = TransactionService(db)
    return await service.withdraw(account_id, data.amount, description=data.description)


@router.post("/transfer", response_model=list[TransactionResponse])
async def transfer(account_id: int, data: TransferRequest, db: AsyncSession = Depends(get_db)):
    service = TransactionService(db)
    txn_out, txn_in = await service.transfer(
        account_id, data.to_account_id, data.amount, description=data.description,
    )
    return [txn_out, txn_in]


@router.get("/transactions", response_model=list[TransactionResponse])
async def list_transactions(
    account_id: int,
    date: date | None = Query(None, description="Filter by date (YYYY-MM-DD)"),
    db: AsyncSession = Depends(get_db),
):
    service = TransactionService(db)
    return await service.get_transactions(account_id, for_date=date)
