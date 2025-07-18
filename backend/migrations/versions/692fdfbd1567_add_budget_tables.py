"""add_budget_tables

Revision ID: 692fdfbd1567
Revises: 458fbd4e8913
Create Date: 2025-07-13 13:43:17.303860

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '692fdfbd1567'
down_revision: Union[str, None] = '458fbd4e8913'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('budgets',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('amount', sa.Float(), nullable=False),
    sa.Column('spent', sa.Float(), nullable=True),
    sa.Column('category', sa.String(), nullable=True),
    sa.Column('period_type', sa.Enum('MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM', name='budgetperiodtype'), nullable=False),
    sa.Column('start_date', sa.DateTime(), nullable=False),
    sa.Column('end_date', sa.DateTime(), nullable=False),
    sa.Column('status', sa.Enum('ACTIVE', 'PAUSED', 'COMPLETED', 'EXPIRED', name='budgetstatus'), nullable=True),
    sa.Column('alert_threshold', sa.Float(), nullable=True),
    sa.Column('ledger_id', sa.Integer(), nullable=False),
    sa.Column('created_by', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
    sa.ForeignKeyConstraint(['ledger_id'], ['ledgers.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_budgets_id'), 'budgets', ['id'], unique=False)
    op.create_table('budget_alerts',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('budget_id', sa.Integer(), nullable=False),
    sa.Column('alert_type', sa.Enum('WARNING', 'CRITICAL', 'EXCEEDED', name='alerttype'), nullable=False),
    sa.Column('threshold', sa.Float(), nullable=False),
    sa.Column('message', sa.String(), nullable=True),
    sa.Column('is_sent', sa.Boolean(), nullable=True),
    sa.Column('sent_at', sa.DateTime(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['budget_id'], ['budgets.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_budget_alerts_id'), 'budget_alerts', ['id'], unique=False)
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f('ix_budget_alerts_id'), table_name='budget_alerts')
    op.drop_table('budget_alerts')
    op.drop_index(op.f('ix_budgets_id'), table_name='budgets')
    op.drop_table('budgets')
    # ### end Alembic commands ###
