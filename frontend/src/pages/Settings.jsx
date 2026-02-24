import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  getRetention,
  saveRetention,
  changePassword,
  getTelegram,
  saveTelegram,
  testTelegram,
  getStatus
} from '../api';
import {
  Shield,
  Clock,
  Bell,
  Save,
  Send,
  Lock,
  Terminal,
  Info,
  CheckCircle,
  AlertCircle,
  Calendar,
  Loader2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'Retention', label: 'Retention', icon: Clock },
  { id: 'Security', label: 'Security', icon: Shield },
  { id: 'Notifications', label: 'Notifications', icon: Bell },
];

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function Settings() {
  const query = useQuery();
  const forceChange = query.get('forceChange') === 'true';
  const [activeTab, setActiveTab] = useState(forceChange ? 'Security' : 'Retention');
  const [devMode, setDevMode] = useState(false);

  // Retention
  const [days, setDays] = useState(30);
  const [cron, setCron] = useState('');
  const [retentionError, setRetentionError] = useState('');
  const [retentionSuccess, setRetentionSuccess] = useState('');
  const [savingRetention, setSavingRetention] = useState(false);

  // Security
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityError, setSecurityError] = useState('');
  const [securitySuccess, setSecuritySuccess] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Notifications
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [tgEnabled, setTgEnabled] = useState(false);
  const [tgError, setTgError] = useState('');
  const [tgSuccess, setTgSuccess] = useState('');
  const [savingTg, setSavingTg] = useState(false);
  const [testingTg, setTestingTg] = useState(false);

  useEffect(() => {
    getRetention()
      .then((data) => {
        setDays(data.days ?? 30);
        setCron(data.cron ?? '');
      })
      .catch(() => { });
    getTelegram()
      .then((data) => {
        setChatId(data.chatId || '');
        setTgEnabled(data.enabled || false);
      })
      .catch(() => { });
    getStatus()
      .then((data) => {
        setDevMode(data.dev_mode || false);
      })
      .catch(() => { });
  }, []);

  async function handleSaveRetention(e) {
    if (e) e.preventDefault();
    setRetentionError('');
    setRetentionSuccess('');
    setSavingRetention(true);
    try {
      await saveRetention({ days: Number(days), cron });
      setRetentionSuccess('Retention policy updated');
    } catch (err) {
      setRetentionError(err.message || 'Failed to update retention');
    } finally {
      setSavingRetention(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setSecurityError('');
    setSecuritySuccess('');
    if (newPassword !== confirmPassword) {
      setSecurityError('Secrets do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setSecurityError('Secret must be at least 8 characters.');
      return;
    }
    setSavingPassword(true);
    try {
      await changePassword({ newPassword });
      setSecuritySuccess('Secret Key changed successfully');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setSecurityError(err.message || 'Failed to update Secret');
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleSaveTelegram(e) {
    e.preventDefault();
    setTgError('');
    setTgSuccess('');
    setSavingTg(true);
    try {
      const data = await saveTelegram({ botToken, chatId });
      setTgSuccess('Notification settings saved');
      setTgEnabled(data.enabled || false);
      setBotToken('');
    } catch (err) {
      setTgError(err.message || 'Failed to save settings');
    } finally {
      setSavingTg(false);
    }
  }

  async function handleTestTelegram() {
    setTgError('');
    setTgSuccess('');
    setTestingTg(true);
    try {
      await testTelegram();
      setTgSuccess('Test message sent successfully');
    } catch (err) {
      setTgError(err.message || 'Connection test failed');
    } finally {
      setTestingTg(false);
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">System Settings</h2>
          <p className="text-slate-400 mt-1">Global preferences and security configuration.</p>
        </div>
        {devMode && <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-amber-500/20 px-3 py-1">DEVELOPMENT MODE</Badge>}
      </div>

      {forceChange && (
        <div className="bg-blue-600/10 border border-blue-600/20 p-6 rounded-2xl flex items-center gap-4 text-blue-200 shadow-xl shadow-blue-900/10 animate-pulse border-l-4 border-l-blue-500">
          <Lock className="w-8 h-8 shrink-0 text-blue-400" />
          <div>
            <p className="font-black uppercase tracking-widest text-[11px] mb-1">Mandatory Action Required</p>
            <p className="text-sm">You are currently using the default system secret. For security reasons, you must establish a new private secret key before proceeding.</p>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-8">
        {/* Navigation Sidebar */}
        <div className="w-full md:w-64 shrink-0 space-y-2">
          {!forceChange && TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 border",
                activeTab === tab.id
                  ? "bg-slate-900 border-slate-700 text-white shadow-lg"
                  : "bg-transparent border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/50"
              )}
            >
              <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-blue-500" : "text-slate-600")} />
              {tab.label}
              {activeTab === tab.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />}
            </button>
          ))}
          {forceChange && (
            <div className="px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white shadow-lg flex items-center gap-3 text-sm font-medium">
              <Shield className="w-4 h-4 text-blue-500" />
              Security First
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-6 animate-in slide-in-from-right-4 duration-300">
          {activeTab === 'Retention' && (
            <Card className="border-slate-800">
              <CardHeader>
                <CardTitle>Storage Polices</CardTitle>
                <CardDescription>Configure how long local backups are retained and automate schedules.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      Retention Cycle
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={days}
                        onChange={(e) => setDays(e.target.value)}
                        className="h-11 bg-slate-900 border-slate-800 pl-4 pr-12 text-sm"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-600 uppercase">Days</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      Automation Schedule
                    </label>
                    <Input
                      placeholder="0 2 * * *"
                      value={cron}
                      onChange={(e) => setCron(e.target.value)}
                      className="h-11 bg-slate-900 border-slate-800 font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex gap-3">
                  <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-400 leading-relaxed">
                    Local archives older than <span className="text-blue-200 font-bold">{days} days</span> are purged automatically.
                    The cron expression <code className="bg-slate-900 px-1 rounded text-emerald-400">{cron || "disabled"}</code> {cron ? "is currently active." : "is not configured."}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-900">
                  {retentionSuccess ? (
                    <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold animate-in fade-in">
                      <CheckCircle className="w-4 h-4" />
                      Settings Purged
                    </div>
                  ) : <div></div>}
                  <Button onClick={handleSaveRetention} disabled={savingRetention} variant="premium" className="px-8 flex-1 md:flex-none">
                    {savingRetention ? "Saving Changes" : "Save Policies"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'Security' && (
            <Card className="border-slate-800">
              <CardHeader>
                <CardTitle>System Key Management</CardTitle>
                <CardDescription>Update the master secret used to authorize management sessions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleChangePassword} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-300">New Secret Identifier</label>
                      <Input
                        type="password"
                        placeholder="minimum 8 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="h-11 bg-slate-900 border-slate-800"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-300">Verify Secret</label>
                      <Input
                        type="password"
                        placeholder="re-enter to confirm"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-11 bg-slate-900 border-slate-800"
                        required
                      />
                    </div>
                  </div>

                  {securityError && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold flex gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {securityError}
                    </div>
                  )}

                  {securitySuccess && (
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold flex gap-2 animate-bounce">
                      <CheckCircle className="w-4 h-4" />
                      {securitySuccess}
                    </div>
                  )}

                  <Button type="submit" variant="premium" className="w-full h-12 font-black uppercase tracking-widest text-[11px]" disabled={savingPassword}>
                    {savingPassword ? "Updating Encryption Context" : "Establish New Secret"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {activeTab === 'Notifications' && (
            <Card className="border-slate-800">
              <CardHeader>
                <CardTitle>Communication Channels</CardTitle>
                <CardDescription>Enable Telegram alerts for backup status notifications.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                    <Terminal className="w-5 h-5 text-blue-500" />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-300">Quick Integration</span>
                  </div>
                  <div className="text-xs text-slate-500 space-y-2 leading-relaxed italic">
                    1. Create a bot using BotFather → Obtain Token<br />
                    2. Use userinfobot to identify your Target Chat ID<br />
                    3. Map parameters below and execute verification test
                  </div>
                </div>

                <form onSubmit={handleSaveTelegram} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300">Bot Authorization Token</label>
                    <Input
                      type="password"
                      value={botToken}
                      onChange={(e) => setBotToken(e.target.value)}
                      placeholder={tgEnabled ? "•••••••••••• (Encrypted)" : "Enter API Token"}
                      className="h-11 bg-slate-900 border-slate-800"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300">Broadcast Chat ID</label>
                    <Input
                      type="text"
                      value={chatId}
                      onChange={(e) => setChatId(e.target.value)}
                      placeholder="e.g. -100123456789"
                      className="h-11 bg-slate-900 border-slate-800 font-mono"
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button type="submit" variant="premium" className="flex-1" disabled={savingTg}>
                      {savingTg ? "Saving" : "Apply Config"}
                    </Button>
                    <Button type="button" variant="secondary" onClick={handleTestTelegram} disabled={testingTg || !tgEnabled} className="px-6 gap-2">
                      {testingTg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Run Diagnostic
                    </Button>
                  </div>

                  {tgSuccess && <p className="text-center text-xs text-emerald-400 font-bold">{tgSuccess}</p>}
                  {tgError && <p className="text-center text-xs text-red-400 font-bold">{tgError}</p>}
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
