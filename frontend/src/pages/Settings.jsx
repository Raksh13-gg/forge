import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  User, Lock, Shield, LogOut, CheckCircle2, XCircle, Eye, EyeOff,
  Save, RefreshCcw, Mail, Hash, Layers, AlertTriangle, X,
  Info, GraduationCap, Users, Database, ChevronRight
} from 'lucide-react';

// ─── Toast ───────────────────────────────────────────────────────────────────
function Toast({ message, type = 'success', onDismiss }) {
  return (
    <div className="fixed top-6 right-6 z-50 w-80 p-4 bg-surface-raised border border-default rounded-xl shadow-2xl flex items-start gap-3 animate-in slide-in-from-right duration-300">
      <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${type === 'success' ? 'bg-success-bg' : 'bg-danger-bg'}`}>
        {type === 'success'
          ? <CheckCircle2 size={18} className="text-success-fg" />
          : <XCircle size={18} className="text-danger-fg" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-primary">{type === 'success' ? 'Success' : 'Error'}</p>
        <p className="text-xs text-secondary mt-0.5 leading-relaxed">{message}</p>
      </div>
      <button onClick={onDismiss} className="text-tertiary hover:text-primary mt-0.5 shrink-0">
        <X size={16} />
      </button>
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function Section({ icon: Icon, title, subtitle, children, accentColor = 'text-accent-glow', badge }) {
  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-8 py-5 border-b border-subtle flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-surface-raised border border-subtle flex items-center justify-center">
            <Icon size={18} className={accentColor} />
          </div>
          <div>
            <h2 className="text-h3 text-primary">{title}</h2>
            {subtitle && <p className="text-xs text-tertiary mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {badge && (
          <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-accent-glow/10 text-accent-glow border border-accent-glow/20">
            {badge}
          </span>
        )}
      </div>
      <div className="p-8">{children}</div>
    </div>
  );
}

// ─── Field Row ────────────────────────────────────────────────────────────────
function FieldRow({ label, icon: Icon, hint, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
      <div className="sm:w-52 pt-2.5 shrink-0">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={13} className="text-tertiary shrink-0" />}
          <label className="text-sm text-secondary">{label}</label>
        </div>
        {hint && <p className="text-xs text-tertiary mt-1 leading-relaxed">{hint}</p>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

// ─── Info Row (read-only) ─────────────────────────────────────────────────────
function InfoRow({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-subtle last:border-0">
      <span className="text-sm text-tertiary">{label}</span>
      <span className={`text-sm text-primary ${mono ? 'font-mono text-xs' : 'font-medium'}`}>{value || '—'}</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Settings() {
  const { profile, user, role, signOut } = useAuth();

  const currentName = profile?.display_name || user?.user_metadata?.display_name || user?.email?.split('@')[0] || '';
  const currentEmail = user?.email || '';
  const currentRole = role || profile?.role || 'student';
  const studentId = profile?.student_id || null;
  const isMentor = currentRole === 'mentor';

  // Profile form
  const [displayName, setDisplayName] = useState(currentName);
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Save profile
  const handleSaveProfile = async () => {
    if (!displayName.trim() || displayName.trim() === currentName) return;
    setSavingProfile(true);

    const { error: dbErr } = await supabase
      .from('users')
      .update({ display_name: displayName.trim() })
      .eq('id', user?.id);

    const { error: metaErr } = await supabase.auth.updateUser({
      data: { display_name: displayName.trim() }
    });

    setSavingProfile(false);
    if (dbErr || metaErr) {
      showToast((dbErr || metaErr).message, 'error');
    } else {
      showToast('Profile updated! Refresh to see changes in the sidebar.');
    }
  };

  // ── Change password
  const handleChangePassword = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      showToast('Passwords do not match.', 'error'); return;
    }
    if (newPassword.length < 8) {
      showToast('Password must be at least 8 characters.', 'error'); return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) {
      showToast(error.message, 'error');
    } else {
      setNewPassword(''); setConfirmPassword('');
      showToast('Password changed successfully!');
    }
  };

  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;
  const passwordMismatch = confirmPassword && newPassword !== confirmPassword;
  const strength = newPassword.length >= 12 ? 'strong' : newPassword.length >= 8 ? 'medium' : newPassword.length > 0 ? 'weak' : null;
  const strengthColor = { strong: 'text-success-fg', medium: 'text-warning-fg', weak: 'text-danger-fg' };
  const barColor = { strong: 'bg-success-fg', medium: 'bg-warning-fg', weak: 'bg-danger-fg' };

  return (
    <div className="pb-24 max-w-3xl mx-auto animate-in fade-in duration-500">

      {/* ── Header */}
      <div className="mb-10">
        <h1 className="text-display-md text-primary tracking-tight">Settings</h1>
        <p className="text-body-lg text-secondary mt-1">Manage your account, security, and program preferences.</p>
      </div>

      <div className="space-y-6">

        {/* ── Profile */}
        <Section icon={User} title="Profile" subtitle="Your identity and display information">
          <div className="space-y-6">
            {/* Avatar Block */}
            <div className="flex items-center gap-5 pb-6 border-b border-subtle">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-glow to-purple-700 flex items-center justify-center text-white font-display font-bold text-2xl shadow-[0_0_24px_rgba(99,102,241,0.35)] shrink-0">
                {(displayName || currentName).charAt(0).toUpperCase() || '?'}
              </div>
              <div className="min-w-0">
                <p className="text-body-lg font-semibold text-primary truncate">{displayName || currentName || 'No name set'}</p>
                <p className="text-sm text-tertiary mt-0.5 truncate">{currentEmail}</p>
                <span className={`inline-flex items-center gap-1.5 mt-2 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                  isMentor
                    ? 'bg-accent-glow/10 text-accent-glow border-accent-glow/30'
                    : 'bg-success-bg text-success-fg border-success-border'
                }`}>
                  <Shield size={10} strokeWidth={2.5} />
                  {currentRole}
                </span>
              </div>
            </div>

            {/* Editable Fields */}
            <div className="space-y-5">
              <FieldRow label="Display Name" icon={User}>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Your full name"
                  className="input w-full"
                />
              </FieldRow>
              <FieldRow label="Email" icon={Mail} hint="Contact your admin to change your email.">
                <input type="email" value={currentEmail} disabled className="input w-full opacity-50 cursor-not-allowed" />
              </FieldRow>
              <FieldRow label="Role" icon={Layers}>
                <div className="input flex items-center gap-2 opacity-60 cursor-not-allowed">
                  <Shield size={14} className="text-tertiary" />
                  <span className="capitalize">{currentRole}</span>
                </div>
              </FieldRow>
              {studentId && (
                <FieldRow label="Student ID" icon={Hash}>
                  <input value={studentId} disabled className="input w-full opacity-50 cursor-not-allowed font-mono text-sm" />
                </FieldRow>
              )}
            </div>

            <div className="flex justify-end pt-5 border-t border-subtle">
              <button
                onClick={handleSaveProfile}
                disabled={savingProfile || !displayName.trim() || displayName.trim() === currentName}
                className="btn-primary disabled:opacity-40"
              >
                {savingProfile
                  ? <><div className="w-4 h-4 border-2 border-inverse border-t-transparent rounded-full animate-spin" />Saving...</>
                  : <><Save size={16} />Save Profile</>}
              </button>
            </div>
          </div>
        </Section>

        {/* ── Mentor-only: Program Info */}
        {isMentor && (
          <Section
            icon={GraduationCap}
            title="Program Overview"
            subtitle="Read-only summary of your ForgeTrack program"
            badge="Mentor Only"
            accentColor="text-accent-glow"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Program', value: 'The Boring People — Forge Track' },
                { label: 'Cohort Year', value: '2025–26' },
                { label: 'Min Attendance', value: '75%' },
              ].map(item => (
                <div key={item.label} className="p-4 bg-surface-inset rounded-xl border border-subtle text-center">
                  <div className="text-xs text-tertiary uppercase tracking-wider mb-1">{item.label}</div>
                  <div className="text-sm font-semibold text-primary">{item.value}</div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-accent-glow/5 border border-accent-glow/20 flex items-start gap-3">
              <Info size={16} className="text-accent-glow shrink-0 mt-0.5" />
              <p className="text-xs text-secondary leading-relaxed">
                Program settings (cohort year, attendance threshold, batch labels) are managed at the database level.
                Contact your Supabase admin or edit the <code className="font-mono text-accent-glow text-[11px]">public.config</code> table to update these values.
              </p>
            </div>
          </Section>
        )}

        {/* ── Mentor-only: Data Management */}
        {isMentor && (
          <Section
            icon={Database}
            title="Data Management"
            subtitle="Quick links for managing program data"
            badge="Mentor Only"
            accentColor="text-success-fg"
          >
            <div className="space-y-3">
              {[
                {
                  icon: Users,
                  label: 'Manage Students',
                  desc: 'View all enrolled students, their USNs, and branches.',
                  link: '/history',
                  color: 'text-accent-glow'
                },
                {
                  icon: Database,
                  label: 'Upload CSV Data',
                  desc: 'Import student attendance from a CSV or Google Sheet export.',
                  link: '/upload',
                  color: 'text-success-fg'
                },
                {
                  icon: GraduationCap,
                  label: 'View Attendance History',
                  desc: 'Browse session-by-session records for any student.',
                  link: '/history',
                  color: 'text-warning-fg'
                },
              ].map(item => (
                <a
                  key={item.label}
                  href={item.link}
                  className="flex items-center gap-4 p-4 rounded-xl border border-subtle bg-surface-inset hover:bg-surface-raised hover:border-default transition-all group"
                >
                  <div className={`w-9 h-9 rounded-lg bg-surface-raised border border-subtle flex items-center justify-center shrink-0 group-hover:border-default`}>
                    <item.icon size={16} className={item.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-primary group-hover:text-accent-glow transition-colors">{item.label}</p>
                    <p className="text-xs text-tertiary mt-0.5 truncate">{item.desc}</p>
                  </div>
                  <ChevronRight size={16} className="text-tertiary opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0" />
                </a>
              ))}
            </div>
          </Section>
        )}

        {/* ── Security */}
        <Section icon={Lock} title="Security" subtitle="Change your login password">
          <div className="space-y-5">
            <FieldRow label="New Password" icon={Lock}>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className={`input w-full pr-10 ${passwordMismatch ? 'border-danger-border' : ''}`}
                />
                <button type="button" onClick={() => setShowNew(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-tertiary hover:text-primary">
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {strength && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex gap-1">
                    {['weak', 'medium', 'strong'].map((l, i) => (
                      <div key={l} className={`h-1 w-10 rounded-full transition-colors ${
                        (strength === 'weak' && i === 0) ||
                        (strength === 'medium' && i <= 1) ||
                        (strength === 'strong')
                          ? barColor[strength] : 'bg-surface-inset'
                      }`} />
                    ))}
                  </div>
                  <span className={`text-xs font-medium capitalize ${strengthColor[strength]}`}>{strength}</span>
                </div>
              )}
            </FieldRow>

            <FieldRow label="Confirm Password" icon={Lock}>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className={`input w-full pr-10 ${
                    passwordMismatch ? 'border-danger-border' :
                    passwordsMatch ? 'border-success-border' : ''}`}
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-tertiary hover:text-primary">
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passwordMismatch && <p className="text-xs text-danger-fg mt-1.5 flex items-center gap-1"><XCircle size={11} />Passwords do not match</p>}
              {passwordsMatch && <p className="text-xs text-success-fg mt-1.5 flex items-center gap-1"><CheckCircle2 size={11} />Passwords match</p>}
            </FieldRow>

            <div className="flex justify-end pt-5 border-t border-subtle">
              <button
                onClick={handleChangePassword}
                disabled={savingPassword || !newPassword || !passwordsMatch}
                className="btn-primary disabled:opacity-40"
              >
                {savingPassword
                  ? <><div className="w-4 h-4 border-2 border-inverse border-t-transparent rounded-full animate-spin" />Updating...</>
                  : <><Lock size={16} />Update Password</>}
              </button>
            </div>
          </div>
        </Section>

        {/* ── Account Info */}
        <Section icon={Info} title="Account Information" subtitle="Read-only system metadata">
          <div>
            <InfoRow label="User ID" value={user?.id} mono />
            <InfoRow label="Role" value={currentRole} />
            <InfoRow label="Email Confirmed" value={user?.email_confirmed_at ? '✓ Yes' : '✗ No'} />
            <InfoRow
              label="Last Sign In"
              value={user?.last_sign_in_at
                ? new Date(user.last_sign_in_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                : null}
            />
            <InfoRow
              label="Account Created"
              value={user?.created_at
                ? new Date(user.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                : null}
            />
          </div>
        </Section>

        {/* ── Danger Zone */}
        <Section icon={AlertTriangle} title="Danger Zone" subtitle="These actions cannot be undone" accentColor="text-danger-fg">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-5 rounded-xl border border-subtle bg-surface-inset">
              <div>
                <p className="text-sm font-semibold text-primary">Sign Out</p>
                <p className="text-xs text-tertiary mt-0.5">End your current session and return to login.</p>
              </div>
              <button
                onClick={async () => { await signOut(); }}
                className="btn-secondary h-10 px-5 hover:border-danger-border hover:text-danger-fg hover:bg-danger-bg transition-all"
              >
                <LogOut size={15} />Sign Out
              </button>
            </div>
            <div className="flex items-center justify-between p-5 rounded-xl border border-subtle bg-surface-inset">
              <div>
                <p className="text-sm font-semibold text-primary">Force Session Reset</p>
                <p className="text-xs text-tertiary mt-0.5">Clears all local auth data. Use if stuck in a redirect loop.</p>
              </div>
              <button
                onClick={() => { localStorage.clear(); sessionStorage.clear(); window.location.href = '/login'; }}
                className="btn-secondary h-10 px-5 hover:border-danger-border hover:text-danger-fg hover:bg-danger-bg transition-all"
              >
                <RefreshCcw size={15} />Reset
              </button>
            </div>
          </div>
        </Section>

      </div>

      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  );
}
