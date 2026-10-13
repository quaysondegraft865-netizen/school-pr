import {
  CalendarMeeting,
  MeetingReport,
  UserProfile,
  AuditLog,
  AppNotification,
  BotSession,
} from '../types';
import {
  INITIAL_CALENDAR_MEETINGS,
  INITIAL_MEETING_REPORTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS,
} from '../data/mockData';

const KEYS = {
  MEETINGS: 'napmeet_meetings',
  REPORTS: 'napmeet_reports',
  PROFILE: 'napmeet_profile',
  AUDIT_LOGS: 'napmeet_audit_logs',
  NOTIFICATIONS: 'napmeet_notifications',
  ACTIVE_SESSION: 'napmeet_active_session',
  RETENTION_DAYS: 'napmeet_retention_days',
  DARK_MODE: 'napmeet_dark_mode',
};

export const getStoredMeetings = (): CalendarMeeting[] => {
  try {
    const raw = localStorage.getItem(KEYS.MEETINGS);
    if (!raw) {
      localStorage.setItem(KEYS.MEETINGS, JSON.stringify(INITIAL_CALENDAR_MEETINGS));
      return INITIAL_CALENDAR_MEETINGS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_CALENDAR_MEETINGS;
  }
};

export const saveStoredMeetings = (meetings: CalendarMeeting[]) => {
  localStorage.setItem(KEYS.MEETINGS, JSON.stringify(meetings));
};

export const getStoredReports = (): MeetingReport[] => {
  try {
    const raw = localStorage.getItem(KEYS.REPORTS);
    if (!raw) {
      localStorage.setItem(KEYS.REPORTS, JSON.stringify(INITIAL_MEETING_REPORTS));
      return INITIAL_MEETING_REPORTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_MEETING_REPORTS;
  }
};

export const saveStoredReports = (reports: MeetingReport[]) => {
  localStorage.setItem(KEYS.REPORTS, JSON.stringify(reports));
};

export const getStoredProfile = (): UserProfile => {
  try {
    const raw = localStorage.getItem(KEYS.PROFILE);
    if (!raw) {
      const defaultProfile: UserProfile = {
        id: 'usr_default',
        name: 'Degraft Quayson',
        email: 'quaysondegraft865@gmail.com',
        role: 'admin',
        plan: 'pro',
        napHoursUsed: 14.5,
        napHoursLimit: 40,
        autoAttendRules: {
          requireExplicitApproval: false,
          onlyInternalMeetings: false,
          maxMeetingLengthMinutes: 90,
          notifyOnWaitingRoomTimeout: true,
        },
        consentNoticeAccepted: true,
      };
      localStorage.setItem(KEYS.PROFILE, JSON.stringify(defaultProfile));
      return defaultProfile;
    }
    return JSON.parse(raw);
  } catch {
    return {
      id: 'usr_default',
      name: 'Degraft Quayson',
      email: 'quaysondegraft865@gmail.com',
      role: 'admin',
      plan: 'pro',
      napHoursUsed: 14.5,
      napHoursLimit: 40,
      autoAttendRules: {
        requireExplicitApproval: false,
        onlyInternalMeetings: false,
        maxMeetingLengthMinutes: 90,
        notifyOnWaitingRoomTimeout: true,
      },
      consentNoticeAccepted: true,
    };
  }
};

export const saveStoredProfile = (profile: UserProfile) => {
  localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
};

export const getStoredAuditLogs = (): AuditLog[] => {
  try {
    const raw = localStorage.getItem(KEYS.AUDIT_LOGS);
    if (!raw) {
      localStorage.setItem(KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
      return INITIAL_AUDIT_LOGS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_AUDIT_LOGS;
  }
};

export const addAuditLog = (
  eventType: AuditLog['eventType'],
  description: string,
  status: AuditLog['status'] = 'success',
  metadata?: Record<string, any>
) => {
  const profile = getStoredProfile();
  const logs = getStoredAuditLogs();
  const newLog: AuditLog = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    eventType,
    description,
    userEmail: profile.email,
    ipAddress: '192.168.1.42',
    status,
    metadata,
  };
  const updated = [newLog, ...logs].slice(0, 100);
  localStorage.setItem(KEYS.AUDIT_LOGS, JSON.stringify(updated));
  return updated;
};

export const getStoredNotifications = (): AppNotification[] => {
  try {
    const raw = localStorage.getItem(KEYS.NOTIFICATIONS);
    if (!raw) {
      localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
      return INITIAL_NOTIFICATIONS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_NOTIFICATIONS;
  }
};

export const addNotification = (
  title: string,
  message: string,
  type: AppNotification['type'] = 'info',
  meetingId?: string
) => {
  const list = getStoredNotifications();
  const newNotif: AppNotification = {
    id: `notif-${Date.now()}`,
    timestamp: 'Just now',
    title,
    message,
    type,
    meetingId,
    read: false,
  };
  const updated = [newNotif, ...list].slice(0, 50);
  localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(updated));
  return updated;
};

export const markAllNotificationsRead = () => {
  const list = getStoredNotifications().map((n) => ({ ...n, read: true }));
  localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(list));
  return list;
};

export const getRetentionDays = (): number => {
  const val = localStorage.getItem(KEYS.RETENTION_DAYS);
  return val ? parseInt(val, 10) : 30;
};

export const setRetentionDays = (days: number) => {
  localStorage.setItem(KEYS.RETENTION_DAYS, days.toString());
};
