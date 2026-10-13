import React from 'react';
import { X, Bell, Check, Info, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import { AppNotification } from '../types';

interface NotificationCenterModalProps {
  notifications: AppNotification[];
  onClose: () => void;
  onMarkAllRead: () => void;
  onSelectMeeting?: (meetingId: string) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  notifications,
  onClose,
  onMarkAllRead,
  onSelectMeeting,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <Bell className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-white text-base">Notifications & Alerts</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onMarkAllRead}
              className="text-xs text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
            >
              Mark all as read
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="p-4 space-y-2.5 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No notifications at this time.
            </div>
          ) : (
            notifications.map((notif) => {
              const Icon =
                notif.type === 'success'
                  ? CheckCircle2
                  : notif.type === 'warning'
                  ? AlertTriangle
                  : notif.type === 'error'
                  ? AlertCircle
                  : Info;

              const iconColor =
                notif.type === 'success'
                  ? 'text-emerald-400'
                  : notif.type === 'warning'
                  ? 'text-amber-400'
                  : notif.type === 'error'
                  ? 'text-rose-400'
                  : 'text-purple-400';

              return (
                <div
                  key={notif.id}
                  onClick={() => {
                    if (notif.meetingId && onSelectMeeting) {
                      onSelectMeeting(notif.meetingId);
                      onClose();
                    }
                  }}
                  className={`p-3.5 rounded-xl border transition-colors flex items-start gap-3 cursor-pointer ${
                    notif.read
                      ? 'bg-slate-950/40 border-slate-800/80 text-slate-400'
                      : 'bg-slate-950/80 border-purple-500/40 text-slate-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${iconColor}`} />
                  <div className="space-y-0.5 flex-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">{notif.title}</span>
                      <span className="text-[10px] text-slate-500">{notif.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-snug">{notif.message}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
