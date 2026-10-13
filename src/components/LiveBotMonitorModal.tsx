import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Radio,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Users,
  Clock,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Play,
  Square,
  Sparkles,
  ExternalLink,
  MessageSquare,
  Send,
  Moon,
  Volume2,
  Share2,
  Settings,
  Bot,
  UserCheck,
  Activity,
  Smile,
  Zap,
} from 'lucide-react';
import { BotSession, BotStatus, UserProfile } from '../types';

interface LiveBotMonitorModalProps {
  session: BotSession | null;
  onClose: () => void;
  onAdvanceStatus?: (nextStatus: BotStatus) => void;
  onLeaveMeeting: () => void;
  onGenerateReportNow: () => void;
  user?: any | null;
  profile?: UserProfile;
  onSwitchToNapMode?: () => void;
}

export const LiveBotMonitorModal: React.FC<LiveBotMonitorModalProps> = ({
  session,
  onClose,
  onAdvanceStatus,
  onLeaveMeeting,
  onGenerateReportNow,
  user,
  profile,
  onSwitchToNapMode,
}) => {
  if (!session) return null;

  // Mode: Are we monitoring the silent bot, or is the client actively participating in the live room?
  const [meetingMode, setMeetingMode] = useState<'client_live' | 'silent_bot'>('client_live');

  // Client Controls
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Live Simulated Speakers and Transcripts
  const [activeSpeakerIndex, setActiveSpeakerIndex] = useState(0);
  const [liveTranscriptHistory, setLiveTranscriptHistory] = useState<
    { speaker: string; text: string; time: string; sentiment: 'positive' | 'neutral' | 'urgent' }[]
  >([
    {
      speaker: 'David Kim (Host)',
      text: 'Good morning everyone! Let us review the Q4 architecture and timeline dependencies.',
      time: '00:01',
      sentiment: 'positive',
    },
    {
      speaker: 'Elena Rostova',
      text: 'The UI tokens migration is on schedule. We are finalizing mobile responsive views.',
      time: '00:14',
      sentiment: 'positive',
    },
    {
      speaker: 'Marcus Vance',
      text: 'We noticed a latency spike in the webhook ingestion queues yesterday. We need to agree on rate limits.',
      time: '00:28',
      sentiment: 'urgent',
    },
  ]);

  // AI Co-Pilot In-Meeting Chat State
  const [aiWhisperInput, setAiWhisperInput] = useState('');
  const [whisperHistory, setWhisperHistory] = useState<
    { sender: 'user' | 'copilot'; text: string; timestamp: string }[]
  >([
    {
      sender: 'copilot',
      text: `Hello ${profile?.name || 'there'}! I am your in-meeting AI Co-Pilot. As you attend or speak, I can draft replies, summarize points, or take over when you are ready to nap.`,
      timestamp: 'Now',
    },
  ]);
  const [isCopilotThinking, setIsCopilotThinking] = useState(false);

  // Status progression steps
  const statuses: { key: BotStatus; label: string }[] = [
    { key: 'scheduled', label: 'Scheduled' },
    { key: 'joining', label: 'Joining' },
    { key: 'waiting_for_host', label: 'Waiting Room' },
    { key: 'in_meeting', label: 'In Meeting' },
    { key: 'processing', label: 'Processing' },
    { key: 'completed', label: 'Completed' },
  ];

  const currentIdx = statuses.findIndex((s) => s.key === session.status);

  // Roster of participants
  const participantsList = [
    {
      name: profile?.name || 'You (Client)',
      role: 'Client Attendee',
      isClient: true,
      avatarBg: 'bg-purple-600',
      initials: (profile?.name || 'Client')
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
    },
    {
      name: 'David Kim',
      role: 'Host • VP Infrastructure',
      isClient: false,
      avatarBg: 'bg-blue-600',
      initials: 'DK',
    },
    {
      name: 'Elena Rostova',
      role: 'Staff Platform Engineer',
      isClient: false,
      avatarBg: 'bg-emerald-600',
      initials: 'ER',
    },
    {
      name: 'Marcus Vance',
      role: 'DevOps Lead',
      isClient: false,
      avatarBg: 'bg-amber-600',
      initials: 'MV',
    },
    {
      name: `NapMeet AI (${profile?.name || 'Client'})`,
      role: 'AI Assistant (Silent Note-Taker)',
      isClient: false,
      avatarBg: 'bg-indigo-600',
      initials: 'AI',
    },
  ];

  // Rotate simulated speaker every 8 seconds if in meeting
  useEffect(() => {
    if (session.status !== 'in_meeting') return;

    const interval = setInterval(() => {
      setActiveSpeakerIndex((prev) => (prev + 1) % 4);
    }, 7000);

    return () => clearInterval(interval);
  }, [session.status]);

  // Handle Asking In-Meeting AI Co-Pilot
  const handleSendCopilotPrompt = (promptText?: string) => {
    const textToSend = promptText || aiWhisperInput.trim();
    if (!textToSend || isCopilotThinking) return;

    const userEntry = {
      sender: 'user' as const,
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setWhisperHistory((prev) => [...prev, userEntry]);
    if (!promptText) setAiWhisperInput('');
    setIsCopilotThinking(true);

    setTimeout(() => {
      let reply = '';
      const lower = textToSend.toLowerCase();

      if (lower.includes('say') || lower.includes('reply') || lower.includes('speak')) {
        reply = `💡 Suggested Talking Point: "We can deploy exponential backoff with jitter on the queue handlers by Friday to prevent webhook retries from triggering latency spikes."`;
      } else if (lower.includes('summarize') || lower.includes('what happened')) {
        reply = `📋 Current Recap: David opened the review. Elena confirmed UI tokens are on track. Marcus raised concern on webhook queue latency and requested rate limits.`;
      } else if (lower.includes('budget') || lower.includes('cost')) {
        reply = `💰 Financial Context: Autoscaling non-production clusters will save ~$3,500/month without risking payment throughput.`;
      } else {
        reply = `🤖 Co-Pilot Analysis: The room dynamic is constructive. Consensus is building toward approval of staging changes. You can safely confirm your availability for testing.`;
      }

      setWhisperHistory((prev) => [
        ...prev,
        {
          sender: 'copilot',
          text: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setIsCopilotThinking(false);
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md">
      <div className="relative w-full max-w-6xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Top Meeting Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base tracking-tight">
                  {session.meetingTitle}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  LIVE SESSION
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span className="font-mono text-purple-300">{session.meetLink}</span>
                <span>•</span>
                <span>Client: {profile?.name || 'Authenticated'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Switcher */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setMeetingMode('client_live')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  meetingMode === 'client_live'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Client Live Join</span>
              </button>
              <button
                onClick={() => setMeetingMode('silent_bot')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  meetingMode === 'silent_bot'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>AI Bot Observer</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Meeting Status Stepper Bar */}
        <div className="px-6 py-2.5 bg-slate-950/40 border-b border-slate-800/80">
          <div className="flex items-center justify-between">
            {statuses.map((step, idx) => {
              const isPassed = idx < currentIdx;
              const isCurrent = idx === currentIdx;

              return (
                <div key={step.key} className="flex items-center gap-2">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                      isCurrent
                        ? 'bg-purple-600 text-white ring-4 ring-purple-500/20 shadow-md shadow-purple-600/40'
                        : isPassed
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isPassed ? '✓' : idx + 1}
                  </div>
                  <span
                    className={`text-xs hidden sm:inline font-medium ${
                      isCurrent
                        ? 'text-purple-300 font-bold'
                        : isPassed
                        ? 'text-slate-300'
                        : 'text-slate-500'
                    }`}
                  >
                    {step.label}
                  </span>
                  {idx < statuses.length - 1 && (
                    <div
                      className={`h-0.5 w-6 sm:w-12 mx-1 ${
                        idx < currentIdx ? 'bg-emerald-600' : 'bg-slate-800'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Split Grid: Left Google Meet Grid, Right AI Co-Pilot Whisper */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 overflow-hidden">
          {/* LEFT 2 COLS: Video Grid & Controls */}
          <div className="lg:col-span-2 p-5 flex flex-col justify-between space-y-4 overflow-y-auto bg-slate-950/30">
            {/* Live Meeting Stage */}
            <div className="relative rounded-2xl bg-slate-950 border border-slate-800 p-4 shadow-inner flex flex-col justify-between min-h-[360px]">
              {/* Meet Top Bar Information */}
              <div className="flex items-center justify-between text-xs text-slate-300 z-10">
                <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800">
                  <Video className="w-3.5 h-3.5 text-blue-400" />
                  <span className="font-mono">{session.meetLink.replace('https://', '')}</span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Real-Time Sentiment Vibe Pill */}
                  <div className="flex items-center gap-1.5 bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-xl text-[11px] font-semibold">
                    <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
                    <span>Dynamic: Productive (88% Harmony)</span>
                  </div>

                  <div className="flex items-center gap-1.5 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono text-purple-300">
                    <Clock className="w-3.5 h-3.5 text-purple-400" />
                    <span>
                      {Math.floor(session.elapsedSeconds / 60)}:
                      {(session.elapsedSeconds % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Waiting Room state */}
              {session.status === 'waiting_for_host' ? (
                <div className="flex flex-col items-center justify-center text-center space-y-3 my-auto z-10 py-12">
                  <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 animate-pulse">
                    <Clock className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">
                      Waiting to be admitted by the meeting host...
                    </h4>
                    <p className="text-xs text-slate-400 max-w-md mt-1">
                      You are in the waiting room for "{session.meetingTitle}".
                    </p>
                  </div>
                  {onAdvanceStatus && (
                    <button
                      onClick={() => onAdvanceStatus('in_meeting')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer shadow-lg shadow-emerald-600/30"
                    >
                      Host Admits Client & Assistant
                    </button>
                  )}
                </div>
              ) : (
                /* Active Participant Tiles Grid */
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-4 z-10">
                  {/* Tile 1: Client Yourself */}
                  <div
                    className={`aspect-video rounded-xl border p-3 flex flex-col justify-between relative shadow-lg ${
                      isCameraOn
                        ? 'bg-gradient-to-br from-slate-900 to-indigo-950/60 border-purple-500/60 ring-1 ring-purple-500/40'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-purple-300 truncate max-w-[110px]">
                        {profile?.name || 'You (Client)'}
                      </span>
                      {isMicMuted ? (
                        <MicOff className="w-3.5 h-3.5 text-rose-400" />
                      ) : (
                        <Mic className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                    </div>

                    <div className="flex flex-col items-center justify-center my-auto">
                      <div className="w-12 h-12 rounded-full bg-purple-600 border-2 border-purple-400 flex items-center justify-center text-white font-extrabold text-sm shadow-md">
                        {(profile?.name || 'C')[0].toUpperCase()}
                      </div>
                      <span className="text-[10px] text-purple-300 font-semibold mt-1">
                        {isCameraOn ? 'Camera Active' : 'Camera Off'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Logged-in Client</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                  </div>

                  {/* Tile 2: David Kim (Host) */}
                  <div
                    className={`aspect-video rounded-xl border p-3 flex flex-col justify-between relative shadow-lg transition-all ${
                      activeSpeakerIndex === 0
                        ? 'bg-slate-900 border-emerald-500 ring-2 ring-emerald-500/40'
                        : 'bg-slate-900/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-white">David Kim (Host)</span>
                      {activeSpeakerIndex === 0 && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      )}
                    </div>

                    <div className="flex items-center justify-center gap-1 my-auto">
                      {[30, 80, 100, 60, 90, 40].map((h, i) => (
                        <div
                          key={i}
                          className={`w-1 rounded-full ${
                            activeSpeakerIndex === 0 ? 'bg-emerald-400 animate-wave-bar' : 'bg-slate-700'
                          }`}
                          style={{
                            height: activeSpeakerIndex === 0 ? `${h}%` : '20%',
                            animationDelay: `${i * 0.1}s`,
                          }}
                        />
                      ))}
                    </div>

                    <div className="text-[10px] text-slate-400 truncate">
                      {activeSpeakerIndex === 0 ? 'Speaking...' : 'Listening'}
                    </div>
                  </div>

                  {/* Tile 3: Elena Rostova */}
                  <div
                    className={`aspect-video rounded-xl border p-3 flex flex-col justify-between transition-all ${
                      activeSpeakerIndex === 1
                        ? 'bg-slate-900 border-emerald-500 ring-2 ring-emerald-500/40'
                        : 'bg-slate-900/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-white">Elena Rostova</span>
                      {activeSpeakerIndex === 1 && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      )}
                    </div>

                    <div className="w-9 h-9 rounded-full bg-emerald-800 text-emerald-200 font-bold text-xs flex items-center justify-center mx-auto my-auto">
                      ER
                    </div>

                    <span className="text-[10px] text-slate-400">
                      {activeSpeakerIndex === 1 ? 'Speaking...' : 'Muted'}
                    </span>
                  </div>

                  {/* Tile 4: Marcus Vance */}
                  <div
                    className={`aspect-video rounded-xl border p-3 flex flex-col justify-between transition-all ${
                      activeSpeakerIndex === 2
                        ? 'bg-slate-900 border-emerald-500 ring-2 ring-emerald-500/40'
                        : 'bg-slate-900/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-white">Marcus Vance</span>
                      {activeSpeakerIndex === 2 && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      )}
                    </div>

                    <div className="w-9 h-9 rounded-full bg-amber-800 text-amber-200 font-bold text-xs flex items-center justify-center mx-auto my-auto">
                      MV
                    </div>

                    <span className="text-[10px] text-slate-400">
                      {activeSpeakerIndex === 2 ? 'Speaking...' : 'Muted'}
                    </span>
                  </div>

                  {/* Tile 5: NapMeet AI Bot */}
                  <div className="aspect-video rounded-xl bg-purple-950/40 border border-purple-500/50 p-3 flex flex-col justify-between ring-1 ring-purple-500/30">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-purple-300">NapMeet AI</span>
                      <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-semibold">
                        Silent
                      </span>
                    </div>

                    <div className="w-9 h-9 rounded-full bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300 mx-auto my-auto">
                      <Bot className="w-5 h-5 text-purple-300" />
                    </div>

                    <span className="text-[10px] text-emerald-400 font-semibold text-center">
                      Auto Note-Taking Active
                    </span>
                  </div>

                  {/* Tile 6: Screen share or overview */}
                  <div className="aspect-video rounded-xl bg-slate-900/80 border border-slate-800 p-3 flex flex-col justify-between">
                    <span className="text-[11px] text-slate-400 font-medium">Shared Deck</span>
                    <div className="flex flex-col items-center justify-center text-slate-500 text-center text-[10px]">
                      <Share2 className="w-5 h-5 mb-1 text-slate-400" />
                      <span>Architecture_v4.pdf</span>
                    </div>
                    <span className="text-[9px] text-slate-500 text-right">View Only</span>
                  </div>
                </div>
              )}

              {/* Live Meeting Bottom Control Bar */}
              <div className="flex items-center justify-between text-xs bg-slate-900/90 px-4 py-2.5 rounded-2xl border border-slate-800 z-10 flex-wrap gap-2">
                {/* Client AV Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsMicMuted(!isMicMuted)}
                    className={`p-2.5 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isMicMuted
                        ? 'bg-rose-600/20 text-rose-400 border border-rose-500/40'
                        : 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                    }`}
                    title={isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
                  >
                    {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    <span className="text-xs">{isMicMuted ? 'Muted' : 'Mic On'}</span>
                  </button>

                  <button
                    onClick={() => setIsCameraOn(!isCameraOn)}
                    className={`p-2.5 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      !isCameraOn
                        ? 'bg-slate-800 text-slate-400 border border-slate-700'
                        : 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                    }`}
                    title={isCameraOn ? 'Turn Camera Off' : 'Turn Camera On'}
                  >
                    {isCameraOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                    <span className="text-xs">{isCameraOn ? 'Cam On' : 'Cam Off'}</span>
                  </button>

                  <button
                    onClick={() => setIsScreenSharing(!isScreenSharing)}
                    className={`p-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                      isScreenSharing
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                    }`}
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Share Screen</span>
                  </button>
                </div>

                {/* Hand-off to Nap Mode or Conclude Actions */}
                <div className="flex items-center gap-2">
                  {onSwitchToNapMode && (
                    <button
                      onClick={onSwitchToNapMode}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition-all cursor-pointer flex items-center gap-1.5"
                      title="Step away: NapMeet AI silently continues attending on your behalf"
                    >
                      <Moon className="w-3.5 h-3.5 text-purple-200" />
                      <span>Take a Nap (AI Attends)</span>
                    </button>
                  )}

                  <button
                    onClick={onGenerateReportNow}
                    className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition-all cursor-pointer flex items-center gap-1.5"
                    title="Conclude call and generate AI report immediately"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Conclude & Generate Report</span>
                  </button>

                  <button
                    onClick={onLeaveMeeting}
                    className="px-3.5 py-2 rounded-xl bg-rose-800 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-800/30 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Square className="w-3.5 h-3.5" />
                    <span>Leave</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Live Real-Time Captions / Transcription Stream */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                  <span>Real-Time Speech Transcription & Sentiment Feed</span>
                </span>
                <span className="text-[11px] text-slate-500">Auto-synced with Gemini</span>
              </div>

              <div className="space-y-2 max-h-32 overflow-y-auto pr-1 text-xs">
                {liveTranscriptHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800/80 flex items-start justify-between gap-3"
                  >
                    <div>
                      <span className="font-bold text-slate-200 text-xs">{item.speaker}: </span>
                      <span className="text-slate-300 text-xs">{item.text}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono shrink-0">
                      {item.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT 1 COL: AI Co-Pilot In-Meeting Whisper Panel */}
          <div className="p-5 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-900/60 flex flex-col justify-between space-y-4">
            <div className="space-y-3 flex-1 flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs">In-Meeting AI Whisper</h4>
                    <span className="text-[10px] text-emerald-400 font-medium">
                      ● Active Co-Pilot Assistance
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-mono text-slate-500">Gemini 3.8</span>
              </div>

              {/* Quick Prompt Pills */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  'What should I say?',
                  'Summarize last 3 mins',
                  'Suggest next question',
                  'Verify budget number',
                ].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendCopilotPrompt(prompt)}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-500/50 text-[11px] text-slate-300 transition-colors cursor-pointer text-left"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Chat Message Stream */}
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[300px] pr-1 pt-2">
                {whisperHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${
                      item.sender === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[90%] p-3 rounded-2xl text-xs leading-relaxed ${
                        item.sender === 'user'
                          ? 'bg-purple-600 text-white rounded-br-none shadow-sm'
                          : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none shadow-inner'
                      }`}
                    >
                      {item.text}
                    </div>
                    <span className="text-[9px] text-slate-500 mt-1 px-1">{item.timestamp}</span>
                  </div>
                ))}

                {isCopilotThinking && (
                  <div className="flex items-center gap-1.5 text-purple-400 text-xs italic p-2">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span>NapMeet Co-Pilot is drafting response...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Input Box for AI Co-Pilot */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendCopilotPrompt();
              }}
              className="relative pt-2"
            >
              <input
                type="text"
                placeholder="Ask Co-Pilot: How to reply, facts, summaries..."
                value={aiWhisperInput}
                onChange={(e) => setAiWhisperInput(e.target.value)}
                className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 shadow-inner"
              />
              <button
                type="submit"
                disabled={!aiWhisperInput.trim() || isCopilotThinking}
                className="absolute right-2 top-3.5 p-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-40 transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
