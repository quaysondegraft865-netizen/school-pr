import React, { useState } from 'react';
import {
  Calendar,
  Video,
  Clock,
  Users,
  Shield,
  Plus,
  RefreshCw,
  Play,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Filter,
  Check,
  AlertCircle,
} from 'lucide-react';
import { CalendarMeeting, BotSession } from '../types';

interface CalendarMeetingsViewProps {
  meetings: CalendarMeeting[];
  onToggleNapApproval: (meetingId: string) => void;
  onToggleAutoAttend: (meetingId: string) => void;
  onSyncCalendar: () => void;
  isSyncing: boolean;
  onStartImmediateAttendance: (meetingId: string) => void;
  onAddCustomMeeting: (newMeeting: Omit<CalendarMeeting, 'id'>) => void;
  onViewReport: (reportId: string) => void;
  isAuthenticated: boolean;
  onConnectGoogle: () => void;
  onOpenJoinMeeting?: () => void;
}

export const CalendarMeetingsView: React.FC<CalendarMeetingsViewProps> = ({
  meetings,
  onToggleNapApproval,
  onToggleAutoAttend,
  onSyncCalendar,
  isSyncing,
  onStartImmediateAttendance,
  onAddCustomMeeting,
  onViewReport,
  isAuthenticated,
  onConnectGoogle,
  onOpenJoinMeeting,
}) => {
  const [filter, setFilter] = useState<'all' | 'approved' | 'meet_only'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New meeting form state
  const [newTitle, setNewTitle] = useState('');
  const [newMeetLink, setNewMeetLink] = useState('https://meet.google.com/');
  const [newStartMinutes, setNewStartMinutes] = useState(30);
  const [newDurationMinutes, setNewDurationMinutes] = useState(45);
  const [newDesc, setNewDesc] = useState('');

  const filteredMeetings = meetings.filter((m) => {
    if (filter === 'approved') return m.napModeApproved;
    if (filter === 'meet_only') return m.isGoogleMeet;
    return true;
  });

  const handleCreateMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const start = new Date(Date.now() + newStartMinutes * 60 * 1000).toISOString();
    const end = new Date(Date.now() + (newStartMinutes + newDurationMinutes) * 60 * 1000).toISOString();

    onAddCustomMeeting({
      title: newTitle,
      description: newDesc,
      startTime: start,
      endTime: end,
      meetLink: newMeetLink.startsWith('http') ? newMeetLink : `https://${newMeetLink}`,
      isGoogleMeet: newMeetLink.includes('meet.google.com'),
      organizer: {
        name: 'You (Host)',
        email: 'user@google.com',
      },
      attendeesCount: 4,
      napModeApproved: true,
      autoAttendConfigured: true,
      botStatus: 'scheduled',
    });

    setNewTitle('');
    setNewDesc('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white tracking-tight">Google Calendar & Meet Schedule</h2>
            <span className="text-[10px] bg-purple-500/20 text-purple-300 font-semibold px-2 py-0.5 rounded-full border border-purple-500/30">
              {meetings.length} Events Synced
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Detect Google Meet links and authorize NapMeet AI to attend on your behalf.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {onOpenJoinMeeting && (
            <button
              onClick={onOpenJoinMeeting}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-sm border border-blue-400/40"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Join / Test Meet Session</span>
            </button>
          )}

          {!isAuthenticated && (
            <button
              onClick={onConnectGoogle}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer flex items-center gap-1.5"
            >
              Connect Real Google Account
            </button>
          )}

          <button
            onClick={onSyncCalendar}
            disabled={isSyncing}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            title="Sync with Google Calendar"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-purple-400' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Calendar'}</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Meeting Link</span>
          </button>
        </div>
      </div>

      {/* Sleep Schedule & Conflict Optimizer Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Nap Window Conflict Shield
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-full">
                Active Protection
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Target sleep window: <strong className="text-slate-200">1:00 PM – 2:30 PM</strong>. Overlapping Google Meet sessions can be automatically delegated to NapMeet AI.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            meetings.forEach((m) => {
              if (!m.napModeApproved) onToggleNapApproval(m.id);
            });
          }}
          className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/30 shrink-0"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Shield Sleep: Delegate All Meetings to AI</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 text-xs">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors ${
            filter === 'all'
              ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
              : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800'
          }`}
        >
          All Meetings ({meetings.length})
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors ${
            filter === 'approved'
              ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
              : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800'
          }`}
        >
          Approved for Nap Mode ({meetings.filter((m) => m.napModeApproved).length})
        </button>
        <button
          onClick={() => setFilter('meet_only')}
          className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors ${
            filter === 'meet_only'
              ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
              : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800'
          }`}
        >
          Google Meet Only ({meetings.filter((m) => m.isGoogleMeet).length})
        </button>
      </div>

      {/* Meeting Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMeetings.map((meeting) => {
          const startDate = new Date(meeting.startTime);
          const endDate = new Date(meeting.endTime);
          const durationMins = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));

          return (
            <div
              key={meeting.id}
              className={`rounded-2xl border p-5 flex flex-col justify-between transition-all ${
                meeting.napModeApproved
                  ? 'border-purple-500/50 bg-slate-900/90 shadow-lg shadow-purple-950/20'
                  : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
              }`}
            >
              <div className="space-y-3">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {meeting.isGoogleMeet ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          <Video className="w-3 h-3" />
                          Google Meet
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                          External
                        </span>
                      )}

                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          meeting.napModeApproved
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {meeting.napModeApproved ? '● AI Approved' : 'Manual Attend'}
                      </span>
                    </div>

                    <h3 className="font-bold text-white text-base leading-snug">{meeting.title}</h3>
                  </div>
                </div>

                {/* Description */}
                {meeting.description && (
                  <p className="text-xs text-slate-400 line-clamp-2">{meeting.description}</p>
                )}

                {/* Metadata badges */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 pt-1">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-purple-400" />
                    <span>
                      {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({durationMins}m)
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Users className="w-3.5 h-3.5" />
                    <span>{meeting.attendeesCount} attendees</span>
                  </div>

                  <div className="flex items-center gap-1 text-slate-400 truncate max-w-[200px]">
                    <span className="text-slate-500">Host:</span>
                    <span>{meeting.organizer.name}</span>
                  </div>
                </div>

                {/* Meet Link Preview */}
                {meeting.meetLink && (
                  <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="flex items-center gap-2 text-slate-300 font-mono text-[11px] truncate">
                      <Video className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className="truncate">{meeting.meetLink}</span>
                    </div>
                    <a
                      href={meeting.meetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-slate-400 hover:text-white transition-colors"
                      title="Open Google Meet Space"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              {/* Action Controls */}
              <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onToggleNapApproval(meeting.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      meeting.napModeApproved
                        ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-sm shadow-purple-600/30'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {meeting.napModeApproved ? <Check className="w-3.5 h-3.5" /> : null}
                    <span>{meeting.napModeApproved ? 'Nap Mode Active' : 'Enable AI Attend'}</span>
                  </button>

                  {meeting.napModeApproved && (
                    <button
                      onClick={() => onToggleAutoAttend(meeting.id)}
                      className={`text-[11px] px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer border ${
                        meeting.autoAttendConfigured
                          ? 'border-indigo-500/40 text-indigo-300 bg-indigo-950/30'
                          : 'border-slate-800 text-slate-500'
                      }`}
                      title="Automatically launch bot when call begins"
                    >
                      {meeting.autoAttendConfigured ? 'Auto-Join: ON' : 'Auto-Join: OFF'}
                    </button>
                  )}
                </div>

                <button
                  onClick={() => onStartImmediateAttendance(meeting.id)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-purple-300 hover:text-white hover:bg-purple-950/50 transition-colors cursor-pointer flex items-center gap-1"
                  title="Simulate AI attending this meeting now"
                >
                  <Play className="w-3 h-3" />
                  <span>Send Bot Now</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Custom Meeting Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Add Google Meet Session</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMeeting} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Meeting Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sprint Architecture Sync"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Google Meet Link</label>
                <input
                  type="text"
                  required
                  placeholder="https://meet.google.com/abc-defg-hij"
                  value={newMeetLink}
                  onChange={(e) => setNewMeetLink(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Starts In (minutes)</label>
                  <input
                    type="number"
                    min={1}
                    value={newStartMinutes}
                    onChange={(e) => setNewStartMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    min={5}
                    value={newDurationMinutes}
                    onChange={(e) => setNewDurationMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Notes / Description</label>
                <textarea
                  rows={2}
                  placeholder="Optional context for the AI assistant..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold cursor-pointer"
                >
                  Schedule for AI Attend
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
