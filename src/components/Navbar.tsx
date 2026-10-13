import React from 'react';
import {
  Moon,
  Sparkles,
  Calendar,
  FileText,
  CheckSquare,
  ShieldCheck,
  Bell,
  LogOut,
  Clock,
  Layers,
  Zap,
  Video,
  User as UserIcon,
  LogIn,
} from 'lucide-react';
import { UserProfile, AppNotification } from '../types';

interface NavbarProps {
  activeTab: 'dashboard' | 'nap_mode' | 'meetings' | 'reports' | 'actions' | 'admin';
  setActiveTab: (tab: 'dashboard' | 'nap_mode' | 'meetings' | 'reports' | 'actions' | 'admin') => void;
  user: any | null;
  profile: UserProfile;
  isLoggingIn: boolean;
  onOpenAuthModal: () => void;
  onOpenJoinMeeting: () => void;
  onLogout: () => void;
  notifications: AppNotification[];
  onOpenNotifications: () => void;
  isNapModeActive: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  user,
  profile,
  isLoggingIn,
  onOpenAuthModal,
  onOpenJoinMeeting,
  onLogout,
  notifications,
  onOpenNotifications,
  isNapModeActive,
}) => {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none"
            >
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 shadow-md shadow-purple-500/20 group-hover:shadow-purple-500/40 transition-shadow">
                <Moon className="w-5 h-5 text-white" />
                <Sparkles className="w-3 h-3 text-amber-300 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-lg text-white tracking-tight">NapMeet</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold tracking-wider">
                    AI
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 block -mt-0.5">Google Meet Assistant</span>
              </div>
            </button>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-slate-800 text-purple-300 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Dashboard
              </button>

              <button
                onClick={() => setActiveTab('meetings')}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'meetings'
                    ? 'bg-slate-800 text-purple-300 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                Calendar & Meet
              </button>

              <button
                onClick={() => setActiveTab('reports')}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'reports'
                    ? 'bg-slate-800 text-purple-300 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Meeting Reports
              </button>

              <button
                onClick={() => setActiveTab('actions')}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'actions'
                    ? 'bg-slate-800 text-purple-300 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                Action Items
              </button>

              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-slate-800 text-purple-300 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin Portal
              </button>
            </nav>
          </div>

          {/* Right section: Join Meeting CTA, Nap Mode CTA, Notifications, Profile */}
          <div className="flex items-center gap-2.5">
            {/* Quick Join Meeting Button */}
            <button
              onClick={onOpenJoinMeeting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600/90 hover:bg-blue-600 text-white shadow-sm transition-all cursor-pointer border border-blue-500/50"
              title="Join or dispatch AI to a Google Meet session"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Join Meeting</span>
            </button>

            {/* Primary Nap Mode Trigger */}
            <button
              onClick={() => setActiveTab('nap_mode')}
              className={`relative inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-md transition-all cursor-pointer ${
                isNapModeActive
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white ring-2 ring-purple-400/50 shadow-purple-500/25 animate-pulse'
                  : 'bg-indigo-950/70 hover:bg-indigo-900/90 text-indigo-200 border border-indigo-700/50 hover:border-indigo-500'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-purple-300" />
              <span className="hidden sm:inline">{isNapModeActive ? 'Nap Mode Active' : 'Nap Mode'}</span>
              {isNapModeActive && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              )}
            </button>

            {/* Notification Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors cursor-pointer focus:outline-none"
              title="Notifications"
            >
              <Bell className="w-4.5 h-4.5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-purple-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Authentication & User Info */}
            {user ? (
              <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-medium text-slate-200 truncate max-w-[130px]">
                    {user.displayName || profile.name}
                  </div>
                  <div className="text-[10px] text-purple-400 uppercase tracking-wider font-semibold">
                    {profile.plan} Plan
                  </div>
                </div>
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-8 h-8 rounded-full border border-purple-500/40 object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-purple-600/30 border border-purple-500/50 text-purple-300 font-bold text-xs flex items-center justify-center">
                    {(user.displayName || profile.name || 'U')[0].toUpperCase()}
                  </div>
                )}
                <button
                  onClick={onLogout}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-sm transition-all cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Client Login</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
