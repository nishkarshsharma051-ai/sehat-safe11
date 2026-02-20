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
}

interface AuthContextType {
    user: User | BackendUser | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    signInWithBackend: (email: string, password: string) => Promise<boolean>;
    signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | BackendUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for backend user first
        const storedUser = localStorage.getItem('backend_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser?.email) {
                try {
                    const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: firebaseUser.email })
                    });

                    if (response.ok) {
                        const data = await response.json();
                        const backendUser: BackendUser = {
                            uid: firebaseUser.uid,
                            email: data.user.email,
                            displayName: data.user.name,
                            role: data.user.role,
                            isBackend: true
                        };
                        setUser(backendUser);
                        localStorage.setItem('backend_user', JSON.stringify(backendUser));
                    } else {
                        setUser(firebaseUser);
                    }
                } catch (error) {
                    console.error('Error verifying user:', error);
                    setUser(firebaseUser);
                }
            } else {
                setUser(firebaseUser);
                if (!firebaseUser) {
                    localStorage.removeItem('backend_user');
                }
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const signInWithGoogle = async () => {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        // SYNC with backend to get/set role
        try {
            // Verify/Create user in backend
            // We use the localStorage selected role if any, to try and register them
            const selectedRole = localStorage.getItem('sehat_safe_selected_role');

            // If user exists, verify will return existing role.
            // If user doesn't exist, we might need a way to 'register' via google on backend.
            // Let's try 'verify' first.
            const verifyRes = await fetch(`${API_BASE_URL}/api/auth/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email })
            });

            if (verifyRes.ok) {
                // User exists, use their role and ID
                const data = await verifyRes.json();
                const backendUser: BackendUser = {
                    uid: data.user.id, // Use MongoDB _id
                    email: data.user.email,
                    displayName: data.user.name,
                    role: data.user.role,
                    isBackend: true
                };
                setUser(backendUser);
                localStorage.setItem('backend_user', JSON.stringify(backendUser));
            } else {
                // User does not exist in backend -> Register with selected role
                const regRes = await fetch(`${API_BASE_URL}/api/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: user.email,
                        name: user.displayName,
                        role: selectedRole || 'patient', // Fallback
                        firebaseUid: user.uid
                    })
                });

                if (regRes.ok) {
                    const data = await regRes.json();
                    const backendUser: BackendUser = {
                        uid: data.user.id, // Use MongoDB _id
                        email: data.user.email,
                        displayName: data.user.name,
                        role: data.user.role, // This is the PERMANENT role
                        isBackend: true
                    };
                    setUser(backendUser);
                    localStorage.setItem('backend_user', JSON.stringify(backendUser));
                }
            }
        } catch (e) {
            console.error("Google Sign In Sync Error", e);
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
                    isBackend: true
                };
                setUser(backendUser);
                localStorage.setItem('backend_user', JSON.stringify(backendUser));

                // Also update the local storage user list for RoleSelection if needed
                const users = JSON.parse(localStorage.getItem('sehat_safe_users') || '[]');
                if (!users.find((u: any) => u.id === data.user.id)) {
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
        localStorage.removeItem('backend_user');
        // Do NOT remove 'sehat_safe_selected_role' - user might want to log back in as same role?
        // Actually, if they logout, they might want to switch accounts.
        // But the requirement is "cannot be changed".
        // Use logic: Role is tied to ACCOUNT. 
        // If I logout, I can see Role Selection again presumably to log in as a *different* user?
        // Or does "cannot be changed" mean the device is locked?
        // Usually it means the ACCOUNT is locked.
        // So clearing selection on logout is fine, because next login will enforce account role.
        localStorage.removeItem('sehat_safe_selected_role');

        await firebaseSignOut(auth);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInWithEmail, signInWithBackend, signUpWithEmail, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
