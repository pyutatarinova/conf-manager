export const getAuthorsString = (sub) => {
  return [sub.authorName, ...(sub.coAuthors || []).map(c => c.name)].join(', ');
};