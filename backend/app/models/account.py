import enum
from decimal import Decimal

from sqlalchemy import Enum, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class AccountType(str, enum.Enum):
    SAVINGS = "savings"
    CURRENT = "current"


INTEREST_RATES: dict[AccountType, tuple[Decimal, Decimal]] = {
    AccountType.SAVINGS: (Decimal("6.0"), Decimal("8.0")),
    AccountType.CURRENT: (Decimal("2.0"), Decimal("4.0")),
}

DEFAULT_INTEREST_RATES: dict[AccountType, Decimal] = {
    AccountType.SAVINGS: Decimal("7.0"),
    AccountType.CURRENT: Decimal("3.0"),
}


class Account(Base):
    __tablename__ = "accounts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    holder_name: Mapped[str] = mapped_column(String(255))
    account_type: Mapped[AccountType] = mapped_column(Enum(AccountType))
    balance: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=Decimal("0.00"))
    interest_rate: Mapped[Decimal] = mapped_column(Numeric(5, 2))

    transactions: Mapped[list["Transaction"]] = relationship(
        back_populates="account",
        foreign_keys="Transaction.account_id",
    )
