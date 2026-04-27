const now = '2026-04-10T09:00:00.000Z';

export const INITIAL_USERS = [
  {
    id: 'b2dd7c70-9bc2-4a4c-958f-9ed95d94d4e1',
    name: 'Иванов Иван Иванович',
    email: 'ivanov@example.com',
    password_hash: 'hash_author',
    affiliation: 'Студент 4 курса',
    bio: '',
    created_at: now
  },
  {
    id: '6f1b53ff-8c24-4b53-8d9b-0f68d63432fd',
    name: 'Петров П.П.',
    email: 'petrov@mail.ru',
    password_hash: 'hash_coauthor_1',
    affiliation: 'Аспирант',
    bio: '',
    created_at: now
  },
  {
    id: '32dfb30f-52f3-4067-8f3b-16f8fba6d965',
    name: 'Сидоров С.С.',
    email: 'sidorov@mail.ru',
    password_hash: 'hash_coauthor_2',
    affiliation: 'Профессор',
    bio: '',
    created_at: now
  },
  {
    id: '1f7daefb-72ef-4479-8c35-4ea7d5f3a711',
    name: 'Доц. Васильев В.В.',
    email: 'vasil@uni.edu',
    password_hash: 'hash_reviewer',
    affiliation: 'Доцент кафедры ИИ',
    bio: '',
    created_at: now
  },
  {
    id: '86d2c501-e63b-4f6f-b1da-74bd7db102f0',
    name: 'Проф. Смирнов А.А.',
    email: 'smirnov@uni.edu',
    password_hash: 'hash_chairman',
    affiliation: 'Профессор, д.т.н.',
    bio: '',
    created_at: now
  }
];

export const INITIAL_CONFERENCES = [
  {
    id: '3b4ce3ee-edf9-40c3-86e4-568e7f6f39ff',
    title: 'Международная ИТ-конференция 2026',
    description: 'Главное событие года в мире технологий, искусственного интеллекта и кибербезопасности.',
    is_public: true,
    is_submit: true,
    submission_deadline: '2026-10-14T23:59:59.000Z',
    created_at: '2026-10-12T00:00:00.000Z'
  }
];

export const INITIAL_CONFERENCE_ROLES = [
  {
    id: 'a8e67f71-14eb-455d-b469-ef68b37a7ef6',
    user_id: '1f7daefb-72ef-4479-8c35-4ea7d5f3a711',
    conference_id: '3b4ce3ee-edf9-40c3-86e4-568e7f6f39ff',
    role: 'reviewer'
  },
  {
    id: '40f8f7b6-d8cd-42fb-b9d8-f8c1db6fd4dd',
    user_id: '86d2c501-e63b-4f6f-b1da-74bd7db102f0',
    conference_id: '3b4ce3ee-edf9-40c3-86e4-568e7f6f39ff',
    section_id: '74dc8819-e0cb-4237-b2ca-1011376a5d7e',
    role: 'chairman'
  }
];

export const INITIAL_SECTIONS = [
  {
    id: '74dc8819-e0cb-4237-b2ca-1011376a5d7e',
    conference_id: '3b4ce3ee-edf9-40c3-86e4-568e7f6f39ff',
    name: 'Искусственный интеллект и Машинное обучение',
    description: 'Секция посвящена современным методам ИИ и нейросетей.'
  },
  {
    id: '0c67d763-0882-42b0-b5cb-54a845daf8a9',
    conference_id: '3b4ce3ee-edf9-40c3-86e4-568e7f6f39ff',
    name: 'Веб-технологии и Кибербезопасность',
    description: 'Безопасность веб-приложений и сетей.'
  }
];

export const INITIAL_FILES = [
  {
    id: '4fc38d83-db2f-4262-9dbe-c9bf64cf77f7',
    storage_path: '/uploads/submission-1/v2/AI_Research_v2.pdf',
    original_name: 'AI_Research_v2.pdf',
    mime_type: 'application/pdf',
    size: 324512,
    uploaded_by: 'b2dd7c70-9bc2-4a4c-958f-9ed95d94d4e1',
    created_at: now
  },
  {
    id: '109a95ed-4998-4c79-9f9f-0fa8d3e07d4a',
    storage_path: '/uploads/submission-1/v2/AI_Research_thesis_v2.pdf',
    original_name: 'AI_Research_thesis_v2.pdf',
    mime_type: 'application/pdf',
    size: 104728,
    uploaded_by: 'b2dd7c70-9bc2-4a4c-958f-9ed95d94d4e1',
    created_at: now
  }
];

export const INITIAL_SUBMISSIONS = [
  {
    id: 'f6aab8f2-3987-43c5-b2f0-5f26dd871f37',
    conference_id: '3b4ce3ee-edf9-40c3-86e4-568e7f6f39ff',
    section_id: '74dc8819-e0cb-4237-b2ca-1011376a5d7e',
    title: 'Анализ современных методов обучения нейросетей в условиях ограниченных ресурсов и больших данных',
    status: 'reviewing',
    current_file_id: '4fc38d83-db2f-4262-9dbe-c9bf64cf77f7',
    revision_count: 1,
    reviewer_locked_round: null,
    chairman_locked_round: null,
    is_best: false,
    created_at: now,
    updated_at: now
  }
];

export const INITIAL_SUBMISSION_AUTHORS = [
  {
    id: 'db2e5d85-b64f-4464-9d88-fec8dcabcb9b',
    submission_id: 'f6aab8f2-3987-43c5-b2f0-5f26dd871f37',
    user_id: 'b2dd7c70-9bc2-4a4c-958f-9ed95d94d4e1',
    name: 'Иванов Иван Иванович',
    email: 'ivanov@example.com',
    affiliation: 'Студент 4 курса',
    author_order: 1,
    is_corresponding: true
  },
  {
    id: 'fd8d4ed4-8ca4-4df9-8d95-e28e3d99d63d',
    submission_id: 'f6aab8f2-3987-43c5-b2f0-5f26dd871f37',
    user_id: '6f1b53ff-8c24-4b53-8d9b-0f68d63432fd',
    name: 'Петров П.П.',
    email: 'petrov@mail.ru',
    affiliation: 'Аспирант',
    author_order: 2,
    is_corresponding: false
  },
  {
    id: 'fab8f6a2-f9d9-4f64-a0a4-d0b34efaf50f',
    submission_id: 'f6aab8f2-3987-43c5-b2f0-5f26dd871f37',
    user_id: '32dfb30f-52f3-4067-8f3b-16f8fba6d965',
    name: 'Сидоров С.С.',
    email: 'sidorov@mail.ru',
    affiliation: 'Профессор',
    author_order: 3,
    is_corresponding: false
  }
];

export const INITIAL_SUBMISSION_FILES = [
  {
    id: 'd1bf1a7a-dd30-43e9-b96f-41090f16f75e',
    submission_id: 'f6aab8f2-3987-43c5-b2f0-5f26dd871f37',
    file_id: '4fc38d83-db2f-4262-9dbe-c9bf64cf77f7',
    version: 2,
    uploaded_at: now
  },
  {
    id: 'f768f07f-df0a-4731-a0f5-e0a2a03d831e',
    submission_id: 'f6aab8f2-3987-43c5-b2f0-5f26dd871f37',
    file_id: '109a95ed-4998-4c79-9f9f-0fa8d3e07d4a',
    version: 2,
    uploaded_at: now
  }
];

export const INITIAL_REVIEWS = [
  {
    id: '3714eb7f-8f24-418d-b4fb-b87f34d21318',
    submission_id: 'f6aab8f2-3987-43c5-b2f0-5f26dd871f37',
    reviewer_id: '1f7daefb-72ef-4479-8c35-4ea7d5f3a711',
    decision: 'needs_revision',
    comments: 'Ваша работа требует более детального описания методологии. Также, пожалуйста, убедитесь, что все графики имеют подписи осям и единицы измерения.',
    file_id: '4fc38d83-db2f-4262-9dbe-c9bf64cf77f7',
    revision_round: 1,
    created_at: now,
    updated_at: now
  }
];

export const INITIAL_REVIEW_ASSIGNMENTS = [
  {
    id: 'e62c4ea4-88f8-4b95-9120-764f5368de11',
    submission_id: 'f6aab8f2-3987-43c5-b2f0-5f26dd871f37',
    reviewer_id: '1f7daefb-72ef-4479-8c35-4ea7d5f3a711',
    assigned_by: '86d2c501-e63b-4f6f-b1da-74bd7db102f0',
    created_at: now
  }
];
