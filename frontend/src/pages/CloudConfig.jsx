import { useState, useEffect } from 'react';
import { getRemotes, addRemote, deleteRemote, testRemote } from '../api';

const REMOTE_TYPES = ['Google Drive', 'Dropbox', 'OneDrive'];

const SETUP_GUIDES = {
  'Google Drive': [
    'Go to Google Cloud Console → Create a project → Enable "Google Drive API".',
    'Under "Credentials" → Create OAuth 2.0 Client ID (Desktop app) → copy Client ID and Secret.',
    'Run `rclone authorize "drive" --client-id YOUR_ID --client-secret YOUR_SECRET` locally to get the OAuth token JSON.',
    'Paste Client ID, Client Secret, and the token JSON below.',
  ],
  'Dropbox': [
    'Optional: Go to Dropbox Developers → Create a new app (Full Dropbox access) to get your own Client ID/Secret.',
    'Run `rclone authorize "dropbox"` locally. If you created an app, add `--client-id ID --client-secret SECRET`.',
    'Follow the browser login. Copy the ENTIRE JSON block (it contains the `refresh_token`) and paste it below.',
  ],
  'OneDrive': [
    'Go to Azure Portal → App Registrations → New registration (Accounts in any org directory).',
    'Under "API permissions" add Microsoft Graph → Files.ReadWrite.All (delegated).',
    'Under "Certificates & secrets" → New client secret → copy the Client ID and Secret.',
    'Run `rclone authorize "onedrive" --client-id CLIENT_ID --client-secret CLIENT_SECRET` locally.',
    'Paste Client ID, Client Secret, and optionally the Tenant ID below.',
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

  const inputCls =
    'w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm';
  const labelCls = 'block text-sm font-medium text-gray-300 mb-1';

  return (
    <div className="p-6 max-w-3xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Cloud Config</h2>
        <button
          onClick={() => { cancelEdit(); window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); }}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors"
        >
          + Add New Remote
        </button>
      </div>

      {/* Existing Remotes */}
      <div className="space-y-4 mb-10">
        {remotes.length === 0 ? (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 text-center text-gray-500 text-sm">
            No remotes configured yet.
          </div>
        ) : (
          remotes.map((remote) => (
            <div key={remote.name} className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 bg-gray-800/50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold">{remote.name}</span>
                    <span className="px-2 py-0.5 bg-gray-700 text-gray-300 text-[10px] uppercase font-bold rounded">
                      {remote.type}
                    </span>
                  </div>
                  {remote.folder && (
                    <div className="text-gray-500 text-xs mt-0.5">📂 {remote.folder}</div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleTest(remote.name)}
                    disabled={testing[remote.name]}
                    className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {testing[remote.name] ? 'Testing…' : '⚡ Test'}
                  </button>
                  <button
                    onClick={() => handleEdit(remote)}
                    className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(remote.name)}
                    className="text-xs bg-red-900/30 hover:bg-red-900/60 text-red-400 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {testResults[remote.name] && (
                <div className="px-5 py-4 border-t border-gray-700 bg-gray-950/50">
                  <div className={`flex items-center gap-2 mb-3 text-sm font-bold ${testResults[remote.name].success ? 'text-green-400' : 'text-red-400'}`}>
                    {testResults[remote.name].success ? '✅ FULL TEST PASSED' : '❌ TEST FAILED'}
                  </div>
                  <pre className="text-[10px] font-mono bg-black/60 p-4 rounded-xl text-blue-300 overflow-x-auto whitespace-pre-wrap leading-relaxed border border-blue-900/30 shadow-inner">
                    {testResults[remote.name]?.console || "No logs captured."}
                  </pre>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Remote Form */}
      <div id="remote-form" className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-6">
          {editingName ? `Edit Remote: ${editingName}` : 'Add New Remote'}
        </h3>

        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-xl text-red-400 text-xs">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-900/20 border border-green-800 rounded-xl text-green-400 text-xs text-center font-bold">
            {success}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelCls}>Remote Name</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className={inputCls}
                placeholder="e.g. dropbox_backups"
                required
                disabled={!!editingName}
              />
            </div>
            <div>
              <label className={labelCls}>Source Type</label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className={inputCls}
              >
                {REMOTE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Setup Guide Accordion */}
          <div className="bg-blue-900/10 border border-blue-900/30 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setGuideOpen((o) => !o)}
              className="w-full flex items-center justify-between px-4 py-2 text-blue-300 text-[10px] font-bold tracking-wider hover:bg-blue-900/20 transition-colors uppercase"
            >
              <span>Setup Guide: {form.type}</span>
              <span>{guideOpen ? '▲' : '▼'}</span>
            </button>
            {guideOpen && (
              <div className="px-5 py-4 border-t border-blue-900/10 text-blue-300/70 text-[11px] leading-relaxed">
                <ol className="list-decimal list-inside space-y-2">
                  {(SETUP_GUIDES[form.type] || []).map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          {form.type === 'Google Drive' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelCls}>Client ID</label>
                  <input name="clientId" value={form.clientId} onChange={handleChange} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Client Secret</label>
                  <input name="clientSecret" value={form.clientSecret} onChange={handleChange} className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>OAuth Token (JSON)</label>
                <textarea name="token" value={form.token} onChange={handleChange} className={inputCls + ' font-mono text-xs'} rows="3" />
              </div>
            </>
          )}

          {form.type === 'Dropbox' && (
            <div>
              <label className={labelCls}>Token JSON (from rclone authorize dropbox)</label>
              <textarea name="token" value={form.token} onChange={handleChange} className={inputCls + ' font-mono text-xs'} rows="4" required />
            </div>
          )}

          {form.type === 'OneDrive' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelCls}>Client ID</label>
                  <input name="clientId" value={form.clientId} onChange={handleChange} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Client Secret</label>
                  <input name="clientSecret" value={form.clientSecret} onChange={handleChange} className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>OAuth Token (JSON)</label>
                <textarea name="token" value={form.token} onChange={handleChange} className={inputCls + ' font-mono text-xs'} rows="3" />
              </div>
            </div>
          )}

          <div>
            <label className={labelCls}>Destination Folder</label>
            <input
              name="folder"
              value={form.folder}
              onChange={handleChange}
              className={inputCls}
              placeholder="/ReiWarden/Backups"
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-blue-900/20"
            >
              {saving ? 'Saving...' : editingName ? 'Update Configuration' : 'Save Remote'}
            </button>
            {editingName && (
              <button
                type="button"
                onClick={cancelEdit}
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-8 rounded-xl transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
