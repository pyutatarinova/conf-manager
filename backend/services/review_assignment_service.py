from fastapi import HTTPException

from models.user import User
from models.submission import Submission
from models.conference_role import ConferenceRole
from models.review_assignment import ReviewAssignment

from repositories.review_assignment_repo import ReviewAssignmentRepository

review_assignment_repo = ReviewAssignmentRepository()

class ReviewAssignmentService:

    def assign_reviewer(self, db, data, current_user):
        submission = (
            db.query(Submission)
            .filter(Submission.id == data.submission_id)
            .first()
        )

        if submission is None:
            raise HTTPException(status_code=404, detail="Заявка не найдена")

        # Назначать рецензента может admin или chair этой конференции
        assigner_role = (
            db.query(ConferenceRole)
            .filter(
                ConferenceRole.user_id == current_user.id,
                ConferenceRole.conference_id == submission.conference_id,
                ConferenceRole.role.in_(["admin", "chair"])
            )
            .first()
        )

        if assigner_role is None:
            raise HTTPException(
                status_code=403,
                detail="Только администратор или председатель конференции может назначать рецензентов"
            )

        reviewer = (
            db.query(User)
            .filter(User.id == data.reviewer_id)
            .first()
        )

        if reviewer is None:
            raise HTTPException(status_code=404, detail="Рецензент не найден")

        reviewer_role = (
            db.query(ConferenceRole)
            .filter(
                ConferenceRole.user_id == data.reviewer_id,
                ConferenceRole.conference_id == submission.conference_id,
                ConferenceRole.role == "reviewer"
            )
            .first()
        )

        if reviewer_role is None:
            raise HTTPException(
                status_code=400,
                detail="Пользователь не является рецензентом в этой конференции"
            )

        existing = review_assignment_repo.get_existing(
            db=db,
            submission_id=data.submission_id,
            reviewer_id=data.reviewer_id
        )

        if existing:
            raise HTTPException(
                status_code=400,
                detail="Рецензент уже назначен на эту заявку"
            )

        # Один активный рецензент на заявку: при переназначении удаляем прежние назначения.
        previous_assignments = review_assignment_repo.list_by_submission(
            db=db,
            submission_id=data.submission_id
        )

        for a in previous_assignments:
            db.delete(a)
        db.commit()

        assignment = ReviewAssignment(
            submission_id=data.submission_id,
            reviewer_id=data.reviewer_id,
            assigned_by=current_user.id
        )

        return review_assignment_repo.create(db, assignment)

    def list_my_submissions(self, db, current_user):
        assignments = review_assignment_repo.list_by_reviewer(
            db=db,
            reviewer_id=current_user.id
        )

        result = []

        for assignment in assignments:
            submission = (
                db.query(Submission)
                .filter(Submission.id == assignment.submission_id)
                .first()
            )

            if submission:
                result.append({
                    "assignment_id": str(assignment.id),
                    "submission_id": str(submission.id),
                    "conference_id": str(submission.conference_id),
                    "section_id": str(submission.section_id),
                    "title": submission.title,
                    "status": submission.status,
                    "assigned_at": assignment.created_at
                })

        return result
