import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  ShieldCheck,
  Lock,
  Mail,
  Users,
  RefreshCw,
  Trash2,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  LogIn,
  LogOut,
  ExternalLink,
  Eye,
  EyeOff,
  MessageSquare,
  MailCheck,
  Inbox,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { authClient, AdminSession } from '../utils/authClient';
import { UserProfile, AdminStats, ContactMessage } from '../types';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminSession: AdminSession | null;
  onAdminLogin: (session: AdminSession) => void;
  onAdminLogout: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  adminSession,
  onAdminLogin,
  onAdminLogout,
}) => {
  // Login form state - MUST be blank by default so credentials are never visible
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Admin dashboard data state
  const [activeTab, setActiveTab] = useState<'users' | 'messages'>('users');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [dataLoading, setDataLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProvider, setFilterProvider] = useState<'all' | 'google' | 'email'>('all');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Fetch users and contact messages when modal opens and admin is logged in
  const fetchDashboardData = async () => {
    if (!adminSession) return;
    try {
      setDataLoading(true);
      const [usersRes, messagesRes] = await Promise.all([
        authClient.getAdminUsers(adminSession.token),
        authClient.getAdminMessages(adminSession.token),
      ]);
      setUsers(usersRes.users);
      setStats(usersRes.stats);
      setMessages(messagesRes.messages);
      setUnreadCount(messagesRes.unreadCount);
    } catch (err: any) {
      setActionMessage('Error loading dashboard records: ' + (err.message || 'Unauthorized'));
    } finally {
      setDataLoading(false);
    }
  };

  const handleMarkMessageRead = async (id: string) => {
    if (!adminSession) return;
    try {
      await authClient.markMessageAsRead(adminSession.token, id);
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: 'read' as const } : m))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      alert('Failed to update message: ' + err.message);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!adminSession) return;
    if (!window.confirm('Are you sure you want to delete this contact message?')) return;
    try {
      const ok = await authClient.deleteAdminMessage(adminSession.token, id);
      if (ok) {
        setMessages((prev) => prev.filter((m) => m.id !== id));
        setActionMessage('Message deleted successfully.');
        setTimeout(() => setActionMessage(null), 3000);
      }
    } catch (err: any) {
      alert('Failed to delete message: ' + err.message);
    }
  };

  useEffect(() => {
    if (isOpen && adminSession) {
      fetchDashboardData();
    }
  }, [isOpen, adminSession?.token]);

  if (!isOpen) return null;

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    try {
      setLoginLoading(true);
      const session = await authClient.loginAdmin(adminEmail, adminPassword);
      if (autoSave) {
        // Saved in localStorage
        authClient.setAdminSession(session);
      }
      onAdminLogin(session);
    } catch (err: any) {
      setLoginError(err.message || 'Invalid email or password. Access denied.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleDeleteUser = async (id: string, email: string) => {
    if (!adminSession) return;
    if (!window.confirm(`Are you sure you want to delete user "${email}"?`)) return;

    try {
      const ok = await authClient.deleteUser(adminSession.token, id);
      if (ok) {
        setUsers((prev) => prev.filter((u) => u.id !== id));
        setActionMessage(`User ${email} deleted successfully.`);
        setTimeout(() => setActionMessage(null), 3000);
      }
    } catch (err: any) {
      alert('Failed to delete: ' + err.message);
    }
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesProvider = filterProvider === 'all' || u.provider === filterProvider;
    return matchesSearch && matchesProvider;
  });

  // Relative time helper
  const formatTimeAgo = (isoString?: string) => {
    if (!isoString) return 'Never';
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 30) return 'Just now (Active)';
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay === 1) return 'Yesterday';
    return `${diffDay}d ago`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      >
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-4xl w-full bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-auto max-h-[90vh] flex flex-col"
        >
          {/* Top Header Bar */}
          <div className="bg-stone-950 text-white px-5 py-4 flex items-center justify-between border-b border-stone-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                    {adminSession ? 'Studio Admin Control Panel' : 'Administrator Portal'}
                  </h2>
                  {adminSession && (
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-400 text-stone-950 font-bold">
                      Ramjan Ali
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-400">
                  {adminSession
                    ? `Logged in as ${adminSession.email} • Real-time user accounts & visit tracking`
                    : 'Restricted access: Authorized Administrator Login Required'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {adminSession && (
                <button
                  type="button"
                  onClick={onAdminLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs text-stone-300 hover:text-white transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* MAIN CONTENT AREA */}
          <div className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-6">
            {!adminSession ? (
              /* LOGIN FORM FOR ADMIN */
              <div className="max-w-md mx-auto py-4 space-y-5">
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center border border-amber-200">
                    <Lock className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-bold text-stone-900">Administrator Sign In</h3>
                  <p className="text-xs text-stone-600">
                    Enter the authorized administrator Gmail and password to unlock the admin panel.
                  </p>
                </div>

                {loginError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-xs text-red-700">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <form onSubmit={handleAdminSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">
                      Admin Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        placeholder="admin@example.com"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-stone-300 bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        autoComplete="username"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">
                      Admin Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••••••"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl border border-stone-300 bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 cursor-pointer p-0.5"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="autoSaveCheckbox"
                      checked={autoSave}
                      onChange={(e) => setAutoSave(e.target.checked)}
                      className="rounded border-stone-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                    />
                    <label htmlFor="autoSaveCheckbox" className="text-xs text-stone-600 cursor-pointer">
                      Auto-save login in this browser (Remember session)
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full py-3 px-4 bg-stone-950 hover:bg-stone-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loginLoading ? (
                      <span className="inline-block animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <>
                        <LogIn className="w-4 h-4 text-amber-400" />
                        <span>Unlock Admin Panel</span>
                      </>
                    )}
                  </button>
                </form>

                <div className="p-3 bg-stone-100/80 border border-stone-200 rounded-xl text-xs text-stone-600 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-stone-500 shrink-0" />
                  <span className="text-[11px]">
                    Authorized administrator credentials required. Access is strictly restricted.
                  </span>
                </div>
              </div>
            ) : (
              /* ACTIVE ADMIN DASHBOARD */
              <div className="space-y-6">
                {/* Stats Overview */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/90 shadow-2xs">
                    <div className="flex items-center justify-between text-stone-500 mb-1">
                      <span className="text-[11px] font-semibold uppercase tracking-wider">Total Users</span>
                      <Users className="w-4 h-4 text-stone-400" />
                    </div>
                    <div className="text-2xl font-black text-stone-900">
                      {stats?.totalUsers ?? users.length}
                    </div>
                    <div className="text-[11px] text-stone-500 mt-1">Signed up accounts</div>
                  </div>

                  <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/80 shadow-2xs">
                    <div className="flex items-center justify-between text-blue-700 mb-1">
                      <span className="text-[11px] font-semibold uppercase tracking-wider">Google / Gmail</span>
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                      </svg>
                    </div>
                    <div className="text-2xl font-black text-blue-950">
                      {stats?.googleUsers ?? users.filter((u) => u.provider === 'google').length}
                    </div>
                    <div className="text-[11px] text-blue-600 mt-1">Gmail authentications</div>
                  </div>

                  <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/90 shadow-2xs">
                    <div className="flex items-center justify-between text-stone-500 mb-1">
                      <span className="text-[11px] font-semibold uppercase tracking-wider">Email / Pass</span>
                      <Mail className="w-4 h-4 text-stone-400" />
                    </div>
                    <div className="text-2xl font-black text-stone-900">
                      {stats?.emailUsers ?? users.filter((u) => u.provider === 'email').length}
                    </div>
                    <div className="text-[11px] text-stone-500 mt-1">Custom email signups</div>
                  </div>

                  <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 shadow-2xs">
                    <div className="flex items-center justify-between text-amber-800 mb-1">
                      <span className="text-[11px] font-semibold uppercase tracking-wider">Total Visits</span>
                      <Clock className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="text-2xl font-black text-amber-950">
                      {stats?.totalVisits ?? users.reduce((a, b) => a + (b.visitCount || 1), 0)}
                    </div>
                    <div className="text-[11px] text-amber-700 mt-1">Session visits recorded</div>
                  </div>
                </div>

                {/* Most Recent Activity Highlight */}
                {stats?.lastActiveEmail && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between flex-wrap gap-2 text-xs">
                    <div className="flex items-center gap-2 text-emerald-900 font-medium">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                      <span>Last website visit:</span>
                      <span className="font-bold font-mono text-emerald-950 bg-white px-2 py-0.5 rounded border border-emerald-300">
                        {stats.lastActiveEmail}
                      </span>
                    </div>
                    <div className="text-emerald-700 font-medium">
                      {formatTimeAgo(stats.lastActiveTime || undefined)} (
                      {new Date(stats.lastActiveTime || '').toLocaleTimeString()})
                    </div>
                  </div>
                )}

                {/* Tab Navigation: Users vs Contact Messages */}
                <div className="flex border-b border-stone-200 gap-4 pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('users')}
                    className={`pb-2.5 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
                      activeTab === 'users'
                        ? 'border-amber-500 text-stone-950 font-bold'
                        : 'border-transparent text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Registered Accounts ({users.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('messages')}
                    className={`pb-2.5 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer relative ${
                      activeTab === 'messages'
                        ? 'border-amber-500 text-stone-950 font-bold'
                        : 'border-transparent text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    <Inbox className="w-4 h-4" />
                    <span>Contact Messages ({messages.length})</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 bg-red-500 text-white font-mono text-[10px] rounded-full font-bold animate-pulse">
                        {unreadCount} new
                      </span>
                    )}
                  </button>
                </div>

                {/* Notification Banner */}
                {actionMessage && (
                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-center justify-between">
                    <span>{actionMessage}</span>
                    <button
                      type="button"
                      onClick={() => setActionMessage(null)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* TAB 1: REGISTERED USERS */}
                {activeTab === 'users' && (
                  <div className="space-y-4">
                    {/* Controls: Search, Filter, Refresh */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          placeholder="Search users by email or name..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex p-1 bg-stone-100 rounded-xl border border-stone-200 text-xs">
                          <button
                            type="button"
                            onClick={() => setFilterProvider('all')}
                            className={`px-3 py-1 rounded-lg font-medium transition-all ${
                              filterProvider === 'all'
                                ? 'bg-white text-stone-900 shadow-2xs font-bold'
                                : 'text-stone-600'
                            }`}
                          >
                            All ({users.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setFilterProvider('google')}
                            className={`px-3 py-1 rounded-lg font-medium transition-all ${
                              filterProvider === 'google'
                                ? 'bg-white text-stone-900 shadow-2xs font-bold'
                                : 'text-stone-600'
                            }`}
                          >
                            Gmail
                          </button>
                          <button
                            type="button"
                            onClick={() => setFilterProvider('email')}
                            className={`px-3 py-1 rounded-lg font-medium transition-all ${
                              filterProvider === 'email'
                                ? 'bg-white text-stone-900 shadow-2xs font-bold'
                                : 'text-stone-600'
                            }`}
                          >
                            Email
                          </button>
                        </div>

                        <button
                          type="button"
                          disabled={dataLoading}
                          onClick={fetchDashboardData}
                          title="Refresh users list"
                          className="p-2 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw className={`w-4 h-4 ${dataLoading ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Users Table */}
                    <div className="border border-stone-200 rounded-xl overflow-hidden shadow-2xs bg-white">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-stone-100/80 border-b border-stone-200 text-stone-600 font-semibold">
                              <th className="py-2.5 px-4">User Email</th>
                              <th className="py-2.5 px-4">Sign In Method</th>
                              <th className="py-2.5 px-4">Last Visited Site</th>
                              <th className="py-2.5 px-4">Total Visits</th>
                              <th className="py-2.5 px-4">Registered Date</th>
                              <th className="py-2.5 px-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-200">
                            {filteredUsers.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="py-8 text-center text-stone-500">
                                  {users.length === 0
                                    ? 'No users have registered yet. As visitors sign in with Gmail or email, their details and last visit will appear here in real time.'
                                    : 'No users match your current filter.'}
                                </td>
                              </tr>
                            ) : (
                              filteredUsers.map((u) => {
                                const isRecentlyActive =
                                  Date.now() - new Date(u.lastVisitAt).getTime() < 15 * 60 * 1000;

                                return (
                                  <tr key={u.id} className="hover:bg-stone-50/70 transition-colors">
                                    <td className="py-3 px-4 font-mono font-medium text-stone-900">
                                      <div className="flex items-center gap-2">
                                        {isRecentlyActive && (
                                          <span
                                            className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"
                                            title="Active recently"
                                          />
                                        )}
                                        <span>{u.email}</span>
                                        {u.name && u.name !== u.email.split('@')[0] && (
                                          <span className="text-[11px] text-stone-400 font-sans">
                                            ({u.name})
                                          </span>
                                        )}
                                      </div>
                                    </td>

                                    <td className="py-3 px-4">
                                      {u.provider === 'google' ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium text-[11px]">
                                          <svg className="w-3 h-3" viewBox="0 0 24 24">
                                            <path
                                              fill="#4285F4"
                                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                            />
                                            <path
                                              fill="#34A853"
                                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                            />
                                          </svg>
                                          Gmail (Google)
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-300 font-medium text-[11px]">
                                          <Mail className="w-3 h-3 text-stone-400" />
                                          Email &amp; Pass
                                        </span>
                                      )}
                                    </td>

                                    <td className="py-3 px-4">
                                      <div className="font-semibold text-stone-800">
                                        {formatTimeAgo(u.lastVisitAt)}
                                      </div>
                                      <div className="text-[10px] text-stone-500">
                                        {new Date(u.lastVisitAt).toLocaleDateString()}{' '}
                                        {new Date(u.lastVisitAt).toLocaleTimeString([], {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
                                      </div>
                                    </td>

                                    <td className="py-3 px-4">
                                      <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-800 font-mono text-[11px] font-semibold border border-stone-200">
                                        {u.visitCount || 1} {u.visitCount === 1 ? 'visit' : 'visits'}
                                      </span>
                                    </td>

                                    <td className="py-3 px-4 text-stone-500 text-[11px]">
                                      {new Date(u.createdAt).toLocaleDateString()}
                                    </td>

                                    <td className="py-3 px-4 text-right">
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteUser(u.id, u.email)}
                                        title="Delete this user record"
                                        className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: CONTACT MESSAGES & INQUIRIES */}
                {activeTab === 'messages' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs text-stone-600">
                      <span>
                        Showing <strong>{messages.length}</strong> message
                        {messages.length === 1 ? '' : 's'} from visitors and users.
                      </span>
                      <button
                        type="button"
                        disabled={dataLoading}
                        onClick={fetchDashboardData}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-100 text-stone-700 cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${dataLoading ? 'animate-spin' : ''}`} />
                        <span>Refresh Inbox</span>
                      </button>
                    </div>

                    {messages.length === 0 ? (
                      <div className="p-10 rounded-2xl bg-stone-50 border border-stone-200 text-center space-y-2">
                        <Inbox className="w-8 h-8 text-stone-400 mx-auto" />
                        <div className="font-bold text-stone-800 text-sm">No Messages Yet</div>
                        <p className="text-xs text-stone-500 max-w-sm mx-auto">
                          When users submit feedback or report problems using the "Contact Admin" form,
                          their messages will show up here.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {messages.map((m) => {
                          const replyMailto = `mailto:${m.senderEmail}?subject=${encodeURIComponent(
                            'Re: ' + m.subject
                          )}&body=${encodeURIComponent(
                            `Hello ${m.senderName || 'there'},\n\nThank you for reaching out regarding Accent Voice Generator Studio.\n\n`
                          )}`;

                          return (
                            <div
                              key={m.id}
                              className={`p-4 rounded-xl border transition-all ${
                                m.status === 'unread'
                                  ? 'bg-amber-50/40 border-amber-300 shadow-xs'
                                  : 'bg-white border-stone-200 shadow-2xs'
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 pb-2 border-b border-stone-100">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {m.status === 'unread' ? (
                                    <span className="px-2 py-0.5 rounded-full bg-red-500 text-white font-bold text-[10px] uppercase">
                                      New / Unread
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 font-medium text-[10px]">
                                      Read
                                    </span>
                                  )}
                                  <a
                                    href={`mailto:${m.senderEmail}`}
                                    className="font-mono font-bold text-xs text-stone-900 hover:text-amber-600 hover:underline flex items-center gap-1"
                                    title="Click to email this user"
                                  >
                                    <Mail className="w-3.5 h-3.5 text-stone-400" />
                                    <span>{m.senderEmail}</span>
                                  </a>
                                  {m.senderName && (
                                    <span className="text-xs text-stone-500">
                                      ({m.senderName})
                                    </span>
                                  )}
                                </div>

                                <div className="text-[11px] text-stone-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-stone-400" />
                                  <span>
                                    {new Date(m.createdAt).toLocaleDateString()} at{' '}
                                    {new Date(m.createdAt).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>
                              </div>

                              <div className="mb-2">
                                <span className="inline-block px-2.5 py-0.5 rounded-md bg-stone-100 text-stone-800 text-[11px] font-semibold mb-1.5">
                                  {m.subject}
                                </span>
                                <p className="text-xs text-stone-700 whitespace-pre-wrap bg-stone-50/70 p-3 rounded-lg border border-stone-200/70 leading-relaxed font-sans">
                                  {m.message}
                                </p>
                              </div>

                              <div className="flex items-center justify-end gap-2 pt-1">
                                <a
                                  href={replyMailto}
                                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold cursor-pointer transition-colors"
                                >
                                  <Mail className="w-3 h-3" />
                                  <span>Reply via Email</span>
                                </a>

                                {m.status === 'unread' && (
                                  <button
                                    type="button"
                                    onClick={() => handleMarkMessageRead(m.id)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium cursor-pointer transition-colors"
                                  >
                                    <MailCheck className="w-3.5 h-3.5" />
                                    <span>Mark as Read</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleDeleteMessage(m.id)}
                                  className="p-1 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                  title="Delete message"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500 shrink-0">
            <span>Accent Voice Generator Studio • Admin Security System</span>
            <span>Created by Ramjan Ali</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
