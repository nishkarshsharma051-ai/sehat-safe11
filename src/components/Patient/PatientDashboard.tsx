import { useState, useEffect } from 'react';
import {
  FileText, Calendar, Bell, MessageSquare, LogOut, Sun, Moon,
  Activity, Heart, Shield, MapPin, TrendingUp, Clock, Users, Link, LayoutDashboard, Settings, Menu, X, ChevronRight
} from 'lucide-react';
import { StaggerContainer, MotionItem } from '../ui/MotionComponents';
import { GlassCard } from '../ui/GlassCard';
import { PremiumButton } from '../ui/PremiumButton';
import { NeumorphicBadge } from '../ui/NeumorphicBadge';
import { AnimatePresence, motion } from 'framer-motion';

import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import PrescriptionUpload from './PrescriptionUpload';
import PrescriptionList from './PrescriptionList';
import AppointmentBooking from './AppointmentBooking';
import MedicineReminders from './MedicineReminders';
import ChatBot from '../Chat/ChatBot';
import HealthSummary from './HealthSummary';
import HealthRiskScore from './HealthRiskScore';
import SecureShare from './SecureShare';
import NearbyHospitals from './NearbyHospitals';
import InsuranceTracker from './InsuranceTracker';
import HealthTimeline from './HealthTimeline';
import HealthTrends from './HealthTrends';
import FamilyManagement from './FamilyManagement';
import { prescriptionService, appointmentService, reminderService, healthEntryService, insuranceService, familyService } from '../../services/dataService';

type ViewType =
  | 'overview' | 'prescriptions' | 'appointments' | 'reminders' | 'chat'
  | 'health-summary' | 'risk-score' | 'secure-share' | 'hospitals'
  | 'insurance' | 'timeline' | 'trends' | 'family' | 'settings';

const NAV_ITEMS: { id: ViewType; label: string; icon: any; section?: string; badge?: string; badgeLabel?: string }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  // Core
  { id: 'prescriptions', label: 'Prescriptions', icon: FileText, section: 'Core' },
  { id: 'appointments', label: 'Appointments', icon: Calendar, section: 'Core' },
  { id: 'reminders', label: 'Reminders', icon: Bell, section: 'Core' },
  { id: 'health-summary', label: 'Health Summary', icon: Heart, section: 'Core' },
  // AI-Powered
  { id: 'chat', label: 'AI Chat', icon: MessageSquare, section: 'AI-Powered', badge: 'info', badgeLabel: 'New' },
  { id: 'risk-score', label: 'Risk Score', icon: Activity, section: 'AI-Powered', badge: 'warning', badgeLabel: 'Beta' },
  // Advanced
  { id: 'secure-share', label: 'Secure Share', icon: Link, section: 'Advanced' },
  { id: 'hospitals', label: 'Hospitals', icon: MapPin, section: 'Advanced' },
  { id: 'insurance', label: 'Insurance', icon: Shield, section: 'Advanced' },
  // Big Brain
  { id: 'timeline', label: 'Timeline', icon: Clock, section: 'Big Brain' },
  { id: 'trends', label: 'Health Trends', icon: TrendingUp, section: 'Big Brain' },
  { id: 'family', label: 'Family', icon: Users, section: 'Big Brain' },
  { id: 'settings', label: 'Settings', icon: Settings, section: 'Advanced' },
];

export default function PatientDashboard() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [activeView, setActiveView] = useState<ViewType>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState({ prescriptions: 0, appointments: 0, reminders: 0, timeline: 0, insurance: 0, family: 0 });

  useEffect(() => {
    const loadStats = async () => {
      const uid = user?.uid || 'anonymous';
      const [prescriptions, appointments, reminders, timeline, insurance, family] = await Promise.all([
        prescriptionService.getAll(uid),
        appointmentService.getByPatient(uid),
        reminderService.getAll(uid),
        healthEntryService.getAll(uid),
        insuranceService.getAll(uid),
        familyService.getAll(uid),
      ]);
      setStats({
        prescriptions: prescriptions.length,
        appointments: appointments.filter((a: any) => a.status !== 'cancelled').length,
        reminders: reminders.filter((r: any) => r.is_active).length,
        timeline: timeline.length,
        insurance: insurance.length,
        family: family.length,
      });
    };
    loadStats();
  }, [user, activeView]);

  // Close mobile menu when view changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [activeView]);

  const renderView = () => {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={activeView}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="h-full"
        >
          {(() => {
            switch (activeView) {
              case 'prescriptions':
                return <>
                  <PrescriptionUpload onUploadComplete={() => setActiveView('prescriptions')} />
                  <div className="mt-6"><PrescriptionList /></div>
                </>;
              case 'appointments':
                return <AppointmentBooking />;
              case 'reminders':
                return <MedicineReminders />;
              case 'chat':
                return <ChatBot />;
              case 'health-summary':
                return <HealthSummary />;
              case 'risk-score':
                return <HealthRiskScore />;
              case 'secure-share':
                return <SecureShare />;
              case 'hospitals':
                return <NearbyHospitals />;
              case 'insurance':
                return <InsuranceTracker />;
              case 'timeline':
                return <HealthTimeline />;
              case 'trends':
                return <HealthTrends />;
              case 'family':
                return <FamilyManagement />;
              case 'settings':
                return <SettingsView />;
              default:
                return renderOverview();
            }
          })()}
        </motion.div>
      </AnimatePresence>
    );
  };

  const SettingsView = () => {
    const [patientProfile, setPatientProfile] = useState({
      name: user?.displayName || 'Rahul Sharma',
      email: user?.email || 'rahul@example.com',
      age: '32',
      bloodGroup: 'O+',
      height: '175',
      weight: '72'
    });

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Settings & Preferences</h2>

        {/* Personal Details */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-indigo-500" />
            Personal Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Full Name</label>
              <input type="text" value={patientProfile.name} onChange={e => setPatientProfile({ ...patientProfile, name: e.target.value })} className="w-full p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-white/10 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Email</label>
              <input type="email" value={patientProfile.email} disabled className="w-full p-3 rounded-xl bg-gray-100/50 dark:bg-slate-800/30 border border-gray-100 dark:border-white/5 text-gray-500 cursor-not-allowed" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Age</label>
                <input type="number" value={patientProfile.age} onChange={e => setPatientProfile({ ...patientProfile, age: e.target.value })} className="w-full p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-white/10 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Blood Group</label>
                <select value={patientProfile.bloodGroup} onChange={e => setPatientProfile({ ...patientProfile, bloodGroup: e.target.value })} className="w-full p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-white/10 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all">
                  <option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>O+</option><option>O-</option><option>AB+</option><option>AB-</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Height (cm)</label>
                <input type="number" value={patientProfile.height} onChange={e => setPatientProfile({ ...patientProfile, height: e.target.value })} className="w-full p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-white/10 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Weight (kg)</label>
                <input type="number" value={patientProfile.weight} onChange={e => setPatientProfile({ ...patientProfile, weight: e.target.value })} className="w-full p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-white/10 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" />
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <PremiumButton variant="primary" size="md">
              Save Profile
            </PremiumButton>
          </div>
        </GlassCard>

        {/* Preferences */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center">
            <Settings className="w-5 h-5 mr-2 text-gray-500" />
            App Preferences
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer" onClick={toggleTheme}>
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-amber-500/10 text-amber-600'}`}>
                  {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Dark Mode</p>
                  <p className="text-xs text-gray-500">Adjust appearance</p>
                </div>
              </div>
              <div className={`w-11 h-6 rounded-full relative transition-colors ${isDark ? 'bg-indigo-500' : 'bg-gray-200'}`}>
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${isDark ? 'left-[22px]' : 'left-0.5'}`}></div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-rose-500/10 text-rose-500 rounded-lg">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Notifications</p>
                  <p className="text-xs text-gray-500">Medicine & appointments</p>
                </div>
              </div>
              <div className="w-11 h-6 rounded-full relative bg-gray-200 dark:bg-slate-700">
                <div className="absolute top-0.5 left-[22px] w-5 h-5 rounded-full bg-white shadow-sm transition-all bg-green-500"></div>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    );
  };

  const renderOverview = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3 tracking-tight">
          Good Morning, {user?.displayName?.split(' ')[0] || 'Patient'}
          <NeumorphicBadge variant="success" className="text-xs py-0.5">PRO</NeumorphicBadge>
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-lg">Your health summary for today</p>
      </div>

      {/* Stats Grid - Apple "Bento" Style */}
      <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Large Primary Card */}
        <MotionItem className="col-span-2 row-span-2">
          <div
            onClick={() => setActiveView('health-summary')}
            className="h-full cursor-pointer relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-500 to-violet-600 text-white p-6 shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group"
          >
            <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-1">Health Score</h3>
                <p className="text-indigo-100">Overall Wellness</p>
              </div>

              <div className="flex items-end justify-between">
                <span className="text-6xl font-bold tracking-tighter">92</span>
                <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-md">
                  +2% this week
                </div>
              </div>
            </div>
          </div>
        </MotionItem>

        {[
          { label: 'Prescriptions', value: stats.prescriptions, color: 'text-blue-500', bg: 'bg-blue-500/10', icon: FileText, view: 'prescriptions' as ViewType },
          { label: 'Appointments', value: stats.appointments, color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: Calendar, view: 'appointments' as ViewType },
          { label: 'Reminders', value: stats.reminders, color: 'text-orange-500', bg: 'bg-orange-500/10', icon: Bell, view: 'reminders' as ViewType },
          { label: 'Timeline', value: stats.timeline, color: 'text-purple-500', bg: 'bg-purple-500/10', icon: Clock, view: 'timeline' as ViewType },
        ].map((stat) => (
          <MotionItem key={stat.label} className="col-span-1">
            <GlassCard onClick={() => setActiveView(stat.view)}
              className="p-5 h-40 flex flex-col justify-between cursor-pointer hover:bg-white/80 dark:hover:bg-slate-800/80 transition-colors group relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-400 dark:group-hover:text-gray-400 transition-colors" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{stat.value}</p>
                <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
              </div>
            </GlassCard>
          </MotionItem>
        ))}
      </StaggerContainer>

      {/* Quick Actions - iOS Action Icons */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 ml-1">Quick Actions</h3>
        <GlassCard className="p-2">
          <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { label: 'Upload Files', icon: FileText, color: 'bg-blue-500', view: 'prescriptions' as ViewType },
              { label: 'AI Chat', icon: MessageSquare, color: 'bg-indigo-500', view: 'chat' as ViewType },
              { label: 'Risk Score', icon: Activity, color: 'bg-rose-500', view: 'risk-score' as ViewType },
              { label: 'Hospitals', icon: MapPin, color: 'bg-red-500', view: 'hospitals' as ViewType },
            ].map((action) => (
              <MotionItem key={action.label}>
                <button
                  onClick={() => setActiveView(action.view)}
                  className="w-full p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex items-center space-x-3 group text-left"
                >
                  <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform`}>
                    <action.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-sm font-semibold text-gray-900 dark:text-gray-100">{action.label}</span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">Tap to open</span>
                  </div>
                </button>
              </MotionItem>
            ))}
          </StaggerContainer>
        </GlassCard>
      </div>
    </div>
  );

  // Group nav items
  let lastSection = '';

  return (
    <div className="flex h-screen bg-[#F2F2F7] dark:bg-black overflow-hidden font-sans">

      {/* Mobile Menu Toggle */}
      <div className="md:hidden fixed top-0 left-0 right-0 p-4 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200/50 dark:border-white/10 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <Heart className="w-5 h-5 text-white fill-current" />
          </div>
          <span className="font-bold text-gray-900 dark:text-white">Sehat Safe</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-circle">
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar - macOS/iPadOS Style */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-gray-100/80 dark:bg-[#1C1C1E]/80 backdrop-blur-2xl border-r border-gray-200/50 dark:border-white/10
        transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out
        flex flex-col
      `}>
        <div className="p-6 pb-2">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-9 h-9 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center">
              <Heart className="w-5 h-5 text-white fill-current" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Sehat Safe</span>
          </div>

          <div className="mb-4">
            <div className="px-3 py-1.5 bg-gray-200/50 dark:bg-white/10 rounded-lg flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">System Operational</span>
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
                  onClick={() => setActiveView(item.id)}
                  className={`
                     w-full flex items-center justify-between px-3 py-2 rounded-lg text-[15px] font-medium transition-all duration-200
                     ${activeView === item.id
                      ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-white/10'
                    }
                   `}
                >
                  <div className="flex items-center space-x-3">
                    <item.icon className={`w-[18px] h-[18px] ${activeView === item.id ? 'opacity-100' : 'opacity-70'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${activeView === item.id
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                      }`}>
                      {item.badgeLabel}
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200/50 dark:border-white/10 space-y-1">
          <button onClick={logout} className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-medium">
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-72 h-screen overflow-y-auto pt-20 md:pt-6 px-4 md:px-8 pb-8 scroll-smooth">
        <div className="max-w-6xl mx-auto">
          {renderView()}
        </div>
      </main>

    </div>
  );
}
