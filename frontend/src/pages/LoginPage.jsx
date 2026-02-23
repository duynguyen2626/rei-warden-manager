import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, getStatus } from '../api';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const navigate = useNavigate();

  // Check if in dev mode on mount
  useEffect(() => {
    fetch((import.meta.env.VITE_API_URL || '') + '/api/status')
      .then(r => r.json())
      .then(data => {
        if (data.dev_mode) {
          setDevMode(true);
          handleBypassLogin();
        }
      })
      .catch(() => {});
  }, []);

  async function handleBypassLogin() {
    setLoading(true);
    try {
      const data = await login('admin');
      localStorage.setItem('rei_token', data.token);
      navigate('/');
    } catch (err) {
      setError(`Dev bypass failed: ${err.message}`);
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setShowErrorDetails(false);
    setLoading(true);
    try {
      const data = await login(password);
      localStorage.setItem('rei_token', data.token);
      navigate('/');
    } catch (err) {
      const errorMsg = err.message || 'Login failed';
      setError(errorMsg);
      if (devMode) {
        setShowErrorDetails(true);
      }
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  }

  const isDev = devMode;

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-4xl mb-2">🛡️</h1>
          <h2 className="text-2xl font-bold text-white">Rei-Warden Backup Manager</h2>
          <p className="text-gray-400 mt-1 text-sm">Enter your password to continue</p>
          {isDev && (
            <p className="text-yellow-400 text-xs mt-2">🚀 Development Mode - Attempting auto-login</p>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-xl"
        >
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter password"
                autoFocus
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 focus:outline-none"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                    <path d="M15.171 13.576l1.414 1.414a1 1 0 001.414-1.414l-1.414-1.414M9.822 9.822l3.354 3.354a2 2 0 01-3.354-3.354z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4">
              <div className="p-3 bg-red-900 border border-red-700 rounded-lg">
                <p className="text-red-300 text-sm font-medium">❌ {error}</p>
                {isDev && showErrorDetails && (
                  <details className="mt-2 text-xs text-red-200 cursor-pointer">
                    <summary className="font-medium">Backend Response</summary>
                    <pre className="mt-1 p-2 bg-red-950 rounded text-red-100 overflow-auto max-h-32 whitespace-pre-wrap break-words">
                      Check browser console for details (F12)
                    </pre>
                  </details>
                )}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>

          {isDev && (
            <p className="text-xs text-gray-500 mt-3 text-center">
              Development Mode - Try: admin
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
