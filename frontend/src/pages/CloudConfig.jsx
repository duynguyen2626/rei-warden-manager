import { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Edit3,
  RefreshCw,
  FolderRoot,
  ShieldQuestion,
  ChevronDown,
  ChevronUp,
  Save,
  X,
  Zap,
  CheckCircle,
  AlertCircle,
  Terminal,
  Cloud,
  Loader2
} from 'lucide-react';
import { getRemotes, addRemote, deleteRemote, testRemote } from '../api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

const REMOTE_TYPES = ['Google Drive', 'Dropbox', 'OneDrive'];

const SETUP_GUIDES = {
  'Google Drive': [
    'Go to Google Cloud Console → Create a project → Enable "Google Drive API".',
    'Under "Credentials" → Create OAuth 2.0 Client ID (Desktop app).',
    'Run `rclone authorize "drive" --client-id YOUR_ID --client-secret YOUR_SECRET` locally.',
    'Paste Client ID, Secret, and the token JSON below.',
  ],
  'Dropbox': [
    'Run `rclone authorize "dropbox"` locally.',
    'Follow the browser login process.',
    'Copy the ENTIRE JSON block (containing the refresh_token) and paste it below.',
  ],
  'OneDrive': [
    'Go to Azure Portal → App Registrations → New registration.',
    'Add Microsoft Graph → Files.ReadWrite.All (delegated) permission.',
    'Run `rclone authorize "onedrive" --client-id CLIENT_ID --client-secret CLIENT_SECRET` locally.',
  ],
};

function emptyForm() {
  return {
    name: '',
    type: 'Google Drive',
    clientId: '',
    clientSecret: '',
    token: '',
    appKey: '',
    appSecret: '',
    tenant: '',
    folder: '',
  };
}

export default function CloudConfig() {
  const [remotes, setRemotes] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [editingName, setEditingName] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [testResults, setTestResults] = useState({});
  const [testing, setTesting] = useState({});
  const [guideOpen, setGuideOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function loadRemotes() {
    try {
      const data = await getRemotes();
      setRemotes(data.remotes || []);
    } catch { }
  }

  useEffect(() => { loadRemotes(); }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (name === 'type') setGuideOpen(false);
  }

  function handleEdit(remote) {
    setEditingName(remote.name);
    setForm({
      name: remote.name,
      type: remote.type,
      clientId: remote.credentials.clientId || '',
      clientSecret: remote.credentials.clientSecret || '',
      token: remote.credentials.token || '',
      appKey: remote.credentials.appKey || '',
      appSecret: remote.credentials.appSecret || '',
      tenant: remote.credentials.tenant || '',
      folder: remote.folder || '',
    });
    setGuideOpen(false);
    setError('');
    setSuccess('');
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }

  function cancelEdit() {
    setEditingName(null);
    setForm(emptyForm());
  }

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        type: form.type,
        folder: form.folder,
        credentials: {
          clientId: form.clientId,
          clientSecret: form.clientSecret,
          token: form.token,
          appKey: form.appKey,
          appSecret: form.appSecret,
          tenant: form.tenant,
        },
      };
      await addRemote(payload);
      setSuccess(editingName ? 'Remote updated successfully' : 'Remote added successfully');
      if (!editingName) setForm(emptyForm());
      setEditingName(null);
      setGuideOpen(false);
      await loadRemotes();
    } catch (err) {
      setError(err.message || 'Failed to save remote');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(name) {
    if (!window.confirm(`Delete remote "${name}"?`)) return;
    try {
      await deleteRemote(name);
      await loadRemotes();
    } catch (err) {
      setError(err.message || 'Failed to delete');
    }
  }

  async function handleTest(name) {
    setTesting((t) => ({ ...t, [name]: true }));
    setTestResults((r) => ({ ...r, [name]: null }));
    try {
      const res = await testRemote(name);
      setTestResults((r) => ({ ...r, [name]: res }));
    } catch (err) {
      setTestResults((r) => ({ ...r, [name]: { success: false, error: err.message, console: err.console } }));
    } finally {
      setTesting((t) => ({ ...t, [name]: false }));
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-10 animate-in slide-in-from-bottom-4 duration-500 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Cloud Strategy</h2>
          <p className="text-slate-400 mt-1">Configure your off-site backup destinations.</p>
        </div>
        <Button
          variant="premium"
          onClick={() => { cancelEdit(); document.getElementById('remote-form')?.scrollIntoView({ behavior: 'smooth' }); }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Remote
        </Button>
      </div>

      {remotes.length === 0 ? (
        <Card className="border-dashed border-slate-700 bg-transparent flex flex-col items-center justify-center py-20 opacity-60">
          <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center mb-6">
            <Cloud className="w-8 h-8 text-slate-500" />
          </div>
          <p className="text-slate-400 font-medium">No cloud remotes configured yet.</p>
          <p className="text-slate-600 text-sm mt-1">Click the button above to add your first destination.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {remotes.map((remote) => (
            <Card key={remote.name} className="group overflow-hidden border-slate-800 transition-all hover:bg-slate-900/40">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b border-slate-900">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Cloud className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold">{remote.name}</CardTitle>
                    <CardDescription className="text-[10px] uppercase font-bold tracking-wider text-slate-600">
                      {remote.type}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400" onClick={() => handleEdit(remote)}>
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500/50 hover:text-red-500 hover:bg-red-500/10" onClick={() => handleDelete(remote.name)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <FolderRoot className="w-3.5 h-3.5" />
                  <span className="truncate">{remote.folder || "Root Directory"}</span>
                </div>

                {testResults[remote.name] && (
                  <div className={cn(
                    "p-3 rounded-lg border text-[11px] font-mono",
                    testResults[remote.name].success
                      ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                      : "bg-red-500/5 border-red-500/20 text-red-400"
                  )}>
                    <div className="flex items-center gap-2 mb-2 font-bold uppercase tracking-wider">
                      {testResults[remote.name].success ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                      {testResults[remote.name].success ? "Connection Verified" : "Verification Failed"}
                    </div>
                    {testResults[remote.name].console && (
                      <div className="bg-black/40 p-2 rounded border border-white/5 overflow-x-auto max-h-[80px] scrollbar-thin">
                        {testResults[remote.name].console}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-0 justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-2 h-8"
                  onClick={() => handleTest(remote.name)}
                  disabled={testing[remote.name]}
                >
                  {testing[remote.name] ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                  {testing[remote.name] ? "Testing" : "Verify Connection"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Form Section */}
      <div id="remote-form" className="scroll-mt-8">
        <Card className="border-blue-500/20 shadow-[0_0_50px_rgba(59,130,246,0.1)]">
          <CardHeader>
            <CardTitle>{editingName ? `Edit ${editingName}` : "Register New Destination"}</CardTitle>
            <CardDescription>Enter the remote credentials and target location.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">Identifier Name</label>
                  <Input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. gdrive-offsite"
                    required
                    disabled={!!editingName}
                    className="h-11 bg-slate-900 border-slate-800"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">Provider Type</label>
                  <select
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    className="flex h-11 w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-white"
                  >
                    {REMOTE_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Guide */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setGuideOpen(!guideOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-slate-400 hover:bg-slate-900 transition-colors uppercase tracking-widest"
                >
                  <div className="flex items-center gap-2">
                    <ShieldQuestion className="w-4 h-4 text-blue-500" />
                    Configuration Guide
                  </div>
                  {guideOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {guideOpen && (
                  <div className="p-4 border-t border-slate-800 bg-slate-950 text-slate-400 text-sm space-y-2 animate-in slide-in-from-top-2 duration-300">
                    {(SETUP_GUIDES[form.type] || []).map((step, i) => (
                      <div key={i} className="flex gap-3">
                        <span className="text-blue-500 font-bold">{i + 1}.</span>
                        <span className="leading-relaxed">{step}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Conditional Inputs */}
              <div className="space-y-6 animate-in fade-in duration-300">
                {form.type === 'Google Drive' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-300">Client ID</label>
                        <Input name="clientId" value={form.clientId} onChange={handleChange} className="h-11 bg-slate-900 border-slate-800" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-300">Client Secret</label>
                        <Input name="clientSecret" value={form.clientSecret} onChange={handleChange} className="h-11 bg-slate-900 border-slate-800" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-300">OAuth Token JSON</label>
                      <textarea
                        name="token"
                        value={form.token}
                        onChange={handleChange}
                        className="w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-mono text-blue-300/80 focus:ring-1 focus:ring-blue-500 outline-none"
                        rows="4"
                      />
                    </div>
                  </div>
                )}

                {form.type === 'Dropbox' && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-slate-500" />
                      Rclone Token Output (JSON)
                    </label>
                    <textarea
                      name="token"
                      value={form.token}
                      onChange={handleChange}
                      className="w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-mono text-blue-300/80 focus:ring-1 focus:ring-blue-500 outline-none"
                      rows="6"
                      required
                      placeholder='{"access_token": "...", "token_type": "bearer", "refresh_token": "...", "expiry": "..."}'
                    />
                  </div>
                )}

                {form.type === 'OneDrive' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-300">Application (Client) ID</label>
                        <Input name="clientId" value={form.clientId} onChange={handleChange} className="h-11 bg-slate-900 border-slate-800" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-300">Client Secret</label>
                        <Input name="clientSecret" value={form.clientSecret} onChange={handleChange} className="h-11 bg-slate-900 border-slate-800" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-300">OAuth Connection JSON</label>
                      <textarea
                        name="token"
                        value={form.token}
                        onChange={handleChange}
                        className="w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-mono text-blue-300/80 focus:ring-1 focus:ring-blue-500 outline-none"
                        rows="4"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">Target Folder Path</label>
                  <Input
                    name="folder"
                    value={form.folder}
                    onChange={handleChange}
                    placeholder="/VaultwardenBackups"
                    required
                    className="h-11 bg-slate-900 border-slate-800 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" variant="premium" className="flex-1 h-12" disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  {editingName ? "Synchronize Changes" : "Create Cloud Remote"}
                </Button>
                {editingName && (
                  <Button type="button" variant="secondary" className="px-8 h-12" onClick={cancelEdit}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {success && (
        <div className="fixed bottom-8 right-8 bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-500 z-50">
          <CheckCircle className="w-5 h-5" />
          <span className="font-bold">{success}</span>
        </div>
      )}
    </div>
  );
}
