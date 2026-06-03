from fastapi import Depends, HTTPException

from models.user import User
from auth.dependencies import get_current_user


def require_superadmin(
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_superadmin:
        raise HTTPException(
            status_code=403,
            detail="Only system admin can perform this action"
        )

    return current_user