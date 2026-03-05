from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import AccountNotFoundError
from app.models.account import Account, AccountType, DEFAULT_INTEREST_RATES
from app.schemas.account import AccountCreate


class AccountService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: AccountCreate) -> Account:
        interest_rate = DEFAULT_INTEREST_RATES[data.account_type]
        account = Account(
            holder_name=data.holder_name,
            account_type=data.account_type,
            balance=Decimal("0.00"),
            interest_rate=interest_rate,
        )
        self.db.add(account)
        await self.db.commit()
        await self.db.refresh(account)
        return account

    async def get_by_id(self, account_id: int) -> Account:
        result = await self.db.execute(select(Account).where(Account.id == account_id))
        account = result.scalar_one_or_none()
        if not account:
            raise AccountNotFoundError(account_id)
        return account

    async def get_all(self) -> list[Account]:
        result = await self.db.execute(select(Account).order_by(Account.id))
        return list(result.scalars().all())
