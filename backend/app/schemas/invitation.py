from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime
from app.models.base import UserRole, InvitationStatus
from typing import Optional

class InvitationBase(BaseModel):
    invitee_email: EmailStr
    role: UserRole = UserRole.MEMBER

class InvitationCreate(InvitationBase):
    ledger_id: int

class Invitation(InvitationBase):
    id: int
    ledger_id: int
    inviter_id: int
    status: InvitationStatus
    expires_at: datetime
    created_at: datetime
    accepted_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

class InvitationResponse(BaseModel):
    invitation_id: int
    invite_url: str
    expires_at: datetime 