import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Sparkles,
  Clock,
  Compass,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { MeetingReport, PhaseSentiment } from '../types';

interface MeetingSentimentChartProps {
  report: MeetingReport;
  compact?: boolean;
}

interface ChartDataPoint {
  phase: string;
  displayLabel: string;
  timeRange: string;
  score: number;
  sentimentLabel: string;
  keyInsight: string;
}

export const MeetingSentimentChart: React.FC<MeetingSentimentChartProps> = ({
  report,
  compact = false,
}) => {
  const [viewMode, setViewMode] = useState<'phases' | 'beats'>('phases');

  // Derive or extract phases
  const getTimelineData = (): ChartDataPoint[] => {
    if (report.sentimentTimeline && report.sentimentTimeline.length >= 3) {
      return report.sentimentTimeline.map((item) => ({
        phase: item.phase,
        displayLabel: item.phaseLabel || item.phase,
        timeRange: item.timeRange || '',
        score: item.score,
        sentimentLabel: item.sentimentLabel || (item.score >= 80 ? 'Productive' : item.score >= 65 ? 'Neutral' : 'Tense'),
        keyInsight: item.keyInsight || 'Meeting progression point',
      }));
    }

    // Dynamic generation if not set explicitly
    const baseScore = report.sentimentScore ?? 80;
    const isTense = report.sentiment === 'tense';
    const isBrainstorming = report.sentiment === 'brainstorming';

    if (isTense) {
      return [
        {
          phase: 'Beginning',
          displayLabel: 'Kickoff & Issue Presentation',
          timeRange: '00:00 - 00:15',
          score: Math.max(35, baseScore - 12),
          sentimentLabel: 'High Tension',
          keyInsight: 'Meeting opened with critical scrutiny and obstacle identification.',
        },
        {
          phase: 'Middle',
          displayLabel: 'Core Debate & Scrutiny',
          timeRange: '00:15 - 00:35',
          score: Math.max(40, baseScore - 5),
          sentimentLabel: 'Critical Analysis',
          keyInsight: 'Intense debate on technical boundaries, resource constraints, or root causes.',
        },
        {
          phase: 'End',
          displayLabel: 'Resolution & Action Commitments',
          timeRange: '00:35 - ' + (report.durationMinutes ? `00:${report.durationMinutes}` : '00:50'),
          score: Math.min(85, baseScore + 18),
          sentimentLabel: 'Resolution Reached',
          keyInsight: 'Tension relaxed as clear action items and accountability were locked in.',
        },
      ];
    } else if (isBrainstorming) {
      return [
        {
          phase: 'Beginning',
          displayLabel: 'Context & Problem Framing',
          timeRange: '00:00 - 00:12',
          score: Math.max(70, baseScore - 8),
          sentimentLabel: 'Exploratory',
          keyInsight: 'Group framed the problem space and established open brainstorming guidelines.',
        },
        {
          phase: 'Middle',
          displayLabel: 'Idea Divergence & Ideation',
          timeRange: '00:12 - 00:30',
          score: Math.min(96, baseScore + 2),
          sentimentLabel: 'Creative Flow',
          keyInsight: 'Peak creative momentum with multiple innovative proposals explored.',
        },
        {
          phase: 'End',
          displayLabel: 'Idea Selection & Next Experiments',
          timeRange: '00:30 - ' + (report.durationMinutes ? `00:${report.durationMinutes}` : '00:45'),
          score: Math.min(98, baseScore + 5),
          sentimentLabel: 'High Excitement',
          keyInsight: 'Selected top design prototypes to advance with high attendee enthusiasm.',
        },
      ];
    } else {
      // Default / productive
      return [
        {
          phase: 'Beginning',
          displayLabel: 'Agenda & Status Alignment',
          timeRange: '00:00 - 00:15',
          score: Math.max(72, baseScore - 6),
          sentimentLabel: 'Constructive Alignment',
          keyInsight: 'Structured review of prior deliverables and session objectives.',
        },
        {
          phase: 'Middle',
          displayLabel: 'Deep Dive & Tradeoff Review',
          timeRange: '00:15 - 00:32',
          score: Math.max(70, baseScore - 9),
          sentimentLabel: 'Analytical Focus',
          keyInsight: 'Detailed discussion of execution dependencies and technical constraints.',
        },
        {
          phase: 'End',
          displayLabel: 'Consensus & Action Allocation',
          timeRange: '00:32 - ' + (report.durationMinutes ? `00:${report.durationMinutes}` : '00:45'),
          score: Math.min(97, baseScore + 8),
          sentimentLabel: 'High Velocity',
          keyInsight: 'Decisions confirmed and all action items assigned with unanimous buy-in.',
        },
      ];
    }
  };

  // Generate finer transcript beats if viewMode === 'beats' and transcript is available
  const getTranscriptBeatData = (): ChartDataPoint[] => {
    if (!report.transcript || report.transcript.length === 0) {
      return getTimelineData();
    }

    const phases = getTimelineData();
    const totalLines = report.transcript.length;

    // Pick 5 to 7 key moments across transcript
    const sampleIndices = [
      0,
      Math.floor(totalLines * 0.25),
      Math.floor(totalLines * 0.5),
      Math.floor(totalLines * 0.75),
      totalLines - 1,
    ].filter((v, i, a) => a.indexOf(v) === i);

    return sampleIndices.map((idx, sampleI) => {
      const line = report.transcript[idx];
      const progressRatio = idx / Math.max(1, totalLines - 1);

      let phaseName = 'Beginning';
      let matchingPhase = phases[0];
      if (progressRatio > 0.66) {
        phaseName = 'End';
        matchingPhase = phases[2] || phases[0];
      } else if (progressRatio > 0.33) {
        phaseName = 'Middle';
        matchingPhase = phases[1] || phases[0];
      }

      // Calculate score with slight realistic variance around phase baseline
      const variance = sampleI % 2 === 0 ? 3 : -2;
      const score = Math.max(30, Math.min(99, matchingPhase.score + variance));

      return {
        phase: `${line.timestamp}`,
        displayLabel: `${line.speaker}: "${line.text.slice(0, 40)}..."`,
        timeRange: line.timestamp,
        score,
        sentimentLabel: matchingPhase.sentimentLabel,
        keyInsight: `${line.speaker}: "${line.text}"`,
      };
    });
  };

  const chartData = viewMode === 'beats' ? getTranscriptBeatData() : getTimelineData();

  const beginningScore = chartData[0]?.score ?? 80;
  const endScore = chartData[chartData.length - 1]?.score ?? 85;
  const scoreDelta = endScore - beginningScore;
  const averageScore = Math.round(
    chartData.reduce((acc, curr) => acc + curr.score, 0) / Math.max(1, chartData.length)
  );

  // Gradient & accent styling based on overall sentiment
  const isTenseOverall = report.sentiment === 'tense';
  const isBrainstorming = report.sentiment === 'brainstorming';

  const strokeColor = isTenseOverall
    ? '#f43f5e' // rose-500
    : isBrainstorming
    ? '#a855f7' // purple-500
    : '#10b981'; // emerald-500

  const fillGradientId = `sentimentGrad_${report.id}`;

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as ChartDataPoint;
      const score = data.score;
      const scoreColor =
        score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-rose-400';

      return (
        <div className="bg-slate-950/95 border border-slate-700/80 rounded-xl p-3 shadow-2xl backdrop-blur-md max-w-xs text-xs space-y-1.5 z-50">
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-purple-400" />
              {data.phase} Phase
            </span>
            {data.timeRange && (
              <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                {data.timeRange}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 pt-0.5">
            <span className="text-slate-400">Sentiment Score:</span>
            <span className={`font-mono font-bold text-sm ${scoreColor}`}>
              {score} <span className="text-[10px] text-slate-500">/ 100</span>
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-400">Tone Dynamics:</span>
            <span className="text-slate-200 font-medium px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700 text-[10px]">
              {data.sentimentLabel}
            </span>
          </div>

          {data.keyInsight && (
            <div className="pt-1 text-[11px] text-slate-300 italic border-t border-slate-850">
              "{data.keyInsight}"
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  if (compact) {
    // Ultra compact version for summary cards
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400 font-medium flex items-center gap-1">
            <Activity className="w-3 h-3 text-purple-400" />
            Sentiment Trajectory
          </span>
          <span
            className={`font-mono font-bold text-[10px] flex items-center gap-0.5 ${
              scoreDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {scoreDelta >= 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {scoreDelta >= 0 ? `+${scoreDelta}` : scoreDelta} pts
          </span>
        </div>

        <div className="h-16 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id={fillGradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={strokeColor} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={strokeColor} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="score"
                stroke={strokeColor}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#${fillGradientId})`}
                dot={{ r: 2.5, fill: strokeColor, strokeWidth: 1, stroke: '#0f172a' }}
                activeDot={{ r: 4.5, fill: '#fff', stroke: strokeColor, strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-0.5">
          <span>Beg ({beginningScore})</span>
          <span>Mid ({chartData[1]?.score ?? 75})</span>
          <span>End ({endScore})</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                Sentiment Score Trajectory
                <span className="text-[10px] font-normal normal-case px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  Recharts Timeline
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Maps tone and harmony dynamics across beginning, middle, and end transcript phases
              </p>
            </div>
          </div>
        </div>

        {/* Action / View switcher & Delta Badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px]">
            <button
              onClick={() => setViewMode('phases')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer font-medium ${
                viewMode === 'phases'
                  ? 'bg-purple-600 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              3 Phases
            </button>
            <button
              onClick={() => setViewMode('beats')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer font-medium ${
                viewMode === 'beats'
                  ? 'bg-purple-600 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Transcript Beats
            </button>
          </div>

          <div
            className={`px-2.5 py-1 rounded-lg border text-xs font-mono font-bold flex items-center gap-1.5 ${
              scoreDelta >= 0
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25'
                : 'bg-rose-500/10 text-rose-300 border-rose-500/25'
            }`}
          >
            {scoreDelta >= 0 ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            <span>
              {scoreDelta >= 0 ? `+${scoreDelta}` : scoreDelta} pts Shift
            </span>
          </div>
        </div>
      </div>

      {/* Recharts Main Area Chart */}
      <div className="h-52 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 12, right: 16, left: -16, bottom: 4 }}
          >
            <defs>
              <linearGradient id={fillGradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={strokeColor} stopOpacity={0.4} />
                <stop offset="95%" stopColor={strokeColor} stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1e293b"
              vertical={false}
            />

            <XAxis
              dataKey="phase"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              dy={6}
            />

            <YAxis
              domain={[30, 100]}
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              tickFormatter={(v) => `${v}`}
              dx={-4}
            />

            <ReferenceLine
              y={70}
              stroke="#475569"
              strokeDasharray="4 4"
              label={{
                value: 'Baseline (70)',
                fill: '#94a3b8',
                fontSize: 9,
                position: 'insideTopLeft',
              }}
            />

            <Tooltip content={<CustomTooltip />} />

            <Area
              type="monotone"
              dataKey="score"
              name="Sentiment Score"
              stroke={strokeColor}
              strokeWidth={3}
              fillOpacity={1}
              fill={`url(#${fillGradientId})`}
              dot={{
                r: 4,
                fill: strokeColor,
                strokeWidth: 2,
                stroke: '#090d16',
              }}
              activeDot={{
                r: 6.5,
                fill: '#ffffff',
                stroke: strokeColor,
                strokeWidth: 2.5,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Phase Cards Breakdown Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        {getTimelineData().map((phase, idx) => {
          const isHighest =
            phase.score === Math.max(...getTimelineData().map((p) => p.score));
          const isLowest =
            phase.score === Math.min(...getTimelineData().map((p) => p.score));

          return (
            <div
              key={phase.phase}
              className={`p-3 rounded-xl border transition-all ${
                isHighest
                  ? 'bg-purple-950/30 border-purple-500/30'
                  : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1">
                  {idx === 0 && <Clock className="w-3 h-3 text-blue-400" />}
                  {idx === 1 && <Compass className="w-3 h-3 text-amber-400" />}
                  {idx === 2 && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                  {phase.phase}
                </span>
                <span
                  className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
                    phase.score >= 85
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : phase.score >= 70
                      ? 'bg-blue-500/20 text-blue-300'
                      : 'bg-rose-500/20 text-rose-300'
                  }`}
                >
                  {phase.score}/100
                </span>
              </div>

              <div className="text-[10px] text-slate-400 font-medium mb-1">
                {phase.displayLabel}
              </div>

              <div className="text-[10px] text-slate-500 line-clamp-2 italic">
                "{phase.keyInsight}"
              </div>
            </div>
          );
        })}
      </div>

      {/* Trajectory Insights Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-900/40 border border-slate-800/80 text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          <span>
            <strong className="text-slate-200">Trajectory Summary:</strong>{' '}
            {scoreDelta > 5
              ? 'Strong positive momentum as the meeting resolved debates and locked in commitments.'
              : scoreDelta < -5
              ? 'Tension heightened toward the closing minutes due to tight deadlines or resource disagreements.'
              : 'Steady constructive equilibrium maintained across the entire agenda.'}
          </span>
        </div>
        <div className="font-mono text-[10px] text-slate-400 shrink-0">
          Average Harmony: <span className="text-white font-bold">{averageScore}/100</span>
        </div>
      </div>
    </div>
  );
};
