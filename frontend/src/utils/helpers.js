export const getAuthorsString = (sub) => {
  return [sub.authorName, ...(sub.coAuthors || []).map(c => c.name)].join(', ');
};

export const formatConferenceDate = (date) => {
  if (!date) return null;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
};
