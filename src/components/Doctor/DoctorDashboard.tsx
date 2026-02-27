import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar, Users, Clock, Stethoscope, ClipboardList, Search,
  LogOut, Sun, Moon, LayoutDashboard, Settings, Sparkles,
  X, ChevronRight, Activity, Download, BarChart3, Building2
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { PremiumButton } from '../ui/PremiumButton';
import { NeumorphicBadge } from '../ui/NeumorphicBadge';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Appointment, Prescription, HealthEntry, Patient } from '../../types';
import { appointmentService, patientService, doctorService, prescriptionService, healthEntryService } from '../../services/dataService';
import { AnimatePresence, motion } from 'framer-motion';
import { API_BASE_URL } from '../../config';
import DoctorWorkloadDashboard from './DoctorWorkloadDashboard';
import DoctorNetworkIntegration from './DoctorNetworkIntegration';
import PatientIntelligenceHub from './PatientIntelligenceHub';
import MedicalRecordUploadModal from '../Patient/MedicalRecordUploadModal';

type ViewType = 'overview' | 'appointments' | 'patients' | 'records' | 'settings' | 'workload' | 'network' | 'intelligence';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'workload', label: 'Load Balance', icon: BarChart3 },
  { id: 'intelligence', label: 'Intelligence Hub', icon: Sparkles },
  { id: 'network', label: 'My Network', icon: Building2 },
  { id: 'appointments', label: 'Schedule', icon: Calendar },
  { id: 'patients', label: 'My Patients', icon: Users },
  { id: 'records', label: 'Medical Records', icon: ClipboardList },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function DoctorDashboard() {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [regData, setRegData] = useState({
    specialization: '',
    qualifications: '',
    hospitalName: '',
    experience: 0,
    availability: 'Mon-Fri, 9AM-5PM',
    phone: ''
  });

  const { logout, user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [currentView, setCurrentView] = useState<ViewType>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [healthEntries, setHealthEntries] = useState<HealthEntry[]>([]);
  const [recordsSearch, setRecordsSearch] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  // Record Upload State
  const [isRecordUploadOpen, setIsRecordUploadOpen] = useState(false);
  const [uploadPatientId, setUploadPatientId] = useState<string>('');

  // Manual Entry State
  const [showManualModal, setShowManualModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'register' | 'book'>('register');
  const [manualPatient, setManualPatient] = useState({ full_name: '', age: '', gender: 'male' as any, phone: '' });
  const [manualAppointment, setManualAppointment] = useState({ patient_id: '', date: '', time: '', reason: '' });
  const [allPatients, setAllPatients] = useState<Patient[]>([]);

  // Settings State
  const [profileData, setProfileData] = useState({
    name: user?.displayName || '',
    specialization: '',
    hospital: '',
    phone: (user as any)?.phone || '',
    email: user?.email || ''
  });

  useEffect(() => {
    const checkDoctorProfile = async () => {
      const userId = (user as any)?.uid || (user as any)?.id;
      if (!userId) return;
      const userRole = (user as any)?.role;
      if (userRole === 'admin') return;

      const profileCacheKey = `doctor_profile_done_${userId}`;
      const cachedDone = localStorage.getItem(profileCacheKey);
      if (cachedDone === 'true') {
        try {
          const profile = await doctorService.getById(userId);
          if (profile?.specialization) {
            setProfileData({
              name: user?.displayName || '',
              specialization: profile.specialization,
              hospital: profile.hospital_name || (profile as any).hospitalName || '',
              phone: (user as any)?.phone || '',
              email: user?.email || ''
            });
          }
        } catch { /* silent */ }
        return;
      }

      try {
        const profile = await doctorService.getById(userId);
        if (profile && profile.specialization) {
          localStorage.setItem(profileCacheKey, 'true');
          setProfileData({
            name: user?.displayName || '',
            specialization: profile.specialization,
            hospital: profile.hospital_name || (profile as any).hospitalName || '',
            phone: (user as any)?.phone || '',
            email: user?.email || ''
          });
        } else {
          setShowProfileModal(true);
        }
      } catch (error: any) {
        if (error?.status === 404 || !navigator.onLine) setShowProfileModal(true);
      }
    };
    checkDoctorProfile();
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingProfile(true);
    try {
      await doctorService.completeProfile(regData);
      const userId = (user as any)?.uid || (user as any)?.id;
      if (userId) localStorage.setItem(`doctor_profile_done_${userId}`, 'true');
      setShowProfileModal(false);
      setProfileData({
        name: user?.displayName || '',
        specialization: regData.specialization,
        hospital: regData.hospitalName,
        phone: regData.phone || (user as any)?.phone || '',
        email: user?.email || ''
      });
    } catch (error) {
      alert('Failed: ' + (error as Error).message);
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  const loadPatients = useCallback(async () => {
    try {
      const patients = await patientService.getAll();
      setAllPatients(patients as Patient[]);
    } catch (error) { console.error(error); }
  }, []);

  const loadAppointments = useCallback(async () => {
    try {
      const data = await appointmentService.getAll();
      setAppointments(data);
    } catch (error) { console.error(error); }
  }, []);

  const loadPrescriptions = useCallback(async () => {
    try {
      const data = await prescriptionService.getAll();
      setPrescriptions(data);
    } catch (error) { console.error(error); }
  }, []);

  const loadHealthEntries = useCallback(async () => {
    try {
      // Avoid calling getAllGlobal to prevent 400 error. 
      // Doctors should view a specific patient's timeline instead of all global health entries.
      setHealthEntries([]);
    } catch (error) { console.error(error); }
  }, []);

  const upcomingAppointments = useMemo(() =>
    appointments.filter(a => a.status !== 'completed' && a.status !== 'cancelled')
      .sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime()),
    [appointments]
  );

  useEffect(() => {
    loadAppointments();
    loadPatients();
    loadPrescriptions();
    loadHealthEntries();
  }, [loadAppointments, loadPatients, loadPrescriptions, loadHealthEntries, currentView]);

  const filteredPatients = useMemo(() =>
    allPatients.filter(p => (p.full_name || p.name || '').toLowerCase().includes(patientSearch.toLowerCase())),
    [allPatients, patientSearch]
  );

  const handleManualRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newPatient = await patientService.addManual(manualPatient);
      setAllPatients(prev => [...prev, { ...newPatient, full_name: newPatient.full_name, name: newPatient.full_name } as Patient]);
      setManualAppointment(prev => ({ ...prev, patient_id: newPatient.id }));
      setActiveTab('book');
    } catch (err) { alert('Failed to register patient'); }
  };

  const handleManualBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await appointmentService.add({
        patient_id: manualAppointment.patient_id,
        appointment_date: `${manualAppointment.date}T${manualAppointment.time}`,
        reason: manualAppointment.reason,
        doctor_id: (user as any)?.uid || (user as any)?.id
      });
      setShowManualModal(false);
      loadAppointments();
      setManualAppointment({ patient_id: '', date: '', time: '', reason: '' });
    } catch (err) { alert('Failed to book appointment'); }
  };

  const updateAppointmentStatus = async (id: string, status: Appointment['status']) => {
    try {
      await appointmentService.updateStatus(id, status);
      loadAppointments();
    } catch (err) { alert('Failed updating status'); }
  };

  const renderOverview = () => (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Welcome, Dr. {profileData.name.split(' ')[0]}</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">You have {upcomingAppointments.length} appointments today.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <GlassCard className="p-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-100 dark:border-indigo-500/20 active:scale-[0.98] transition-transform">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-indigo-500 rounded-2xl shadow-lg shadow-indigo-500/20"><Users className="w-5 h-5 text-white" /></div>
            <span className="text-3xl font-bold text-gray-900 dark:text-white">{allPatients.length}</span>
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Patients</p>
        </GlassCard>
        <GlassCard className="p-6 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-100 dark:border-emerald-500/20 active:scale-[0.98] transition-transform">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-500/20"><Calendar className="w-5 h-5 text-white" /></div>
            <span className="text-3xl font-bold text-gray-900 dark:text-white">{upcomingAppointments.length}</span>
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Scheduled Today</p>
        </GlassCard>
        <GlassCard className="p-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-100 dark:border-amber-500/20 active:scale-[0.98] transition-transform sm:col-span-2 md:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-500 rounded-2xl shadow-lg shadow-amber-500/20"><Activity className="w-5 h-5 text-white" /></div>
            <span className="text-3xl font-bold text-gray-900 dark:text-white">{prescriptions.length}</span>
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Clinical Files</p>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-500" /> Recent Activity
            </h3>
            <button onClick={() => setCurrentView('appointments')} className="text-xs font-bold text-indigo-500 hover:underline transition-all">View All</button>
          </div>
          <div className="space-y-4">
            {upcomingAppointments.slice(0, 4).map(apt => (
              <div key={apt.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-white/5 group hover:bg-white dark:hover:bg-white/5 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                    {apt.patient?.full_name?.charAt(0) || 'P'}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800 dark:text-white">{apt.patient?.full_name}</h4>
                    <p className="text-xs text-gray-500 font-medium">{new Date(apt.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {apt.reason}</p>
                  </div>
                </div>
                <NeumorphicBadge variant={apt.status === 'confirmed' ? 'success' : 'info'} className="scale-90">
                  {apt.status}
                </NeumorphicBadge>
              </div>
            ))}
          </div>
        </GlassCard>

      </div>
    </div>
  );

  const renderAppointments = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Scheduled Appointments</h2>
        <PremiumButton variant="primary" size="sm" onClick={() => { setActiveTab('register'); setShowManualModal(true); }}>
          New Appointment
        </PremiumButton>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 md:gap-6">
        {appointments.map(apt => (
          <GlassCard key={apt.id} className="p-5 md:p-6 relative overflow-hidden group hover:scale-[1.01] transition-transform active:scale-[0.99]">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-lg shadow-sm">
                  {apt.patient?.full_name?.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-white text-sm md:text-base">{apt.patient?.full_name}</h3>
                  <p className="text-[10px] md:text-xs text-gray-500 font-medium">{apt.patient?.phone}</p>
                </div>
              </div>
              <NeumorphicBadge variant={apt.status === 'confirmed' ? 'success' : apt.status === 'pending' ? 'info' : 'neutral'} className="text-[10px]">
                {apt.status}
              </NeumorphicBadge>
            </div>
            <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-white/5">
              <div className="flex justify-between text-xs md:text-sm">
                <span className="text-gray-500 flex items-center gap-2 font-medium"><Calendar className="w-3.5 h-3.5" /> Date</span>
                <span className="font-bold text-gray-800 dark:text-white">{new Date(apt.appointment_date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-xs md:text-sm">
                <span className="text-gray-500 flex items-center gap-2 font-medium"><Clock className="w-3.5 h-3.5" /> Time</span>
                <span className="font-bold text-gray-800 dark:text-white">{new Date(apt.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-black/20 p-3 rounded-xl mt-2 font-medium italic">"{apt.reason}"</p>
            </div>
            <div className="mt-6 flex gap-3">
              {apt.status === 'pending' && (
                <PremiumButton className="flex-1 text-xs py-3" size="sm" onClick={() => updateAppointmentStatus(apt.id, 'confirmed')}>Approve</PremiumButton>
              )}
              {apt.status !== 'completed' && (
                <button onClick={() => updateAppointmentStatus(apt.id, 'completed')} className="flex-1 py-3 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl hover:bg-emerald-100 active:bg-emerald-200 transition-all">Mark Complete</button>
              )}
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );

  const renderPatients = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Active Patients</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search patients..." value={patientSearch} onChange={e => setPatientSearch(e.target.value)}
            className="pl-10 pr-4 py-2 rounded-xl bg-white/50 dark:bg-black/20 border border-transparent focus:border-indigo-500 transition-all w-64 text-sm" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredPatients.map(p => (
          <GlassCard key={p.id} className="p-5 flex items-center space-x-4 hover:shadow-xl transition-all group cursor-pointer" onClick={() => setCurrentView('records')}>
            <div className="w-14 h-14 rounded-2xl bg-indigo-500 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-indigo-500/30">
              {(p.full_name || p.name || 'P')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-800 dark:text-white truncate">{p.full_name || p.name}</h3>
              <p className="text-xs text-gray-500 font-medium mt-0.5">{p.phone || 'No Contact'}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-500 transition-colors" />
          </GlassCard>
        ))}
      </div>
    </div>
  );

  const renderRecords = () => {
    const combinedRecords = [
      ...prescriptions.map(p => ({ ...p, recordType: 'prescription' })),
      ...healthEntries.map(e => ({ ...e, recordType: 'healthEntry' }))
    ].sort((a, b) => new Date(b.created_at || (b as any).prescription_date || (b as any).date).getTime() - new Date(a.created_at || (a as any).prescription_date || (a as any).date).getTime());

    const filteredRecords = combinedRecords.filter(r => {
      const patientName = (r as any).patient?.name || (r as any).patientId?.name || (r as any).patient?.full_name || '';
      return !recordsSearch || `${patientName} ${(r as any).ai_summary || ''} ${(r as any).diagnosis || ''} ${(r as any).title || ''}`.toLowerCase().includes(recordsSearch.toLowerCase());
    });

    return (
      <div className="space-y-6 pb-12">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Central Medical Archive</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Found {filteredRecords.length} digitized clinical files</p>
          </div>
          <div className="flex items-center gap-3">
            <PremiumButton onClick={() => setIsRecordUploadOpen(true)} variant="primary" size="sm" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> AI Smart Upload
            </PremiumButton>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search records..." value={recordsSearch} onChange={e => setRecordsSearch(e.target.value)}
                className="pl-10 pr-4 py-2 border-none bg-white/50 dark:bg-black/20 rounded-xl w-64 text-sm" />
            </div>
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="py-20 text-center">
            <ClipboardList className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <p className="text-gray-500 font-medium">No records matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecords.map((record: any) => {
              const isPres = record.recordType === 'prescription';
              const pName = record.patient?.full_name || record.patient?.name || record.patientId?.name || 'Patient';
              return (
                <GlassCard key={record.id} className={`p-6 hover:shadow-2xl transition-all border-t-4 ${isPres ? 'border-t-purple-500' : 'border-t-indigo-500'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-gray-900 dark:text-white text-base">{pName}</h3>
                    <NeumorphicBadge variant={isPres ? 'info' : 'success'}>
                      {isPres ? 'Prescription' : (record.type || 'Record')}
                    </NeumorphicBadge>
                  </div>
                  <div className="bg-gray-50 dark:bg-black/20 p-4 rounded-2xl mb-4 min-h-[80px]">
                    <p className="text-xs font-bold text-gray-400 tracking-tight mb-1">{isPres ? 'Diagnosis' : (record.title || 'Summary')}</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                      {isPres ? (record.diagnosis || 'No recorded diagnosis') : (record.description || 'Processed medical file')}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/5">
                    <span className="text-[10px] font-medium text-gray-400">{new Date(record.created_at || record.prescription_date).toLocaleDateString()}</span>
                    <button onClick={() => setSelectedRecord(record)} className="text-xs font-bold text-indigo-500 hover:text-indigo-600 transition-colors border-none p-0 bg-transparent">View Deep Analysis</button>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    switch (currentView) {
      case 'overview': return renderOverview();
      case 'appointments': return renderAppointments();
      case 'patients': return renderPatients();
      case 'records': return renderRecords();
      case 'workload': return <DoctorWorkloadDashboard />;
      case 'intelligence': return <PatientIntelligenceHub />;
      case 'network': return <DoctorNetworkIntegration />;
      default: return renderOverview();
    }
  };



  return (
    <div className="flex min-h-[100dvh] bg-transparent overflow-x-hidden font-sans">
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-gray-100/80 dark:bg-[#1C1C1E]/80 backdrop-blur-2xl border-r border-gray-200/50 dark:border-white/10
        transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out
        flex flex-col
      `}>
        <div className="p-6 pb-2">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
              <Stethoscope className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Sehat Connect</span>
          </div>
          <div className="px-4 py-3 bg-white/50 dark:bg-white/5 rounded-2xl border border-gray-200/50 dark:border-white/5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-[10px] font-bold uppercase">
              {profileData.name ? profileData.name.split(' ').map(n => n[0]).join('') : 'D'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{profileData.name || 'Clinical Specialist'}</p>
              <p className="text-[10px] text-gray-500 font-bold uppercase truncate">{profileData.specialization || 'Onboarding...'}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button key={item.id} onClick={() => { setCurrentView(item.id as ViewType); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium transition-all ${currentView === item.id ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-white/10'}`}>
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200/50 dark:border-white/10 flex flex-col gap-2">
          <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/5 transition-all">
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {isDark ? 'Daylight' : 'Night Mode'}
          </button>
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 md:ml-72 min-h-[100dvh] p-4 md:p-8">
        <div className="max-w-6xl mx-auto pt-12 md:pt-0">
          {renderContent()}
        </div>
      </main>

      {/* Record Analysis Detail View */}
      <AnimatePresence>
        {selectedRecord && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={() => setSelectedRecord(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200 dark:border-white/10">
              <div className="p-8 bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-between">
                <div className="text-white">
                  <h3 className="text-2xl font-bold">Clinical Analysis</h3>
                  <p className="text-white/70 text-xs font-bold uppercase tracking-wide mt-1">{selectedRecord.recordType === 'prescription' ? 'Digital Prescription' : 'Medical File'}</p>
                </div>
                <button onClick={() => setSelectedRecord(null)} className="p-3 bg-white/20 hover:bg-white/30 rounded-2xl text-white transition-all"><X className="w-6 h-6" /></button>
              </div>
              <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-3xl">🗂️</div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Patient Identity</p>
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white">{selectedRecord.patient?.full_name || selectedRecord.patient?.name || selectedRecord.patientId?.name || 'Assigned Patient'}</h4>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-xs font-bold text-indigo-500 uppercase tracking-wide">AI Digitized Insights</p>
                  <div className="p-6 bg-indigo-500/5 rounded-3xl border border-indigo-100 dark:border-indigo-500/20">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                      {selectedRecord.ai_summary || selectedRecord.description || 'Our clinical AI engine has processed this document. No anomalies detected.'}
                    </p>
                  </div>
                </div>

                {/* Download PDF button if exists */}
                {(selectedRecord as any).pdfUrl && (
                  <a href={`${API_BASE_URL}${(selectedRecord as any).pdfUrl}`} target="_blank" rel="noreferrer"
                    className="w-full flex items-center justify-center gap-3 py-4 bg-gray-900 dark:bg-white text-white dark:text-black rounded-2xl font-bold text-sm hover:opacity-90 transition-all uppercase tracking-wide">
                    <Download className="w-5 h-5" /> View Original Document
                  </a>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Upload Modal */}
      <MedicalRecordUploadModal
        isOpen={isRecordUploadOpen}
        onClose={() => { setIsRecordUploadOpen(false); setUploadPatientId(''); }}
        patientId={uploadPatientId}
        onUploadComplete={() => {
          loadHealthEntries();
          setIsRecordUploadOpen(false);
          setUploadPatientId('');
        }}
      >
        {!uploadPatientId && (
          <div className="mb-8 p-6 bg-indigo-500/5 rounded-3xl border border-indigo-100 dark:border-indigo-500/20">
            <label className="block text-xs font-bold text-indigo-500 uppercase tracking-wide mb-4">Assign Extraction to Patient</label>
            <select value={uploadPatientId} onChange={e => setUploadPatientId(e.target.value)}
              className="w-full p-4 rounded-2xl bg-white dark:bg-black border border-indigo-100 dark:border-white/10 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-bold">
              <option value="">-- Choose Patient for AI Processing --</option>
              {allPatients.map(p => p && (
                <option key={p.id} value={p.id}>{p.full_name || p.name}</option>
              ))}
            </select>
          </div>
        )}
      </MedicalRecordUploadModal>

      {/* Manual Entry Modal */}
      <AnimatePresence>
        {showManualModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
              className="bg-white dark:bg-[#1C1C1E] rounded-[3rem] w-full max-w-lg overflow-hidden shadow-2xl border border-gray-200 dark:border-white/10">
              <div className="flex border-b border-gray-100 dark:border-white/10 p-2">
                <button onClick={() => setActiveTab('register')} className={`flex-1 p-4 text-xs font-bold uppercase tracking-wide rounded-2xl transition-all ${activeTab === 'register' ? 'bg-indigo-500 text-white' : 'text-gray-400'}`}>1. Registry</button>
                <button onClick={() => setActiveTab('book')} className={`flex-1 p-4 text-xs font-bold uppercase tracking-wide rounded-2xl transition-all ${activeTab === 'book' ? 'bg-indigo-500 text-white' : 'text-gray-400'}`}>2. Booking</button>
                <button onClick={() => setShowManualModal(false)} className="p-4 text-gray-400"><X className="w-6 h-6" /></button>
              </div>
              <div className="p-8">
                {activeTab === 'register' ? (
                  <form onSubmit={handleManualRegister} className="space-y-6">
                    <input required placeholder="FULL NAME" value={manualPatient.full_name} onChange={e => setManualPatient({ ...manualPatient, full_name: e.target.value })} className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-black border-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold uppercase placeholder:text-gray-300" />
                    <div className="grid grid-cols-2 gap-4">
                      <input required type="number" placeholder="AGE" value={manualPatient.age} onChange={e => setManualPatient({ ...manualPatient, age: e.target.value })} className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-black border-none font-bold uppercase" />
                      <select value={manualPatient.gender} onChange={e => setManualPatient({ ...manualPatient, gender: e.target.value as any })} className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-black border-none font-bold uppercase">
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                    <input required placeholder="PHONE NUMBER" value={manualPatient.phone} onChange={e => setManualPatient({ ...manualPatient, phone: e.target.value })} className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-black border-none font-medium uppercase tracking-wide" />
                    <PremiumButton type="submit" className="w-full py-5 rounded-[2rem] shadow-2xl shadow-indigo-500/30">Register New Patient</PremiumButton>
                  </form>
                ) : (
                  <form onSubmit={handleManualBook} className="space-y-6">
                    <select required value={manualAppointment.patient_id} onChange={e => setManualAppointment({ ...manualAppointment, patient_id: e.target.value })} className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-black border-none font-bold uppercase">
                      <option value="">-- SELECT PATIENT --</option>
                      {allPatients.map(p => <option key={p.id} value={p.id}>{p.full_name || p.name}</option>)}
                    </select>
                    <div className="grid grid-cols-2 gap-4">
                      <input required type="date" value={manualAppointment.date} onChange={e => setManualAppointment({ ...manualAppointment, date: e.target.value })} className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-black border-none font-bold" />
                      <input required type="time" value={manualAppointment.time} onChange={e => setManualAppointment({ ...manualAppointment, time: e.target.value })} className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-black border-none font-bold" />
                    </div>
                    <input required placeholder="REASON FOR VISIT" value={manualAppointment.reason} onChange={e => setManualAppointment({ ...manualAppointment, reason: e.target.value })} className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-black border-none font-medium uppercase tracking-wide" />
                    <PremiumButton type="submit" className="w-full py-5 rounded-[2rem] shadow-2xl shadow-indigo-500/30">Confirm Appointment</PremiumButton>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Profile Modal */}
      <AnimatePresence>
        {showProfileModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-[#1C1C1E] rounded-[3.5rem] p-10 w-full max-w-2xl shadow-2xl border border-gray-200 dark:border-white/10">
              <div className="text-center space-y-4 mb-10">
                <div className="w-20 h-20 bg-emerald-500 rounded-3xl mx-auto flex items-center justify-center text-white text-3xl shadow-2xl shadow-emerald-500/40">🩺</div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Physician Onboarding</h2>
                <p className="text-gray-500 font-medium text-xs">Verify your identity & clinical specialty</p>
              </div>
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <input required placeholder="SPECIALIZATION" value={regData.specialization} onChange={e => setRegData({ ...regData, specialization: e.target.value })} className="w-full p-5 rounded-3xl bg-gray-50 dark:bg-black font-bold uppercase" />
                  <input required placeholder="QUALIFICATIONS" value={regData.qualifications} onChange={e => setRegData({ ...regData, qualifications: e.target.value })} className="w-full p-5 rounded-3xl bg-gray-50 dark:bg-black font-bold uppercase" />
                  <input required placeholder="HOSPITAL NAME" value={regData.hospitalName} onChange={e => setRegData({ ...regData, hospitalName: e.target.value })} className="w-full p-5 rounded-3xl bg-gray-50 dark:bg-black font-bold uppercase" />
                  <input required type="number" placeholder="EXP (YEARS)" value={regData.experience || ''} onChange={e => setRegData({ ...regData, experience: parseInt(e.target.value) || 0 })} className="w-full p-5 rounded-3xl bg-gray-50 dark:bg-black font-bold uppercase" />
                </div>
                <input required placeholder="AVAILABILITY (e.g. MON-FRI)" value={regData.availability} onChange={e => setRegData({ ...regData, availability: e.target.value })} className="w-full p-5 rounded-3xl bg-gray-50 dark:bg-black font-medium uppercase tracking-wide" />
                <PremiumButton type="submit" isLoading={isSubmittingProfile} className="w-full py-6 rounded-full text-lg shadow-2xl shadow-emerald-500/30">Finalize Clinical Profile</PremiumButton>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
