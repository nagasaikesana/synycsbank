from datetime import date, datetime, timezone
from decimal import Decimal

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import (
    AccountNotFoundError,
    InsufficientFundsError,
    InvalidAmountError,
    SameAccountTransferError,
)
from app.models.account import Account
from app.models.transaction import Transaction, TransactionType
from app.services.account_service import AccountService


class TransactionService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.account_service = AccountService(db)

    async def deposit(
        self,
        account_id: int,
        amount: Decimal,
        description: str | None = None,
    ) -> Transaction:
        if amount <= 0:
            raise InvalidAmountError()

        account = await self.account_service.get_by_id(account_id)
        account.balance += amount

        txn = Transaction(
            account_id=account_id,
            transaction_type=TransactionType.CREDIT,
            amount=amount,
            balance_after=account.balance,
            description=description or "Deposit",
        )
        self.db.add(txn)
        await self.db.commit()
        await self.db.refresh(txn)
        return txn

    async def withdraw(
        self,
        account_id: int,
        amount: Decimal,
        description: str | None = None,
    ) -> Transaction:
        if amount <= 0:
            raise InvalidAmountError()

        account = await self.account_service.get_by_id(account_id)
        if account.balance < amount:
            raise InsufficientFundsError()

        account.balance -= amount

        txn = Transaction(
            account_id=account_id,
            transaction_type=TransactionType.DEBIT,
            amount=amount,
            balance_after=account.balance,
            description=description or "Withdrawal",
        )
        self.db.add(txn)
        await self.db.commit()
        await self.db.refresh(txn)
        return txn

    async def transfer(
        self,
        from_account_id: int,
        to_account_id: int,
        amount: Decimal,
        description: str | None = None,
    ) -> tuple[Transaction, Transaction]:
        if amount <= 0:
            raise InvalidAmountError()
        if from_account_id == to_account_id:
            raise SameAccountTransferError()

        # Lock rows in consistent order to prevent deadlocks
        first_id, second_id = sorted([from_account_id, to_account_id])
        result = await self.db.execute(
            select(Account)
            .where(Account.id.in_([first_id, second_id]))
            .with_for_update()
            .order_by(Account.id)
        )
        accounts = {a.id: a for a in result.scalars().all()}

        if from_account_id not in accounts:
            raise AccountNotFoundError(from_account_id)
        if to_account_id not in accounts:
            raise AccountNotFoundError(to_account_id)

        from_account = accounts[from_account_id]
        to_account = accounts[to_account_id]

        if from_account.balance < amount:
            raise InsufficientFundsError()

        from_account.balance -= amount
        to_account.balance += amount

        transfer_desc = description or f"Transfer to account #{to_account_id}"

        txn_out = Transaction(
            account_id=from_account_id,
            transaction_type=TransactionType.DEBIT,
            amount=amount,
            balance_after=from_account.balance,
            related_account_id=to_account_id,
            description=transfer_desc,
        )
        txn_in = Transaction(
            account_id=to_account_id,
            transaction_type=TransactionType.CREDIT,
            amount=amount,
            balance_after=to_account.balance,
            related_account_id=from_account_id,
            description=f"Transfer from account #{from_account_id}",
        )
        self.db.add_all([txn_out, txn_in])
        await self.db.commit()
        await self.db.refresh(txn_out)
        await self.db.refresh(txn_in)
        return txn_out, txn_in

    async def get_transactions(
        self,
        account_id: int,
        for_date: date | None = None,
    ) -> list[Transaction]:
        await self.account_service.get_by_id(account_id)  # existence check

        filters = [Transaction.account_id == account_id]

        if for_date:
            start = datetime(for_date.year, for_date.month, for_date.day, tzinfo=timezone.utc)
            end = datetime(for_date.year, for_date.month, for_date.day, 23, 59, 59, 999999, tzinfo=timezone.utc)
            filters.append(Transaction.created_at >= start)
            filters.append(Transaction.created_at <= end)

        result = await self.db.execute(
            select(Transaction)
            .where(and_(*filters))
            .order_by(Transaction.created_at.desc())
        )
        return list(result.scalars().all())
