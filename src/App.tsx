import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { useState, useEffect, lazy, Suspense } from 'react';
import { AnimatePresence } from 'framer-motion';
import { PageTransition } from './components/Layout/PageTransition';
import Login from './components/Auth/Login';

// Role Selection is critical for LCP (initial view), load it eagerly
import RoleSelection from './components/Auth/RoleSelection';

// Lazy load other heavy dashboard components
const PatientDashboard = lazy(() => import('./components/Patient/PatientDashboard'));
const DoctorDashboard = lazy(() => import('./components/Doctor/DoctorDashboard'));
const EmergencySOS = lazy(() => import('./components/Emergency/EmergencySOS'));
const AdminDashboard = lazy(() => import('./components/Admin/AdminDashboard'));
const ViewSwitcher = lazy(() => import('./components/Admin/ViewSwitcher'));
const EmergencyProfile = lazy(() => import('./pages/EmergencyProfile'));
const InitialLoader = lazy(() => import('./components/ui/InitialLoader'));
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function LoadingSpinner() {
  return (
    <div className="initial-loader">
      <div className="spinner"></div>
      <p className="loading-text">Sehat Safe is loading...</p>
    </div>
  );
}

function AppContent() {
  const { user, loading } = useAuth();
  const [role, setRole] = useState<'patient' | 'doctor' | 'admin' | null>(() => {
    const backendUser = localStorage.getItem('backend_user');
    if (backendUser) return JSON.parse(backendUser).role;
    return null;
  });
  const [preAuthRole, setPreAuthRole] = useState<'patient' | 'doctor' | 'admin' | null>(() => {
    return localStorage.getItem('sehat_safe_selected_role') as 'patient' | 'doctor' | 'admin' | null;
  });
  const [isAdmin, setIsAdmin] = useState(() => {
    const backendUser = localStorage.getItem('backend_user');
    if (backendUser) return JSON.parse(backendUser).role === 'admin';
    return false;
  });
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      setRole(null);
      // Keep preAuthRole as is from localStorage or sync it
      const savedRole = localStorage.getItem('sehat_safe_selected_role');
      if (savedRole) setPreAuthRole(savedRole as any);
      return;
    }

    const users = JSON.parse(localStorage.getItem('sehat_safe_users') || '[]');
    const existing = users.find((u: { id: string; role?: string }) => u.id === user.uid);

    // PRIORITY 1: Backend Role (Source of Truth)
    const userWithRole = user as { uid: string; role?: 'patient' | 'doctor' | 'admin' };
    if (userWithRole.role) {
      setRole(userWithRole.role);
      setIsAdmin(userWithRole.role === 'admin');
    }
    // PRIORITY 2: Local Storage Role (Fallback / Legacy)
    else if (existing && existing.role) {
      setRole(existing.role as any);
      setIsAdmin(existing.role === 'admin');
    }
    // PRIORITY 3: Pre-Auth Selection (New Registration)
    else if (preAuthRole) {
      setRole(preAuthRole);
      setIsAdmin(preAuthRole === 'admin');

      // Ensure it's saved in local storage profile if missing
      if (!existing) {
        const profile = {
          id: user.uid,
          role: preAuthRole,
          full_name: user.displayName || 'New User',
          created_at: new Date().toISOString(),
          email: user.email
        };
        localStorage.setItem('sehat_safe_users', JSON.stringify([...users, profile]));
      }
    }
  }, [user, preAuthRole]);

  if (loading) {
    return <LoadingSpinner />;
  }

  // 1. If not logged in
  if (!user) {
    // 1a. If no role selected yet -> Show Role Selection
    if (!preAuthRole) {
      return (
        <RoleSelection onSelect={(r) => {
          setPreAuthRole(r);
          localStorage.setItem('sehat_safe_selected_role', r);
        }} />
      );
    }

    // 1b. If role selected -> Show Login (pass role)
    return <Login selectedRole={preAuthRole} onBack={() => {
      setPreAuthRole(null);
      localStorage.removeItem('sehat_safe_selected_role');
    }} />;
  }

  // 2. Logged in logic (Dashboard Routing)
  // If role is not yet determined from user profile, use preAuthRole as fallback or wait
  const effectiveRole = role || preAuthRole;

  if (!effectiveRole) {
    // Escape hatch: If we have a user but NO role was found after loading,
    // show RoleSelection so they can re-assert who they are
    return (
      <RoleSelection onSelect={(r) => {
        setPreAuthRole(r);
        localStorage.setItem('sehat_safe_selected_role', r);
      }} />
    );
  }

  return (
    <>
      <AnimatePresence>
        {showSplash && (
          <Suspense fallback={null}>
            <InitialLoader />
          </Suspense>
        )}
      </AnimatePresence>

      <div className="h-[100dvh] relative overflow-hidden">
        <AnimatePresence mode="wait">
          {!showSplash && (
            <PageTransition key={effectiveRole || 'guest'} className="h-[100dvh]">
              <Suspense fallback={<LoadingSpinner />}>
                {effectiveRole === 'admin' ? (
                  <>
                    <AdminDashboard />
                    {isAdmin && <ViewSwitcher currentRole={role || 'admin'} onRoleChange={setRole} />}
                  </>
                ) : effectiveRole === 'doctor' ? (
                  <>
                    <DoctorDashboard />
                    {isAdmin && <ViewSwitcher currentRole={role || 'doctor'} onRoleChange={setRole} />}
                  </>
                ) : (
                  <>
                    <PatientDashboard />
                    {isAdmin && <ViewSwitcher currentRole={role || 'patient'} onRoleChange={setRole} />}
                  </>
                )}
              </Suspense>
            </PageTransition>
          )}
        </AnimatePresence>
        <Suspense fallback={null}>
          <EmergencySOS />
        </Suspense>
      </div>
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LanguageProvider>
          <Router>
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/emergency/:patientId" element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <EmergencyProfile />
                  </Suspense>
                } />
                <Route path="*" element={<AppContent />} />
              </Routes>
            </AnimatePresence>
          </Router>
        </LanguageProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
