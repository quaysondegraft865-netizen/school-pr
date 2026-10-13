import React, { useState } from 'react';
import {
  ShieldCheck,
  Activity,
  Users,
  Cpu,
  Lock,
  Trash2,
  Download,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Server,
  Zap,
  Sliders,
  Database,
  Radio,
  FileText,
} from 'lucide-react';
import { AuditLog, SystemHealth, UserProfile } from '../types';

interface AdminPortalProps {
  auditLogs: AuditLog[];
  systemHealth: SystemHealth;
  profile: UserProfile;
  retentionDays: number;
  onUpdateRetentionDays: (days: number) => void;
  onPurgeAllData: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  auditLogs,
  systemHealth,
  profile,
  retentionDays,
  onUpdateRetentionDays,
  onPurgeAllData,
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<
    'overview' | 'fleet' | 'users' | 'ai_config' | 'audit' | 'privacy'
  >('overview');

  const [aiModel, setAiModel] = useState<'gemini-3.8-flash' | 'gemini-3.5-transcribe'>('gemini-3.8-flash');
  const [temperature, setTemperature] = useState(0.4);
  const [transcriptionDiarization, setTranscriptionDiarization] = useState(true);
  const [adminTranscriptConsent, setAdminTranscriptConsent] = useState(false);
  const [logFilter, setLogFilter] = useState('all');

  const mockUsers = [
    {
      id: 'u-1',
      name: profile.name,
      email: profile.email,
      role: 'Super Admin',
      plan: 'Pro Plan',
      napHours: '14.5 / 40 hrs',
      lastActive: 'Just now',
    },
    {
      id: 'u-2',
      name: 'Elena Rostova',
      email: 'elena.rostova@techcloud.io',
      role: 'Staff Member',
      plan: 'Enterprise',
      napHours: '28.0 / 80 hrs',
      lastActive: '2 hours ago',
    },
    {
      id: 'u-3',
      name: 'Marcus Vance',
      email: 'm.vance@techcloud.io',
      role: 'Staff Member',
      plan: 'Free Trial',
      napHours: '4.2 / 5 hrs',
      lastActive: 'Yesterday',
    },
  ];

  const filteredLogs = auditLogs.filter((log) => {
    if (logFilter === 'all') return true;
    return log.eventType === logFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">Admin & Governance Portal</h2>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 font-bold px-2 py-0.5 rounded-full border border-purple-500/30">
                RBAC ENFORCED
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage bot fleet workers, AI model parameters, privacy retention, and security audit logs.
            </p>
          </div>
        </div>

        {/* System status pill */}
        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-emerald-400">Fleet Healthy: 99.98% Uptime</span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium">
        {[
          { key: 'overview', label: 'System Health', icon: Activity },
          { key: 'fleet', label: 'Bot Fleet Monitor', icon: Radio },
          { key: 'users', label: 'User & Plan Quotas', icon: Users },
          { key: 'ai_config', label: 'AI & Gemini Engine', icon: Sliders },
          { key: 'audit', label: 'Security Audit Logs', icon: FileText },
          { key: 'privacy', label: 'Data Retention & Privacy', icon: Lock },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveAdminTab(tab.key as any)}
              className={`px-3 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeAdminTab === tab.key
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

      {/* Tab 1: System Health Overview */}
      {activeAdminTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400">Bot Worker Fleet Capacity</span>
              <div className="text-2xl font-bold text-white font-mono">
                {systemHealth.botPoolAvailable} / {systemHealth.botPoolTotal} Available
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{ width: `${(systemHealth.botPoolAvailable / systemHealth.botPoolTotal) * 100}%` }}
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400">Gemini 3.8 Flash Inference Latency</span>
              <div className="text-2xl font-bold text-purple-300 font-mono">
                {systemHealth.geminiApiLatencyMs} ms
              </div>
              <span className="text-[10px] text-emerald-400">Normal operating range</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400">Google Calendar & Meet API</span>
              <div className="text-2xl font-bold text-emerald-400 font-mono">Connected</div>
              <span className="text-[10px] text-slate-400">OAuth Scopes Active</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400">Active Live Meeting Sessions</span>
              <div className="text-2xl font-bold text-blue-400 font-mono">
                {systemHealth.activeBotSessionsCount} Sessions
              </div>
              <span className="text-[10px] text-slate-400">Zero audio transmission enforced</span>
            </div>
          </div>

          {/* Infrastructure Health details */}
          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-white">Cluster Health & Service Matrix</h3>
            <div className="space-y-3 text-xs">
              {[
                { name: 'Headless Google Meet Automation Cluster (Puppeteer / WebRTC)', status: 'Operational', latency: '42ms' },
                { name: 'Gemini 3.8 Flash Intelligence Engine (Summaries & Action Items)', status: 'Operational', latency: '340ms' },
                { name: 'Gemini 3.5 Speech-to-Text Transcription Service', status: 'Operational', latency: '210ms' },
                { name: 'Google Calendar Sync Webhook Gateway', status: 'Operational', latency: '15ms' },
                { name: 'Encrypted Vault & Temporary Audio Buffer', status: 'Operational', latency: '8ms' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-slate-200 font-medium">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    <span className="text-slate-400">{item.latency}</span>
                    <span className="text-emerald-400 font-semibold">{item.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Fleet Monitor */}
      {activeAdminTab === 'fleet' && (
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Active Bot Fleet Workers</h3>
            <span className="text-xs text-slate-400 font-mono">6 of 30 active</span>
          </div>

          <div className="space-y-2 text-xs">
            {[
              { id: 'bot-node-01', user: 'Degraft Quayson', meeting: 'Product Architecture Sync', status: 'In Meeting', elapsed: '14m 20s' },
              { id: 'bot-node-02', user: 'Elena Rostova', meeting: 'Design Sprint Review', status: 'In Meeting', elapsed: '28m 10s' },
              { id: 'bot-node-03', user: 'Marcus Vance', meeting: 'GTM Review', status: 'Waiting Room', elapsed: '02m 45s' },
              { id: 'bot-node-04', user: 'Sarah Jenkins', meeting: 'Sprint Retrospective', status: 'Processing Summary', elapsed: '45m 00s' },
            ].map((node) => (
              <div key={node.id} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-purple-300 font-semibold">{node.id}</span>
                    <span className="text-slate-200 font-medium">— {node.meeting}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">User: {node.user}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {node.status}
                  </span>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">Elapsed: {node.elapsed}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Users & Quotas */}
      {activeAdminTab === 'users' && (
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="text-sm font-semibold text-white">Registered Users & Sleep Quotas</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">User</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Subscription</th>
                  <th className="py-2.5 px-3">Nap Attendance Quota</th>
                  <th className="py-2.5 px-3">Last Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {mockUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-850/50">
                    <td className="py-3 px-3">
                      <div className="font-medium text-white">{u.name}</div>
                      <div className="text-[11px] text-slate-400">{u.email}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-purple-300 font-semibold">{u.plan}</td>
                    <td className="py-3 px-3 font-mono">{u.napHours}</td>
                    <td className="py-3 px-3 text-slate-400">{u.lastActive}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: AI & Gemini Configuration */}
      {activeAdminTab === 'ai_config' && (
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-white">AI Language Model & Transcription Settings</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Powered by the official Google Gen AI TypeScript SDK.
            </p>
          </div>

          <div className="space-y-4 text-xs max-w-xl">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Intelligence Model</label>
              <select
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-purple-300 font-semibold focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                <option value="gemini-3.8-flash">gemini-3.8-flash (Recommended for Executive Summaries)</option>
                <option value="gemini-3.5-transcribe">gemini-3.5-transcribe (High-accuracy Audio Diarization)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 font-medium mb-1">
                <span>Inference Temperature</span>
                <span className="font-mono text-purple-400">{temperature}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Lower temperature produces more strict, factual action item extractions.
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div>
                <span className="text-slate-200 font-medium block">Automatic Speaker Diarization</span>
                <span className="text-[11px] text-slate-500">
                  Tag speaker identities based on Google Meet active speaker events.
                </span>
              </div>
              <input
                type="checkbox"
                checked={transcriptionDiarization}
                onChange={(e) => setTranscriptionDiarization(e.target.checked)}
                className="rounded border-slate-700 text-purple-600 focus:ring-purple-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Security Audit Logs */}
      {activeAdminTab === 'audit' && (
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-white">Immutable Security Audit Logs</h3>
              <p className="text-xs text-slate-400">
                All OAuth grants, bot joins, departures, and data purges are logged for SOC2 compliance.
              </p>
            </div>

            <select
              value={logFilter}
              onChange={(e) => setLogFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="all">All Events ({auditLogs.length})</option>
              <option value="oauth_connect">OAuth Connections</option>
              <option value="bot_scheduled">Bot Dispatches</option>
              <option value="report_generated">Report Generations</option>
              <option value="bot_left">Bot Departures</option>
            </select>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-200">{log.description}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      {log.eventType}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    User: {log.userEmail} | IP: {log.ipAddress}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-emerald-400 font-semibold uppercase">
                    {log.status}
                  </span>
                  <div className="text-[10px] text-slate-500">{log.timestamp}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Data Retention & Privacy Controls */}
      {activeAdminTab === 'privacy' && (
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-white">Retention & Permanent Deletion Policy</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Configure automatic data lifecycle rules and privacy protection standards.
            </p>
          </div>

          {/* Admin restriction notice */}
          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 flex items-start gap-3">
            <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-2">
              <span className="font-bold text-amber-300">
                Mandatory Privacy Guardrail (RBAC Transcript Shield):
              </span>
              <p className="text-slate-300">
                Per user privacy rules: Administrators do not automatically gain access to private
                meeting transcripts without explicit participant authorization and a formal enterprise audit policy.
              </p>
              <label className="flex items-center gap-2 pt-1 text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={adminTranscriptConsent}
                  onChange={(e) => setAdminTranscriptConsent(e.target.checked)}
                  className="rounded border-slate-700 text-amber-500 focus:ring-amber-500"
                />
                <span>I acknowledge I have legal authorization to review compliance summaries.</span>
              </label>
            </div>
          </div>

          {/* Retention period slider */}
          <div className="space-y-3 max-w-lg text-xs">
            <label className="block text-slate-300 font-medium">
              Automatic Transcript Auto-Purge Window
            </label>
            <div className="flex items-center gap-3">
              {[7, 14, 30, 90].map((days) => (
                <button
                  key={days}
                  onClick={() => onUpdateRetentionDays(days)}
                  className={`px-3 py-1.5 rounded-lg border font-semibold transition-colors cursor-pointer ${
                    retentionDays === days
                      ? 'bg-purple-600 text-white border-purple-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {days} Days
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500">
              Raw audio recordings and diarized transcripts will be permanently purged after {retentionDays} days.
            </p>
          </div>

          {/* Permanent Purge Trigger */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-rose-300 block">Purge All Historical Transcripts</span>
              <span className="text-[11px] text-slate-500">
                Immediately clear all cached transcripts and meeting intelligence reports.
              </span>
            </div>

            <button
              onClick={onPurgeAllData}
              className="px-4 py-2 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700/50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Purge All Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
