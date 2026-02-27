import { useState, useEffect } from 'react';
import { Users, FileText, Calendar, Download, Eye, Shield, Menu, X, ChevronRight, LogOut, LayoutDashboard, Clock, Sun, Moon, LucideIcon } from 'lucide-react';
import { UserProfile, Appointment, Prescription } from '../../types';
import { adminService } from '../../services/dataService';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { GlassCard } from '../ui/GlassCard';
import { PremiumButton } from '../ui/PremiumButton';
import { NeumorphicBadge } from '../ui/NeumorphicBadge';
import { StaggerContainer, MotionItem } from '../ui/MotionComponents';
import { AnimatePresence, motion } from 'framer-motion';

type ViewType = 'overview' | 'users' | 'appointments' | 'prescriptions';

export default function AdminDashboard() {
  const { logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [currentView, setCurrentView] = useState<ViewType>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    patients: 0,
    doctors: 0,
    totalAppointments: 0,
    totalPrescriptions: 0,
    pendingAppointments: 0,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [fetchedStats, fetchedUsers, fetchedAppointments, fetchedPrescriptions] = await Promise.all([
        adminService.getStats(),
        adminService.getAllUsers(),
        adminService.getAllAppointments(),
        adminService.getAllPrescriptions()
      ]);

      setStats(fetchedStats);

      // Map users (Backend: _id, name -> FE: id, full_name)
      setUsers(fetchedUsers.map((u: any): UserProfile => ({
        ...u,
        id: u._id,
        full_name: u.name,
        created_at: u.createdAt,
        role: u.role || 'patient'
      })));

      setAppointments(fetchedAppointments);
      setPrescriptions(fetchedPrescriptions);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError('Failed to load dashboard data. Please ensure you have admin privileges.');
    } finally {
      setLoading(false);
    }
  };

  const getPatientName = (id: string) => {
    const user = users.find(u => u.id === id);
    return user ? user.full_name : 'Unknown Patient';
  };

  const NAV_ITEMS: { id: ViewType; label: string; icon: LucideIcon; section?: string; badge?: string; badgeLabel?: string }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'users', label: 'User Management', icon: Users, section: 'Management' },
    { id: 'appointments', label: 'Appointments', icon: Calendar, section: 'Records' },
    { id: 'prescriptions', label: 'Prescriptions', icon: FileText, section: 'Records' },
  ];

  const renderView = () => (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentView}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="h-full"
      >
        {(() => {
          switch (currentView) {
            case 'users': return renderUsers();
            case 'appointments': return renderAppointments();
            case 'prescriptions': return renderPrescriptions();
            default: return renderOverview();
          }
        })()}
      </motion.div>
    </AnimatePresence>
  );

  const renderOverview = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3 tracking-tight">
          Admin Overview
          <NeumorphicBadge variant="info" className="text-xs py-0.5">Control Center</NeumorphicBadge>
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-lg">Platform statistics at a glance</p>
      </div>

      <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Patients', value: stats.patients, icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Doctors', value: stats.doctors, icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10' },
          { label: 'Total Appointments', value: stats.totalAppointments, icon: Calendar, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'Pending Appts', value: stats.pendingAppointments, icon: Clock, color: 'text-orange-500', bg: 'bg-orange-500/10' },
          { label: 'Prescriptions', value: stats.totalPrescriptions, icon: FileText, color: 'text-rose-500', bg: 'bg-rose-500/10' },
        ].map((stat) => (
          <MotionItem key={stat.label}>
            <GlassCard className="p-6 flex flex-col justify-between h-40 group relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-gray-400 transition-colors" />
              </div>
              <div>
                <p className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">{stat.value}</p>
                <p className="text-sm text-gray-500 font-medium uppercase tracking-wider mt-1">{stat.label}</p>
              </div>
            </GlassCard>
          </MotionItem>
        ))}
      </StaggerContainer>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">User Management</h2>
        <PremiumButton variant="secondary" size="sm" icon={<Download className="w-4 h-4" />}>
          Export Users
        </PremiumButton>
      </div>

      <GlassCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Specialization</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {users.map((user: UserProfile) => (
                <tr key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mr-3 font-bold text-xs">
                        {user.full_name?.charAt(0)}
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{user.full_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <NeumorphicBadge variant={user.role === 'admin' ? 'error' : user.role === 'doctor' ? 'info' : 'success'}>
                      {user.role}
                    </NeumorphicBadge>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{user.phone || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{user.specialization || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );

  const renderAppointments = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">All Appointments</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {appointments.map((apt: Appointment) => (
          <GlassCard key={apt.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-tight">Patient</p>
                <h3 className="font-bold text-gray-800 dark:text-white">{apt.patient?.full_name || getPatientName(apt.patient_id)}</h3>
                <p className="text-sm text-gray-500 flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2"></span>
                  Dr. {apt.doctor?.full_name}
                </p>
              </div>
              <NeumorphicBadge variant={apt.status === 'confirmed' ? 'success' : apt.status === 'pending' ? 'warning' : 'neutral'}>
                {apt.status}
              </NeumorphicBadge>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-white/5 text-sm">
              <div>
                <p className="text-gray-400 text-xs mb-1">Date & Time</p>
                <p className="font-medium text-gray-700 dark:text-gray-300">{new Date(apt.appointment_date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">Reason</p>
                <p className="font-medium text-gray-700 dark:text-gray-300 truncate">{apt.reason}</p>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );

  const renderPrescriptions = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Prescription Records</h2>
      <GlassCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Patient</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Doctor</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Meds</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {prescriptions.map((p: Prescription) => (
                <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">{getPatientName(p.patient_id)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{p.doctor_name || 'Uploaded'}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                      {p.medicines?.length || 0} ITEMS
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <a href={p.file_url} target="_blank" rel="noreferrer" className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </a>
                      <a href={p.file_url} download className="p-2 text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10 rounded-lg transition-colors">
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );

  let lastSection = '';

  return (
    <div className="flex min-h-[100dvh] bg-transparent overflow-x-hidden font-sans">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 p-4 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200/50 dark:border-white/10 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-gray-900 dark:text-white">Admin Hub</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-gray-100/80 dark:bg-[#1C1C1E]/80 backdrop-blur-2xl border-r border-gray-200/50 dark:border-white/10
        transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out
        flex flex-col
      `}>
        <div className="p-6 pb-2">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-700 rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Admin Hub</span>
          </div>

          <div className="mb-4">
            <div className="px-3 py-1.5 bg-gray-200/50 dark:bg-white/10 rounded-lg flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Admin Mode Active</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 space-y-0.5 scrollbar-hide">
          {NAV_ITEMS.map((item) => {
            const isSection = item.section && item.section !== lastSection;
            if (isSection) lastSection = item.section!;

            return (
              <div key={item.id}>
                {isSection && (
                  <div className="px-3 mt-6 mb-2 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    {item.section}
                  </div>
                )}
                <button
                  onClick={() => {
                    setCurrentView(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`
                    w-full flex items-center justify-between px-3 py-2 rounded-lg text-[15px] font-medium transition-all duration-200
                    ${currentView === item.id
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-white/10'
                    }
                  `}
                >
                  <div className="flex items-center space-x-3">
                    <item.icon className={`w-[18px] h-[18px] ${currentView === item.id ? 'opacity-100' : 'opacity-70'}`} />
                    <span>{item.label}</span>
                  </div>
                </button>
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200/50 dark:border-white/10 space-y-2">
          <button onClick={toggleTheme} className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-white/10 transition-colors text-sm font-medium">
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span>{isDark ? 'Light' : 'Dark'} Mode</span>
          </button>
          <button onClick={logout} className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-medium">
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-72 min-h-[100dvh] pt-20 md:pt-6 px-4 md:px-8 pb-8 scroll-smooth">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <GlassCard className="max-w-md mx-auto mt-20 text-center p-8">
              <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Access Denied</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
              <PremiumButton onClick={() => window.location.reload()} variant="primary" className="w-full">
                Retry Access
              </PremiumButton>
            </GlassCard>
          ) : renderView()}
        </div>
      </main>
    </div>
  );
}
