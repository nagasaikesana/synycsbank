from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.transaction import TransactionType


class DepositRequest(BaseModel):
    amount: Decimal = Field(..., gt=0)
    description: str | None = None


class WithdrawRequest(BaseModel):
    amount: Decimal = Field(..., gt=0)
    description: str | None = None


class TransferRequest(BaseModel):
    to_account_id: int
    amount: Decimal = Field(..., gt=0)
    description: str | None = None


class TransactionResponse(BaseModel):
    id: int
    account_id: int
    transaction_type: TransactionType
    amount: Decimal
    balance_after: Decimal
    description: str | None
    related_account_id: int | None
    created_at: datetime

    model_config = {"from_attributes": True}
