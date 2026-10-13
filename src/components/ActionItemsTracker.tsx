import React, { useState } from 'react';
import {
  CheckSquare,
  Square,
  Clock,
  User,
  AlertCircle,
  Plus,
  Search,
  Filter,
  FileText,
  Check,
} from 'lucide-react';
import { MeetingReport, ActionItem } from '../types';

interface ActionItemsTrackerProps {
  reports: MeetingReport[];
  onOpenReport: (reportId: string) => void;
  onUpdateActionItem: (reportId: string, actionId: string, completed: boolean) => void;
}

export const ActionItemsTracker: React.FC<ActionItemsTrackerProps> = ({
  reports,
  onOpenReport,
  onUpdateActionItem,
}) => {
  const [filter, setFilter] = useState<'all' | 'me' | 'pending' | 'completed'>('me');
  const [search, setSearch] = useState('');

  // Collect all items with source meeting info
  const allItems: { item: ActionItem; report: MeetingReport }[] = [];
  reports.forEach((report) => {
    (report.actionItems || []).forEach((item) => {
      allItems.push({ item, report });
    });
  });

  const filtered = allItems.filter(({ item }) => {
    if (filter === 'me' && !item.isCurrentUser) return false;
    if (filter === 'pending' && item.completed) return false;
    if (filter === 'completed' && !item.completed) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.task.toLowerCase().includes(q) ||
        item.assignee.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const myPendingCount = allItems.filter(
    ({ item }) => item.isCurrentUser && !item.completed
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white tracking-tight">AI Action Items & Commitments</h2>
            <span className="text-[10px] bg-purple-500/20 text-purple-300 font-semibold px-2 py-0.5 rounded-full border border-purple-500/30">
              {myPendingCount} Tasks for You
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Aggregated tasks and deliverables extracted by Gemini 3.8 Flash from meetings attended by NapMeet AI.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => setFilter('me')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
              filter === 'me'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Assigned to Me ({allItems.filter((a) => a.item.isCurrentUser).length})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
              filter === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            All Team ({allItems.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
              filter === 'pending'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Pending
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Filter action items by task description or assignee..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 rounded-2xl bg-slate-900/40 border border-slate-800">
            <CheckSquare className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-300">No Action Items Found</h4>
            <p className="text-xs text-slate-500 mt-1">
              {filter === 'me'
                ? 'You have no outstanding commitments from your attended meetings. Sleep easy!'
                : 'No items match your filter criteria.'}
            </p>
          </div>
        ) : (
          filtered.map(({ item, report }) => (
            <div
              key={item.id}
              className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                item.isCurrentUser
                  ? 'bg-slate-900/80 border-purple-500/40 shadow-sm'
                  : 'bg-slate-900/40 border-slate-800'
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => onUpdateActionItem(report.id, item.id, !item.completed)}
                  className="mt-0.5 text-slate-400 hover:text-purple-400 cursor-pointer"
                >
                  {item.completed ? (
                    <CheckSquare className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-500" />
                  )}
                </button>

                <div className="space-y-1">
                  <div
                    className={`text-xs font-medium leading-relaxed ${
                      item.completed ? 'line-through text-slate-500' : 'text-slate-100'
                    }`}
                  >
                    {item.task}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-purple-400" />
                      <span>{item.assignee}</span>
                    </span>

                    {item.deadline && (
                      <span className="flex items-center gap-1 text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>Deadline: {item.deadline}</span>
                      </span>
                    )}

                    <button
                      onClick={() => onOpenReport(report.id)}
                      className="text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <FileText className="w-3 h-3" />
                      <span>Source: {report.title}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Status pills */}
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                {item.isCurrentUser && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Your Task
                  </span>
                )}
                <span
                  className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded ${
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
          ))
        )}
      </div>
    </div>
  );
};
