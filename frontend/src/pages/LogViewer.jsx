import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Terminal,
  RefreshCw,
  Settings2,
  Download,
  Trash2,
  ChevronDown,
  Activity,
  Zap,
  Loader2
} from 'lucide-react';
import { getLogs, getStatus } from '../api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

const LINE_OPTIONS = [100, 200, 500];

export default function LogViewer() {
  const [logs, setLogs] = useState([]);
  const [lines, setLines] = useState(200);
  const [error, setError] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const bottomRef = useRef(null);

  const fetchLogs = useCallback(async () => {
    try {
      const data = await getLogs(lines);
      setLogs(data.logs || []);
    } catch {
      setError('Failed to fetch logs');
    }
  }, [lines]);

  async function checkRunning() {
    try {
      const data = await getStatus();
      setIsRunning(data.is_running === true);
    } catch { }
  }

  useEffect(() => {
    fetchLogs();
    checkRunning();
  }, [fetchLogs]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      fetchLogs();
      checkRunning();
    }, 3000);
    return () => clearInterval(interval);
  }, [isRunning, fetchLogs]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  function getLogColor(line) {
    if (line.includes('[ERROR]') || line.includes('❌') || line.includes('Failed')) return 'text-red-400';
    if (line.includes('[WARN]') || line.includes('⚠️')) return 'text-amber-400';
    if (line.includes('[INFO]') || line.includes('ℹ️')) return 'text-blue-400';
    if (line.includes('Success') || line.includes('✅')) return 'text-emerald-400';
    return 'text-white/80';
  }

  return (
    <div className="p-8 max-w-6xl mx-auto h-full flex flex-col space-y-6 animate-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Diagnostic Logs</h2>
          <p className="text-slate-400 mt-1">Real-time system activities and execution history.</p>
        </div>
        <div className="flex items-center gap-3">
          {isRunning && (
            <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 px-3 py-1 gap-2 border-l-4">
              <Activity className="w-3 h-3 animate-pulse" />
              LIVE STREAMING
            </Badge>
          )}

          <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-800">
            {LINE_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => setLines(n)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all",
                  lines === n ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"
                )}
              >
                {n}L
              </button>
            ))}
          </div>

          <Button variant="secondary" size="icon" className="h-10 w-10 rounded-xl" onClick={fetchLogs}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="flex-1 bg-black border-slate-800 shadow-2xl overflow-hidden flex flex-col min-h-[500px] relative">
        <div className="absolute top-0 left-0 right-0 h-10 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between z-10">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
          </div>
          <div className="flex items-center gap-2">
            <Terminal className="w-3 h-3 text-slate-500" />
            <span className="text-[10px] text-slate-500 font-mono tracking-tighter">system@rei-warden:~/logs</span>
          </div>
          <div className="w-12" />
        </div>

        <CardContent className="flex-1 overflow-auto p-0 scrollbar-thin mt-10">
          <div className="p-6 font-mono text-[13px] leading-relaxed selection:bg-blue-500/30">
            {logs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-20 py-40">
                <Terminal className="w-12 h-12" />
                <p className="text-sm">Empty environment. No execution logs detected.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {logs.map((line, i) => (
                  <div key={i} className="flex gap-4 group">
                    <span className="text-slate-800 select-none text-[10px] pt-1 w-8 text-right shrink-0">{i + 1}</span>
                    <div className={cn("whitespace-pre-wrap break-all transition-colors", getLogColor(line))}>
                      {line}
                    </div>
                  </div>
                ))}
                <div className="flex gap-4 animate-pulse">
                  <span className="text-slate-800 select-none text-[10px] pt-1 w-8 text-right shrink-0">{logs.length + 1}</span>
                  <div className="w-2 h-5 bg-blue-500/50" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </CardContent>

        {/* CRT Overlay Effect */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,128,0.02))] z-20" />
      </Card>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="flex justify-center gap-6">
        <div className="flex items-center gap-2 text-[10px] text-slate-600 font-bold uppercase tracking-widest">
          <span className="w-2 h-2 rounded-full bg-blue-500" /> INFO
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-600 font-bold uppercase tracking-widest">
          <span className="w-2 h-2 rounded-full bg-amber-500" /> WARN
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-600 font-bold uppercase tracking-widest">
          <span className="w-2 h-2 rounded-full bg-red-500" /> ERROR
        </div>
      </div>
    </div>
  );
}
