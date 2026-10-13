import React, { useState } from 'react';
import {
  X,
  Video,
  Play,
  ExternalLink,
  Bot,
  User,
  Shield,
  Clock,
  Sparkles,
  Radio,
  ArrowRight,
  Mic,
  MicOff,
} from 'lucide-react';
import { CalendarMeeting } from '../types';

interface JoinMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetings: CalendarMeeting[];
  userName: string;
  onDispatchBot: (meetingId: string, meetLink: string, title: string) => void;
  onStartInteractiveSession: (meetingId: string, meetLink: string, title: string) => void;
}

export const JoinMeetingModal: React.FC<JoinMeetingModalProps> = ({
  isOpen,
  onClose,
  meetings,
  userName,
  onDispatchBot,
  onStartInteractiveSession,
}) => {
  if (!isOpen) return null;

  const [meetInput, setMeetInput] = useState('');
  const [meetingTitle, setMeetingTitle] = useState('');
  const [joinRole, setJoinRole] = useState<'bot' | 'client_direct' | 'interactive'>('bot');
  const [selectedCalendarMeeting, setSelectedCalendarMeeting] = useState<CalendarMeeting | null>(
    meetings[0] || null
  );

  const activeMeetLink = meetInput.trim()
    ? (meetInput.startsWith('http') ? meetInput : `https://${meetInput}`)
    : (selectedCalendarMeeting?.meetLink || 'https://meet.google.com/new');

  const activeTitle = meetingTitle.trim()
    ? meetingTitle
    : (selectedCalendarMeeting?.title || 'Ad-Hoc Google Meet Session');

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();

    if (joinRole === 'bot') {
      onDispatchBot(
        selectedCalendarMeeting?.id || `meet-adhoc-${Date.now()}`,
        activeMeetLink,
        activeTitle
      );
      onClose();
    } else if (joinRole === 'interactive') {
      onStartInteractiveSession(
        selectedCalendarMeeting?.id || `meet-adhoc-${Date.now()}`,
        activeMeetLink,
        activeTitle
      );
      onClose();
    } else if (joinRole === 'client_direct') {
      // Direct join in Google Meet tab
      window.open(activeMeetLink, '_blank', 'noopener,noreferrer');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Join Google Meet Session</h2>
              <p className="text-[11px] text-slate-400">
                Join live as client or dispatch NapMeet AI to attend on your behalf.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleJoin} className="space-y-5 text-xs">
          {/* Quick Meeting Selector */}
          <div className="space-y-2">
            <label className="block text-slate-300 font-medium">Select Upcoming Meeting</label>
            <select
              value={selectedCalendarMeeting?.id || ''}
              onChange={(e) => {
                const found = meetings.find((m) => m.id === e.target.value);
                if (found) {
                  setSelectedCalendarMeeting(found);
                  setMeetInput(found.meetLink);
                  setMeetingTitle(found.title);
                }
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="">-- Or enter custom link below --</option>
              {meetings.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title} ({new Date(m.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                </option>
              ))}
            </select>
          </div>

          {/* Direct Link or Code Input */}
          <div className="space-y-2">
            <label className="block text-slate-300 font-medium">Google Meet URL or Space Code</label>
            <div className="relative">
              <Video className="w-4 h-4 text-blue-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="https://meet.google.com/zqp-wryt-kba"
                value={meetInput}
                onChange={(e) => setMeetInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Meeting Title Input */}
          <div className="space-y-2">
            <label className="block text-slate-300 font-medium">Session Title</label>
            <input
              type="text"
              placeholder="e.g. Sprint Review & Architecture Sync"
              value={meetingTitle}
              onChange={(e) => setMeetingTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Join Role Choice */}
          <div className="space-y-2">
            <label className="block text-slate-300 font-medium">How would you like to join?</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Option 1: Dispatch AI Bot */}
              <div
                onClick={() => setJoinRole('bot')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  joinRole === 'bot'
                    ? 'border-purple-500 bg-purple-950/30 text-white shadow-sm ring-1 ring-purple-500/40'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-purple-300 mb-1">
                  <Bot className="w-4 h-4" />
                  <span>Send AI Bot</span>
                </div>
                <p className="text-[11px] leading-snug text-slate-400">
                  Bot joins as "{userName}'s Assistant" silently while you nap.
                </p>
              </div>

              {/* Option 2: Live Room Simulator */}
              <div
                onClick={() => setJoinRole('interactive')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  joinRole === 'interactive'
                    ? 'border-blue-500 bg-blue-950/30 text-white shadow-sm ring-1 ring-blue-500/40'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-blue-300 mb-1">
                  <Radio className="w-4 h-4" />
                  <span>Live Co-Pilot Room</span>
                </div>
                <p className="text-[11px] leading-snug text-slate-400">
                  Monitor live room stream with AI note-taker co-pilot.
                </p>
              </div>

              {/* Option 3: Direct Google Meet Tab */}
              <div
                onClick={() => setJoinRole('client_direct')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  joinRole === 'client_direct'
                    ? 'border-emerald-500 bg-emerald-950/30 text-white shadow-sm ring-1 ring-emerald-500/40'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-300 mb-1">
                  <ExternalLink className="w-4 h-4" />
                  <span>Open Meet App</span>
                </div>
                <p className="text-[11px] leading-snug text-slate-400">
                  Directly launch Google Meet in browser tab as yourself.
                </p>
              </div>
            </div>
          </div>

          {/* Action button */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-800">
            <span className="text-[11px] text-slate-500">
              Target: <strong className="text-slate-300">{activeMeetLink.replace('https://', '')}</strong>
            </span>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all cursor-pointer flex items-center gap-2"
            >
              <span>
                {joinRole === 'bot'
                  ? 'Dispatch AI Assistant to Meeting'
                  : joinRole === 'interactive'
                  ? 'Enter Live Meeting Room'
                  : 'Open Google Meet'}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
