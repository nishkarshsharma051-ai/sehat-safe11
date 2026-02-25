import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
    User,
    onAuthStateChanged,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile,
    signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { API_BASE_URL } from '../config';

interface BackendUser {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
    role?: string;
    isBackend?: boolean;
    token?: string;
}

interface AuthContextType {
    user: User | BackendUser | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    signInWithBackend: (email: string, password: string) => Promise<boolean>;
    signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
    logout: () => Promise<void>;
    token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | BackendUser | null>(() => {
        const storedUser = localStorage.getItem('backend_user');
        return storedUser ? JSON.parse(storedUser) : null;
    });
    const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
    const [loading, setLoading] = useState(() => !localStorage.getItem('backend_user'));

    useEffect(() => {
        // Safety timeout to prevent infinite loading screen
        const safetyTimeout = setTimeout(() => {
            if (loading) {
                console.warn('Auth check taking too long, forcing loading to false');
                setLoading(false);
            }
        }, 8000);

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser?.email) {
                try {
                    const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email: firebaseUser.email,
                            firebaseUid: firebaseUser.uid
                        })
                    });

                    if (response.ok) {
                        const data = await response.json();
                        const backendUser: BackendUser = {
                            uid: data.user.id,
                            email: data.user.email,
                            displayName: data.user.name,
                            role: data.user.role,
                            isBackend: true,
                            token: data.token
                        };
                        setUser(backendUser);
                        setToken(data.token);
                        localStorage.setItem('backend_user', JSON.stringify(backendUser));
                        localStorage.setItem('auth_token', data.token);
                    } else {
                        setUser(firebaseUser);
                    }
                } catch (error) {
                    console.error('Error verifying user:', error);
                    setUser(firebaseUser);
                }
            } else {
                if (!firebaseUser) {
                    setUser(null);
                    setToken(null);
                    localStorage.removeItem('backend_user');
                    localStorage.removeItem('auth_token');
                } else {
                    setUser(firebaseUser);
                }
            }
            setLoading(false);
            clearTimeout(safetyTimeout);
        });
        return () => {
            unsubscribe();
            clearTimeout(safetyTimeout);
        };
    }, []);

    const signInWithGoogle = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
            // State will be updated by onAuthStateChanged listener
        } catch (e) {
            console.error("Google Sign In Error", e);
            throw e;
        }
    };

    const signInWithBackend = async (email: string, password: string): Promise<boolean> => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (response.ok) {
                const data = await response.json();
                const backendUser: BackendUser = {
                    uid: data.user.id,
                    email: data.user.email,
                    displayName: data.user.name,
                    role: data.user.role,
                    isBackend: true,
                    token: data.token
                };
                setUser(backendUser);
                setToken(data.token);
                localStorage.setItem('backend_user', JSON.stringify(backendUser));
                localStorage.setItem('auth_token', data.token);

                // Also update the local storage user list for RoleSelection if needed
                const users = JSON.parse(localStorage.getItem('sehat_safe_users') || '[]');
                if (!users.find((u: { id: string }) => u.id === data.user.id)) {
                    const profile = {
                        id: data.user.id,
                        role: data.user.role,
                        full_name: data.user.name,
                        email: data.user.email,
                        created_at: new Date().toISOString()
                    };
                    localStorage.setItem('sehat_safe_users', JSON.stringify([...users, profile]));
                }

                return true;
            }
            return false;
        } catch (error) {
            console.error('Backend login failed:', error);
            return false;
        }
    };

    const signInWithEmail = async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
        // We rely on verify loop in useEffect to pick up role if exists
    };

    const signUpWithEmail = async (email: string, password: string, name: string) => {
        // 1. Firebase Auth
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(result.user, { displayName: name });

        // 2. Backend Registration (Persistence)
        const selectedRole = localStorage.getItem('sehat_safe_selected_role');
        try {
            const regRes = await fetch(`${API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email,
                    name: name,
                    role: selectedRole || 'patient',
                    firebaseUid: result.user.uid
                })
            });

            // If successful, the useEffect verify loop will pick it up or we can set it here
            if (regRes.ok) {
                await regRes.json();
                // Optionally set user here to avoid delay
            }
        } catch (e) {
            console.error("Backend Registration Sync Error", e);
        }
    };

    const logout = async () => {
        // Remove backend user info but keep the selected role to enforce immutability
        localStorage.removeItem('backend_user');
        localStorage.removeItem('auth_token');
        // Do NOT remove 'sehat_safe_selected_role' so the chosen role persists across sessions
        await firebaseSignOut(auth);
        setUser(null);
        setToken(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInWithEmail, signInWithBackend, signUpWithEmail, logout, token }}>
            {children}
        </AuthContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
