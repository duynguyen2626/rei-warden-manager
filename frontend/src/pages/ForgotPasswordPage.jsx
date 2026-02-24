import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Key,
    Mail,
    ArrowLeft,
    CheckCircle,
    AlertCircle,
    Loader2,
    ShieldCheck
} from 'lucide-react';
import { forgotPassword } from '../api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);
        try {
            const data = await forgotPassword(email);
            setMessage(data.message);
        } catch (err) {
            setError(err.message || 'Failed to request reset link');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decorative Blur */}
            <div className="absolute top-1/4 -right-20 w-80 h-80 bg-blue-600/10 rounded-full blur-[120px]" />

            <div className="w-full max-w-[420px] relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card className="border-slate-800 bg-slate-950/50 backdrop-blur-xl shadow-2xl">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center mb-4">
                            <Key className="w-6 h-6 text-blue-500" />
                        </div>
                        <CardTitle className="text-2xl font-bold">Secret Retrieval</CardTitle>
                        <CardDescription>
                            Enter your recovery email to reset your master secret.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-300">Recovery Email</label>
                                <div className="relative group">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                                    <Input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10 h-11 bg-slate-900 border-slate-800"
                                        placeholder="your@email.com"
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {message && (
                                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 animate-in zoom-in-95">
                                    <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                                    <p className="text-xs font-bold text-emerald-200">{message}</p>
                                </div>
                            )}

                            {error && (
                                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                                    <p className="text-xs font-bold text-red-200">{error}</p>
                                </div>
                            )}

                            <Button type="submit" variant="premium" className="w-full h-11" disabled={loading}>
                                {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                {loading ? "Processing Request" : "Send Recovery Link"}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="justify-center border-t border-slate-800/50 pt-6">
                        <Link to="/login" className="flex items-center gap-2 text-sm text-slate-500 hover:text-white transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                            Return to Login
                        </Link>
                    </CardFooter>
                </Card>

                <p className="text-center text-[10px] text-slate-600 mt-8 uppercase font-black tracking-widest">
                    REI-WARDEN Security Protocol
                </p>
            </div>
        </div>
    );
}
