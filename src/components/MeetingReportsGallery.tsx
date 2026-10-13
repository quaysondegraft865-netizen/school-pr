import React, { useState } from 'react';
import {
  FileText,
  Search,
  Calendar,
  Clock,
  Users,
  CheckSquare,
  Sparkles,
  Download,
  Trash2,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Smile,
  Zap,
  Activity,
  Flame,
  Filter,
  BarChart2,
  RefreshCw,
  HeartHandshake,
  Info,
  Check,
} from 'lucide-react';
import { MeetingReport, MeetingSentiment } from '../types';
import { requestAiMeetingAnalysis } from '../lib/gemini';
import { MeetingSentimentChart } from './MeetingSentimentChart';

interface MeetingReportsGalleryProps {
  reports: MeetingReport[];
  onOpenReport: (reportId: string) => void;
  onDeleteReport: (reportId: string) => void;
  onUpdateReport?: (updated: MeetingReport) => void;
}

export const MeetingReportsGallery: React.FC<MeetingReportsGalleryProps> = ({
  reports,
  onOpenReport,
  onDeleteReport,
  onUpdateReport,
}) => {
  const [search, setSearch] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState<'all' | MeetingSentiment>('all');
  const [analyzingReportId, setAnalyzingReportId] = useState<string | null>(null);

  // Sentiment configuration helper
  const getSentimentMeta = (sentiment?: MeetingSentiment, score: number = 80) => {
    switch (sentiment) {
      case 'productive':
        return {
          label: 'Productive Alignment',
          shortLabel: 'Productive',
          icon: TrendingUp,
          bg: 'bg-emerald-500/15',
          text: 'text-emerald-300',
          border: 'border-emerald-500/30',
          glow: 'shadow-emerald-500/20',
          barColor: 'from-emerald-500 to-teal-400',
          dot: 'bg-emerald-400',
          vibeDesc: 'High decision velocity, constructive consensus, and clear accountability.',
        };
      case 'brainstorming':
        return {
          label: 'Creative Brainstorming',
          shortLabel: 'Brainstorming',
          icon: Lightbulb,
          bg: 'bg-purple-500/15',
          text: 'text-purple-300',
          border: 'border-purple-500/30',
          glow: 'shadow-purple-500/20',
          barColor: 'from-purple-500 to-indigo-400',
          dot: 'bg-purple-400',
          vibeDesc: 'Divergent ideation, energetic exploration, and innovative proposals.',
        };
      case 'tense':
        return {
          label: 'Tense Debate & Scrutiny',
          shortLabel: 'Tense Debate',
          icon: AlertTriangle,
          bg: 'bg-rose-500/15',
          text: 'text-rose-300',
          border: 'border-rose-500/30',
          glow: 'shadow-rose-500/20',
          barColor: 'from-rose-500 to-amber-500',
          dot: 'bg-rose-400',
          vibeDesc: 'Heated discussions, risk scrutiny, pushback on deadlines or resource constraints.',
        };
      case 'collaborative':
        return {
          label: 'Cross-Team Collaboration',
          shortLabel: 'Collaborative',
          icon: HeartHandshake,
          bg: 'bg-blue-500/15',
          text: 'text-blue-300',
          border: 'border-blue-500/30',
          glow: 'shadow-blue-500/20',
          barColor: 'from-blue-500 to-cyan-400',
          dot: 'bg-blue-400',
          vibeDesc: 'Synergy between departments, cooperative roadmapping, and shared ownership.',
        };
      case 'urgent':
        return {
          label: 'High-Urgency Escalation',
          shortLabel: 'Urgent',
          icon: Flame,
          bg: 'bg-amber-500/15',
          text: 'text-amber-300',
          border: 'border-amber-500/30',
          glow: 'shadow-amber-500/20',
          barColor: 'from-amber-500 to-orange-500',
          dot: 'bg-amber-400',
          vibeDesc: 'Immediate priority issue, production incident mitigation, or critical timeline.',
        };
      case 'celebratory':
        return {
          label: 'Celebratory & Wins',
          shortLabel: 'Celebratory',
          icon: Sparkles,
          bg: 'bg-yellow-500/15',
          text: 'text-yellow-300',
          border: 'border-yellow-500/30',
          glow: 'shadow-yellow-500/20',
          barColor: 'from-yellow-400 to-amber-500',
          dot: 'bg-yellow-400',
          vibeDesc: 'Celebration of shipped launches, milestone achievements, and team recognition.',
        };
      case 'informative':
      default:
        return {
          label: 'Informative Briefing',
          shortLabel: 'Informative',
          icon: Info,
          bg: 'bg-sky-500/15',
          text: 'text-sky-300',
          border: 'border-sky-500/30',
          glow: 'shadow-sky-500/20',
          barColor: 'from-sky-500 to-blue-400',
          dot: 'bg-sky-400',
          vibeDesc: 'Structured status readout, broadcast updates, and informational sync.',
        };
    }
  };

  // Re-run sentiment analysis with Gemini
  const handleReanalyzeSentiment = async (report: MeetingReport, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onUpdateReport || analyzingReportId) return;

    setAnalyzingReportId(report.id);
    try {
      const res = await requestAiMeetingAnalysis({
        meetingTitle: report.title,
        meetingDate: report.date,
        participants: report.participants.map((p) => p.name),
        transcript: report.transcript,
      });

      const updated: MeetingReport = {
        ...report,
        sentiment: res.sentiment,
        sentimentScore: res.sentimentScore,
        sentimentHighlights: res.sentimentHighlights,
        executiveSummary: res.executiveSummary || report.executiveSummary,
      };

      onUpdateReport(updated);
    } catch (err) {
      console.error('Sentiment re-analysis failed:', err);
    } finally {
      setAnalyzingReportId(null);
    }
  };

  // Filter reports
  const filtered = reports.filter((r) => {
    if (sentimentFilter !== 'all') {
      const reportSentiment = r.sentiment || 'productive';
      if (reportSentiment !== sentimentFilter) return false;
    }

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.title.toLowerCase().includes(q) ||
      r.executiveSummary.toLowerCase().includes(q) ||
      (r.sentimentHighlights && r.sentimentHighlights.toLowerCase().includes(q)) ||
      (r.sentiment && r.sentiment.toLowerCase().includes(q)) ||
      r.mainDiscussionPoints.some((p) => p.toLowerCase().includes(q))
    );
  });

  // Calculate sentiment metrics across the fleet
  const countProductive = reports.filter((r) => (r.sentiment || 'productive') === 'productive').length;
  const countBrainstorming = reports.filter((r) => r.sentiment === 'brainstorming').length;
  const countTense = reports.filter((r) => r.sentiment === 'tense').length;
  const countCollaborative = reports.filter((r) => r.sentiment === 'collaborative').length;
  const countUrgent = reports.filter((r) => r.sentiment === 'urgent').length;

  const totalReports = reports.length || 1;
  const avgHarmonyScore = Math.round(
    reports.reduce((acc, r) => acc + (r.sentimentScore ?? 80), 0) / totalReports
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Overview */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl shadow-xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
              <Activity className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Meeting Intelligence & Sentiment Gallery
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-[11px] bg-purple-500/20 text-purple-300 font-semibold px-2 py-0.5 rounded-full border border-purple-500/30">
                  {reports.length} Reports Analyzed
                </span>
                <span className="text-xs text-slate-400">
                  Gemini 3.8 Flash Tone & Sentiment Engine
                </span>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Every session attended by NapMeet AI is analyzed for psychological dynamics, tension spikes,
            creative breakthroughs, and actionable consensus so you know how the room felt without being there.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full lg:w-72 self-start lg:self-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search reports or sentiments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 shadow-inner"
          />
        </div>
      </div>

      {/* Sentiment Intelligence Bar & Fleet Mood Breakdown */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Fleet Sentiment Distribution & Harmony Index
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Average Harmony Score:</span>
            <span className="px-2.5 py-0.5 rounded-lg font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              {avgHarmonyScore}% Positive Alignment
            </span>
          </div>
        </div>

        {/* Stacked Sentiment Distribution Visualizer */}
        <div className="space-y-1.5">
          <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden flex p-0.5 gap-0.5">
            <div
              style={{ width: `${(countProductive / totalReports) * 100}%` }}
              className="h-full bg-emerald-500 rounded-l-full transition-all"
              title={`${countProductive} Productive`}
            />
            <div
              style={{ width: `${(countBrainstorming / totalReports) * 100}%` }}
              className="h-full bg-purple-500 transition-all"
              title={`${countBrainstorming} Brainstorming`}
            />
            <div
              style={{ width: `${(countTense / totalReports) * 100}%` }}
              className="h-full bg-rose-500 transition-all"
              title={`${countTense} Tense Debate`}
            />
            <div
              style={{ width: `${(countCollaborative / totalReports) * 100}%` }}
              className="h-full bg-blue-500 transition-all"
              title={`${countCollaborative} Collaborative`}
            />
            <div
              style={{ width: `${(countUrgent / totalReports) * 100}%` }}
              className="h-full bg-amber-500 rounded-r-full transition-all"
              title={`${countUrgent} Urgent`}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>0% (Friction)</span>
            <span>50% (Mixed Dynamic)</span>
            <span>100% (High Consensus)</span>
          </div>
        </div>

        {/* Sentiment Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60">
          <span className="text-slate-500 text-[11px] font-semibold pr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            Filter by Vibe:
          </span>

          <button
            onClick={() => setSentimentFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              sentimentFilter === 'all'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-1 ring-purple-400'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All Sentiments ({reports.length})
          </button>

          <button
            onClick={() => setSentimentFilter('productive')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              sentimentFilter === 'productive'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-slate-950 text-emerald-400/80 hover:text-emerald-300 border border-slate-800 hover:border-emerald-500/40'
            }`}
          >
            <TrendingUp className="w-3 h-3" />
            <span>Productive ({countProductive})</span>
          </button>

          <button
            onClick={() => setSentimentFilter('brainstorming')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              sentimentFilter === 'brainstorming'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-slate-950 text-purple-400/80 hover:text-purple-300 border border-slate-800 hover:border-purple-500/40'
            }`}
          >
            <Lightbulb className="w-3 h-3" />
            <span>Brainstorming ({countBrainstorming})</span>
          </button>

          <button
            onClick={() => setSentimentFilter('tense')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              sentimentFilter === 'tense'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'bg-slate-950 text-rose-400/80 hover:text-rose-300 border border-slate-800 hover:border-rose-500/40'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Tense Debate ({countTense})</span>
          </button>

          {countCollaborative > 0 && (
            <button
              onClick={() => setSentimentFilter('collaborative')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                sentimentFilter === 'collaborative'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-slate-950 text-blue-400/80 hover:text-blue-300 border border-slate-800 hover:border-blue-500/40'
              }`}
            >
              <HeartHandshake className="w-3 h-3" />
              <span>Collaborative ({countCollaborative})</span>
            </button>
          )}

          {countUrgent > 0 && (
            <button
              onClick={() => setSentimentFilter('urgent')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                sentimentFilter === 'urgent'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                  : 'bg-slate-950 text-amber-400/80 hover:text-amber-300 border border-slate-800 hover:border-amber-500/40'
              }`}
            >
              <Flame className="w-3 h-3" />
              <span>Urgent ({countUrgent})</span>
            </button>
          )}
        </div>
      </div>

      {/* Reports Grid with Rich Sentiment Visualization */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900/50 border border-slate-800 space-y-3">
          <Activity className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No reports match this sentiment filter</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try switching sentiment tabs or clearing search keywords to view all meeting summaries.
          </p>
          <button
            onClick={() => {
              setSentimentFilter('all');
              setSearch('');
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((report) => {
            const sentimentType = report.sentiment || 'productive';
            const sentimentScore = report.sentimentScore ?? 85;
            const meta = getSentimentMeta(sentimentType, sentimentScore);
            const Icon = meta.icon;
            const isAnalyzing = analyzingReportId === report.id;

            return (
              <div
                key={report.id}
                className={`rounded-2xl border bg-slate-900/70 hover:bg-slate-900/95 transition-all p-5 flex flex-col justify-between space-y-4 shadow-sm group ${
                  sentimentType === 'tense'
                    ? 'border-rose-900/50 hover:border-rose-500/50 hover:shadow-rose-950/20'
                    : sentimentType === 'brainstorming'
                    ? 'border-purple-900/50 hover:border-purple-500/50 hover:shadow-purple-950/20'
                    : 'border-slate-800 hover:border-emerald-500/40 hover:shadow-emerald-950/20'
                }`}
              >
                <div className="space-y-3.5">
                  {/* Top Badge Row: Status + Sentiment Visualization */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        AI ATTENDED
                      </span>
                      <span className="text-xs text-slate-400 font-medium">• {report.date}</span>
                    </div>

                    {/* Prominent Visual Sentiment Pill with glow */}
                    <div
                      className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${meta.bg} ${meta.text} ${meta.border} shadow-sm transition-transform group-hover:scale-105`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{meta.label}</span>
                      <span className="text-[11px] font-mono opacity-80">({sentimentScore}%)</span>
                    </div>
                  </div>

                  <h3 className="font-bold text-white text-base group-hover:text-purple-300 transition-colors leading-snug">
                    {report.title}
                  </h3>

                  {/* Sentiment Harmony Gauge & Dynamics Box */}
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                        <Activity className="w-3.5 h-3.5 text-purple-400" />
                        <span>Meeting Dynamic & Atmosphere</span>
                      </span>
                      <span className={`font-mono font-bold text-xs ${meta.text}`}>
                        {sentimentScore}/100 Harmony Index
                      </span>
                    </div>

                    {/* Gradient Progress bar */}
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden p-0.5">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${meta.barColor} transition-all duration-500`}
                        style={{ width: `${Math.max(12, Math.min(100, sentimentScore))}%` }}
                      />
                    </div>

                    {/* Sentiment Highlights text */}
                    {report.sentimentHighlights ? (
                      <p className="text-[11px] text-slate-300 italic pt-0.5 leading-relaxed">
                        "{report.sentimentHighlights}"
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic pt-0.5">
                        {meta.vibeDesc}
                      </p>
                    )}

                    {/* Compact Recharts Sentiment Score Trajectory (Beginning, Middle, End) */}
                    <div className="pt-1.5 border-t border-slate-850">
                      <MeetingSentimentChart report={report} compact={true} />
                    </div>

                    {/* Re-analyze with Gemini button */}
                    {onUpdateReport && (
                      <div className="pt-1 flex justify-end">
                        <button
                          onClick={(e) => handleReanalyzeSentiment(report, e)}
                          disabled={isAnalyzing}
                          className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                          title="Re-run Gemini 3.8 Flash to refresh sentiment scoring"
                        >
                          <RefreshCw className={`w-3 h-3 ${isAnalyzing ? 'animate-spin' : ''}`} />
                          <span>{isAnalyzing ? 'Analyzing Sentiment...' : 'Re-Score Sentiment with Gemini'}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Executive Summary Snippet */}
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {report.executiveSummary}
                  </p>

                  {/* Stats badges */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-purple-400" />
                      <span>{report.durationMinutes}m call</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-blue-400" />
                      <span>{report.participants.length} attendees</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{report.actionItems.length} action items</span>
                    </div>
                  </div>
                </div>

                {/* Bottom buttons */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <button
                    onClick={() => onDeleteReport(report.id)}
                    className="text-slate-500 hover:text-rose-400 text-xs p-1.5 rounded transition-colors cursor-pointer"
                    title="Delete this report permanently"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onOpenReport(report.id)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-purple-600/20"
                  >
                    <span>Read Full Intelligence Report</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
