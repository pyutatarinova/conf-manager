export const INITIAL_CONFERENCES = [
  {
    id: 1,
    title: 'Международная ИТ-конференция 2026',
    description: 'Главное событие года в мире технологий, искусственного интеллекта и кибербезопасности.',
    startDate: '2026-10-12',
    endDate: '2026-10-14'
  }
];

export const INITIAL_SECTIONS = [
  { id: 1, conferenceId: 1, name: 'Искусственный интеллект и Машинное обучение', description: 'Секция посвящена современным методам ИИ и нейросетей.' },
  { id: 2, conferenceId: 1, name: 'Веб-технологии и Кибербезопасность', description: 'Безопасность веб-приложений и сетей.' }
];

export const INITIAL_USERS = [
  { id: 101, conferenceId: 1, name: 'Доц. Васильев В.В.', email: 'vasil@uni.edu', role: 'reviewer', position: 'Доцент кафедры ИИ' },
  { id: 102, conferenceId: 1, name: 'Проф. Смирнов А.А.', email: 'smirnov@uni.edu', role: 'chairman', sectionId: 1, position: 'Профессор, д.т.н.' }
];

export const INITIAL_SUBMISSIONS = [
  {
    id: 1,
    conferenceId: 1,
    authorName: 'Иванов Иван Иванович',
    email: 'ivanov@example.com',
    position: 'Студент 4 курса',
    coAuthors: [
      { name: 'Петров П.П.', email: 'petrov@mail.ru', position: 'Аспирант' },
      { name: 'Сидоров С.С.', email: 'sidorov@mail.ru', position: 'Профессор' }
    ],
    theme: 'Анализ современных методов обучения нейросетей в условиях ограниченных ресурсов и больших данных',
    sectionId: 1,
    fileName: 'AI_Research_v1.pdf',
    thesisFileName: 'AI_Research_thesis_v1.pdf',
    status: 'reviewing',
    revisionCount: 1,
    reviewText: 'Ваша работа требует более детального описания методологии. Также, пожалуйста, убедитесь, что все графики имеют подписи осям и единицы измерения.',
    reviewerId: 101,
    isBest: false,
    headApproved: false
  }
];
