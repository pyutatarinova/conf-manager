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
import InviteRegisterView from './components/common/InviteRegisterView';
import CreateConferenceModal from './components/ui/CreateConferenceModal';
import { clearAccessToken, getAccessToken } from './api/client';
import { createConference, getMyConferenceRole, listConferenceReviewers, listConferenceStaff, listConferences, listSections } from './api/conferences';
import { sendEmail } from './api/notifications';
import { getMe } from './api/users';
import { listConferenceSubmissions, listSubmissionAuthors, listChairMySubmissions, makeSubmissionDecision, updateSubmission as apiUpdateSubmission } from './api/submissions';
import { assignReviewer, listMyReviewSubmissions, listSubmissionReviews } from './api/reviews';

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

const normalizeSubmissionStatus = (status) => {
  const value = String(status || '').trim();
  if (!value) return 'reviewing';
  if (value === 'submitted') return 'reviewing';
  if (value === 'reviewed') return 'reviewing';
  if (value === 'revision_required') return 'needs_revision';
  if (value === 'rejected') return 'rejected';
  if (value === 'accepted_oral') return 'accepted_oral';
  if (value === 'accepted_poster') return 'accepted_poster';
  if (value === 'accepted') return 'accepted_oral';
  return value;
};

const mapUiDecisionToApi = (uiValue) => {
  const v = String(uiValue || '').trim();
  if (v === 'needs_revision') return 'revision_required';
  if (v === 'rejected') return 'rejected';
  if (v === 'accepted_oral') return 'accepted_oral';
  if (v === 'accepted_poster') return 'accepted_poster';
  if (v === 'reviewing') return null;
  return v || null;
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isConferenceSelected, setIsConferenceSelected] = useState(false);
  const [currentRole, setCurrentRole] = useState(ROLES.AUTHOR);
  const [activeTab, setActiveTab] = useState('main');
  const [conferencesLoading, setConferencesLoading] = useState(false);
  const [conferencesError, setConferencesError] = useState('');
  const [authScreen, setAuthScreen] = useState('auth');

  const [usersTable, setUsersTable] = useState(INITIAL_USERS);
  const [conferencesTable, setConferencesTable] = useState([]);
  const [conferenceRolesTable, setConferenceRolesTable] = useState(INITIAL_CONFERENCE_ROLES);
  const [sectionsTable, setSectionsTable] = useState(INITIAL_SECTIONS);
  const [submissionsTable, setSubmissionsTable] = useState(INITIAL_SUBMISSIONS);
  const [submissionAuthorsTable, setSubmissionAuthorsTable] = useState(INITIAL_SUBMISSION_AUTHORS);
  const [filesTable, setFilesTable] = useState(INITIAL_FILES);
  const [submissionFilesTable, setSubmissionFilesTable] = useState(INITIAL_SUBMISSION_FILES);
  const [reviewsTable, setReviewsTable] = useState(INITIAL_REVIEWS);
  const [reviewAssignmentsTable, setReviewAssignmentsTable] = useState(INITIAL_REVIEW_ASSIGNMENTS);
  const [chairVisibleSubmissionIds, setChairVisibleSubmissionIds] = useState([]);
  const [conferenceReviewers, setConferenceReviewers] = useState([]);
  const [staffLoadedForConf, setStaffLoadedForConf] = useState(null);

  const [activeConfId, setActiveConfId] = useState(null);
  const [isCreateConfOpen, setIsCreateConfOpen] = useState(false);

  const safeSendEmail = (payload) => {
    try {
      void sendEmail(payload).catch(() => {});
    } catch {
      // ignore client-side email errors in demo/local mode
    }
  };

  useEffect(() => {
    if (getAccessToken()) setIsAuthenticated(true);
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadMe() {
      if (!isAuthenticated) {
        setCurrentUser(null);
        return;
      }
      try {
        const me = await getMe();
        if (!isActive) return;
        setCurrentUser(me || null);
        if (me?.id) {
          setUsersTable((prev) => {
            const nextUser = {
              id: me.id,
              name: me.name || '',
              email: me.email || '',
              password_hash: '',
              affiliation: me.affiliation || '',
              bio: me.bio || '',
              created_at: me.created_at || nowIso()
            };
            const existingIdx = prev.findIndex((u) => u.id === me.id);
            if (existingIdx === -1) return [...prev, nextUser];
            const copy = [...prev];
            copy[existingIdx] = { ...copy[existingIdx], ...nextUser };
            return copy;
          });
        }
      } catch {
        if (!isActive) return;
        setCurrentUser(null);
      }
    }

    loadMe();

    return () => {
      isActive = false;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    let isActive = true;

    async function loadConferences() {
      if (!isAuthenticated) return;
      setConferencesLoading(true);
      setConferencesError('');
      try {
        const data = await listConferences();
        if (!isActive) return;
        if (Array.isArray(data)) {
          setConferencesTable(data);
          if (!activeConfId && data[0]?.id) setActiveConfId(data[0].id);
        }
      } catch (e) {
        if (!isActive) return;
        setConferencesError(e?.message || 'Не удалось загрузить список конференций.');
      } finally {
        if (isActive) setConferencesLoading(false);
      }
    }

    loadConferences();

    return () => {
      isActive = false;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    let isActive = true;

    async function loadSections() {
      if (!isAuthenticated || !activeConfId) return;
      try {
        const data = await listSections(activeConfId);
        if (!isActive) return;
        if (!Array.isArray(data)) return;
        setSectionsTable((prev) => {
          const withoutConf = prev.filter((s) => s.conference_id !== activeConfId);
          const nextForConf = data.map((s) => ({
            id: s.id,
            conference_id: s.conference_id,
            chair_id: s.chair_id || null,
            chair_name: s.chair_name || null,
            chair_email: s.chair_email || null,
            name: s.name,
            description: s.description
          }));
          return [...withoutConf, ...nextForConf];
        });
      } catch {
        // ignore sections load errors in demo/local mode
      }
    }

    loadSections();

    return () => {
      isActive = false;
    };
  }, [isAuthenticated, activeConfId]);

  useEffect(() => {
    let isActive = true;

    async function loadRole() {
      if (!isAuthenticated || !activeConfId) return;
      try {
        const data = await getMyConferenceRole(activeConfId);
        if (!isActive) return;
        const role = String(data?.role || '').trim();
        if (role === 'admin') setCurrentRole(ROLES.ADMIN);
        else if (role === 'chair') setCurrentRole(ROLES.CHAIRMAN);
        else if (role === 'reviewer') setCurrentRole(ROLES.REVIEWER);
        else setCurrentRole(ROLES.AUTHOR);
      } catch {
        if (!isActive) return;
        setCurrentRole(ROLES.AUTHOR);
      }
    }

    loadRole();

    return () => { isActive = false; };
  }, [isAuthenticated, activeConfId]);

  useEffect(() => {
    let isActive = true;

    async function loadStaff() {
      if (!isAuthenticated || !activeConfId) return;
      if (currentRole !== ROLES.ADMIN) return;
      if (staffLoadedForConf === activeConfId) return;

      try {
        const data = await listConferenceStaff(activeConfId);
        if (!isActive) return;
        if (!Array.isArray(data)) return;

        setUsersTable((prev) => {
          const other = prev.filter((u) => !data.some((r) => r.user_id === u.id));
          const next = data
            .filter((r) => r.user_id)
            .map((r) => ({
              id: r.user_id,
              name: r.user_name || '',
              email: r.email || '',
              password_hash: '',
              affiliation: r.affiliation || '',
              bio: '',
              created_at: nowIso()
            }));
          return [...other, ...next];
        });

        setConferenceRolesTable((prev) => {
          const other = prev.filter((r) => r.conference_id !== activeConfId);
          const next = data.map((r) => ({
            id: r.role_id,
            user_id: r.user_id,
            conference_id: r.conference_id,
            role: r.role === 'chair' ? 'chairman' : r.role,
            section_id: r.section_id || null
          }));
          return [...other, ...next];
        });

        setStaffLoadedForConf(activeConfId);
      } catch {
        // ignore
      }
    }

    loadStaff();

    return () => { isActive = false; };
  }, [isAuthenticated, activeConfId, currentRole, staffLoadedForConf]);

  useEffect(() => {
    let isActive = true;

    async function loadReviewers() {
      if (!isAuthenticated || !activeConfId) return;
      if (currentRole !== ROLES.ADMIN && currentRole !== ROLES.CHAIRMAN) return;
      try {
        const data = await listConferenceReviewers(activeConfId);
        if (!isActive) return;
        setConferenceReviewers(Array.isArray(data) ? data : []);
      } catch {
        if (!isActive) return;
        setConferenceReviewers([]);
      }
    }

    loadReviewers();

    return () => { isActive = false; };
  }, [isAuthenticated, activeConfId, currentRole]);

  useEffect(() => {
    let isActive = true;

    async function loadChairScope() {
      if (!isAuthenticated || !activeConfId || currentRole !== ROLES.CHAIRMAN) return;
      setChairVisibleSubmissionIds([]);
      try {
        const data = await listChairMySubmissions();
        if (!isActive) return;
        if (!Array.isArray(data)) return;
        setChairVisibleSubmissionIds(data.map((s) => s.id).filter(Boolean));
      } catch {
        // ignore (user may not be chair)
      }
    }

    loadChairScope();

    return () => {
      isActive = false;
    };
  }, [isAuthenticated, activeConfId, currentRole]);

  useEffect(() => {
    let isActive = true;

    async function loadMyAssignments() {
      if (!isAuthenticated || !activeConfId || !currentUser?.id) return;
      try {
        const data = await listMyReviewSubmissions();
        if (!isActive) return;
        if (!Array.isArray(data)) return;
        setReviewAssignmentsTable(() => data.map((a) => ({
          id: a.assignment_id || uuid(),
          submission_id: a.submission_id,
          reviewer_id: currentUser.id,
          assigned_by: a.assigned_by || null,
          created_at: a.assigned_at || nowIso()
        })));
      } catch {
        // ignore (may not be reviewer)
      }
    }

    loadMyAssignments();

    return () => {
      isActive = false;
    };
  }, [isAuthenticated, activeConfId, currentUser?.id]);

  useEffect(() => {
    let isActive = true;

    async function loadSubmissions() {
      if (!isAuthenticated || !activeConfId) return;
      try {
        const data = await listConferenceSubmissions(activeConfId);
        if (!isActive) return;
        if (!Array.isArray(data)) return;

        const normalizedSubmissions = data.map((s) => ({
          id: s.id,
          conference_id: activeConfId,
          section_id: s.section_id || null,
          title: s.title,
          status: normalizeSubmissionStatus(s.status),
          final_comment: s.final_comment ?? null,
          current_file_id: s.current_file_id || null,
          revision_count: s.revision_count ?? 1,
          is_best: s.is_best ?? false,
          created_at: s.created_at || nowIso(),
          updated_at: s.updated_at || nowIso()
        }));

        setSubmissionsTable((prev) => {
          const withoutConf = prev.filter((s) => s.conference_id !== activeConfId);
          return [...withoutConf, ...normalizedSubmissions];
        });

        const authorsBySubmission = await Promise.all(
          normalizedSubmissions.map(async (s) => {
            try {
              const authors = await listSubmissionAuthors(s.id);
              return { submissionId: s.id, authors: Array.isArray(authors) ? authors : [] };
            } catch {
              return { submissionId: s.id, authors: [] };
            }
          })
        );

        if (!isActive) return;

        setSubmissionAuthorsTable((prev) => {
          const remaining = prev.filter((a) => !normalizedSubmissions.some((s) => s.id === a.submission_id));
          const next = [];
          authorsBySubmission.forEach(({ submissionId, authors }) => {
            authors.forEach((a) => {
              next.push({
                id: a.id || uuid(),
                submission_id: submissionId,
                user_id: a.user_id || null,
                name: a.name,
                email: a.email,
                affiliation: a.affiliation || '',
                author_order: a.author_order ?? 1,
                is_corresponding: Boolean(a.is_corresponding)
              });
            });
          });
          return [...remaining, ...next];
        });

        const reviewsBySubmission = await Promise.all(
          normalizedSubmissions.map(async (s) => {
            try {
              const reviews = await listSubmissionReviews(s.id);
              return { submissionId: s.id, reviews: Array.isArray(reviews) ? reviews : [] };
            } catch {
              return { submissionId: s.id, reviews: [] };
            }
          })
        );

        if (!isActive) return;

        setReviewsTable((prev) => {
          const remaining = prev.filter((r) => !normalizedSubmissions.some((s) => s.id === r.submission_id));
          const next = [];
          reviewsBySubmission.forEach(({ submissionId, reviews }) => {
            reviews.forEach((r) => {
              next.push({
                id: r.id || uuid(),
                submission_id: submissionId,
                reviewer_id: r.reviewer_id || null,
                decision: normalizeSubmissionStatus(r.decision),
                comments: r.comments || '',
                file_id: r.file_id || null,
                revision_round: r.revision_round ?? 1,
                created_at: r.created_at || nowIso(),
                updated_at: r.updated_at || r.created_at || nowIso()
              });
            });
          });
          return [...remaining, ...next];
        });
      } catch {
        // ignore submissions load errors in demo/local mode
      }
    }

    loadSubmissions();

    return () => {
      isActive = false;
    };
  }, [isAuthenticated, activeConfId]);

  const refreshSubmissions = async (conferenceId) => {
    if (!conferenceId) return;
    const data = await listConferenceSubmissions(conferenceId);
    if (!Array.isArray(data)) return;

    const normalizedSubmissions = data.map((s) => ({
      id: s.id,
      conference_id: conferenceId,
      section_id: s.section_id || null,
      title: s.title,
      status: normalizeSubmissionStatus(s.status),
      final_comment: s.final_comment ?? null,
      current_file_id: s.current_file_id || null,
      revision_count: s.revision_count ?? 1,
      is_best: s.is_best ?? false,
      created_at: s.created_at || nowIso(),
      updated_at: s.updated_at || nowIso()
    }));

    setSubmissionsTable((prev) => {
      const withoutConf = prev.filter((s) => s.conference_id !== conferenceId);
      return [...withoutConf, ...normalizedSubmissions];
    });

    const authorsBySubmission = await Promise.all(
      normalizedSubmissions.map(async (s) => {
        try {
          const authors = await listSubmissionAuthors(s.id);
          return { submissionId: s.id, authors: Array.isArray(authors) ? authors : [] };
        } catch {
          return { submissionId: s.id, authors: [] };
        }
      })
    );

    setSubmissionAuthorsTable((prev) => {
      const remaining = prev.filter((a) => !normalizedSubmissions.some((s) => s.id === a.submission_id));
      const next = [];
      authorsBySubmission.forEach(({ submissionId, authors }) => {
        authors.forEach((a) => {
          next.push({
            id: a.id || uuid(),
            submission_id: submissionId,
            user_id: a.user_id || null,
            name: a.name,
            email: a.email,
            affiliation: a.affiliation || '',
            author_order: a.author_order ?? 1,
            is_corresponding: Boolean(a.is_corresponding)
          });
        });
      });
      return [...remaining, ...next];
    });

    const reviewsBySubmission = await Promise.all(
      normalizedSubmissions.map(async (s) => {
        try {
          const reviews = await listSubmissionReviews(s.id);
          return { submissionId: s.id, reviews: Array.isArray(reviews) ? reviews : [] };
        } catch {
          return { submissionId: s.id, reviews: [] };
        }
      })
    );

    setReviewsTable((prev) => {
      const remaining = prev.filter((r) => !normalizedSubmissions.some((s) => s.id === r.submission_id));
      const next = [];
      reviewsBySubmission.forEach(({ submissionId, reviews }) => {
        reviews.forEach((r) => {
          next.push({
            id: r.id || uuid(),
            submission_id: submissionId,
            reviewer_id: r.reviewer_id || null,
            decision: normalizeSubmissionStatus(r.decision),
            comments: r.comments || '',
            file_id: r.file_id || null,
            revision_round: r.revision_round ?? 1,
            created_at: r.created_at || nowIso(),
            updated_at: r.updated_at || r.created_at || nowIso()
          });
        });
      });
      return [...remaining, ...next];
    });
  };

  const conferences = useMemo(
    () => conferencesTable.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      startDate: toDateInput(c.start_date),
      endDate: toDateInput(c.submission_deadline),
      isPublic: c.is_public ?? false,
      isSubmit: c.is_submit ?? true
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
      .map((s) => ({
        id: s.id,
        conferenceId: s.conference_id,
        chairId: s.chair_id || null,
        chairName: s.chair_name || null,
        chairEmail: s.chair_email || null,
        name: s.name,
        description: s.description
      })),
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
          sectionId: r.section_id || ''
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
          .filter((r) => r.submission_id === s.id && r.revision_round === s.revision_count)
          .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))[0];

        const assignment = reviewAssignmentsTable.find((a) => a.submission_id === s.id);

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
          reviewText: s.final_comment || latestReview?.comments || '',
          reviewerId: assignment?.reviewer_id || null,
          isBest: Boolean(s.is_best),
          reviewerLocked: s.reviewer_locked_round === s.revision_count,
          chairmanLocked: s.chairman_locked_round === s.revision_count,
          reviewerLockedRound: s.reviewer_locked_round ?? null,
          chairmanLockedRound: s.chairman_locked_round ?? null
        };
      });
  }, [submissionsTable, submissionAuthorsTable, filesTable, submissionFilesTable, reviewsTable, reviewAssignmentsTable, activeConfId]);

  const visibleSubmissions = useMemo(() => {
    if (currentRole !== ROLES.AUTHOR) return curSubmissions;

    const myEmail = String(currentUser?.email || '').trim().toLowerCase();
    if (!myEmail) return [];

    const allowedIds = new Set(
      submissionAuthorsTable
        .filter((a) => String(a.email || '').trim().toLowerCase() === myEmail)
        .map((a) => a.submission_id)
    );

    return curSubmissions.filter((s) => allowedIds.has(s.id));
  }, [curSubmissions, currentRole, currentUser, submissionAuthorsTable]);

  const chairmanScopedSubmissions = useMemo(() => {
    if (currentRole !== ROLES.CHAIRMAN) return curSubmissions;
    if (!Array.isArray(chairVisibleSubmissionIds) || chairVisibleSubmissionIds.length === 0) return [];
    const allowed = new Set(chairVisibleSubmissionIds);
    return curSubmissions.filter((s) => allowed.has(s.id));
  }, [curSubmissions, currentRole, chairVisibleSubmissionIds]);

  const currentReviewerId = currentRole === ROLES.REVIEWER ? (currentUser?.id || null) : null;
  const currentChairmanId = currentRole === ROLES.CHAIRMAN ? (currentUser?.id || null) : null;

  const setConferences = (nextConferences) => {
    setConferencesTable((prev) => prev.map((conf) => {
      const next = nextConferences.find((c) => c.id === conf.id);
      if (!next) return conf;
        return {
          ...conf,
          title: next.title,
          description: next.description,
          start_date: toIsoDate(next.startDate) || conf.start_date,
          submission_deadline: toIsoDate(next.endDate) || conf.submission_deadline,
          is_public: next.isPublic ?? conf.is_public ?? false,
          is_submit: next.isSubmit ?? conf.is_submit ?? true
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
	          chair_id: s.chairId ?? existing?.chair_id ?? null,
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
        nextRoles.push({
          id: uuid(),
          user_id: existingUser.id,
          conference_id: activeConfId,
          role: u.role,
          section_id: u.role === 'chairman' ? (u.sectionId || null) : null
        });
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
        nextRoles.push({
          id: uuid(),
          user_id: userId,
          conference_id: activeConfId,
          role: u.role,
          section_id: u.role === 'chairman' ? (u.sectionId || null) : null
        });
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
      reviewer_locked_round: null,
      chairman_locked_round: null,
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

  const updateSubmission = (id, updates, actorRole = 'admin') => {
    const currentSubmission = submissionsTable.find((s) => s.id === id);
    if (!currentSubmission) return;

    // Реальные вызовы API (reviews/submissions). Оставшаяся часть функции — legacy мок-логика.
    if ((actorRole === 'chairman' || actorRole === 'admin') && updates?.finalizeChairman === true) {
      (async () => {
        const decision = mapUiDecisionToApi(updates.status || currentSubmission.status);
        if (!decision) return;
        await makeSubmissionDecision(id, { decision, comment: updates.reviewText ?? null });
        await refreshSubmissions?.(activeConfId);
      })().catch(() => {});
      return;
    }

    if (actorRole === 'reviewer' && updates?.finalizeReview === true) {
      (async () => {
        const decision = mapUiDecisionToApi(updates.status || currentSubmission.status);
        if (!decision) return;
        await makeSubmissionDecision(id, { decision, comment: updates.reviewText ?? null });
        await refreshSubmissions?.(activeConfId);
      })().catch(() => {});
      return;
    }

    if ((actorRole === 'chairman' || actorRole === 'admin') && updates?.reviewerId !== undefined) {
      (async () => {
        if (!updates.reviewerId) return;
        await assignReviewer({ submission_id: id, reviewer_id: updates.reviewerId });
        await refreshSubmissions?.(activeConfId);
      })().catch(() => {});
      return;
    }

    if (actorRole === 'admin' && updates?.sectionId !== undefined) {
      (async () => {
        await apiUpdateSubmission(id, { section_id: updates.sectionId || null });
        await refreshSubmissions?.(activeConfId);
      })().catch(() => {});
      return;
    }

    if (actorRole === 'admin' && (updates?.status !== undefined || updates?.reviewText !== undefined)) {
      (async () => {
        const decision = mapUiDecisionToApi(updates.status || currentSubmission.status);
        if (decision) await makeSubmissionDecision(id, { decision, comment: updates.reviewText ?? null });
        await refreshSubmissions?.(activeConfId);
      })().catch(() => {});
      return;
    }

    const isReviewerLockedForRound = currentSubmission.reviewer_locked_round === currentSubmission.revision_count;
    const isChairmanLockedForRound = currentSubmission.chairman_locked_round === currentSubmission.revision_count;

    let nextSubmission = { ...currentSubmission };

    if (updates.sectionId !== undefined) {
      if (actorRole === 'admin') nextSubmission.section_id = updates.sectionId;
    }

    if (updates.status !== undefined) {
      const canEditStatus =
        actorRole === 'admin'
        || (actorRole === 'reviewer' && !isReviewerLockedForRound && !isChairmanLockedForRound)
        || (actorRole === 'chairman' && !isChairmanLockedForRound);

      if (canEditStatus) {
        nextSubmission.status = updates.status;

        const authors = submissionAuthorsTable.filter((a) => a.submission_id === id);
        const uniqueEmails = [...new Set(authors.map((a) => a.email).filter(Boolean))];
        uniqueEmails.forEach((email) => {
          safeSendEmail({
            to: email,
            subject: 'Изменение статуса работы',
            text: `Статус вашей работы "${currentSubmission.title}" изменен на: ${updates.status}`
          });
        });
      }
    }

    if (updates.revisionCount !== undefined) {
      if (actorRole === 'author' || actorRole === 'admin') nextSubmission.revision_count = updates.revisionCount;
    }

    if (updates.isBest !== undefined) {
      if (actorRole === 'admin') nextSubmission.is_best = updates.isBest;
    }
    nextSubmission.updated_at = nowIso();

    if (updates.fileName || updates.thesisFileName) {
      if (actorRole !== 'author' && actorRole !== 'admin') return;
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
      if (actorRole !== 'chairman' && actorRole !== 'admin') return;
      if (actorRole === 'chairman' && isChairmanLockedForRound) return;

      (async () => {
        if (!updates.reviewerId) return;
        await assignReviewer({ submission_id: id, reviewer_id: updates.reviewerId });
        await refreshSubmissions?.(activeConfId);
      })().catch(() => {});
      return;

      if (updates.reviewerId) {
        const reviewer = usersTable.find((u) => u.id === updates.reviewerId);
        if (reviewer?.email) {
          safeSendEmail({
            to: reviewer.email,
            subject: 'Назначена работа на рецензирование',
            text: `Вам назначена работа "${currentSubmission.title}" для рецензирования.`
          });
        }
      }
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
      const canEditReview =
        actorRole === 'admin'
        || (actorRole === 'reviewer' && !isReviewerLockedForRound && !isChairmanLockedForRound)
        || (actorRole === 'chairman' && !isChairmanLockedForRound);

      if (actorRole === 'author') {
        // Автор не может менять рецензию.
      } else if (canEditReview) {
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
    }

    if (actorRole === 'reviewer' && updates.finalizeReview === true) {
      nextSubmission.reviewer_locked_round = nextSubmission.revision_count;
    }

    if (actorRole === 'chairman' && updates.finalizeChairman === true) {
      nextSubmission.chairman_locked_round = nextSubmission.revision_count;
    }

    setSubmissionsTable((prev) => prev.map((s) => (s.id === id ? nextSubmission : s)));
  };

  useEffect(() => {
    if (currentRole === ROLES.ADMIN) setActiveTab('info');
    else setActiveTab('main');
  }, [currentRole]);

  if (!isAuthenticated) {
    if (authScreen === 'invite') {
      return (
        <InviteRegisterView
          onAuth={(token) => {
            if (token) setIsAuthenticated(true);
            setIsConferenceSelected(false);
            setAuthScreen('auth');
          }}
          onBack={() => setAuthScreen('auth')}
        />
      );
    }

    return (
      <AuthView
        onAuth={() => {
          setIsAuthenticated(true);
          setIsConferenceSelected(false);
        }}
        onInviteRegister={() => setAuthScreen('invite')}
      />
    );
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
          onLogout={() => {
            clearAccessToken();
            setIsAuthenticated(false);
            setIsConferenceSelected(false);
            setIsCreateConfOpen(false);
          }}
          loading={conferencesLoading}
          error={conferencesError}
        />

        <CreateConferenceModal
          isOpen={isCreateConfOpen}
          onClose={() => setIsCreateConfOpen(false)}
          onCreate={({ title, startDate, endDate }) => {
            (async () => {
              try {
                const created = await createConference({
                  title,
                  description: '',
                  start_date: toIsoDate(startDate) || null,
                  submission_deadline: toIsoDate(endDate) || null,
                  is_public: false,
                  is_submit: true
                });

                const newId = created?.id || uuid();

                setConferencesTable((prev) => [
                  ...prev,
                  {
                    id: newId,
                    title: created?.title ?? title,
                    description: created?.description ?? '',
                    is_public: created?.is_public ?? false,
                    is_submit: created?.is_submit ?? true,
                    start_date: created?.start_date ?? (toIsoDate(startDate) || null),
                    submission_deadline: created?.submission_deadline ?? (toIsoDate(endDate) || nowIso())
                  }
                ]);

                setActiveConfId(newId);
                setIsCreateConfOpen(false);
                setIsConferenceSelected(true);
              } catch {
                const newId = uuid();
                setConferencesTable((prev) => [
                  ...prev,
                  {
                    id: newId,
                    title,
                    description: '',
                    is_public: false,
                    is_submit: true,
                    start_date: toIsoDate(startDate) || null,
                    submission_deadline: toIsoDate(endDate) || nowIso()
                  }
                ]);
                setActiveConfId(newId);
                setIsCreateConfOpen(false);
                setIsConferenceSelected(true);
              }
            })();
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

	        <div className="hidden">
	          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Роль</span>
	          <span className="text-sm font-black text-indigo-600">
	            {currentRole === ROLES.ADMIN ? 'Администратор' : currentRole === ROLES.CHAIRMAN ? 'Председатель' : currentRole === ROLES.REVIEWER ? 'Рецензент' : 'Автор'}
	          </span>
          <select
            className="hidden"
            value={currentRole}
	            onChange={() => {}}
	            disabled
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
            clearAccessToken();
            setIsAuthenticated(false);
            setIsConferenceSelected(false);
            setIsCreateConfOpen(false);
          }}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-5xl mx-auto">
            {activeTab === 'main' && currentRole === ROLES.AUTHOR && (
              <AuthorView
                activeConfId={activeConfId}
                currentUser={currentUser}
                sendEmail={safeSendEmail}
                isSubmitOpen={activeConf?.isSubmit ?? true}
                sections={curSections}
                submissions={visibleSubmissions}
                updateSubmission={(id, updates) => updateSubmission(id, updates, ROLES.AUTHOR)}
                refreshSubmissions={refreshSubmissions}
              />
            )}
            {activeTab === 'main' && currentRole === ROLES.REVIEWER && (
              <ReviewerView
                submissions={curSubmissions}
                updateSubmission={(id, updates) => updateSubmission(id, updates, ROLES.REVIEWER)}
                currentReviewerId={currentReviewerId}
              />
            )}
            {activeTab === 'main' && currentRole === ROLES.CHAIRMAN && (
              <ChairmanView
                activeConfId={activeConfId}
                submissions={chairmanScopedSubmissions}
                updateSubmission={(id, updates) => updateSubmission(id, updates, ROLES.CHAIRMAN)}
                sections={curSections}
                setSections={setSections}
                users={curUsers}
                chairmanId={currentChairmanId}
                reviewers={conferenceReviewers}
              />
            )}

            {activeTab === 'info' && currentRole === ROLES.ADMIN && <AdminInfoView conference={activeConf} conferences={conferences} setConferences={setConferences} />}
            {activeTab === 'info' && currentRole !== ROLES.ADMIN && <PublicInfoView conference={activeConf} sections={curSections} users={curUsers} />}

            {activeTab === 'program' && <SharedProgramView sections={curSections} submissions={curSubmissions} />}

            {activeTab === 'users' && currentRole === ROLES.ADMIN && <AdminUsersView activeConfId={activeConfId} users={curUsers} setUsers={setUsers} submissions={curSubmissions} sections={curSections} />}
            {activeTab === 'submissions' && currentRole === ROLES.ADMIN && <AdminSubmissionsView activeConfId={activeConfId} sections={curSections} setSections={setSections} submissions={curSubmissions} users={curUsers} reviewers={conferenceReviewers} updateSubmission={(id, updates) => updateSubmission(id, updates, ROLES.ADMIN)} />}
          </div>
        </main>
      </div>
    </div>
  );
}
