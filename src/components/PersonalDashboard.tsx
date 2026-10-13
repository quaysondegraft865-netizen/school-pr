import React from 'react';
import {
  Moon,
  Clock,
  Sparkles,
  Calendar,
  CheckSquare,
  FileText,
  Shield,
  ArrowRight,
  Video,
  Play,
  CheckCircle2,
  AlertCircle,
  Users,
} from 'lucide-react';
import { CalendarMeeting, MeetingReport, UserProfile } from '../types';

interface PersonalDashboardProps {
  meetings: CalendarMeeting[];
  reports: MeetingReport[];
  profile: UserProfile;
  onNavigateTab: (tab: 'dashboard' | 'nap_mode' | 'meetings' | 'reports' | 'actions' | 'admin') => void;
  onOpenReport: (reportId: string) => void;
  onToggleNapApproval: (meetingId: string) => void;
  onStartImmediateAttendance: (meetingId: string) => void;
  isNapModeActive: boolean;
  onOpenJoinMeeting?: () => void;
  onOpenAuthModal?: () => void;
  isAuthenticated?: boolean;
}

export const PersonalDashboard: React.FC<PersonalDashboardProps> = ({
  meetings,
  reports,
  profile,
  onNavigateTab,
  onOpenReport,
  onToggleNapApproval,
  onStartImmediateAttendance,
  isNapModeActive,
  onOpenJoinMeeting,
  onOpenAuthModal,
  isAuthenticated = false,
}) => {
  const approvedMeetings = meetings.filter((m) => m.napModeApproved);
  const nextMeeting = approvedMeetings[0] || meetings[0];

  // Action items for user
  const userActionItems: { task: string; reportTitle: string; deadline?: string }[] = [];
  reports.forEach((r) => {
    (r.actionItems || []).forEach((a) => {
      if (a.isCurrentUser && !a.completed) {
        userActionItems.push({
          task: a.task,
          reportTitle: r.title,
          deadline: a.deadline,
        });
      }
    });
  });

  return (
    <div className="space-y-8">
      {/* Hero Welcome Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-purple-950/70 via-slate-900/90 to-indigo-950/70 border border-purple-500/30 p-6 sm:p-8 overflow-hidden shadow-2xl backdrop-blur-xl">
        <div className="absolute right-0 top-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                AI MEETING ATTENDANT & CLIENT PORTAL
              </span>
              <span className="text-xs text-slate-400">
                Welcome back, {profile.name}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Rest peacefully. Your AI assistant will handle the meeting.
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              NapMeet AI joins authorized Google Meet sessions as your silent, transparent note-taker.
              Or log in directly as a client to join live with real-time AI Co-Pilot whisper assistance.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Direct Join Meeting CTA */}
            {onOpenJoinMeeting && (
              <button
                onClick={onOpenJoinMeeting}
                className="w-full sm:w-auto px-5 py-3.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 border border-blue-400/50"
              >
                <Video className="w-4 h-4" />
                <span>Join Google Meet</span>
              </button>
            )}

            <button
              onClick={() => onNavigateTab('nap_mode')}
              className={`w-full sm:w-auto px-6 py-3.5 rounded-xl text-xs font-bold shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                isNapModeActive
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-500/20'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-500/25 ring-4 ring-purple-500/20'
              }`}
            >
              <Moon className="w-4 h-4" />
              <span>{isNapModeActive ? 'Open Active Nap Mode' : 'Launch Nap Mode'}</span>
            </button>

            {!isAuthenticated && onOpenAuthModal ? (
              <button
                onClick={onOpenAuthModal}
                className="w-full sm:w-auto px-4 py-3 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Client Login</span>
              </button>
            ) : (
              <button
                onClick={() => onNavigateTab('meetings')}
                className="w-full sm:w-auto px-4 py-3 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Calendar className="w-4 h-4 text-purple-400" />
                <span>View Calendar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Sleep Reclaimed</span>
            <Moon className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            {profile.napHoursUsed} hrs
          </div>
          <span className="text-[11px] text-purple-300">Of {profile.napHoursLimit} monthly quota</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Meetings Attended</span>
            <Video className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            {reports.length} calls
          </div>
          <span className="text-[11px] text-emerald-400">100% attendance success</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Tasks For You</span>
            <CheckSquare className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-300 font-mono">
            {userActionItems.length} tasks
          </div>
          <span className="text-[11px] text-slate-400">Extracted from transcripts</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Upcoming Queue</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-300 font-mono">
            {approvedMeetings.length} calls
          </div>
          <span className="text-[11px] text-slate-400">Ready for Nap Mode</span>
        </div>
      </div>

      {/* Two Column Grid: Next Scheduled Meeting & Outstanding Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Scheduled Meeting Card */}
        <div className="lg:col-span-2 rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                Next Up On Your Calendar
              </span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  nextMeeting?.napModeApproved
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {nextMeeting?.napModeApproved ? '● AI Attend Approved' : 'Not Approved'}
              </span>
            </div>

            {nextMeeting ? (
              <div className="space-y-3 pt-1">
                <h3 className="text-lg font-bold text-white">{nextMeeting.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {nextMeeting.description || 'No agenda provided by host.'}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-purple-400" />
                    <span>
                      {new Date(nextMeeting.startTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-blue-400" />
                    <span className="font-mono">{nextMeeting.meetLink}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    <span>{nextMeeting.attendeesCount} participants</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">No scheduled meetings found.</p>
            )}
          </div>

          {nextMeeting && (
            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
              <button
                onClick={() => onToggleNapApproval(nextMeeting.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  nextMeeting.napModeApproved
                    ? 'bg-purple-600 hover:bg-purple-500 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                {nextMeeting.napModeApproved ? 'Revoke AI Attendance' : 'Authorize AI to Attend'}
              </button>

              <button
                onClick={() => onStartImmediateAttendance(nextMeeting.id)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600/80 hover:bg-indigo-600 text-white transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Simulate Attendance Now</span>
              </button>
            </div>
          )}
        </div>

        {/* Action Items Quick Card */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4" />
                Tasks Assigned to You
              </span>
              <button
                onClick={() => onNavigateTab('actions')}
                className="text-xs text-purple-400 hover:underline cursor-pointer"
              >
                View all
              </button>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {userActionItems.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No pending tasks! All caught up.
                </div>
              ) : (
                userActionItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-950/60 border border-purple-500/30 text-xs space-y-1"
                  >
                    <p className="text-slate-200 font-medium leading-snug">{item.task}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="truncate max-w-[150px]">{item.reportTitle}</span>
                      {item.deadline && <span className="text-amber-300 font-mono">{item.deadline}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 text-[11px] text-slate-400 flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-400 shrink-0" />
            <span>AI extracted tasks are updated instantly after every meeting.</span>
          </div>
        </div>
      </div>

      {/* Completed Meeting Intelligence Highlights */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Recent Attended Meeting Reports</h3>
            <p className="text-xs text-slate-400">
              Executive takeaways from calls attended while you were resting.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('reports')}
            className="text-xs text-purple-400 hover:underline font-medium cursor-pointer flex items-center gap-1"
          >
            <span>View All Reports</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.slice(0, 2).map((report) => (
            <div
              key={report.id}
              onClick={() => onOpenReport(report.id)}
              className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-purple-500/40 hover:bg-slate-900/80 transition-all cursor-pointer space-y-3 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  ATTENDED BY NAPMEET AI
                </span>
                <span className="text-xs text-slate-400">{report.date}</span>
              </div>

              <h4 className="font-bold text-white text-sm">{report.title}</h4>

              <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                {report.executiveSummary}
              </p>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                <span>{report.durationMinutes}m duration • {report.participants.length} attendees</span>
                <span className="text-purple-400 font-semibold flex items-center gap-1">
                  Read Report <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
