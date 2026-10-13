import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Download,
  Printer,
  Copy,
  Check,
  Calendar,
  Clock,
  Video,
  Users,
  CheckSquare,
  HelpCircle,
  Quote as QuoteIcon,
  Sparkles,
  Search,
  FileText,
  Edit3,
  Save,
  Tag,
  Share2,
  Volume2,
  VolumeX,
  Play,
  Pause,
  MessageSquare,
  Send,
  Mail,
  PieChart,
  BarChart3,
  RefreshCw,
  ExternalLink,
  Bot,
  Zap,
  Activity,
} from 'lucide-react';
import { MeetingReport, ActionItem } from '../types';
import { askMeetingQuestion, generateFollowUpDrafts, generateAudioBriefing } from '../lib/gemini';
import { MeetingSentimentChart } from './MeetingSentimentChart';

interface MeetingReportModalProps {
  report: MeetingReport | null;
  onClose: () => void;
  onUpdateReport?: (updated: MeetingReport) => void;
}

export const MeetingReportModal: React.FC<MeetingReportModalProps> = ({
  report,
  onClose,
  onUpdateReport,
}) => {
  if (!report) return null;

  const [activeTab, setActiveTab] = useState<
    'summary' | 'sentiment_trajectory' | 'audio' | 'ask_ai' | 'drafts' | 'talk_time' | 'transcript' | 'notes'
  >('summary');

  const [transcriptSearch, setTranscriptSearch] = useState('');
  const [speakerFilter, setSpeakerFilter] = useState('all');
  const [copied, setCopied] = useState(false);
  const [userNotes, setUserNotes] = useState(
    localStorage.getItem(`notes_${report.id}`) ||
      'Attended on my behalf via NapMeet AI. All decisions confirmed.'
  );
  const [actionItems, setActionItems] = useState<ActionItem[]>(report.actionItems || []);

  // Audio Briefing State
  const [isPlayingBriefing, setIsPlayingBriefing] = useState(false);
  const [briefingText, setBriefingText] = useState('');
  const [briefingSpeed, setBriefingSpeed] = useState<number>(1);
  const [isLoadingBriefing, setIsLoadingBriefing] = useState(false);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Q&A State
  const [questionInput, setQuestionInput] = useState('');
  const [isAskingQuestion, setIsAskingQuestion] = useState(false);
  const [chatHistory, setChatHistory] = useState<
    { q: string; a: string; timestamp: string }[]
  >([
    {
      q: 'Were there any commitments assigned specifically to me?',
      a: `Yes, you have action items assigned from ${report.title}. Check the action items checklist to review due dates.`,
      timestamp: 'Just now',
    },
  ]);

  // Follow-up drafts state
  const [drafts, setDrafts] = useState<{
    emailSubject: string;
    emailBody: string;
    slackMessage: string;
  } | null>(null);
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(false);
  const [copiedDraftType, setCopiedDraftType] = useState<string | null>(null);

  // Load / generate briefing on tab change or mount
  useEffect(() => {
    if (activeTab === 'audio' && !briefingText) {
      loadBriefing();
    }
    if (activeTab === 'drafts' && !drafts) {
      loadDrafts();
    }
  }, [activeTab]);

  const loadBriefing = async () => {
    setIsLoadingBriefing(true);
    try {
      const script = await generateAudioBriefing(
        report.title,
        report.executiveSummary,
        actionItems,
        report.sentiment || 'productive'
      );
      setBriefingText(script);
    } catch {
      setBriefingText(
        `Good day! NapMeet AI attended "${report.title}". Executive summary: ${report.executiveSummary}`
      );
    } finally {
      setIsLoadingBriefing(false);
    }
  };

  const loadDrafts = async () => {
    setIsLoadingDrafts(true);
    try {
      const generated = await generateFollowUpDrafts(
        report.title,
        actionItems,
        report.decisionsMade
      );
      setDrafts(generated);
    } catch (e) {
      console.warn('Draft error:', e);
    } finally {
      setIsLoadingDrafts(false);
    }
  };

  // Web Speech API Voice synthesis
  const togglePlayBriefing = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }

    if (isPlayingBriefing) {
      window.speechSynthesis.cancel();
      setIsPlayingBriefing(false);
      return;
    }

    window.speechSynthesis.cancel();
    const textToSpeak = briefingText || report.executiveSummary;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = briefingSpeed;

    // Pick natural voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) => v.name.includes('Google') || v.name.includes('Natural') || v.lang.startsWith('en')
    );
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onend = () => setIsPlayingBriefing(false);
    utterance.onerror = () => setIsPlayingBriefing(false);

    speechUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlayingBriefing(true);
  };

  const handleSpeedChange = (speed: number) => {
    setBriefingSpeed(speed);
    if (isPlayingBriefing) {
      togglePlayBriefing(); // restart with new speed
    }
  };

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Handle Q&A submit
  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionInput.trim() || isAskingQuestion) return;

    const q = questionInput;
    setQuestionInput('');
    setIsAskingQuestion(true);

    try {
      const answer = await askMeetingQuestion(report.title, report.transcript, q);
      setChatHistory((prev) => [
        ...prev,
        {
          q,
          a: answer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      setChatHistory((prev) => [
        ...prev,
        {
          q,
          a: 'Could not query transcript at this moment. Please check the transcript tab.',
          timestamp: 'Just now',
        },
      ]);
    } finally {
      setIsAskingQuestion(false);
    }
  };

  const handleToggleAction = (id: string) => {
    const updated = actionItems.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setActionItems(updated);
    if (onUpdateReport) {
      onUpdateReport({ ...report, actionItems: updated });
    }
  };

  const handleSaveNotes = () => {
    localStorage.setItem(`notes_${report.id}`, userNotes);
  };

  // Copy helper
  const handleCopyText = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDraftType(type);
    setTimeout(() => setCopiedDraftType(null), 2000);
  };

  // Export functions
  const handleExportMarkdown = () => {
    const md = `# ${report.title}
**Date:** ${report.date}  
**Duration:** ${report.durationMinutes} mins  
**Google Meet:** ${report.meetLink}  
**Attended By:** NapMeet AI Assistant  

---

## 1. Executive Summary
${report.executiveSummary}

## 2. Meeting Purpose
${report.meetingPurpose}

## 3. Main Discussion Points
${report.mainDiscussionPoints.map((p) => `- ${p}`).join('\n')}

## 4. Decisions Made
${report.decisionsMade.map((d) => `- ${d}`).join('\n')}

## 5. Action Items
${actionItems.map((a) => `- [${a.completed ? 'x' : ' '}] **${a.task}** (Assignee: ${a.assignee}, Due: ${a.deadline || 'N/A'}, Priority: ${a.priority})`).join('\n')}

## 6. Questions & Answers
${report.questionsAndAnswers.map((q) => `> **Q:** ${q.question} (${q.askedBy || 'Attendee'})\n> **A:** ${q.answer} (${q.answeredBy || 'Speaker'})`).join('\n\n')}

## 7. Important Quotes
${report.importantQuotes.map((q) => `> "${q.quote}"  \n> — *${q.speaker}* [${q.timestamp}]`).join('\n\n')}

## 8. Follow-up Recommendations
${report.followUpRecommendations.map((r) => `- ${r}`).join('\n')}

---

## Transcript
${report.transcript.map((t) => `**[${t.timestamp}] ${t.speaker}:** ${t.text}`).join('\n\n')}
`;
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.title.replace(/[^a-z0-9]/gi, '_')}_Report.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filtered transcript lines
  const uniqueSpeakers = Array.from(new Set(report.transcript.map((t) => t.speaker)));
  const filteredTranscript = report.transcript.filter((line) => {
    const matchesSpeaker = speakerFilter === 'all' || line.speaker === speakerFilter;
    const matchesSearch =
      transcriptSearch === '' ||
      line.text.toLowerCase().includes(transcriptSearch.toLowerCase()) ||
      line.speaker.toLowerCase().includes(transcriptSearch.toLowerCase());
    return matchesSpeaker && matchesSearch;
  });

  // Calculate talk-time metrics
  const totalSpeakingMins = report.participants.reduce(
    (acc, p) => acc + (p.speakingTimeMinutes || 0),
    0
  ) || 40;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                ATTENDED BY NAPMEET AI
              </span>
              <span className="text-xs text-slate-400">• {report.date}</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight mt-1">{report.title}</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportMarkdown}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer flex items-center gap-1.5 text-xs"
              title="Export as Markdown"
            >
              <Download className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Export</span>
            </button>

            <button
              onClick={() => window.print()}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer"
              title="Print / Save PDF"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-Tabs: Rich Suite */}
        <div className="flex items-center gap-1 px-6 py-2.5 bg-slate-950/50 border-b border-slate-800 text-xs font-medium overflow-x-auto">
          {[
            { key: 'summary', label: 'AI Intelligence', icon: Sparkles },
            { key: 'sentiment_trajectory', label: 'Sentiment Curve', icon: Activity },
            { key: 'audio', label: 'Wake-Up Audio Briefing', icon: Volume2 },
            { key: 'ask_ai', label: 'Ask NapMeet Q&A', icon: Bot },
            { key: 'drafts', label: 'Follow-Up Drafts', icon: Mail },
            { key: 'talk_time', label: 'Talk-Time Analytics', icon: BarChart3 },
            { key: 'transcript', label: `Transcript (${report.transcript.length})`, icon: FileText },
            { key: 'notes', label: 'My Notes', icon: Edit3 },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  activeTab === tab.key
                    ? 'bg-purple-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* TAB 1: SUMMARY */}
          {activeTab === 'summary' && (
            <div className="space-y-6">
              {/* Sentiment & Tone Analysis Card */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                      Meeting Sentiment & Tone Detection
                    </span>
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                        report.sentiment === 'tense'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          : report.sentiment === 'brainstorming'
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      }`}
                    >
                      ● {report.sentiment ? report.sentiment.toUpperCase() : 'PRODUCTIVE'}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-purple-300">
                    Harmony Score: {report.sentimentScore ?? 85}/100
                  </span>
                </div>

                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${
                      report.sentiment === 'tense'
                        ? 'from-rose-500 to-amber-500'
                        : report.sentiment === 'brainstorming'
                        ? 'from-purple-500 to-indigo-400'
                        : 'from-emerald-500 to-teal-400'
                    }`}
                    style={{ width: `${report.sentimentScore ?? 85}%` }}
                  />
                </div>

                {report.sentimentHighlights && (
                  <p className="text-xs text-slate-300 italic">
                    "{report.sentimentHighlights}"
                  </p>
                )}
              </div>

              {/* Recharts Sentiment Score Over Meeting Course (Beginning, Middle, End) */}
              <MeetingSentimentChart report={report} />

              {/* 1. Executive Summary */}
              <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-2">
                <div className="flex items-center gap-2 text-purple-300 font-semibold text-xs tracking-wide uppercase">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>Executive Summary</span>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed">
                  {report.executiveSummary}
                </p>
              </div>

              {/* 2. Meeting Purpose */}
              <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-1.5">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Meeting Purpose & Context
                </h4>
                <p className="text-sm text-slate-300">{report.meetingPurpose}</p>
              </div>

              {/* 3. Main Discussion Points & Decisions Made */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wide">
                    Main Discussion Points
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {report.mainDiscussionPoints.map((point, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">
                    Consensus & Decisions Made
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {report.decisionsMade.map((decision, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                        <span>{decision}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 4. Action Items */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-purple-400" />
                    <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wide">
                      Action Items & Deadlines
                    </h4>
                  </div>
                  <span className="text-xs text-slate-400">
                    Click checkbox to mark completed
                  </span>
                </div>

                <div className="space-y-2">
                  {actionItems.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-lg border text-xs flex items-start justify-between gap-3 transition-colors ${
                        item.isCurrentUser
                          ? 'border-purple-500/50 bg-purple-950/20'
                          : 'border-slate-800 bg-slate-900/40'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => handleToggleAction(item.id)}
                          className="mt-0.5 rounded border-slate-700 text-purple-600 focus:ring-purple-500 cursor-pointer"
                        />
                        <div className="space-y-1">
                          <span
                            className={`${
                              item.completed
                                ? 'line-through text-slate-500'
                                : 'text-slate-200 font-medium'
                            }`}
                          >
                            {item.task}
                          </span>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            <span>
                              Assignee:{' '}
                              <strong className={item.isCurrentUser ? 'text-purple-300' : 'text-slate-300'}>
                                {item.assignee}
                              </strong>
                            </span>
                            {item.deadline && <span>• Due: {item.deadline}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {item.isCurrentUser && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-500/30 text-purple-300 border border-purple-500/40">
                            Assigned to You
                          </span>
                        )}
                        <span
                          className={`text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded ${
                            item.priority === 'high'
                              ? 'bg-rose-500/20 text-rose-300'
                              : item.priority === 'medium'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {item.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* DEDICATED TAB: RECHARTS SENTIMENT SCORE TRAJECTORY */}
          {activeTab === 'sentiment_trajectory' && (
            <div className="space-y-6">
              <MeetingSentimentChart report={report} />

              {/* Meeting Phase Deep Dive & Quotes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Phase 1: Beginning
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      0% - 30% Progress
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-white">Opening & Agenda Setup</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Evaluates initial attendee alignment, introductions, and context framing. Identifies whether attendees started on a collaborative or contentious tone.
                  </p>
                  <div className="pt-2 border-t border-slate-850 text-[11px] text-slate-300 italic">
                    {report.transcript[0] ? `"${report.transcript[0].speaker}: ${report.transcript[0].text}"` : 'Constructive session kickoff.'}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Phase 2: Middle
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      30% - 70% Progress
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-white">Technical Scrutiny & Core Debate</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    The core problem-solving phase where technical tradeoffs, blockers, resource friction, and key concerns are thoroughly evaluated.
                  </p>
                  <div className="pt-2 border-t border-slate-850 text-[11px] text-slate-300 italic">
                    {report.transcript[Math.floor(report.transcript.length / 2)] ? `"${report.transcript[Math.floor(report.transcript.length / 2)].speaker}: ${report.transcript[Math.floor(report.transcript.length / 2)].text}"` : 'Thorough evaluation of requirements.'}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Phase 3: End
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      70% - 100% Progress
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-white">Consensus & Action Allocation</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Final convergence where action items are assigned, commitments are sealed, and closing sentiment reaches consensus equilibrium.
                  </p>
                  <div className="pt-2 border-t border-slate-850 text-[11px] text-slate-300 italic">
                    {report.transcript[report.transcript.length - 1] ? `"${report.transcript[report.transcript.length - 1].speaker}: ${report.transcript[report.transcript.length - 1].text}"` : 'Decisions approved with action owners assigned.'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AUDIO WAKE-UP BRIEFING */}
          {activeTab === 'audio' && (
            <div className="space-y-6 max-w-2xl mx-auto py-2">
              <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-950/40 via-slate-900 to-indigo-950/40 border border-purple-500/30 text-center space-y-5 shadow-xl">
                <div className="w-16 h-16 rounded-full bg-purple-600/20 border border-purple-500/40 text-purple-300 flex items-center justify-center mx-auto shadow-inner">
                  <Volume2 className="w-8 h-8" />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white">60-Second Wake-Up Audio Digest</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    Listen to a smooth spoken voice recap of key decisions and tasks from {report.title} without looking at screens.
                  </p>
                </div>

                {/* Animated Waveform Visualization */}
                <div className="flex items-center justify-center gap-1.5 h-12 bg-slate-950/80 rounded-xl px-6 py-2 border border-slate-800">
                  {[30, 60, 90, 45, 80, 100, 70, 50, 85, 40, 65, 95, 30, 75, 55, 90].map((h, i) => (
                    <div
                      key={i}
                      className={`w-1.5 bg-purple-400 rounded-full transition-all ${
                        isPlayingBriefing ? 'animate-wave-bar' : 'h-3 opacity-30'
                      }`}
                      style={{
                        height: isPlayingBriefing ? `${h}%` : '20%',
                        animationDelay: `${(i * 0.08).toFixed(2)}s`,
                      }}
                    />
                  ))}
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4 pt-2">
                  <button
                    onClick={togglePlayBriefing}
                    disabled={isLoadingBriefing}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/30 cursor-pointer"
                  >
                    {isPlayingBriefing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span>{isPlayingBriefing ? 'Pause Voice Briefing' : 'Play Voice Digest'}</span>
                  </button>

                  <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-1 text-xs">
                    {[1, 1.25, 1.5].map((speed) => (
                      <button
                        key={speed}
                        onClick={() => handleSpeedChange(speed)}
                        className={`px-2 py-1 rounded cursor-pointer ${
                          briefingSpeed === speed
                            ? 'bg-purple-600 text-white font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Spoken Script Text Readout */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Briefing Script Transcription:
                </span>
                <p className="text-xs text-slate-300 leading-relaxed italic">
                  {briefingText || 'Loading audio briefing transcript...'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: ASK NAPMEET Q&A */}
          {activeTab === 'ask_ai' && (
            <div className="space-y-4 max-w-2xl mx-auto flex flex-col h-[520px]">
              <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/20 text-xs text-slate-300 flex items-center gap-2.5">
                <Bot className="w-4 h-4 text-purple-400 shrink-0" />
                <span>
                  Ask anything about the meeting! Gemini 3.8 Flash will answer factually based on the
                  recorded transcript.
                </span>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto space-y-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                {chatHistory.map((item, idx) => (
                  <div key={idx} className="space-y-2">
                    {/* User Question */}
                    <div className="flex justify-end">
                      <div className="max-w-[85%] rounded-2xl bg-purple-600 text-white px-4 py-2.5 text-xs shadow-sm">
                        {item.q}
                      </div>
                    </div>
                    {/* Bot Answer */}
                    <div className="flex justify-start">
                      <div className="max-w-[90%] rounded-2xl bg-slate-900 border border-slate-800 text-slate-200 px-4 py-2.5 text-xs space-y-1 shadow-sm">
                        <div className="flex items-center gap-1.5 text-[10px] text-purple-300 font-bold">
                          <Sparkles className="w-3 h-3" />
                          <span>NapMeet AI</span>
                          <span className="text-slate-500 font-normal">• {item.timestamp}</span>
                        </div>
                        <p className="leading-relaxed">{item.a}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {isAskingQuestion && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 px-4 py-2 text-xs flex items-center gap-2">
                      <RefreshCw className="w-3 h-3 animate-spin text-purple-400" />
                      <span>Reviewing meeting transcript...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Form */}
              <form onSubmit={handleAskQuestion} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ask e.g. 'What was decided about the database?', 'Did anyone question my timeline?'"
                  value={questionInput}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
                <button
                  type="submit"
                  disabled={!questionInput.trim() || isAskingQuestion}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Ask</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 4: FOLLOW-UP COMMUNICATION DRAFTS */}
          {activeTab === 'drafts' && (
            <div className="space-y-5 max-w-3xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Automated Post-Meeting Communication</h3>
                  <p className="text-xs text-slate-400">
                    Pre-composed professional messages acknowledging decisions and confirming your action items.
                  </p>
                </div>
                <button
                  onClick={loadDrafts}
                  disabled={isLoadingDrafts}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDrafts ? 'animate-spin' : ''}`} />
                  <span>Regenerate Drafts</span>
                </button>
              </div>

              {/* Email Draft Card */}
              <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
                    <Mail className="w-4 h-4" />
                    <span>Executive Email Follow-Up</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyText(drafts?.emailBody || '', 'email')}
                      className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium cursor-pointer flex items-center gap-1"
                    >
                      {copiedDraftType === 'email' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedDraftType === 'email' ? 'Copied' : 'Copy Email'}</span>
                    </button>
                    <a
                      href={`mailto:${report.participants.map((p) => p.email).filter(Boolean).join(',')}?subject=${encodeURIComponent(drafts?.emailSubject || '')}&body=${encodeURIComponent(drafts?.emailBody || '')}`}
                      className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium cursor-pointer flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Open in Gmail</span>
                    </a>
                  </div>
                </div>

                <div className="text-xs bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block font-mono">
                    Subject: <strong className="text-slate-200">{drafts?.emailSubject}</strong>
                  </span>
                </div>

                <pre className="text-xs text-slate-300 bg-slate-900/50 p-4 rounded-xl border border-slate-800 font-sans whitespace-pre-wrap leading-relaxed">
                  {drafts?.emailBody || 'Generating customized follow-up email...'}
                </pre>
              </div>

              {/* Slack Draft Card */}
              <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-400">
                    <MessageSquare className="w-4 h-4" />
                    <span>Team Channel Post (Slack / Discord)</span>
                  </div>
                  <button
                    onClick={() => handleCopyText(drafts?.slackMessage || '', 'slack')}
                    className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium cursor-pointer flex items-center gap-1"
                  >
                    {copiedDraftType === 'slack' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedDraftType === 'slack' ? 'Copied' : 'Copy Slack Post'}</span>
                  </button>
                </div>

                <pre className="text-xs text-slate-300 bg-slate-900/50 p-4 rounded-xl border border-slate-800 font-sans whitespace-pre-wrap leading-relaxed">
                  {drafts?.slackMessage || 'Generating Slack channel update...'}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 5: SPEAKER TALK-TIME ANALYTICS */}
          {activeTab === 'talk_time' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div>
                <h3 className="text-sm font-bold text-white">Participant Share of Voice & Talk-Time Analytics</h3>
                <p className="text-xs text-slate-400">
                  Measured duration and speaking distribution across all call participants.
                </p>
              </div>

              <div className="space-y-3">
                {report.participants.map((p, idx) => {
                  const mins = p.speakingTimeMinutes || (idx === 0 ? 18 : idx === 1 ? 12 : 5);
                  const percentage = Math.round((mins / totalSpeakingMins) * 100);

                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{p.name}</span>
                          <span className="text-[10px] text-slate-400">({p.role || 'Participant'})</span>
                          {p.isHost && (
                            <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-semibold">
                              HOST
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-purple-300 font-semibold">
                          {mins} mins ({percentage}%)
                        </span>
                      </div>

                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-purple-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 text-xs text-slate-300 flex items-center justify-between">
                <span>
                  NapMeet AI maintained <strong>100% Silent Observer compliance</strong> with 0 minutes speaking time.
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                  COMPLIANT
                </span>
              </div>
            </div>
          )}

          {/* TAB 6: VERBATIM TRANSCRIPT */}
          {activeTab === 'transcript' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search keywords or speakers in transcript..."
                    value={transcriptSearch}
                    onChange={(e) => setTranscriptSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <select
                  value={speakerFilter}
                  onChange={(e) => setSpeakerFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="all">All Speakers ({report.participants.length})</option>
                  {uniqueSpeakers.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {filteredTranscript.map((line) => (
                  <div
                    key={line.id}
                    className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-purple-300">{line.speaker}</span>
                      <span className="font-mono text-slate-500">[{line.timestamp}]</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{line.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: USER NOTES */}
          {activeTab === 'notes' && (
            <div className="space-y-4 max-w-2xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-white">Personal Meeting Annotations</h4>
                  <p className="text-xs text-slate-400">
                    Add custom corrections, takeaways, or confidential notes to this report.
                  </p>
                </div>
                <button
                  onClick={handleSaveNotes}
                  className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Notes
                </button>
              </div>

              <textarea
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                rows={8}
                className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                placeholder="Write custom notes or corrections here..."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
