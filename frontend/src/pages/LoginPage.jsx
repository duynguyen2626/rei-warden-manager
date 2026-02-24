import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Key,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  HelpCircle,
  Terminal,
  CloudLightning
} from 'lucide-react';
import { login } from '../api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/Card';

export default function LoginPage() {
  const [secretKey, setSecretKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/status')
      .then(r => r.json())
      .then(data => {
        if (data.dev_mode) setDevMode(true);
      })
      .catch(() => { });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(secretKey);
      localStorage.setItem('rei_token', data.token);

      if (data.isFirstLogin) {
        navigate('/settings?forceChange=true');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Access Denied: Invalid Secret Key');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Blur */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-blue-600/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-indigo-600/20 rounded-full blur-[120px]" />

      <div className="w-full max-w-[420px] relative z-10 animate-in fade-in zoom-in-95 duration-700">
        <div className="text-center mb-10">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-2xl shadow-blue-500/40 mb-6 rotate-3">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">REI-WARDEN</h1>
          <p className="text-slate-400 font-medium">Enterprise Backup Management</p>
        </div>

        <Card className="border-slate-800 bg-slate-950/50 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-1 pb-8">
            <CardTitle className="text-xl font-bold">Secure Access</CardTitle>
            <CardDescription className="text-slate-500 text-sm">
              Please enter your unique secret key to authorization.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-300">Secret Key</label>
                    <Link to="/forgot-password" title="Get help with your key" className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1">
                      <HelpCircle className="w-3 h-3" />
                      Help?
                    </Link>
                  </div>
                  <div className="relative group">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                      type={showKey ? "text" : "password"}
                      value={secretKey}
                      onChange={(e) => setSecretKey(e.target.value)}
                      placeholder="••••••••••••"
                      className="pl-10 h-12 bg-slate-900/50 border-slate-800 placeholder:text-slate-700"
                      required
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors"
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                    <p className="text-xs font-bold text-red-200">{error}</p>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                variant="premium"
                className="w-full h-12 text-sm font-black tracking-widest uppercase"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <CloudLightning className="w-5 h-5 mr-2" />
                )}
                {loading ? "Authenticating" : "Authorize Session"}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col border-t border-slate-800/50 pt-6 mt-2">
            {devMode && (
              <div className="w-full p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-3">
                <Terminal className="w-4 h-4 text-emerald-500" />
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                  Dev Mode Active: <span className="text-emerald-400">Thanhnam0</span>
                </div>
              </div>
            )}
            <p className="text-[10px] text-slate-600 mt-6 text-center">
              © {new Date().getFullYear()} REI-WARDEN. Protected by end-to-end encryption.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
