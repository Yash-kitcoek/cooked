from fastapi import HTTPException, status

from app.models import Complaint, Role, User


def require_role(user: User, *roles: Role, check_profile: bool = True) -> None:
    if user.role not in {role.value for role in roles}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="insufficient permissions")
    if check_profile and not user.profile_completed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="PROFILE_INCOMPLETE")


def can_view_complaint(user: User, complaint: Complaint) -> bool:
    if user.role == Role.admin.value:
        return True
    if user.role == Role.student.value:
        return complaint.student_id == user.id
    if user.role in {Role.staff.value, Role.department_head.value}:
        return complaint.department == user.department
    return False


def enforce_view_complaint(user: User, complaint: Complaint) -> None:
    if not can_view_complaint(user, complaint):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="complaint not found")
