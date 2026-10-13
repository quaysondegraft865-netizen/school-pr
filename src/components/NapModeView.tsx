import React, { useState, useEffect } from 'react';
import {
  Moon,
  Clock,
  Shield,
  Play,
  Square,
  AlertTriangle,
  CheckCircle2,
  Users,
  Video,
  Sparkles,
  VolumeX,
  Volume2,
  Radio,
  FileCheck,
  ChevronRight,
  ExternalLink,
  Info,
} from 'lucide-react';
import { CalendarMeeting, BotSession, BotStatus, MeetingReport } from '../types';

interface NapModeViewProps {
  meetings: CalendarMeeting[];
  isNapModeActive: boolean;
  onToggleNapMode: () => void;
  activeSession: BotSession | null;
  onStartImmediateAttendance: (meetingId: string) => void;
  onStopAttendance: () => void;
  onInspectBot: (session: BotSession) => void;
  onViewReport: (reportId: string) => void;
  reports: MeetingReport[];
}

export const NapModeView: React.FC<NapModeViewProps> = ({
  meetings,
  isNapModeActive,
  onToggleNapMode,
  activeSession,
  onStartImmediateAttendance,
  onStopAttendance,
  onInspectBot,
  onViewReport,
  reports,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(60);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>(
    meetings.find((m) => m.napModeApproved)?.id || meetings[0]?.id || ''
  );

  // Advanced Wake-Up Triggers State
  const [wakeIfNameMentioned, setWakeIfNameMentioned] = useState(true);
  const [emergencyKeywords, setEmergencyKeywords] = useState('incident, outage, blocker, budget, security');
  const [ambientTheme, setAmbientTheme] = useState<'midnight' | 'violet' | 'amber'>('midnight');
  const [isPlayingChime, setIsPlayingChime] = useState(false);

  // Web Audio Gentle Alarm Chime Player
  const playGentleWakeChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      setIsPlayingChime(true);

      const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5 chord arpeggio
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.2);

        gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.2);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + idx * 0.2 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.2 + 0.8);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.2);
        osc.stop(ctx.currentTime + idx * 0.2 + 0.85);
      });

      setTimeout(() => setIsPlayingChime(false), 1200);
    } catch (e) {
      console.warn('AudioContext not allowed yet:', e);
      setIsPlayingChime(false);
    }
  };

  // Update clock every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setCurrentDate(
        now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const approvedMeetings = meetings.filter((m) => m.napModeApproved);
  const nextScheduledMeeting = approvedMeetings[0] || meetings[0];

  // Calculate countdown to next meeting
  const [countdownString, setCountdownString] = useState<string>('00:18:24');
  useEffect(() => {
    if (!nextScheduledMeeting) return;
    const interval = setInterval(() => {
      const target = new Date(nextScheduledMeeting.startTime).getTime();
      const diff = target - Date.now();
      if (diff <= 0) {
        setCountdownString('Starting now');
      } else {
        const hrs = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        setCountdownString(
          `${hrs > 0 ? `${hrs}h ` : ''}${mins.toString().padStart(2, '0')}m ${secs
            .toString()
            .padStart(2, '0')}s`
        );
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [nextScheduledMeeting]);

  const selectedMeeting = meetings.find((m) => m.id === selectedMeetingId) || nextScheduledMeeting;

  // Find if there is a recently completed report for the selected meeting
  const matchingReport = reports.find(
    (r) => r.meetingId === selectedMeeting?.id || r.title === selectedMeeting?.title
  );

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-gradient-to-b from-[#070b14] via-[#0b0f19] to-[#0d1322] text-slate-100 p-4 sm:p-6 lg:p-8 flex flex-col justify-between overflow-hidden">
      {/* Ambient background particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/5 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-[32rem] h-[32rem] bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute top-12 right-24 w-1.5 h-1.5 bg-purple-300 rounded-full star-twinkle" />
        <div className="absolute top-32 left-48 w-2 h-2 bg-indigo-200 rounded-full star-twinkle" style={{ animationDelay: '1.5s' }} />
        <div className="absolute bottom-40 left-1/3 w-1.5 h-1.5 bg-blue-300 rounded-full star-twinkle" style={{ animationDelay: '2.5s' }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto w-full space-y-8">
        {/* Top Header: Sleep clock & Status */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800/60 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-950/80 border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-900/30">
              <Moon className="w-6 h-6 text-purple-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-white">Nap Mode Nightstand</h1>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                    isNapModeActive
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {isNapModeActive ? '● MONITORING ACTIVE' : 'STANDBY'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Rest peacefully while NapMeet AI attends your authorized Google Meet calls.
              </p>
            </div>
          </div>

          {/* Time & Date display */}
          <div className="text-center sm:text-right">
            <div className="text-3xl sm:text-4xl font-mono font-bold tracking-tight text-slate-100">
              {currentTime || '12:00:00'}
            </div>
            <div className="text-xs text-purple-300/80 font-medium">{currentDate}</div>
          </div>
        </div>

        {/* Hero Nap Mode Controller Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Action / Countdown Box */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-400">
                  <Clock className="w-4 h-4" />
                  <span>Next Authorized Meeting Countdown</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
                  <span>Auto-stop limit:</span>
                  <select
                    value={timeLimitMinutes}
                    onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                    className="bg-transparent text-purple-300 font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value={30}>30 mins</option>
                    <option value={45}>45 mins</option>
                    <option value={60}>60 mins</option>
                    <option value={90}>90 mins</option>
                  </select>
                </div>
              </div>

              {/* Countdown Digits */}
              <div className="text-center py-4">
                <div className="text-5xl sm:text-6xl font-extrabold font-mono tracking-tight bg-gradient-to-r from-purple-200 via-indigo-100 to-white bg-clip-text text-transparent">
                  {countdownString}
                </div>
                <p className="text-sm text-slate-400 mt-2">
                  Target call: <span className="text-slate-200 font-medium">{nextScheduledMeeting?.title || 'No upcoming meeting'}</span>
                </p>
              </div>

              {/* Live Session / Bot State Box */}
              {activeSession ? (
                <div className="rounded-xl border border-purple-500/40 bg-purple-950/30 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                      <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">
                        Bot Status: {activeSession.status.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-purple-300">
                      Elapsed: {Math.floor(activeSession.elapsedSeconds / 60)}m {activeSession.elapsedSeconds % 60}s
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <Video className="w-3.5 h-3.5 text-blue-400" />
                      <span className="truncate max-w-[200px]">{activeSession.meetingTitle}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Users className="w-3.5 h-3.5" />
                      <span>{activeSession.participantsCount} participants</span>
                    </div>
                  </div>

                  {/* Audio Waveform visualization */}
                  <div className="pt-2 flex items-center justify-between gap-1 h-8 bg-slate-950/60 rounded-lg px-3">
                    <div className="flex items-center gap-1">
                      {[30, 60, 90, 45, 80, 100, 70, 50, 85, 40, 65, 95, 30, 75].map((h, i) => (
                        <div
                          key={i}
                          className="w-1 bg-purple-400 rounded-full animate-wave-bar"
                          style={{
                            height: `${h}%`,
                            animationDelay: `${(i * 0.08).toFixed(2)}s`,
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-purple-300 font-mono">
                      Active: {activeSession.activeSpeaker || 'Host speaking'}
                    </span>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => onInspectBot(activeSession)}
                      className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Inspect Live Meeting Stream
                    </button>
                    <button
                      onClick={onStopAttendance}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700/50 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Square className="w-3 h-3" />
                      Leave Call
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-slate-200">
                        {approvedMeetings.length} Meeting(s) Approved for Sleep Coverage
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Bot will automatically join when meetings start
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onStartImmediateAttendance(selectedMeeting?.id)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Play className="w-3 h-3" />
                    Simulate Attend Now
                  </button>
                </div>
              )}
            </div>

            {/* Main Toggle Control */}
            <div className="pt-6 border-t border-slate-800/70 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                onClick={onToggleNapMode}
                className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm tracking-wide shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2.5 ${
                  isNapModeActive
                    ? 'bg-rose-600 hover:bg-rose-500 text-white ring-4 ring-rose-500/20'
                    : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white ring-4 ring-purple-500/20 shadow-purple-500/25'
                }`}
              >
                {isNapModeActive ? (
                  <>
                    <Square className="w-4 h-4" />
                    Disable Nap Mode & Wake Up
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4" />
                    Enable Nap Mode
                  </>
                )}
              </button>

              <div className="text-xs text-slate-400 flex items-center gap-2">
                <VolumeX className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>Zero audio output guaranteed during attendance.</span>
              </div>
            </div>
          </div>

          {/* Right Column: Meeting Queue & Safety Policy */}
          <div className="space-y-6 flex flex-col justify-between">
            {/* Approved Meetings Queue */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Nap Session Queue
                </h3>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-bold">
                  {approvedMeetings.length} Approved
                </span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {meetings.map((meeting) => (
                  <div
                    key={meeting.id}
                    onClick={() => setSelectedMeetingId(meeting.id)}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      selectedMeetingId === meeting.id
                        ? 'border-purple-500/60 bg-purple-950/20 text-white'
                        : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between font-medium">
                      <span className="truncate max-w-[170px] text-slate-200">{meeting.title}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                          meeting.napModeApproved
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {meeting.napModeApproved ? 'Authorized' : 'Off'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                      <span>{new Date(meeting.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="font-mono text-purple-400">{meeting.meetLink.split('/').pop()}</span>
                    </div>
                  </div>
                ))}
              </div>

              {matchingReport && (
                <button
                  onClick={() => onViewReport(matchingReport.id)}
                  className="w-full mt-2 py-2 px-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 hover:bg-emerald-900/50 text-emerald-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  View Completed Meeting Report
                </button>
              )}
            </div>

            {/* Advanced Smart Wake-Up Triggers Panel */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Smart Wake-Up Triggers
                </span>
                <button
                  type="button"
                  onClick={playGentleWakeChime}
                  className="text-[10px] bg-slate-800 hover:bg-slate-700 text-purple-300 px-2 py-0.5 rounded font-mono border border-slate-700 cursor-pointer flex items-center gap-1"
                  title="Test soothing harmonic wake-up chime"
                >
                  <Volume2 className="w-3 h-3 text-purple-400" />
                  <span>{isPlayingChime ? 'Playing...' : 'Test Chime'}</span>
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <label className="flex items-center justify-between text-slate-300 cursor-pointer">
                  <span>Wake me if someone asks for me</span>
                  <input
                    type="checkbox"
                    checked={wakeIfNameMentioned}
                    onChange={(e) => setWakeIfNameMentioned(e.target.checked)}
                    className="rounded border-slate-700 text-purple-600 focus:ring-purple-500"
                  />
                </label>

                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">
                    Emergency Keywords (Triggers Chime):
                  </span>
                  <input
                    type="text"
                    value={emergencyKeywords}
                    onChange={(e) => setEmergencyKeywords(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-200 focus:outline-none focus:border-purple-500"
                    placeholder="incident, blocker, urgent..."
                  />
                </div>
              </div>
            </div>

            {/* Strict Safety & Ethics Policy Card */}
            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-purple-400 font-semibold text-xs">
                <Shield className="w-4 h-4" />
                <span>Strict Safety & Privacy Guarantee</span>
              </div>
              <ul className="text-[11px] text-slate-400 space-y-1.5 list-disc list-inside">
                <li>Bot joins clearly named: <strong className="text-slate-300">"NapMeet AI — Assistant for [You]"</strong>.</li>
                <li>Respects Google Meet waiting rooms and host admission.</li>
                <li>Muted microphone: Never speaks, votes, or sends unauthorized chats.</li>
                <li>Encrypted audio pipeline with auto-purge retention rules.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
