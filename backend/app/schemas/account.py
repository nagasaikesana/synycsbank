from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.account import AccountType


class AccountCreate(BaseModel):
    holder_name: str = Field(..., min_length=1, max_length=255)
    account_type: AccountType


class AccountResponse(BaseModel):
    id: int
    holder_name: str
    account_type: AccountType
    balance: Decimal
    interest_rate: Decimal

    model_config = {"from_attributes": True}
