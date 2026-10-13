import React, { useState, useEffect, useRef } from 'react';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
  getCurrentUser,
} from './lib/firebase';
import { fetchGoogleCalendarEvents } from './lib/calendarApi';
import {
  getStoredMeetings,
  saveStoredMeetings,
  getStoredReports,
  saveStoredReports,
  getStoredProfile,
  saveStoredProfile,
  getStoredAuditLogs,
  addAuditLog,
  getStoredNotifications,
  addNotification,
  markAllNotificationsRead,
  getRetentionDays,
  setRetentionDays,
} from './lib/storage';
import {
  CalendarMeeting,
  MeetingReport,
  UserProfile,
  AuditLog,
  AppNotification,
  BotSession,
  BotStatus,
  SystemHealth,
} from './types';
import { INITIAL_SYSTEM_HEALTH } from './data/mockData';
import { requestAiMeetingAnalysis } from './lib/gemini';
import { Navbar } from './components/Navbar';
import { PersonalDashboard } from './components/PersonalDashboard';
import { NapModeView } from './components/NapModeView';
import { CalendarMeetingsView } from './components/CalendarMeetingsView';
import { MeetingReportsGallery } from './components/MeetingReportsGallery';
import { ActionItemsTracker } from './components/ActionItemsTracker';
import { AdminPortal } from './components/AdminPortal';
import { MeetingReportModal } from './components/MeetingReportModal';
import { LiveBotMonitorModal } from './components/LiveBotMonitorModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { AuthModal } from './components/AuthModal';
import { JoinMeetingModal } from './components/JoinMeetingModal';

export default function App() {
  // Navigation & View States
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'nap_mode' | 'meetings' | 'reports' | 'actions' | 'admin'
  >('dashboard');

  // Core Data States
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile>(getStoredProfile());
  const [meetings, setMeetings] = useState<CalendarMeeting[]>(getStoredMeetings());
  const [reports, setReports] = useState<MeetingReport[]>(getStoredReports());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(getStoredAuditLogs());
  const [notifications, setNotifications] = useState<AppNotification[]>(getStoredNotifications());
  const [retentionDays, setRetentionPeriod] = useState<number>(getRetentionDays());
  const [systemHealth, setSystemHealth] = useState<SystemHealth>(INITIAL_SYSTEM_HEALTH);

  // Nap Mode & Bot Session
  const [isNapModeActive, setIsNapModeActive] = useState(false);
  const [activeSession, setActiveSession] = useState<BotSession | null>(null);

  // Modals
  const [selectedReport, setSelectedReport] = useState<MeetingReport | null>(null);
  const [inspectingSession, setInspectingSession] = useState<BotSession | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showJoinMeetingModal, setShowJoinMeetingModal] = useState(false);

  // Loading States
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);

  // Timer reference for active bot simulation
  const sessionTimerRef = useRef<any>(null);

  // 1. Initialize Auth on mount
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        if (currentUser) {
          const updatedProfile = {
            ...profile,
            name: currentUser.displayName || profile.name,
            email: currentUser.email || profile.email,
            avatarUrl: currentUser.photoURL || undefined,
          };
          setProfile(updatedProfile);
          saveStoredProfile(updatedProfile);
        }
      },
      () => {
        setUser(null);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // 2. Active Bot Session Tick
  useEffect(() => {
    if (!activeSession) {
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
      return;
    }

    sessionTimerRef.current = setInterval(() => {
      setActiveSession((prev) => {
        if (!prev) return null;
        const nextElapsed = prev.elapsedSeconds + 1;

        // Auto progression for demo simulation:
        let nextStatus = prev.status;
        if (prev.status === 'joining' && nextElapsed >= 4) {
          nextStatus = 'waiting_for_host';
        } else if (prev.status === 'waiting_for_host' && nextElapsed >= 9) {
          nextStatus = 'in_meeting';
        }

        const updated = {
          ...prev,
          elapsedSeconds: nextElapsed,
          status: nextStatus,
        };

        if (inspectingSession && inspectingSession.id === prev.id) {
          setInspectingSession(updated);
        }

        return updated;
      });
    }, 1000);

    return () => {
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    };
  }, [activeSession, inspectingSession]);

  // Google Login Handler
  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        const updatedProfile = {
          ...profile,
          name: res.user.displayName || profile.name,
          email: res.user.email || profile.email,
          avatarUrl: res.user.photoURL || undefined,
        };
        setProfile(updatedProfile);
        saveStoredProfile(updatedProfile);

        const logs = addAuditLog(
          'oauth_connect',
          `Google OAuth connected with Google Calendar & Google Meet permissions for ${res.user.email}.`
        );
        setAuditLogs(logs);

        const notifs = addNotification(
          'Google Account Connected',
          'Successfully authorized Google Calendar and Google Meet scopes.',
          'success'
        );
        setNotifications(notifs);

        // Auto sync calendar if access token is available
        if (res.accessToken) {
          handleSyncCalendarWithToken(res.accessToken);
        }
      }
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      const notifs = addNotification(
        'Sign-In Notice',
        err?.message || 'Google Sign-In closed or canceled.',
        'warning'
      );
      setNotifications(notifs);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    const logs = addAuditLog('oauth_disconnect', 'Signed out from Google Account.');
    setAuditLogs(logs);
    const notifs = addNotification(
      'Signed Out',
      'Disconnected Google session from NapMeet AI.',
      'info'
    );
    setNotifications(notifs);
  };

  // Sync Google Calendar Events
  const handleSyncCalendarWithToken = async (token: string) => {
    setIsSyncingCalendar(true);
    try {
      const googleEvents = await fetchGoogleCalendarEvents(token);
      if (googleEvents && googleEvents.length > 0) {
        // Merge with existing approvals
        const merged = googleEvents.map((gev) => {
          const existing = meetings.find((m) => m.id === gev.id);
          return existing
            ? { ...gev, napModeApproved: existing.napModeApproved, autoAttendConfigured: existing.autoAttendConfigured }
            : gev;
        });
        setMeetings(merged);
        saveStoredMeetings(merged);

        const notifs = addNotification(
          'Calendar Synced',
          `Imported ${googleEvents.length} events from your primary Google Calendar.`,
          'success'
        );
        setNotifications(notifs);
      }
    } catch (error) {
      console.warn('Could not fetch events from real Google Calendar, keeping schedule:', error);
    } finally {
      setIsSyncingCalendar(false);
    }
  };

  const handleSyncCalendar = async () => {
    const token = await getAccessToken();
    if (token) {
      handleSyncCalendarWithToken(token);
    } else {
      // Re-initialize demo schedule
      const notifs = addNotification(
        'Calendar Updated',
        'Google Calendar schedule refreshed with latest Google Meet links.',
        'info'
      );
      setNotifications(notifs);
    }
  };

  // Toggle Nap Mode
  const handleToggleNapMode = () => {
    const nextState = !isNapModeActive;
    setIsNapModeActive(nextState);

    if (nextState) {
      const logs = addAuditLog(
        'bot_scheduled',
        'Nap Mode enabled. AI meeting assistant standing by for authorized calls.'
      );
      setAuditLogs(logs);
      const notifs = addNotification(
        'Nap Mode Activated',
        'Your sleep monitor is live. Authorized Google Meet calls will be attended silently.',
        'info'
      );
      setNotifications(notifs);
    } else {
      const notifs = addNotification(
        'Nap Mode Deactivated',
        'Sleep monitor stopped. Normal notification delivery resumed.',
        'info'
      );
      setNotifications(notifs);
    }
  };

  // Immediate attendance trigger
  const handleStartImmediateAttendance = (meetingId?: string) => {
    const targetMeeting =
      meetings.find((m) => m.id === meetingId) ||
      meetings.find((m) => m.napModeApproved) ||
      meetings[0];

    if (!targetMeeting) return;

    const newSession: BotSession = {
      id: `bot-session-${Date.now()}`,
      meetingId: targetMeeting.id,
      meetingTitle: targetMeeting.title,
      meetLink: targetMeeting.meetLink,
      botName: `NapMeet AI — Assistant for ${profile.name}`,
      status: 'joining',
      startedAt: new Date().toISOString(),
      elapsedSeconds: 0,
      participantsCount: targetMeeting.attendeesCount || 4,
      audioLevels: [40, 80, 60, 90, 70],
      activeSpeaker: 'Meeting Host',
      transcriptionEnabled: true,
      maxDurationMinutes: 60,
      silentObserverEnforced: true,
    };

    setActiveSession(newSession);
    setIsNapModeActive(true);

    const logs = addAuditLog(
      'bot_joined',
      `NapMeet AI initiated attendance for "${targetMeeting.title}". Disclosed transparent identity.`
    );
    setAuditLogs(logs);

    const notifs = addNotification(
      'Bot Dispatched to Google Meet',
      `NapMeet AI joining "${targetMeeting.title}" (${targetMeeting.meetLink}). Microphone is locked muted.`,
      'info',
      targetMeeting.id
    );
    setNotifications(notifs);
  };

  // Stop Attendance / Leave Meeting
  const handleStopAttendance = () => {
    if (activeSession) {
      const logs = addAuditLog(
        'bot_left',
        `NapMeet AI safely exited Google Meet space "${activeSession.meetingTitle}".`
      );
      setAuditLogs(logs);
      setActiveSession(null);
      setInspectingSession(null);
    }
  };

  // Conclude Call & Generate Report via Gemini 3.8 Flash
  const handleConcludeAndGenerateReport = async () => {
    if (!activeSession) return;

    // Advance session status to processing
    setActiveSession((prev) => (prev ? { ...prev, status: 'processing' } : null));

    // Realistic sample transcript for the active meeting
    const sampleTranscript = [
      { id: 't-1', timestamp: '00:02:10', speaker: 'Meeting Host', text: `Welcome everyone to ${activeSession.meetingTitle}. Let's get right into our key deliverables.` },
      { id: 't-2', timestamp: '00:05:40', speaker: 'Engineering Lead', text: `We reviewed the performance benchmarks and identified that our API throughput can be doubled with request multiplexing.` },
      { id: 't-3', timestamp: '00:12:15', speaker: 'Product Manager', text: `Agreed. We need ${profile.name} to verify the database indexes before we promote to production.` },
      { id: 't-4', timestamp: '00:18:30', speaker: 'Engineering Lead', text: `Also, will we have any breaking changes for mobile clients?` },
      { id: 't-5', timestamp: '00:22:45', speaker: 'Meeting Host', text: `No breaking changes; the schema changes are strictly additive.` },
      { id: 't-6', timestamp: '00:35:10', speaker: 'Meeting Host', text: `Fantastic discussion. Approved: Proceed with the rollout schedule as planned.` },
    ];

    try {
      const analysis = await requestAiMeetingAnalysis({
        meetingTitle: activeSession.meetingTitle,
        meetingDate: 'Today',
        participants: ['Meeting Host', 'Engineering Lead', 'Product Manager', `${profile.name} (Attended via NapMeet AI)`],
        currentUserEmail: profile.email,
        currentUserName: profile.name,
        transcript: sampleTranscript,
      });

      const newReport: MeetingReport = {
        id: `rep-${Date.now()}`,
        meetingId: activeSession.meetingId,
        title: activeSession.meetingTitle,
        date: 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        endTime: new Date(Date.now() + 1000 * 60 * 35).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        durationMinutes: 35,
        meetLink: activeSession.meetLink,
        botStatus: 'completed',
        sentiment: analysis.sentiment || 'productive',
        sentimentScore: analysis.sentimentScore ?? 86,
        sentimentHighlights: analysis.sentimentHighlights || 'Constructive alignment with swift agreement on key milestones.',
        executiveSummary: analysis.executiveSummary,
        meetingPurpose: analysis.meetingPurpose,
        mainDiscussionPoints: analysis.mainDiscussionPoints,
        decisionsMade: analysis.decisionsMade,
        actionItems: analysis.actionItems,
        questionsAndAnswers: analysis.questionsAndAnswers,
        importantQuotes: analysis.importantQuotes,
        followUpRecommendations: analysis.followUpRecommendations,
        transcript: sampleTranscript,
        participants: [
          { name: 'Meeting Host', role: 'Host', isHost: true, speakingTimeMinutes: 16 },
          { name: 'Engineering Lead', role: 'Lead', speakingTimeMinutes: 11 },
          { name: 'Product Manager', role: 'PM', speakingTimeMinutes: 8 },
          { name: `NapMeet AI — Assistant for ${profile.name}`, role: 'AI Assistant (Silent)', speakingTimeMinutes: 0 },
        ],
        recordingEnabled: true,
        createdAt: new Date().toISOString(),
      };

      const updatedReports = [newReport, ...reports];
      setReports(updatedReports);
      saveStoredReports(updatedReports);

      // Update meeting reportId
      const updatedMeetings = meetings.map((m) =>
        m.id === activeSession.meetingId ? { ...m, reportId: newReport.id, botStatus: 'completed' as BotStatus } : m
      );
      setMeetings(updatedMeetings);
      saveStoredMeetings(updatedMeetings);

      addAuditLog(
        'report_generated',
        `Meeting intelligence report generated for "${activeSession.meetingTitle}".`
      );

      const notifs = addNotification(
        'Meeting Intelligence Report Ready',
        `NapMeet AI concluded attendance for "${activeSession.meetingTitle}". ${newReport.actionItems.length} action items extracted.`,
        'success',
        activeSession.meetingId
      );
      setNotifications(notifs);

      // Open report modal immediately
      setSelectedReport(newReport);
    } catch (err) {
      console.error('Error generating report:', err);
    } finally {
      setActiveSession(null);
      setInspectingSession(null);
    }
  };

  // Toggle Meeting Nap Approval
  const handleToggleNapApproval = (meetingId: string) => {
    const updated = meetings.map((m) =>
      m.id === meetingId ? { ...m, napModeApproved: !m.napModeApproved } : m
    );
    setMeetings(updated);
    saveStoredMeetings(updated);
  };

  // Toggle Auto Attend
  const handleToggleAutoAttend = (meetingId: string) => {
    const updated = meetings.map((m) =>
      m.id === meetingId ? { ...m, autoAttendConfigured: !m.autoAttendConfigured } : m
    );
    setMeetings(updated);
    saveStoredMeetings(updated);
  };

  // Add custom meeting
  const handleAddCustomMeeting = (newMeeting: Omit<CalendarMeeting, 'id'>) => {
    const created: CalendarMeeting = {
      ...newMeeting,
      id: `meet-custom-${Date.now()}`,
    };
    const updated = [created, ...meetings];
    setMeetings(updated);
    saveStoredMeetings(updated);

    const notifs = addNotification(
      'Meeting Scheduled',
      `Added "${created.title}" with Google Meet link. Ready for Nap Mode.`,
      'info'
    );
    setNotifications(notifs);
  };

  // Update Action Item
  const handleUpdateActionItem = (reportId: string, actionId: string, completed: boolean) => {
    const updatedReports = reports.map((r) => {
      if (r.id !== reportId) return r;
      const updatedActions = (r.actionItems || []).map((a) =>
        a.id === actionId ? { ...a, completed } : a
      );
      return { ...r, actionItems: updatedActions };
    });
    setReports(updatedReports);
    saveStoredReports(updatedReports);

    if (selectedReport && selectedReport.id === reportId) {
      const updatedSelected = updatedReports.find((r) => r.id === reportId);
      if (updatedSelected) setSelectedReport(updatedSelected);
    }
  };

  // Update Report
  const handleUpdateReport = (updated: MeetingReport) => {
    const list = reports.map((r) => (r.id === updated.id ? updated : r));
    setReports(list);
    saveStoredReports(list);
  };

  // Delete Report
  const handleDeleteReport = (reportId: string) => {
    const list = reports.filter((r) => r.id !== reportId);
    setReports(list);
    saveStoredReports(list);

    addAuditLog('data_deleted', `Permanently deleted report ${reportId}.`);
    const notifs = addNotification('Report Deleted', 'Meeting intelligence report removed.', 'info');
    setNotifications(notifs);
  };

  // Purge all data
  const handlePurgeAllData = () => {
    setReports([]);
    saveStoredReports([]);
    addAuditLog('data_deleted', 'Admin executed full transcript purge.');
    const notifs = addNotification('Data Purged', 'All transcripts and reports permanently cleared.', 'warning');
    setNotifications(notifs);
  };

  // Update retention period
  const handleUpdateRetentionDays = (days: number) => {
    setRetentionPeriod(days);
    setRetentionDays(days);
    addNotification('Retention Policy Updated', `Transcripts will auto-delete after ${days} days.`, 'info');
  };

  // Handle successful login from AuthModal
  const handleAuthSuccess = (loggedInUser: any) => {
    setUser(loggedInUser);
    const updatedProfile: UserProfile = {
      ...profile,
      name: loggedInUser.displayName || loggedInUser.email?.split('@')[0] || profile.name,
      email: loggedInUser.email || profile.email,
      avatarUrl: loggedInUser.photoURL || undefined,
    };
    setProfile(updatedProfile);
    saveStoredProfile(updatedProfile);

    const logs = addAuditLog(
      'oauth_connect',
      `Client signed in as ${updatedProfile.name} (${updatedProfile.email}).`
    );
    setAuditLogs(logs);

    const notifs = addNotification(
      'Client Signed In',
      `Welcome ${updatedProfile.name}! Ready to attend Google Meet calls.`,
      'success'
    );
    setNotifications(notifs);
  };

  // Handle Join Meeting dispatch from JoinMeetingModal
  const handleDispatchBotFromModal = (meetingId: string, meetLink: string, title: string) => {
    const existing = meetings.find((m) => m.id === meetingId);
    if (!existing) {
      const newM: CalendarMeeting = {
        id: meetingId,
        title,
        meetLink,
        isGoogleMeet: true,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 1000 * 60 * 45).toISOString(),
        organizer: { name: profile.name, email: profile.email },
        attendeesCount: 4,
        napModeApproved: true,
        autoAttendConfigured: true,
        botStatus: 'joining',
      };
      const updatedList = [newM, ...meetings];
      setMeetings(updatedList);
      saveStoredMeetings(updatedList);
    }
    handleStartImmediateAttendance(meetingId);
  };

  const handleStartInteractiveSession = (meetingId: string, meetLink: string, title: string) => {
    handleDispatchBotFromModal(meetingId, meetLink, title);
    const sess: BotSession = {
      id: `bot-session-${Date.now()}`,
      meetingId,
      meetingTitle: title,
      meetLink,
      botName: `NapMeet AI — Assistant for ${profile.name}`,
      status: 'in_meeting',
      startedAt: new Date().toISOString(),
      elapsedSeconds: 0,
      participantsCount: 5,
      audioLevels: [50, 90, 70, 85],
      activeSpeaker: 'Meeting Host',
      transcriptionEnabled: true,
      maxDurationMinutes: 60,
      silentObserverEnforced: true,
    };
    setActiveSession(sess);
    setInspectingSession(sess);
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans selection:bg-purple-500/30">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        profile={profile}
        isLoggingIn={isLoggingIn}
        onOpenAuthModal={() => setShowAuthModal(true)}
        onOpenJoinMeeting={() => setShowJoinMeetingModal(true)}
        onLogout={handleLogout}
        notifications={notifications}
        onOpenNotifications={() => setShowNotifications(true)}
        isNapModeActive={isNapModeActive}
      />

      {/* Main View Router */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'dashboard' && (
          <PersonalDashboard
            meetings={meetings}
            reports={reports}
            profile={profile}
            onNavigateTab={setActiveTab}
            onOpenReport={(id) => {
              const rep = reports.find((r) => r.id === id);
              if (rep) setSelectedReport(rep);
            }}
            onToggleNapApproval={handleToggleNapApproval}
            onStartImmediateAttendance={handleStartImmediateAttendance}
            isNapModeActive={isNapModeActive}
            onOpenJoinMeeting={() => setShowJoinMeetingModal(true)}
            onOpenAuthModal={() => setShowAuthModal(true)}
            isAuthenticated={Boolean(user)}
          />
        )}

        {activeTab === 'nap_mode' && (
          <NapModeView
            meetings={meetings}
            isNapModeActive={isNapModeActive}
            onToggleNapMode={handleToggleNapMode}
            activeSession={activeSession}
            onStartImmediateAttendance={handleStartImmediateAttendance}
            onStopAttendance={handleStopAttendance}
            onInspectBot={(session) => setInspectingSession(session)}
            onViewReport={(id) => {
              const rep = reports.find((r) => r.id === id);
              if (rep) setSelectedReport(rep);
            }}
            reports={reports}
          />
        )}

        {activeTab === 'meetings' && (
          <CalendarMeetingsView
            meetings={meetings}
            onToggleNapApproval={handleToggleNapApproval}
            onToggleAutoAttend={handleToggleAutoAttend}
            onSyncCalendar={handleSyncCalendar}
            isSyncing={isSyncingCalendar}
            onStartImmediateAttendance={handleStartImmediateAttendance}
            onAddCustomMeeting={handleAddCustomMeeting}
            onViewReport={(id) => {
              const rep = reports.find((r) => r.id === id);
              if (rep) setSelectedReport(rep);
            }}
            isAuthenticated={Boolean(user)}
            onConnectGoogle={handleLogin}
            onOpenJoinMeeting={() => setShowJoinMeetingModal(true)}
          />
        )}

        {activeTab === 'reports' && (
          <MeetingReportsGallery
            reports={reports}
            onOpenReport={(id) => {
              const rep = reports.find((r) => r.id === id);
              if (rep) setSelectedReport(rep);
            }}
            onDeleteReport={handleDeleteReport}
            onUpdateReport={handleUpdateReport}
          />
        )}

        {activeTab === 'actions' && (
          <ActionItemsTracker
            reports={reports}
            onOpenReport={(id) => {
              const rep = reports.find((r) => r.id === id);
              if (rep) setSelectedReport(rep);
            }}
            onUpdateActionItem={handleUpdateActionItem}
          />
        )}

        {activeTab === 'admin' && (
          <AdminPortal
            auditLogs={auditLogs}
            systemHealth={systemHealth}
            profile={profile}
            retentionDays={retentionDays}
            onUpdateRetentionDays={handleUpdateRetentionDays}
            onPurgeAllData={handlePurgeAllData}
          />
        )}
      </main>

      {/* Report Modal */}
      {selectedReport && (
        <MeetingReportModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onUpdateReport={handleUpdateReport}
        />
      )}

      {/* Live Bot / Interactive Meeting Room Modal */}
      {inspectingSession && (
        <LiveBotMonitorModal
          session={inspectingSession}
          onClose={() => setInspectingSession(null)}
          onAdvanceStatus={(next) => {
            setActiveSession((prev) => (prev ? { ...prev, status: next } : null));
            setInspectingSession((prev) => (prev ? { ...prev, status: next } : null));
          }}
          onLeaveMeeting={handleStopAttendance}
          onGenerateReportNow={handleConcludeAndGenerateReport}
          user={user}
          profile={profile}
          onSwitchToNapMode={() => {
            setIsNapModeActive(true);
            const notifs = addNotification(
              'Switched to Nap Mode',
              'NapMeet AI is silently attending the meeting on your behalf while you rest.',
              'success'
            );
            setNotifications(notifs);
          }}
        />
      )}

      {/* Notifications Drawer */}
      {showNotifications && (
        <NotificationCenterModal
          notifications={notifications}
          onClose={() => setShowNotifications(false)}
          onMarkAllRead={() => {
            const readList = markAllNotificationsRead();
            setNotifications(readList);
          }}
          onSelectMeeting={(mId) => {
            const report = reports.find((r) => r.meetingId === mId);
            if (report) {
              setSelectedReport(report);
            } else {
              setActiveTab('meetings');
            }
          }}
        />
      )}

      {/* Client Auth Modal */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onGoogleLogin={handleLogin}
          isGoogleLoading={isLoggingIn}
          onAuthSuccess={handleAuthSuccess}
        />
      )}

      {/* Join Meeting Modal */}
      {showJoinMeetingModal && (
        <JoinMeetingModal
          isOpen={showJoinMeetingModal}
          onClose={() => setShowJoinMeetingModal(false)}
          meetings={meetings}
          userName={profile.name}
          onDispatchBot={handleDispatchBotFromModal}
          onStartInteractiveSession={handleStartInteractiveSession}
        />
      )}
    </div>
  );
}
