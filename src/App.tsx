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

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-14 h-14 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Loading...</p>
      </div>
    </div>
  );
}

function AppContent() {
  const { user, loading } = useAuth();
  const [role, setRole] = useState<'patient' | 'doctor' | 'admin' | null>(null);
  const [preAuthRole, setPreAuthRole] = useState<'patient' | 'doctor' | 'admin' | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check local storage for pre-selected role (if any)
    const savedRole = localStorage.getItem('sehat_safe_selected_role');
    if (savedRole && (savedRole === 'patient' || savedRole === 'doctor')) {
      setPreAuthRole(savedRole as 'patient' | 'doctor');
    }

    if (!user) {
      setIsAdmin(false);
      setRole(null);
      return;
    }

    const users = JSON.parse(localStorage.getItem('sehat_safe_users') || '[]');
    const existing = users.find((u: { id: string; role?: string }) => u.id === user.uid);

    // Check for backend user role (Admin or Regular)
    // PRIORITY 1: Backend Role (Source of Truth)
    const userWithRole = user as { uid: string; role?: 'patient' | 'doctor' | 'admin' };
    if (userWithRole.role) {
      if (userWithRole.role === 'admin') {
        setIsAdmin(true);
        if (!role) setRole('admin');
      } else {
        setIsAdmin(false);
        setRole(userWithRole.role as 'patient' | 'doctor'); // Lock to backend role
      }
    }
    // PRIORITY 2: Local Storage Role (Fallback / Legacy)
    else if (existing && existing.role) {
      if (existing.role === 'admin') {
        setIsAdmin(true);
        if (!role) setRole('admin');
      } else {
        setIsAdmin(false);
        setRole(existing.role as 'patient' | 'doctor');
      }
    }
    // PRIORITY 3: Pre-Auth Selection (New Registration)
    else if (preAuthRole) {
      setIsAdmin(false);
      setRole(preAuthRole as 'patient' | 'doctor' | 'admin');

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
    // Should not happen if flow is correct, but fallback to Patient
    return <LoadingSpinner />;
  }

  if (effectiveRole === 'admin') {
    return (
      <PageTransition key="admin-dashboard">
        <Suspense fallback={<LoadingSpinner />}>
          <AdminDashboard />
          <EmergencySOS />
          {isAdmin && (
            <ViewSwitcher currentRole={role || 'admin'} onRoleChange={setRole} />
          )}
        </Suspense>
      </PageTransition>
    );
  }

  if (effectiveRole === 'doctor') {
    return (
      <PageTransition key="doctor-dashboard">
        <Suspense fallback={<LoadingSpinner />}>
          <DoctorDashboard />
          <EmergencySOS />
          {isAdmin && (
            <ViewSwitcher currentRole={role || 'doctor'} onRoleChange={setRole} />
          )}
        </Suspense>
      </PageTransition>
    );
  }

  return (
    <PageTransition key="patient-dashboard">
      <Suspense fallback={<LoadingSpinner />}>
        <PatientDashboard />
        <EmergencySOS />
        {isAdmin && (
          <ViewSwitcher currentRole={role || 'patient'} onRoleChange={setRole} />
        )}
      </Suspense>
    </PageTransition>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LanguageProvider>
          <AnimatePresence mode="wait">
            <AppContent />
          </AnimatePresence>
        </LanguageProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
