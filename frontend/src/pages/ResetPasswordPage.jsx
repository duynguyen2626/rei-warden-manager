import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../api';
import {
    ShieldAlert,
    Lock,
    CheckCircle,
    AlertCircle,
    Loader2,
    Zap
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    useEffect(() => {
        if (!token) {
            setError('The security token is missing or has expired.');
        }
    }, [token]);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!token) return;
        setError('');

        if (password !== confirmPassword) {
            setError('Secret keys do not match. Please verify.');
            return;
        }

        setLoading(true);
        try {
            await resetPassword(token, password);
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.message || 'The reset operation failed. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decorative Blur */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[150px]" />

            <div className="w-full max-w-[420px] relative z-10 animate-in fade-in zoom-in-95 duration-500">
                <Card className="border-slate-800 bg-slate-950/50 backdrop-blur-xl shadow-2xl overflow-hidden">
                    <div className="h-1.5 w-full bg-blue-600" />
                    <CardHeader className="text-center pt-8">
                        <div className="mx-auto w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center mb-4">
                            <ShieldAlert className="w-6 h-6 text-blue-500" />
                        </div>
                        <CardTitle className="text-2xl font-bold">New Secret Key</CardTitle>
                        <CardDescription>
                            Establish your new master authorization key.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-300">Master Secret</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <Input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="pl-10 h-11 bg-slate-900 border-slate-800"
                                            placeholder="••••••••••••"
                                            required
                                            disabled={!!error || success}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-300">Confirm Secret</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <Input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="pl-10 h-11 bg-slate-900 border-slate-800"
                                            placeholder="••••••••••••"
                                            required
                                            disabled={!!error || success}
                                        />
                                    </div>
                                </div>
                            </div>

                            {success && (
                                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 animate-bounce">
                                    <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                                    <p className="text-xs font-bold text-emerald-200">Reset Complete. Redirecting...</p>
                                </div>
                            )}

                            {error && (
                                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 animate-in shake">
                                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                                    <p className="text-xs font-bold text-red-200">{error}</p>
                                </div>
                            )}

                            {!success && (
                                <Button type="submit" variant="premium" className="w-full h-11" disabled={loading || !!error}>
                                    {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                    <Zap className="w-4 h-4 mr-2" />
                                    {loading ? "Re-Encrypting" : "Update Profile Key"}
                                </Button>
                            )}
                        </form>
                    </CardContent>
                </Card>

                <p className="text-center text-[10px] text-slate-600 mt-8 uppercase font-black tracking-widest">
                    REI-WARDEN High Priority Operation
                </p>
            </div>
        </div>
    );
}
