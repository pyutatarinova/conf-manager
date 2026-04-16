import React, { useEffect, useMemo, useState } from 'react';
import { Award } from 'lucide-react';

import {
  INITIAL_CONFERENCES,
  INITIAL_CONFERENCE_ROLES,
  INITIAL_FILES,
  INITIAL_REVIEW_ASSIGNMENTS,
  INITIAL_REVIEWS,
  INITIAL_SECTIONS,
  INITIAL_SUBMISSION_AUTHORS,
  INITIAL_SUBMISSION_FILES,
  INITIAL_SUBMISSIONS,
  INITIAL_USERS
} from './data/initialData';
import { ROLES } from './constants';

import Sidebar from './components/layout/Sidebar';

import AuthView from './components/common/AuthView';
import CreateConferenceModal from './components/ui/CreateConferenceModal';

import AuthorView from './views/AuthorView';
import ReviewerView from './views/ReviewerView';
import ChairmanView from './views/ChairmanView';

import AdminInfoView from './views/Admin/AdminInfoView';
import AdminUsersView from './views/Admin/AdminUsersView';
import AdminSubmissionsView from './views/Admin/AdminSubmissionsView';

import PublicInfoView from './views/PublicInfoView';
import SharedProgramView from './views/SharedProgramView';
import ConferenceSelectView from './views/ConferenceSelectView';

const nowIso = () => new Date().toISOString();
const toDateInput = (iso) => (iso ? String(iso).slice(0, 10) : '');
const toIsoDate = (date) => (date ? `${date}T00:00:00.000Z` : '');
const uuid = () => (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

const buildMimeType = (name) => {
  const lower = String(name || '').toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  return 'application/octet-stream';
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isConferenceSelected, setIsConferenceSelected] = useState(false);
  const [currentRole, setCurrentRole] = useState(ROLES.AUTHOR);
  const [activeTab, setActiveTab] = useState('main');

  const [usersTable, setUsersTable] = useState(INITIAL_USERS);
  const [conferencesTable, setConferencesTable] = useState(INITIAL_CONFERENCES);
  const [conferenceRolesTable, setConferenceRolesTable] = useState(INITIAL_CONFERENCE_ROLES);
  const [sectionsTable, setSectionsTable] = useState(INITIAL_SECTIONS);
  const [submissionsTable, setSubmissionsTable] = useState(INITIAL_SUBMISSIONS);
  const [submissionAuthorsTable, setSubmissionAuthorsTable] = useState(INITIAL_SUBMISSION_AUTHORS);
  const [filesTable, setFilesTable] = useState(INITIAL_FILES);
  const [submissionFilesTable, setSubmissionFilesTable] = useState(INITIAL_SUBMISSION_FILES);
  const [reviewsTable, setReviewsTable] = useState(INITIAL_REVIEWS);
  const [reviewAssignmentsTable, setReviewAssignmentsTable] = useState(INITIAL_REVIEW_ASSIGNMENTS);

  const [activeConfId, setActiveConfId] = useState(INITIAL_CONFERENCES[0]?.id || null);
  const [isCreateConfOpen, setIsCreateConfOpen] = useState(false);

  const conferences = useMemo(
    () => conferencesTable.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      startDate: toDateInput(c.created_at),
      endDate: toDateInput(c.submission_deadline)
    })),
    [conferencesTable]
  );

  useEffect(() => {
    if (!activeConfId && conferences[0]?.id) setActiveConfId(conferences[0].id);
    if (activeConfId && !conferences.some((c) => c.id === activeConfId)) setActiveConfId(conferences[0]?.id || null);
  }, [activeConfId, conferences]);

  const activeConf = conferences.find((c) => c.id === activeConfId) || conferences[0];

  const curSections = useMemo(
    () => sectionsTable
      .filter((s) => s.conference_id === activeConfId)
      .map((s) => ({ id: s.id, conferenceId: s.conference_id, name: s.name, description: s.description })),
    [sectionsTable, activeConfId]
  );

  const curUsers = useMemo(() => {
    const roleRows = conferenceRolesTable.filter((r) => r.conference_id === activeConfId);
    return roleRows
      .map((r) => {
        const user = usersTable.find((u) => u.id === r.user_id);
        if (!user) return null;
        return {
          id: user.id,
          conferenceId: r.conference_id,
          name: user.name,
          email: user.email,
          role: r.role,
          position: user.affiliation || '',
          sectionId: ''
        };
      })
      .filter(Boolean);
  }, [conferenceRolesTable, usersTable, activeConfId]);

  const curSubmissions = useMemo(() => {
    return submissionsTable
      .filter((s) => s.conference_id === activeConfId)
      .map((s) => {
        const authors = submissionAuthorsTable
          .filter((a) => a.submission_id === s.id)
          .sort((a, b) => a.author_order - b.author_order);

        const mainAuthor = authors.find((a) => a.is_corresponding) || authors[0];
        const coAuthors = authors
          .filter((a) => a.id !== mainAuthor?.id)
          .map((a) => ({ name: a.name, email: a.email, position: a.affiliation || '' }));

        const currentFile = filesTable.find((f) => f.id === s.current_file_id);
        const fileVersions = submissionFilesTable.filter((f) => f.submission_id === s.id);
        const latestVersion = fileVersions.reduce((max, f) => Math.max(max, f.version), 0);
        const thesisLink = fileVersions.find((f) => f.version === latestVersion && f.file_id !== s.current_file_id);
        const thesisFile = filesTable.find((f) => f.id === thesisLink?.file_id);

        const latestReview = reviewsTable
          .filter((r) => r.submission_id === s.id && r.decision !== 'program_approved')
          .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))[0];

        const assignment = reviewAssignmentsTable.find((a) => a.submission_id === s.id);
        const headApproved = reviewsTable.some((r) => r.submission_id === s.id && r.decision === 'program_approved');

        return {
          id: s.id,
          conferenceId: s.conference_id,
          sectionId: s.section_id,
          authorName: mainAuthor?.name || 'Автор не указан',
          email: mainAuthor?.email || '',
          position: mainAuthor?.affiliation || '',
          coAuthors,
          theme: s.title,
          fileName: currentFile?.original_name || 'document.pdf',
          thesisFileName: thesisFile?.original_name || 'thesis.pdf',
          status: s.status,
          revisionCount: s.revision_count,
          reviewText: latestReview?.comments || '',
          reviewerId: assignment?.reviewer_id || null,
          isBest: Boolean(s.is_best),
          headApproved
        };
      });
  }, [submissionsTable, submissionAuthorsTable, filesTable, submissionFilesTable, reviewsTable, reviewAssignmentsTable, activeConfId]);

  const currentReviewerId = curUsers.find((u) => u.role === 'reviewer')?.id || null;

  const setConferences = (nextConferences) => {
    setConferencesTable((prev) => prev.map((conf) => {
      const next = nextConferences.find((c) => c.id === conf.id);
      if (!next) return conf;
      return {
        ...conf,
        title: next.title,
        description: next.description,
        created_at: toIsoDate(next.startDate) || conf.created_at,
        submission_deadline: toIsoDate(next.endDate) || conf.submission_deadline
      };
    }));
  };

  const setSections = (nextSectionsLegacy) => {
    setSectionsTable((prev) => {
      let next = prev.filter((s) => s.conference_id !== activeConfId);
      const updatedForConf = nextSectionsLegacy.map((s) => {
        const existing = prev.find((p) => p.id === s.id);
        return {
          id: s.id || uuid(),
          conference_id: activeConfId,
          name: s.name,
          description: s.description,
          ...(existing ? {} : {})
        };
      });
      return [...next, ...updatedForConf];
    });
  };

  const setUsers = (nextUsersLegacy) => {
    const existingById = new Map(usersTable.map((u) => [u.id, u]));
    const previousForConference = conferenceRolesTable.filter((r) => r.conference_id === activeConfId);

    const nextRoles = [];
    const nextUsers = [...usersTable];

    nextUsersLegacy.forEach((u) => {
      const userId = u.id || uuid();
      const existingUser = existingById.get(userId) || usersTable.find((x) => x.email === u.email);

      if (existingUser) {
        const idx = nextUsers.findIndex((x) => x.id === existingUser.id);
        nextUsers[idx] = {
          ...nextUsers[idx],
          name: u.name,
          email: u.email,
          affiliation: u.position || nextUsers[idx].affiliation,
          bio: nextUsers[idx].bio || ''
        };
        nextRoles.push({ id: uuid(), user_id: existingUser.id, conference_id: activeConfId, role: u.role });
      } else {
        nextUsers.push({
          id: userId,
          name: u.name,
          email: u.email,
          password_hash: 'hash_generated',
          affiliation: u.position || '',
          bio: '',
          created_at: nowIso()
        });
        nextRoles.push({ id: uuid(), user_id: userId, conference_id: activeConfId, role: u.role });
      }
    });

    const keepUserIds = new Set(nextUsersLegacy.map((u) => u.id));
    const filteredRoles = conferenceRolesTable.filter((r) => r.conference_id !== activeConfId || keepUserIds.has(r.user_id));

    setUsersTable(nextUsers);
    setConferenceRolesTable([...filteredRoles.filter((r) => r.conference_id !== activeConfId), ...nextRoles]);

    const deletedUsers = previousForConference.filter((r) => !keepUserIds.has(r.user_id)).map((r) => r.user_id);
    if (deletedUsers.length > 0) {
      setUsersTable((prev) => prev.filter((u) => !deletedUsers.includes(u.id)));
    }
  };

  const setSubmissions = (nextSubmissionsLegacy) => {
    if (nextSubmissionsLegacy.length <= curSubmissions.length) return;

    const added = nextSubmissionsLegacy.find((s) => !curSubmissions.some((p) => p.id === s.id));
    if (!added) return;

    const submissionId = uuid();
    const createdAt = nowIso();

    const resolveUserId = (name, email, affiliation) => {
      const existing = usersTable.find((u) => u.email === email);
      if (existing) return existing.id;
      const id = uuid();
      setUsersTable((prev) => [...prev, {
        id,
        name,
        email,
        password_hash: 'hash_generated',
        affiliation: affiliation || '',
        bio: '',
        created_at: createdAt
      }]);
      return id;
    };

    const mainUserId = resolveUserId(added.authorName, added.email, added.position);
    const paperFileId = uuid();
    const thesisFileId = uuid();

    setFilesTable((prev) => [
      ...prev,
      {
        id: paperFileId,
        storage_path: `/uploads/${submissionId}/v1/${added.fileName}`,
        original_name: added.fileName,
        mime_type: buildMimeType(added.fileName),
        size: 0,
        uploaded_by: mainUserId,
        created_at: createdAt
      },
      {
        id: thesisFileId,
        storage_path: `/uploads/${submissionId}/v1/${added.thesisFileName || 'thesis.pdf'}`,
        original_name: added.thesisFileName || 'thesis.pdf',
        mime_type: buildMimeType(added.thesisFileName),
        size: 0,
        uploaded_by: mainUserId,
        created_at: createdAt
      }
    ]);

    setSubmissionsTable((prev) => [...prev, {
      id: submissionId,
      conference_id: activeConfId,
      section_id: added.sectionId,
      title: added.theme,
      status: added.status,
      current_file_id: paperFileId,
      revision_count: 0,
      is_best: false,
      created_at: createdAt,
      updated_at: createdAt
    }]);

    setSubmissionFilesTable((prev) => [
      ...prev,
      { id: uuid(), submission_id: submissionId, file_id: paperFileId, version: 1, uploaded_at: createdAt },
      { id: uuid(), submission_id: submissionId, file_id: thesisFileId, version: 1, uploaded_at: createdAt }
    ]);

    const coAuthors = added.coAuthors || [];
    const authorRows = [
      {
        id: uuid(),
        submission_id: submissionId,
        user_id: mainUserId,
        name: added.authorName,
        email: added.email,
        affiliation: added.position || '',
        author_order: 1,
        is_corresponding: true
      },
      ...coAuthors.map((a, idx) => {
        const userId = resolveUserId(a.name, a.email, a.position);
        return {
          id: uuid(),
          submission_id: submissionId,
          user_id: userId,
          name: a.name,
          email: a.email,
          affiliation: a.position || '',
          author_order: idx + 2,
          is_corresponding: false
        };
      })
    ];

    setSubmissionAuthorsTable((prev) => [...prev, ...authorRows]);
  };

  const updateSubmission = (id, updates) => {
    const currentSubmission = submissionsTable.find((s) => s.id === id);
    if (!currentSubmission) return;

    let nextSubmission = { ...currentSubmission };

    if (updates.sectionId !== undefined) nextSubmission.section_id = updates.sectionId;
    if (updates.status !== undefined) nextSubmission.status = updates.status;
    if (updates.revisionCount !== undefined) nextSubmission.revision_count = updates.revisionCount;
    if (updates.isBest !== undefined) nextSubmission.is_best = updates.isBest;
    nextSubmission.updated_at = nowIso();

    if (updates.fileName || updates.thesisFileName) {
      const primaryAuthor = submissionAuthorsTable
        .filter((a) => a.submission_id === id)
        .sort((a, b) => a.author_order - b.author_order)[0];
      const uploader = primaryAuthor?.user_id || usersTable[0]?.id || uuid();
      const version = (updates.revisionCount ?? nextSubmission.revision_count) + 1;
      const uploadedAt = nowIso();

      const paperFileId = uuid();
      const thesisFileId = uuid();

      const paperName = updates.fileName || filesTable.find((f) => f.id === currentSubmission.current_file_id)?.original_name || 'document.pdf';
      const thesisName = updates.thesisFileName || 'thesis.pdf';

      setFilesTable((prev) => [
        ...prev,
        {
          id: paperFileId,
          storage_path: `/uploads/${id}/v${version}/${paperName}`,
          original_name: paperName,
          mime_type: buildMimeType(paperName),
          size: 0,
          uploaded_by: uploader,
          created_at: uploadedAt
        },
        {
          id: thesisFileId,
          storage_path: `/uploads/${id}/v${version}/${thesisName}`,
          original_name: thesisName,
          mime_type: buildMimeType(thesisName),
          size: 0,
          uploaded_by: uploader,
          created_at: uploadedAt
        }
      ]);

      setSubmissionFilesTable((prev) => [
        ...prev,
        { id: uuid(), submission_id: id, file_id: paperFileId, version, uploaded_at: uploadedAt },
        { id: uuid(), submission_id: id, file_id: thesisFileId, version, uploaded_at: uploadedAt }
      ]);

      nextSubmission.current_file_id = paperFileId;
    }

    if (updates.reviewerId !== undefined) {
      setReviewAssignmentsTable((prev) => {
        const without = prev.filter((a) => a.submission_id !== id);
        if (!updates.reviewerId) return without;
        const chairmanUser = conferenceRolesTable.find((r) => r.conference_id === currentSubmission.conference_id && r.role === 'chairman')?.user_id || updates.reviewerId;
        return [
          ...without,
          {
            id: uuid(),
            submission_id: id,
            reviewer_id: updates.reviewerId,
            assigned_by: chairmanUser,
            created_at: nowIso()
          }
        ];
      });
    }

    if (updates.reviewText !== undefined) {
      const assignedReviewer = updates.reviewerId || reviewAssignmentsTable.find((a) => a.submission_id === id)?.reviewer_id;
      if (assignedReviewer) {
        setReviewsTable((prev) => [
          ...prev,
          {
            id: uuid(),
            submission_id: id,
            reviewer_id: assignedReviewer,
            decision: updates.status || nextSubmission.status,
            comments: updates.reviewText || '',
            file_id: nextSubmission.current_file_id,
            revision_round: nextSubmission.revision_count,
            created_at: nowIso(),
            updated_at: nowIso()
          }
        ]);
      }
    }

    if (updates.headApproved === true) {
      const chairmanUser = conferenceRolesTable.find((r) => r.conference_id === currentSubmission.conference_id && r.role === 'chairman')?.user_id;
      if (chairmanUser) {
        setReviewsTable((prev) => {
          const exists = prev.some((r) => r.submission_id === id && r.decision === 'program_approved');
          if (exists) return prev;
          return [
            ...prev,
            {
              id: uuid(),
              submission_id: id,
              reviewer_id: chairmanUser,
              decision: 'program_approved',
              comments: '',
              file_id: nextSubmission.current_file_id,
              revision_round: nextSubmission.revision_count,
              created_at: nowIso(),
              updated_at: nowIso()
            }
          ];
        });
      }
    }

    setSubmissionsTable((prev) => prev.map((s) => (s.id === id ? nextSubmission : s)));
  };

  useEffect(() => {
    if (currentRole === ROLES.ADMIN) setActiveTab('info');
    else setActiveTab('main');
  }, [currentRole]);

  if (!isAuthenticated) {
    return <AuthView onAuth={() => { setIsAuthenticated(true); setIsConferenceSelected(false); }} />;
  }

  if (!isConferenceSelected) {
    return (
      <>
        <ConferenceSelectView
          conferences={conferences}
          isAdmin={currentRole === ROLES.ADMIN}
          onCreateConference={() => setIsCreateConfOpen(true)}
          onSelect={(conferenceId) => {
            setActiveConfId(conferenceId);
            setIsConferenceSelected(true);
          }}
        />

        <CreateConferenceModal
          isOpen={isCreateConfOpen}
          onClose={() => setIsCreateConfOpen(false)}
          onCreate={({ title, startDate, endDate }) => {
            const newId = uuid();
            setConferencesTable((prev) => [
              ...prev,
              {
                id: newId,
                title,
                description: '',
                created_at: toIsoDate(startDate) || nowIso(),
                submission_deadline: toIsoDate(endDate) || nowIso()
              }
            ]);
            setActiveConfId(newId);
            setIsCreateConfOpen(false);
            setIsConferenceSelected(true);
          }}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans text-slate-900 selection:bg-indigo-100 overflow-x-hidden">
      <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-100 flex-shrink-0">
            <Award className="w-5 h-5 text-white" />
          </div>
          <p className="font-bold text-lg text-slate-800 truncate max-w-[200px] md:max-w-md">
            {activeConf?.title || 'Конференция'}
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-50 p-1 rounded-xl border border-slate-200 ml-4 flex-shrink-0">
          <select
            className="bg-transparent border-none text-sm font-bold rounded-lg px-3 py-1.5 focus:ring-0 outline-none cursor-pointer text-indigo-600"
            value={currentRole}
            onChange={(e) => setCurrentRole(e.target.value)}
          >
            <option value={ROLES.AUTHOR}>Автор</option>
            <option value={ROLES.REVIEWER}>Рецензент</option>
            <option value={ROLES.CHAIRMAN}>Председатель</option>
            <option value={ROLES.ADMIN}>Администратор</option>
          </select>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          role={currentRole}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onBackToConferenceSelect={() => setIsConferenceSelected(false)}
          onLogout={() => {
            setIsAuthenticated(false);
            setIsConferenceSelected(false);
            setIsCreateConfOpen(false);
          }}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-5xl mx-auto">
            {activeTab === 'main' && currentRole === ROLES.AUTHOR && <AuthorView activeConfId={activeConfId} sections={curSections} submissions={curSubmissions} updateSubmission={updateSubmission} setSubmissions={setSubmissions} />}
            {activeTab === 'main' && currentRole === ROLES.REVIEWER && <ReviewerView submissions={curSubmissions} updateSubmission={updateSubmission} currentReviewerId={currentReviewerId} />}
            {activeTab === 'main' && currentRole === ROLES.CHAIRMAN && <ChairmanView submissions={curSubmissions} updateSubmission={updateSubmission} sections={curSections} setSections={setSections} users={curUsers} />}

            {activeTab === 'info' && currentRole === ROLES.ADMIN && <AdminInfoView conference={activeConf} conferences={conferences} setConferences={setConferences} />}
            {activeTab === 'info' && currentRole !== ROLES.ADMIN && <PublicInfoView conference={activeConf} sections={curSections} />}

            {activeTab === 'program' && <SharedProgramView sections={curSections} submissions={curSubmissions} />}

            {activeTab === 'users' && currentRole === ROLES.ADMIN && <AdminUsersView activeConfId={activeConfId} users={curUsers} setUsers={setUsers} submissions={curSubmissions} />}
            {activeTab === 'submissions' && currentRole === ROLES.ADMIN && <AdminSubmissionsView activeConfId={activeConfId} sections={curSections} setSections={setSections} submissions={curSubmissions} updateSubmission={updateSubmission} />}
          </div>
        </main>
      </div>
    </div>
  );
}
