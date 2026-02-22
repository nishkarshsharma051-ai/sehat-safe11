import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Heart, Mail, Lock, User, ArrowRight, Sun, Moon, ArrowLeft } from 'lucide-react';

interface LoginProps {
    selectedRole?: 'patient' | 'doctor' | 'admin';
    onBack?: () => void;
}

export default function Login({ selectedRole, onBack }: LoginProps) {
    const { signInWithGoogle, signInWithEmail, signInWithBackend, signUpWithEmail } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const [isSignUp, setIsSignUp] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleGoogleSignIn = async () => {
        try {
            setError('');
            await signInWithGoogle();
        } catch (err) {
            setError((err as Error).message || 'Failed to sign in with Google');
        }
    };

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isSignUp) {
                if (password.length < 6) {
                    setError('Password must be at least 6 characters');
                    setLoading(false);
                    return;
                }
                await signUpWithEmail(email, password, name);
            } else {
                // Try backend login first
                const success = await signInWithBackend(email, password);
                if (!success) {
                    await signInWithEmail(email, password);
                }
            }
        } catch (err) {
            const authError = err as { code?: string; message: string };
            if (authError.code === 'auth/email-already-in-use') {
                setError('An account with this email already exists');
            } else if (authError.code === 'auth/invalid-credential') {
                setError('Invalid email or password');
            } else if (authError.code === 'auth/weak-password') {
                setError('Password must be at least 6 characters');
            } else {
                setError(authError.message || 'Authentication failed');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative">
            {onBack && (
                <button
                    onClick={onBack}
                    className="absolute top-6 left-6 p-2.5 rounded-xl bg-white/50 dark:bg-white/10 hover:bg-white/70 dark:hover:bg-white/20 transition-all duration-300 flex items-center space-x-2 text-gray-700 dark:text-gray-300 font-medium"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="hidden md:inline">Back</span>
                </button>
            )}

            <button
                onClick={toggleTheme}
                className="absolute top-6 right-6 p-2.5 rounded-xl bg-white/50 dark:bg-white/10 hover:bg-white/70 dark:hover:bg-white/20 transition-all duration-300"
                aria-label="Toggle theme"
            >
                {isDark ? <Sun className="w-5 h-5 text-yellow-500 theme-toggle-icon" /> : <Moon className="w-5 h-5 text-slate-700 theme-toggle-icon" />}
            </button>
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center mb-4">
                        <div className="bg-gradient-to-br from-blue-500 to-green-500 p-4 rounded-2xl shadow-lg">
                            <Heart className="w-10 h-10 text-white" fill="white" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                        Sehat Safe
                    </h1>
                    <p className="text-gray-600 mt-2 text-lg">
                        {selectedRole ? `${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Login` : 'Your Digital Health Wallet'}
                    </p>
                </div>

                <div className="backdrop-blur-lg bg-white/70 rounded-3xl shadow-2xl p-8 border border-white/20">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center capitalize">
                        {isSignUp ? `Create ${selectedRole || ''} Account` : `Welcome Back ${selectedRole ? selectedRole : ''}`}
                    </h2>
                    <p className="text-gray-500 text-center mb-6">
                        {isSignUp ? 'Sign up to get started' : 'Sign in to access your dashboard'}
                    </p>

                    {error && (
                        <div className="mb-4 p-3 bg-red-100/80 border border-red-200 text-red-700 rounded-xl text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleEmailSubmit} className="space-y-4">
                        {isSignUp && (
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                                />
                            </div>
                        )}

                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="email"
                                placeholder="Email Address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                            />
                        </div>

                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-xl font-medium hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span>{loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}</span>
                            {!loading && <ArrowRight className="w-4 h-4" />}
                        </button>
                    </form>

                    <div className="my-6 flex items-center">
                        <div className="flex-1 border-t border-gray-200"></div>
                        <span className="px-4 text-sm text-gray-400">or</span>
                        <div className="flex-1 border-t border-gray-200"></div>
                    </div>

                    <button
                        onClick={handleGoogleSignIn}
                        className="w-full flex items-center justify-center space-x-3 py-3 px-4 bg-white border-2 border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:shadow-lg hover:scale-[1.02] transition-all"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        <span>Sign in with Google</span>
                    </button>

                    <div className="mt-6 text-center">
                        <p className="text-gray-600">
                            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                            <button
                                onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
                                className="text-blue-600 hover:text-blue-700 font-medium"
                            >
                                {isSignUp ? 'Sign In' : 'Sign Up'}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
