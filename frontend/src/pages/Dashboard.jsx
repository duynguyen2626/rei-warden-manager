import { useState, useEffect, useCallback } from 'react';
import {
  Play,
  History,
  HardDrive,
  Database,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  FileArchive,
  Clock,
  ExternalLink
} from 'lucide-react';
import { getStatus, runBackup, getBackupHistory, getDiskSpace } from '../api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

function formatDate(ts) {
  if (!ts) return 'Never';
  return new Date(ts).toLocaleString();
}

function formatBytes(bytes) {
  if (bytes == null || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export default function Dashboard() {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [history, setHistory] = useState([]);
  const [disk, setDisk] = useState(null);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await getStatus();
      setStatus(data);
      if (data.is_running) {
        setProgress((prev) => Math.min(prev + 10, 90));
      } else {
        setProgress(data.status === 'success' ? 100 : 0);
      }
    } catch {
      setError('Failed to fetch status');
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const data = await getBackupHistory();
      setHistory(data.history || []);
    } catch (e) { void e; }
  }, []);

  const fetchDisk = useCallback(async () => {
    try {
      const data = await getDiskSpace();
      setDisk(data);
    } catch (e) { void e; }
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchHistory();
    fetchDisk();
    const interval = setInterval(() => { fetchStatus(); fetchHistory(); }, 5000);
    const diskInterval = setInterval(fetchDisk, 30000);
    return () => { clearInterval(interval); clearInterval(diskInterval); };
  }, [fetchStatus, fetchHistory, fetchDisk]);

  useEffect(() => {
    if (!status?.is_running) return;
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, [status?.is_running, fetchStatus]);

  async function handleRunBackup() {
    setError('');
    setRunning(true);
    setProgress(5);
    try {
      await runBackup();
      await fetchStatus();
    } catch (err) {
      setError(err.message || 'Failed to start backup');
    } finally {
      setRunning(false);
    }
  }

  const isRunning = running || status?.is_running;
  const diskPercent = disk && disk.total > 0 ? Math.round((disk.used / disk.total) * 100) : null;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">System Overview</h2>
          <p className="text-slate-400 mt-1">Manage and monitor your Vaultwarden backups.</p>
        </div>
        <Button
          variant="premium"
          size="lg"
          onClick={handleRunBackup}
          disabled={isRunning}
          className="h-12 px-8"
        >
          {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
          {isRunning ? "Backup in Progress" : "Run Manual Backup"}
        </Button>
      </div>

      {status?.dev_mode && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-center gap-4 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.05)]">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="font-bold">Development Mode Active</p>
            <p className="text-sm opacity-80">Rclone commands are being mocked for local development testing.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-200">
          <XCircle className="w-5 h-5 text-red-500" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="group hover:border-blue-500/30 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Memory Status</CardTitle>
            <Database className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatBytes(status?.storage_used)}</div>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">Local Staging Size</p>
          </CardContent>
        </Card>

        <Card className="group hover:border-blue-500/30 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Last Backup Run</CardTitle>
            <Clock className="w-4 h-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white whitespace-nowrap overflow-hidden text-ellipsis">
              {formatDate(status?.last_backup)}
            </div>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">Completion Timestamp</p>
          </CardContent>
        </Card>

        <Card className="group hover:border-blue-500/30 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Current Status</CardTitle>
            {isRunning ? (
              <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
            ) : status?.status === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-white">
                {isRunning ? "Running" : (status?.status || "Idle")}
              </div>
              <Badge variant={isRunning ? "outline" : (status?.status === 'success' ? "success" : "destructive")} className="h-5">
                {isRunning ? "LIVE" : "READY"}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider line-clamp-1">
              {status?.last_message || "System standby"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Disk Usage */}
        <Card className="h-full">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                <HardDrive className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <CardTitle>Storage Health</CardTitle>
                <CardDescription>Disk space on the local manager system</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400 font-medium">Utilization Rate</span>
                <span className={cn(
                  "font-bold",
                  diskPercent > 90 ? "text-red-400" : diskPercent > 70 ? "text-amber-400" : "text-emerald-400"
                )}>{diskPercent || 0}%</span>
              </div>
              <div className="h-4 bg-slate-900 rounded-full overflow-hidden p-1 border border-slate-800">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-1000 bg-gradient-to-r",
                    diskPercent > 90 ? "from-red-600 to-red-400" : "from-blue-600 to-indigo-400"
                  )}
                  style={{ width: `${diskPercent || 0}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-center">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Total</p>
                <p className="text-sm font-bold text-slate-200">{formatBytes(disk?.total)}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-center">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Used</p>
                <p className="text-sm font-bold text-slate-200">{formatBytes(disk?.used)}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-center">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Free</p>
                <p className="text-sm font-bold text-slate-200">{formatBytes(disk?.available)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Bar (Visible Only when running) */}
        {isRunning && (
          <Card className="h-full border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.1)]">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                </div>
                <div>
                  <CardTitle>Backup Progress</CardTitle>
                  <CardDescription>Compressing and uploading archive...</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 flex flex-col justify-center min-h-[140px]">
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-slate-400 text-sm">Task Completion</span>
                  <span className="text-3xl font-black text-blue-400 tracking-tighter">{progress}%</span>
                </div>
                <div className="h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!isRunning && history.length > 0 && (
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                  <History className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest backup operation summary</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Last Archive:</span>
                  <span className="text-slate-200 font-mono truncate max-w-[200px]">{history[0].fileName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Compressed Size:</span>
                  <span className="text-slate-200 font-bold">{formatBytes(history[0].fileSize)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Destination:</span>
                  <div className="flex gap-1">
                    {(history[0].destinations || []).map(d => (
                      <Badge key={d} variant="outline" className="text-[10px] py-0">{d}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* History Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
              <History className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <CardTitle>Execution Logs</CardTitle>
              <CardDescription>Complete history of backup attempts</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="py-12 text-center space-y-2 opacity-50">
              <FileArchive className="w-12 h-12 mx-auto text-slate-600" />
              <p>No activity records found.</p>
            </div>
          ) : (
            <div className="relative overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-900/50 text-slate-500 uppercase text-[10px] font-bold tracking-widest border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Timestamp</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Archive Details</th>
                    <th className="px-6 py-4">Duration</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {history.map((h, i) => (
                    <tr key={i} className="group hover:bg-slate-900/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-slate-300 font-medium">
                        {formatDate(h.timestamp)}
                      </td>
                      <td className="px-6 py-4">
                        {h.status === 'success' ? (
                          <div className="flex items-center gap-2 text-emerald-400">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Success</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-red-400">
                            <XCircle className="w-4 h-4" />
                            <span>Failed</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-slate-100 font-mono text-xs mb-1 truncate max-w-[200px]" title={h.fileName}>
                            {h.fileName || "—"}
                          </span>
                          <span className="text-slate-500 text-[11px]">
                            {h.fileSize ? formatBytes(h.fileSize) : "Unknown size"} &middot; {(h.destinations || []).join(', ') || 'Local Only'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {h.duration != null ? `${h.duration}s` : '—'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigate('/logs')}>
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
