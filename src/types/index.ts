export type BotStatus =
  | 'scheduled'
  | 'joining'
  | 'waiting_for_host'
  | 'in_meeting'
  | 'processing'
  | 'completed'
  | 'failed';

export interface ActionItem {
  id: string;
  task: string;
  assignee: string;
  isCurrentUser: boolean;
  deadline?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

export interface QuestionAnswer {
  question: string;
  askedBy?: string;
  answer: string;
  answeredBy?: string;
}

export interface Quote {
  quote: string;
  speaker: string;
  timestamp: string;
  context?: string;
}

export interface TranscriptLine {
  id: string;
  timestamp: string;
  speaker: string;
  text: string;
  sentiment?: 'positive' | 'neutral' | 'urgent';
}

export type MeetingSentiment =
  | 'productive'
  | 'tense'
  | 'brainstorming'
  | 'collaborative'
  | 'urgent'
  | 'celebratory'
  | 'informative';

export interface PhaseSentiment {
  phase: string; // 'Beginning' | 'Middle' | 'End'
  phaseLabel?: string;
  score: number; // 0 to 100
  timeRange?: string;
  sentimentLabel?: string;
  keyInsight?: string;
}

export interface MeetingReport {
  id: string;
  meetingId: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  meetLink: string;
  botStatus: BotStatus;
  sentiment?: MeetingSentiment;
  sentimentScore?: number; // 0 to 100
  sentimentHighlights?: string;
  sentimentTimeline?: PhaseSentiment[];
  failureReason?: string;
  executiveSummary: string;
  meetingPurpose: string;
  mainDiscussionPoints: string[];
  decisionsMade: string[];
  actionItems: ActionItem[];
  questionsAndAnswers: QuestionAnswer[];
  importantQuotes: Quote[];
  followUpRecommendations: string[];
  transcript: TranscriptLine[];
  participants: {
    name: string;
    email?: string;
    role?: string;
    isHost?: boolean;
    speakingTimeMinutes?: number;
  }[];
  recordingEnabled: boolean;
  createdAt: string;
}

export interface CalendarMeeting {
  id: string;
  title: string;
  description?: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  meetLink: string;
  isGoogleMeet: boolean;
  organizer: {
    name: string;
    email: string;
  };
  attendeesCount: number;
  napModeApproved: boolean; // authorized for AI attendance
  autoAttendConfigured: boolean;
  botStatus: BotStatus;
  botSessionId?: string;
  reportId?: string;
}

export interface BotSession {
  id: string;
  meetingId: string;
  meetingTitle: string;
  meetLink: string;
  botName: string;
  status: BotStatus;
  startedAt: string;
  elapsedSeconds: number;
  waitingRoomStartTime?: string;
  joinedMeetingTime?: string;
  endedAt?: string;
  failureReason?: string;
  participantsCount: number;
  activeSpeaker?: string;
  audioLevels: number[];
  transcriptionEnabled: boolean;
  maxDurationMinutes: number;
  silentObserverEnforced: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: 'admin' | 'user';
  plan: 'free' | 'pro' | 'enterprise';
  napHoursUsed: number;
  napHoursLimit: number;
  autoAttendRules: {
    requireExplicitApproval: boolean;
    onlyInternalMeetings: boolean;
    maxMeetingLengthMinutes: number;
    notifyOnWaitingRoomTimeout: boolean;
  };
  consentNoticeAccepted: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  eventType: 'oauth_connect' | 'oauth_disconnect' | 'bot_scheduled' | 'bot_joined' | 'bot_left' | 'report_generated' | 'data_deleted' | 'admin_action';
  description: string;
  userEmail: string;
  ipAddress: string;
  status: 'success' | 'warning' | 'error';
  metadata?: Record<string, any>;
}

export interface AppNotification {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  meetingId?: string;
  read: boolean;
}

export interface SystemHealth {
  status: 'operational' | 'degraded' | 'outage';
  uptimePercentage: number;
  botPoolAvailable: number;
  botPoolTotal: number;
  geminiApiLatencyMs: number;
  calendarApiStatus: 'healthy' | 'degraded';
  activeBotSessionsCount: number;
}
