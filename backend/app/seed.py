import logging
import random
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account import Account, AccountType, DEFAULT_INTEREST_RATES
from app.models.transaction import Transaction, TransactionType

logger = logging.getLogger(__name__)

INITIAL_DEPOSIT = Decimal("100000")

# 10 savings + 10 current account holders
_HOLDER_NAMES = [
    # Savings accounts
    "Aarav Sharma",
    "Priya Patel",
    "Rohan Mehta",
    "Ananya Iyer",
    "Vikram Reddy",
    "Sneha Gupta",
    "Arjun Nair",
    "Kavya Joshi",
    "Rahul Verma",
    "Meera Kapoor",
    # Current accounts
    "Siddharth Malhotra",
    "Neha Singh",
    "Aditya Rao",
    "Pooja Deshmukh",
    "Karthik Menon",
    "Divya Chatterjee",
    "Manish Tiwari",
    "Ritu Agarwal",
    "Suresh Pillai",
    "Anjali Bhatt",
]

# Realistic credit descriptions
_CREDIT_DESCRIPTIONS = [
    "Monthly salary",
    "Salary credit",
    "Freelance payment",
    "UPI collection",
    "Cashback credit",
    "Refund from merchant",
    "Rental income",
    "Invoice settlement",
    "Family transfer received",
    "Interest credit",
    "Fixed deposit maturity",
    "Insurance claim",
    "Commission credit",
    "Reimbursement",
    "Cash deposit at branch",
]

# Realistic debit descriptions
_DEBIT_DESCRIPTIONS = [
    "Swiggy order",
    "Zomato order",
    "Amazon purchase",
    "Flipkart order",
    "Electricity bill",
    "Mobile recharge",
    "Rent payment",
    "EMI payment",
    "Insurance premium",
    "Credit card payment",
    "ATM withdrawal",
    "Grocery shopping",
    "Petrol pump",
    "Medical expenses",
    "School fees",
    "Netflix subscription",
    "Gym membership",
    "Water bill",
    "Gas bill",
    "Online shopping",
]


def _random_aug_2025_date() -> datetime:
    """Return a random datetime in August 2025."""
    day = random.randint(1, 31)
    hour = random.randint(8, 20)
    minute = random.randint(0, 59)
    second = random.randint(0, 59)
    return datetime(2025, 8, day, hour, minute, second, tzinfo=timezone.utc)


def _random_date_after(start: datetime) -> datetime:
    """Return a random datetime between start and now."""
    now = datetime(2026, 3, 4, tzinfo=timezone.utc)
    delta = now - start
    random_seconds = random.randint(86400, max(86400, int(delta.total_seconds())))
    return start + timedelta(seconds=random_seconds)


def _generate_transactions(
    account_id: int,
    opening_date: datetime,
) -> tuple[list[Transaction], Decimal]:
    """Generate 15 transactions for an account (including the initial deposit).
    Returns (transactions_list, final_balance).
    """
    txns: list[Transaction] = []

    # Transaction 1: Initial deposit
    running_balance = INITIAL_DEPOSIT
    txns.append(Transaction(
        account_id=account_id,
        transaction_type=TransactionType.CREDIT,
        amount=INITIAL_DEPOSIT,
        balance_after=running_balance,
        description="Initial deposit - Account opening",
        created_at=opening_date,
    ))

    # Generate 14 more transactions with dates after opening, sorted chronologically
    txn_dates = sorted([_random_date_after(opening_date) for _ in range(14)])

    for txn_date in txn_dates:
        # ~40% credits, ~60% debits (realistic spending pattern)
        is_credit = random.random() < 0.4

        if is_credit:
            # Credit amounts: ₹2,000 - ₹60,000
            amount = Decimal(random.randint(2000, 60000))
            amount = Decimal(int(amount / 100) * 100)  # round to nearest 100
            description = random.choice(_CREDIT_DESCRIPTIONS)
            running_balance += amount
            txn_type = TransactionType.CREDIT
        else:
            # Debit amounts: ₹200 - ₹25,000
            amount = Decimal(random.randint(200, 25000))
            amount = Decimal(int(amount / 50) * 50)  # round to nearest 50

            # Don't let balance go below ₹1,000
            if amount > running_balance - Decimal("1000"):
                amount = max(
                    Decimal("200"),
                    Decimal(int((running_balance - Decimal("1000")) * Decimal("0.3") / 50) * 50),
                )
            if amount < Decimal("200"):
                # Balance too low for debit, make it a credit instead
                amount = Decimal(random.randint(5000, 30000))
                amount = Decimal(int(amount / 100) * 100)
                description = random.choice(_CREDIT_DESCRIPTIONS)
                running_balance += amount
                txn_type = TransactionType.CREDIT
            else:
                description = random.choice(_DEBIT_DESCRIPTIONS)
                running_balance -= amount
                txn_type = TransactionType.DEBIT

        txns.append(Transaction(
            account_id=account_id,
            transaction_type=txn_type,
            amount=amount,
            balance_after=running_balance,
            description=description,
            created_at=txn_date,
        ))

    return txns, running_balance


async def seed_data(db: AsyncSession) -> None:
    """Seed 20 accounts (10 savings + 10 current) with 15 transactions each."""
    count = await db.scalar(select(func.count()).select_from(Account))
    if count:
        logger.info("Data already seeded — skipping.")
        return

    all_accounts: list[Account] = []
    opening_dates: list[datetime] = []

    # First 10 holders → savings, next 10 → current
    for i, name in enumerate(_HOLDER_NAMES):
        acc_type = AccountType.SAVINGS if i < 10 else AccountType.CURRENT
        opening_date = _random_aug_2025_date()

        account = Account(
            holder_name=name,
            account_type=acc_type,
            balance=INITIAL_DEPOSIT,  # will be updated after transactions
            interest_rate=DEFAULT_INTEREST_RATES[acc_type],
        )
        db.add(account)
        all_accounts.append(account)
        opening_dates.append(opening_date)

    await db.flush()  # assign IDs

    total_txns = 0
    for account, opening_date in zip(all_accounts, opening_dates):
        txns, final_balance = _generate_transactions(account.id, opening_date)
        for txn in txns:
            db.add(txn)
        account.balance = final_balance
        total_txns += len(txns)

    await db.commit()
    logger.info(
        "Seeded %d accounts (%d savings + %d current) with %d total transactions.",
        len(all_accounts), 10, 10, total_txns,
    )
