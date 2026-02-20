import { useState, useEffect } from 'react';
import {
  Calendar, Users, Clock, FileText, Stethoscope, ClipboardList, Search,
  LogOut, Sun, Moon, LayoutDashboard, MessageSquare, Bell, Settings, Sparkles, PlusCircle,
  Shield, Lock, User, Mail, Smartphone, Menu, X, ChevronRight, Activity
} from 'lucide-react';
import { StaggerContainer, MotionItem } from '../ui/MotionComponents';
import { GlassCard } from '../ui/GlassCard';
import { PremiumButton } from '../ui/PremiumButton';
import { NeumorphicBadge } from '../ui/NeumorphicBadge';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Appointment } from '../../types';
import { appointmentService, patientService } from '../../services/dataService';
import { getGeminiResponse } from '../../services/geminiService';
import { AnimatePresence, motion } from 'framer-motion';

type ViewType = 'overview' | 'appointments' | 'patients' | 'records' | 'settings';

export default function DoctorDashboard() {
  const { logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [currentView, setCurrentView] = useState<ViewType>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiBriefing, setAiBriefing] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Manual Entry State
  const [showManualModal, setShowManualModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'register' | 'book'>('register');
  const [manualPatient, setManualPatient] = useState({ full_name: '', age: '', gender: 'male', phone: '' });
  const [manualAppointment, setManualAppointment] = useState({ patient_id: '', date: '', time: '', reason: '' });
  const [allPatients, setAllPatients] = useState<any[]>([]);

  // Settings State
  const [profileData, setProfileData] = useState({
    name: 'Dr. Sarah Wilson',
    specialization: 'Cardiologist',
    hospital: 'City General Hospital',
    phone: '+91 98765 43210',
    email: 'sarah.wilson@health.com'
  });
  const [notifications, setNotifications] = useState({
    email: true,
    sms: true,
    push: false
  });

  useEffect(() => {
    loadAppointments();
    loadPatients();
  }, [currentView]);

  // Close mobile menu when view changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [currentView]);

  const loadPatients = async () => {
    const patients = await patientService.getAll();
    setAllPatients(patients);
  };

  const generateDailyBriefing = async () => {
    setIsAiLoading(true);
    setShowAiModal(true);
    try {
      if (upcomingAppointments.length === 0) {
        setAiBriefing("You have no appointments scheduled for today. Enjoy your free time! ☕️");
        setIsAiLoading(false);
        return;
      }

      const scheduleText = upcomingAppointments.map(apt =>
        `- Time: ${new Date(apt.appointment_date).toLocaleTimeString()} | Patient: #${apt.patient_id.slice(-4)} | Reason: ${apt.reason}`
      ).join('\n');

      const prompt = `
        Acting as a medical assistant, provide a brief professional summary of my schedule for today. 
        Identify any potential high-priority cases based on the reasons provided.
        Suggest a quick preparation tip for the most complex case if any.
        
        Schedule:
        ${scheduleText}
      `;

      const response = await getGeminiResponse(prompt);
      setAiBriefing(response);
    } catch (error) {
      console.error("AI Error:", error);
      setAiBriefing("Sorry, I couldn't generate the briefing at this moment. Please check your connection.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleManualRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newPatient = await patientService.addManual({
        full_name: manualPatient.full_name,
        phone: manualPatient.phone,
        gender: manualPatient.gender as any,
      });

      await loadPatients();
      setManualPatient({ full_name: '', age: '', gender: 'male', phone: '' });
      setActiveTab('book'); // Switch to book tab
      setManualAppointment(prev => ({ ...prev, patient_id: newPatient.id }));
      alert('Patient Registered Successfully!');
    } catch (error) {
      console.error('Error registering patient:', error);
    }
  };

  const handleManualBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const appointment: Appointment = {
        id: Date.now().toString(),
        patient_id: manualAppointment.patient_id,
        doctor_id: 'current_doctor_id', // In real app, get from auth
        appointment_date: `${manualAppointment.date}T${manualAppointment.time}`,
        status: 'confirmed',
        reason: manualAppointment.reason,
      };

      await appointmentService.add(appointment);
      await loadAppointments();
      setShowManualModal(false);
      setManualAppointment({ patient_id: '', date: '', time: '', reason: '' });
      alert('Appointment Booked Successfully!');
    } catch (error) {
      console.error('Error booking appointment:', error);
    }
  };

  const loadAppointments = async () => {
    try {
      const data = await appointmentService.getAll();
      setAppointments(data);
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  };

  const updateAppointmentStatus = async (id: string, status: string) => {
    try {
      await appointmentService.updateStatus(id, status as Appointment['status']);
      setAppointments((prev) =>
        prev.map((apt) => (apt.id === id ? { ...apt, status: status as Appointment['status'] } : apt))
      );
    } catch (error) {
      console.error('Error updating appointment:', error);
    }
  };

  const addNotes = async (id: string) => {
    const notes = prompt('Enter notes for this appointment:');
    if (!notes) return;

    try {
      await appointmentService.addNotes(id, notes);
      setAppointments((prev) =>
        prev.map((apt) => (apt.id === id ? { ...apt, notes } : apt))
      );
    } catch (error) {
      console.error('Error adding notes:', error);
    }
  };

  const NAV_ITEMS = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'patients', label: 'My Patients', icon: Users },
    { id: 'records', label: 'Medical Records', icon: ClipboardList },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  const upcomingAppointments = appointments.filter(
    (apt) => apt.status === 'confirmed' || apt.status === 'pending'
  );
  const completedAppointments = appointments.filter((apt) => apt.status === 'completed');

  // Get unique patients from appointments
  const uniquePatients = Array.from(
    new Map(
      appointments
        .filter(a => a.patient_id)
        .map(a => [a.patient_id, { id: a.patient_id, name: a.patient?.full_name || `Patient ${a.patient_id.slice(-4)}`, appointmentCount: 0, lastVisit: a.appointment_date }])
    ).values()
  ).map(p => ({
    ...p,
    appointmentCount: appointments.filter(a => a.patient_id === p.id).length,
    lastVisit: appointments.filter(a => a.patient_id === p.id).sort((a, b) =>
      new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime()
    )[0]?.appointment_date,
  }));

  const filteredPatients = uniquePatients.filter(p =>
    p.name.toLowerCase().includes(patientSearch.toLowerCase())
  );

  const renderContent = () => {
    return (
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
              case 'appointments':
                return renderAppointments();
              case 'patients':
                return renderPatients();
              case 'records':
                return renderRecords();
              case 'settings':
                return renderSettings();
              default:
                return renderOverview();
            }
          })()}
        </motion.div>
      </AnimatePresence>
    );
  };

  const renderSettings = () => (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Settings & Preferences</h2>

      {/* Profile Settings */}
      <GlassCard className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-indigo-500/10 rounded-lg">
            <User className="w-5 h-5 text-indigo-500" />
          </div>
          <h3 className="font-bold text-gray-800 dark:text-white">Profile Information</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Full Name</label>
            <input
              type="text"
              value={profileData.name}
              onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
              className="w-full p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-white/10 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Specialization</label>
            <input
              type="text"
              value={profileData.specialization}
              onChange={(e) => setProfileData({ ...profileData, specialization: e.target.value })}
              className="w-full p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-white/10 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Phone Number</label>
            <input
              type="tel"
              value={profileData.phone}
              onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
              className="w-full p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-white/10 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Hospital / Clinic</label>
            <input
              type="text"
              value={profileData.hospital}
              onChange={(e) => setProfileData({ ...profileData, hospital: e.target.value })}
              className="w-full p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-white/10 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <PremiumButton variant="primary" size="md">
            Save Changes
          </PremiumButton>
        </div>
      </GlassCard>

      {/* Account Security */}
      <GlassCard className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <Shield className="w-5 h-5 text-emerald-500" />
          </div>
          <h3 className="font-bold text-gray-800 dark:text-white">Security</h3>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 mb-4">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </div>
            <div>
              <p className="font-bold text-gray-800 dark:text-white">Password</p>
              <p className="text-xs text-gray-500">Last changed 3 months ago</p>
            </div>
          </div>
          <button className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors">
            Change
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </div>
            <div>
              <p className="font-bold text-gray-800 dark:text-white">Two-Factor Auth</p>
              <p className="text-xs text-gray-500">Enabled via Authenticator App</p>
            </div>
          </div>
          <div className="w-11 h-6 rounded-full relative bg-emerald-500">
            <div className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-white shadow-sm"></div>
          </div>
        </div>
      </GlassCard>

      {/* Notifications */}
      <GlassCard className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-amber-500/10 rounded-lg">
            <Bell className="w-5 h-5 text-amber-500" />
          </div>
          <h3 className="font-bold text-gray-800 dark:text-white">Notifications</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Notifications</span>
            </div>
            <div className={`w-11 h-6 rounded-full relative transition-colors ${notifications.email ? 'bg-indigo-500' : 'bg-gray-200 dark:bg-slate-700'}`} onClick={() => setNotifications({ ...notifications, email: !notifications.email })}>
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${notifications.email ? 'left-[22px]' : 'left-0.5'}`}></div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MessageSquare className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">SMS Alerts</span>
            </div>
            <div className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer ${notifications.sms ? 'bg-indigo-500' : 'bg-gray-200 dark:bg-slate-700'}`} onClick={() => setNotifications({ ...notifications, sms: !notifications.sms })}>
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${notifications.sms ? 'left-[22px]' : 'left-0.5'}`}></div>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3 tracking-tight">
          Good Morning, {profileData.name.split(' ')[1]}
          <NeumorphicBadge variant="success" className="text-xs py-0.5">ONLINE</NeumorphicBadge>
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-lg">Your daily breakdown</p>
      </div>

      {/* Stats Grid - Apple "Bento" Style */}
      <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* AI Assistant Card - Large */}
        <MotionItem className="col-span-2 row-span-2">
          <div
            className="h-full relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-600 text-white p-8 shadow-xl shadow-indigo-500/20 group"
          >
            <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 p-24 bg-black/10 rounded-full blur-2xl -ml-8 -mb-8 pointer-events-none"></div>

            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-inner border border-white/20">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm border border-white/10">AI ASSISTANT</span>
                </div>
                <h3 className="text-3xl font-bold mb-2 tracking-tight">Daily Briefing</h3>
                <p className="text-indigo-100 text-lg opacity-90 leading-relaxed max-w-sm">
                  Get an AI-powered summary of your patient records and schedule.
                </p>
              </div>

              <button
                onClick={generateDailyBriefing}
                className="mt-6 w-full py-3 bg-white text-indigo-600 rounded-xl text-sm font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
              >
                {isAiLoading ? <span className="animate-pulse">Analyzing...</span> : <><span>Generate Report</span><ChevronRight className="w-4 h-4" /></>}
              </button>
            </div>
          </div>
        </MotionItem>

        {[
          { label: 'Appointments', value: appointments.length, icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-500/10', view: 'appointments' as ViewType },
          { label: 'Upcoming', value: upcomingAppointments.length, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10', view: 'appointments' as ViewType },
          { label: 'Completed', value: completedAppointments.length, icon: ClipboardList, color: 'text-emerald-500', bg: 'bg-emerald-500/10', view: 'records' as ViewType },
          { label: 'Total Patients', value: uniquePatients.length, icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10', view: 'patients' as ViewType },
        ].map((stat) => (
          <MotionItem key={stat.label} className="col-span-1">
            <GlassCard
              onClick={() => setCurrentView(stat.view)}
              className="p-5 h-40 flex flex-col justify-between cursor-pointer hover:bg-white/80 dark:hover:bg-slate-800/80 transition-colors group relative overflow-hidden"
            >
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-2">
          <GlassCard className="p-6 h-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                Today's Schedule
              </h3>
              <button onClick={() => setCurrentView('appointments')} className="text-sm text-blue-500 font-bold hover:text-blue-600 transition-colors">View All</button>
            </div>

            {upcomingAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                  <Stethoscope className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                </div>
                <p className="text-gray-900 dark:text-white font-semibold text-lg">No appointments</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs mt-1">Your schedule is clear for today. Use the manual entry to add patients.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingAppointments.slice(0, 5).map((apt) => (
                  <div key={apt.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-2xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer group">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg">
                        {apt.patient_id.slice(-2)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white text-sm">Patient #{apt.patient_id.slice(-4)}</p>
                        <div className="flex items-center text-xs text-gray-500 mt-1 space-x-2">
                          <span className="flex items-center"><Clock className="w-3 h-3 mr-1" />{new Date(apt.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                          <span>{apt.reason}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {apt.status === 'pending' && (
                        <div className="px-3 py-1 bg-green-500/10 text-green-600 rounded-lg text-xs font-bold">
                          Pending
                        </div>
                      )}
                      <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center">
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <GlassCard className="p-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Quick Actions</h3>
            <StaggerContainer className="grid grid-cols-2 gap-3">
              {[
                { label: 'Patient List', icon: Users, color: 'bg-blue-500', view: 'patients' as ViewType },
                { label: 'Schedule', icon: Calendar, color: 'bg-indigo-500', view: 'appointments' as ViewType },
                { label: 'Records', icon: ClipboardList, color: 'bg-purple-500', view: 'records' as ViewType },
                { label: 'Settings', icon: Settings, color: 'bg-teal-500', view: 'settings' as ViewType },
              ].map((action) => (
                <MotionItem key={action.label}>
                  <button
                    onClick={() => setCurrentView(action.view)}
                    className="w-full text-left bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 p-3 rounded-2xl transition-all group"
                  >
                    <div className={`w-8 h-8 rounded-lg ${action.color} flex items-center justify-center text-white mb-2 shadow-sm group-hover:scale-110 transition-transform`}>
                      <action.icon className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{action.label}</p>
                  </button>
                </MotionItem>
              ))}

              <MotionItem className="col-span-2">
                <button
                  onClick={() => setShowManualModal(true)}
                  className="w-full p-4 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 transition-colors text-left group flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-bold text-amber-700 dark:text-amber-500">Manual Entry</p>
                    <p className="text-[10px] text-amber-600 dark:text-amber-400/80 font-medium">Register & Book</p>
                  </div>
                  <div className="bg-amber-500 w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform">
                    <PlusCircle className="w-4 h-4" />
                  </div>
                </button>
              </MotionItem>
            </StaggerContainer>
          </GlassCard>
        </div>
      </div>
    </div >
  );

  const renderAppointments = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">All Appointments</h2>

      {appointments.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h3 className="text-xl font-bold text-gray-700 dark:text-white mb-2">No Appointments</h3>
          <p className="text-gray-500 dark:text-gray-400">Your schedule is currently empty.</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {appointments.map((apt) => (
            <GlassCard key={apt.id} className="p-6 relative overflow-hidden group hover:shadow-xl transition-all border-l-4 border-l-blue-500">
              {/* Status Badge */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider mb-2 ${apt.status === 'confirmed' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' :
                    apt.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                      apt.status === 'completed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' :
                        'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                    }`}>
                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${apt.status === 'confirmed' ? 'bg-green-500' :
                      apt.status === 'pending' ? 'bg-amber-500' :
                        apt.status === 'completed' ? 'bg-blue-500' : 'bg-red-500'
                      }`}></span>
                    {apt.status}
                  </div>
                  <h3 className="font-bold text-gray-800 dark:text-white text-lg">Patient #{apt.patient_id.slice(-4)}</h3>
                </div>
                <button onClick={() => addNotes(apt.id)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
                  <FileText className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300 mb-6 bg-gray-50 dark:bg-black/20 p-4 rounded-xl">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-3 text-gray-400" />
                  <span className="font-medium">{new Date(apt.appointment_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-3 text-gray-400" />
                  <span className="font-medium">{new Date(apt.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex items-center">
                  <Activity className="w-4 h-4 mr-3 text-gray-400" />
                  <span>{apt.reason}</span>
                </div>
                {apt.notes && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-white/10 text-xs italic text-gray-500">
                    "{apt.notes}"
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {apt.status === 'pending' && (
                  <PremiumButton onClick={() => updateAppointmentStatus(apt.id, 'confirmed')}
                    variant="primary" size="sm" className="flex-1 bg-green-500 hover:bg-green-600 border-none shadow-none">
                    Confirm
                  </PremiumButton>
                )}
                {(apt.status === 'pending' || apt.status === 'confirmed') && (
                  <PremiumButton onClick={() => updateAppointmentStatus(apt.id, 'completed')}
                    variant="secondary" size="sm" className="flex-1">
                    Complete
                  </PremiumButton>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );

  const renderPatients = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">My Patients</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={patientSearch}
            onChange={(e) => setPatientSearch(e.target.value)}
            className="pl-10 pr-4 py-2 rounded-xl bg-white/50 dark:bg-black/20 border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-black/40 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all w-64 text-sm"
          />
        </div>
      </div>

      {filteredPatients.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400">No patients found.</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.map((patient) => (
            <GlassCard key={patient.id} className="p-5 flex items-center space-x-4 hover:shadow-lg transition-all cursor-pointer group">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold shadow-md group-hover:scale-105 transition-transform">
                {patient.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-800 dark:text-white truncate">{patient.name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">#{patient.id.slice(-6)}</p>
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-2">
                  <Clock className="w-3 h-3 mr-1" />
                  {patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString() : 'Never'}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600" />
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );

  const renderRecords = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Medical Records</h2>
      {completedAppointments.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <ClipboardList className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400">No medical records generated yet.</p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {completedAppointments.map((apt) => (
            <GlassCard key={apt.id} className="p-1 flex items-center justify-between group overflow-hidden">
              <div className="flex items-center p-4 flex-1">
                <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform mr-4">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-white">Consultation Report</h3>
                  <div className="flex items-center mt-1 space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <span>Patient #{apt.patient_id.slice(-4)}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                    <span>{new Date(apt.appointment_date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="pr-4">
                <PremiumButton variant="ghost" size="sm" className="group-hover:bg-purple-50 dark:group-hover:bg-purple-900/20">
                  View
                </PremiumButton>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen bg-[#F2F2F7] dark:bg-black overflow-hidden font-sans">

      {/* Mobile Menu Toggle */}
      <div className="md:hidden fixed top-0 left-0 right-0 p-4 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200/50 dark:border-white/10 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-white fill-current" />
          </div>
          <span className="font-bold text-gray-900 dark:text-white">Sehat Connect</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-circle">
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Manual Entry Modal - Apple Style Dialog */}
      <AnimatePresence>
        {showManualModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowManualModal(false)}
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl relative z-10"
            >
              <div className="flex border-b border-gray-100 dark:border-white/10">
                <button
                  className={`flex-1 p-4 font-bold text-sm transition-colors ${activeTab === 'register' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                  onClick={() => setActiveTab('register')}
                >
                  1. Register Patient
                </button>
                <div className="w-px bg-gray-100 dark:bg-white/10"></div>
                <button
                  className={`flex-1 p-4 font-bold text-sm transition-colors ${activeTab === 'book' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                  onClick={() => setActiveTab('book')}
                >
                  2. Book Appointment
                </button>
                <button onClick={() => setShowManualModal(false)} className="p-4 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8">
                {activeTab === 'register' ? (
                  <form onSubmit={handleManualRegister} className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Full Name</label>
                      <input required type="text" className="w-full p-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                        value={manualPatient.full_name} onChange={e => setManualPatient({ ...manualPatient, full_name: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Age</label>
                        <input required type="number" className="w-full p-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                          value={manualPatient.age} onChange={e => setManualPatient({ ...manualPatient, age: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Gender</label>
                        <select className="w-full p-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                          value={manualPatient.gender} onChange={e => setManualPatient({ ...manualPatient, gender: e.target.value })}
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Phone Number</label>
                      <input required type="tel" className="w-full p-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                        value={manualPatient.phone} onChange={e => setManualPatient({ ...manualPatient, phone: e.target.value })} />
                    </div>
                    <PremiumButton type="submit" className="w-full shadow-lg shadow-indigo-500/25">
                      Register Patient
                    </PremiumButton>
                  </form>
                ) : (
                  <form onSubmit={handleManualBook} className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Select Patient</label>
                      <select required className="w-full p-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                        value={manualAppointment.patient_id} onChange={e => setManualAppointment({ ...manualAppointment, patient_id: e.target.value })}
                      >
                        <option value="">-- Choose Patient --</option>
                        {allPatients.map(p => (
                          <option key={p.id} value={p.id}>{p.full_name} ({p.phone || 'No Phone'})</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Date</label>
                        <input required type="date" className="w-full p-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                          value={manualAppointment.date} onChange={e => setManualAppointment({ ...manualAppointment, date: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Time</label>
                        <input required type="time" className="w-full p-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                          value={manualAppointment.time} onChange={e => setManualAppointment({ ...manualAppointment, time: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Reason / Condition</label>
                      <input required type="text" className="w-full p-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                        value={manualAppointment.reason} onChange={e => setManualAppointment({ ...manualAppointment, reason: e.target.value })} />
                    </div>
                    <PremiumButton type="submit" className="w-full shadow-lg shadow-indigo-500/25">
                      Book Appointment
                    </PremiumButton>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Briefing Modal */}
      <AnimatePresence>
        {showAiModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowAiModal(false)}
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl relative z-10 flex flex-col"
            >
              <div className="p-6 bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-3 text-white">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                  <h3 className="text-xl font-bold tracking-tight">Daily Briefing</h3>
                </div>
                <button
                  onClick={() => setShowAiModal(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                {isAiLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-6">
                    <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    <p className="text-gray-500 font-medium animate-pulse">Analyzing schedule & patient records...</p>
                  </div>
                ) : (
                  <div className="prose prose-indigo dark:prose-invert max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        table: ({ node, ...props }) => <table className="w-full border-collapse my-4 text-sm" {...props} />,
                        thead: ({ node, ...props }) => <thead className="bg-indigo-50/50" {...props} />,
                        th: ({ node, ...props }) => <th className="border-b border-gray-200 px-4 py-2 text-left font-bold text-indigo-900" {...props} />,
                        td: ({ node, ...props }) => <td className="border-b border-gray-100 px-4 py-2" {...props} />,
                        strong: ({ node, ...props }) => <strong className="font-bold text-indigo-600 dark:text-indigo-400" {...props} />,
                      }}
                    >
                      {aiBriefing}
                    </ReactMarkdown>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-gray-100 dark:border-white/10 flex justify-end shrink-0 bg-gray-50 dark:bg-transparent">
                <PremiumButton onClick={() => setShowAiModal(false)} variant="secondary" size="sm">
                  Close Report
                </PremiumButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sidebar - macOS/iPadOS Style */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-gray-100/80 dark:bg-[#1C1C1E]/80 backdrop-blur-2xl border-r border-gray-200/50 dark:border-white/10
        transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out
        flex flex-col
      `}>
        <div className="p-6 pb-2">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-9 h-9 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-xl shadow-lg shadow-emerald-500/30 flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white fill-current" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Sehat Connect</span>
          </div>

          <div className="mb-4">
            <div className="px-3 py-2 bg-white/50 dark:bg-white/5 rounded-xl flex items-center space-x-3 border border-gray-200/50 dark:border-white/5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">SW</div>
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-white">Dr. Sarah Wilson</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">Cardiologist</p>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 space-y-0.5 scrollbar-hide">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as ViewType)}
              className={`
                 w-full flex items-center justify-between px-3 py-2 rounded-lg text-[15px] font-medium transition-all duration-200
                 ${currentView === item.id
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-white/10'
                }
               `}
            >
              <div className="flex items-center space-x-3">
                <item.icon className={`w-[18px] h-[18px] ${currentView === item.id ? 'opacity-100' : 'opacity-70'}`} />
                <span>{item.label}</span>
              </div>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200/50 dark:border-white/10 space-y-1">
          <button onClick={toggleTheme} className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-white/10 transition-colors text-sm font-medium">
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <button onClick={logout} className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-medium">
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-72 h-screen overflow-y-auto pt-20 md:pt-6 px-4 md:px-8 pb-8 scroll-smooth">
        <div className="max-w-6xl mx-auto">
          {renderContent()}
        </div>
      </main>

    </div>
  );
}
