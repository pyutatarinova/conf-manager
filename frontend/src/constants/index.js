export const ROLES = {
  ADMIN: 'admin',
  AUTHOR: 'author',
  REVIEWER: 'reviewer',
  CHAIRMAN: 'chairman'
};

export const STATUSES = {
  reviewing: { label: 'На рецензировании', color: 'bg-blue-50 text-blue-700 border-blue-100' },
  needs_revision: { label: 'На доработке', color: 'bg-amber-50 text-amber-700 border-amber-100' },
  revision_submitted: { label: 'Загружена исправленная версия', color: 'bg-cyan-50 text-cyan-700 border-cyan-100' },
  rejected: { label: 'Отклонена', color: 'bg-red-50 text-red-700 border-red-100' },
  accepted_poster: { label: 'Принята (Постер)', color: 'bg-purple-50 text-purple-700 border-purple-100' },
  accepted_oral: { label: 'Принята (Устно)', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' }
};
