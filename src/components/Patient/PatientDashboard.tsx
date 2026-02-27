import { useState, useEffect, useCallback } from 'react';
import { LucideIcon } from 'lucide-react';
import {
  FileText, Calendar, Bell, MessageSquare, LogOut, Sun, Moon,
  Activity, Heart, Shield, MapPin, TrendingUp, Clock, Users, Link, LayoutDashboard, Settings, Menu, X, ChevronRight, Target, Sparkles, Share2
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
import UnifiedTimeline from './UnifiedTimeline';
import HealthTrends from './HealthTrends';
import FamilyManagement from './FamilyManagement';
import SchemeMatcher from './SchemeMatcher';
import HealthPlans from './HealthPlans';
import SymptomTracker from './SymptomTracker';
import { prescriptionService, appointmentService, reminderService, healthEntryService, insuranceService, familyService, healthProfileService } from '../../services/dataService';
import { calculateHealthScore } from '../../utils/healthScoreUtils';
import { useLanguage } from '../../contexts/LanguageContext';
import MedicalRecordUploadModal from './MedicalRecordUploadModal';

type ViewType =
  | 'overview' | 'prescriptions' | 'appointments' | 'reminders' | 'chat'
  | 'health-summary' | 'risk-score' | 'secure-share' | 'hospitals'
  | 'insurance' | 'timeline' | 'trends' | 'family' | 'settings' | 'schemes' | 'health-plans' | 'symptoms';

const NAV_ITEMS: { id: ViewType; label: string; icon: LucideIcon; section?: string; badge?: string; badgeLabel?: string }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  // Core
  { id: 'prescriptions', label: 'Prescriptions', icon: FileText, section: 'Core' },
  { id: 'appointments', label: 'Appointments', icon: Calendar, section: 'Core' },
  { id: 'reminders', label: 'Reminders', icon: Bell, section: 'Core' },
  { id: 'timeline', label: 'Health Records', icon: Clock, section: 'Core' },
  { id: 'health-summary', label: 'Health Summary', icon: Heart, section: 'Core' },
  { id: 'symptoms', label: 'Symptom Tracker', icon: Activity, section: 'Core' },
  // AI-Powered
  { id: 'chat', label: 'AI Chat', icon: MessageSquare, section: 'AI-Powered', badge: 'info', badgeLabel: 'New' },
  { id: 'health-plans', label: 'Health Plans', icon: Target, section: 'AI-Powered', badge: 'success', badgeLabel: 'AI' },
  { id: 'risk-score', label: 'Risk Score', icon: Activity, section: 'AI-Powered', badge: 'warning', badgeLabel: 'Beta' },
  // Advanced
  { id: 'secure-share', label: 'Secure Share', icon: Link, section: 'Advanced' },
  { id: 'hospitals', label: 'Hospitals', icon: MapPin, section: 'Advanced' },
  { id: 'insurance', label: 'Insurance', icon: Shield, section: 'Advanced' },
  // Big Brain
  { id: 'trends', label: 'Health Trends', icon: TrendingUp, section: 'Big Brain' },
  { id: 'family', label: 'Family', icon: Users, section: 'Big Brain' },
  { id: 'schemes', label: 'Scheme Matcher', icon: Shield, section: 'Big Brain', badge: 'info', badgeLabel: 'Beta' },
  { id: 'settings', label: 'Settings', icon: Settings, section: 'Advanced' },
];

export default function PatientDashboard() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { lang, setLang, t } = useLanguage();
  const [activeView, setActiveView] = useState<ViewType>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState({ prescriptions: 0, appointments: 0, reminders: 0, timeline: 0, insurance: 0, family: 0 });
  const [healthScore, setHealthScore] = useState(0);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  const loadStats = useCallback(async () => {
    setIsLoadingStats(true);
    const uid = user?.uid || 'anonymous';
    try {
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
        appointments: appointments.filter((a: { status: string }) => a.status !== 'cancelled').length,
        reminders: reminders.filter((r: { is_active: boolean }) => r.is_active).length,
        timeline: timeline.length,
        insurance: insurance.length,
        family: family.length,
      });

      const profile = await healthProfileService.get(uid);
      if (profile) {
        setHealthScore(calculateHealthScore(profile));
      } else {
        setHealthScore(85); // Default fallback
      }
    } catch (e) {
      console.error("Failed to load stats", e);
    } finally {
      setIsLoadingStats(false);
    }
  }, [user]);

  useEffect(() => {
    loadStats();
  }, [loadStats, activeView]);

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
                return <UnifiedTimeline />;
              case 'trends':
                return <HealthTrends />;
              case 'family':
                return <FamilyManagement />;
              case 'schemes':
                return <SchemeMatcher />;
              case 'health-plans':
                return <HealthPlans />;
              case 'symptoms':
                return <SymptomTracker />;
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
      id: '', // Store profile ID
      full_name: user?.displayName || '',
      email: user?.email || '',
      age: '',
      blood_group: 'O+',
      height: '',
      weight: '',
      bp_systolic: 120,
      bp_diastolic: 80,
      sugar_level: 100
    });

    useEffect(() => {
      const fetchProfile = async () => {
        if (!user?.uid) return;
        const profile = await healthProfileService.get(user.uid);
        if (profile) {
          setPatientProfile({
            id: profile.id,
            full_name: user.displayName || '',
            email: user.email || '',
            age: String(profile.age || ''),
            blood_group: profile.blood_group || 'O+',
            height: String(profile.height || ''),
            weight: String(profile.weight || ''),
            bp_systolic: profile.bp_systolic || 120,
            bp_diastolic: profile.bp_diastolic || 80,
            sugar_level: profile.sugar_level || 100
          });
        }
      };
      fetchProfile();
    }, []);

    const handleSaveProfile = async () => {
      if (!user?.uid) return;
      try {
        await healthProfileService.save({
          id: patientProfile.id,
          patient_id: user.uid,
          age: Number(patientProfile.age),
          blood_group: patientProfile.blood_group,
          height: Number(patientProfile.height),
          weight: Number(patientProfile.weight),
          bp_systolic: patientProfile.bp_systolic,
          bp_diastolic: patientProfile.bp_diastolic,
          sugar_level: patientProfile.sugar_level,
          allergies: [],
          chronic_conditions: [],
          emergency_contacts: []
        });

        // Refresh dashboard stats and score
        await loadStats();
        alert(t('Profile updated successfully!', 'प्रोफ़ाइल सफलतापूर्वक अपडेट की गई!'));
      } catch (error) {
        console.error('Failed to save profile:', error);
        alert(t('Failed to update profile. Please try again.', 'प्रोफ़ाइल अपडेट करने में विफल। कृपया फिर से प्रयास करें।'));
      }
    };

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">{t('Settings & Preferences', 'सेटिंग्स और प्राथमिकताएं')}</h2>

        {/* Personal Details */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-indigo-500" />
            {t('Personal Information', 'व्यक्तिगत जानकारी')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{t('Full Name', 'पूरा नाम')}</label>
              <input type="text" value={patientProfile.full_name} onChange={e => setPatientProfile({ ...patientProfile, full_name: e.target.value })} className="w-full p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-white/10 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{t('Email', 'ईमेल')}</label>
              <input type="email" value={patientProfile.email} disabled className="w-full p-3 rounded-xl bg-gray-100/50 dark:bg-slate-800/30 border border-gray-100 dark:border-white/5 text-gray-500 cursor-not-allowed" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{t('Age', 'उम्र')}</label>
                <input type="number" value={patientProfile.age} onChange={e => setPatientProfile({ ...patientProfile, age: e.target.value })} className="w-full p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-white/10 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{t('Blood Group', 'रक्त समूह')}</label>
                <select value={patientProfile.blood_group} onChange={e => setPatientProfile({ ...patientProfile, blood_group: e.target.value })} className="w-full p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-white/10 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all">
                  <option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>O+</option><option>O-</option><option>AB+</option><option>AB-</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{t('Height (cm)', 'ऊंचाई (सेमी)')}</label>
                <input type="number" value={patientProfile.height} onChange={e => setPatientProfile({ ...patientProfile, height: e.target.value })} className="w-full p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-white/10 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{t('Weight (kg)', 'वजन (किग्रा)')}</label>
                <input type="number" value={patientProfile.weight} onChange={e => setPatientProfile({ ...patientProfile, weight: e.target.value })} className="w-full p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-white/10 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" />
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <PremiumButton variant="primary" size="md" onClick={handleSaveProfile}>
              {t('Save Profile', 'प्रोफ़ाइल सहेजें')}
            </PremiumButton>
          </div>
        </GlassCard>

        {/* Preferences */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center">
            <Settings className="w-5 h-5 mr-2 text-gray-500" />
            {t('App Preferences', 'ऐप प्राथमिकताएं')}
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer" onClick={toggleTheme}>
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-amber-500/10 text-amber-600'}`}>
                  {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{t('Dark Mode', 'डार्क मोड')}</p>
                  <p className="text-xs text-gray-500">{t('Adjust appearance', 'दिखावट बदलें')}</p>
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
                  <p className="font-semibold text-gray-900 dark:text-white">{t('Notifications', 'सूचनाएं')}</p>
                  <p className="text-xs text-gray-500">{t('Medicine & appointments', 'दवा और अपॉइंटमेंट')}</p>
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
          {t('Welcome back', 'वापस स्वागत है')}, {user?.displayName?.split(' ')[0] || t('Patient', 'मरीज')}
          <NeumorphicBadge variant="success" className="text-xs py-0.5">{t('PRO', 'प्रो')}</NeumorphicBadge>
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-lg">{t('Your health summary for today', 'आज के लिए आपका स्वास्थ्य सारांश')}</p>
      </div>

      {/* Stats Grid - Apple "Bento" Style */}
      <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Large Primary Card */}
        <MotionItem className="col-span-2 row-span-2">
          <div
            onClick={() => !isLoadingStats && setActiveView('health-summary')}
            className={`h-full cursor-pointer relative overflow-hidden rounded-[2rem] p-6 shadow-xl transition-all duration-300 group ${isLoadingStats
              ? 'bg-gray-200 dark:bg-slate-800 animate-pulse cursor-wait'
              : 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98]'
              }`}
          >
            {!isLoadingStats && (
              <>
                <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div>
                    <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md">
                      <Heart className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-1">{t('Health Score', 'स्वास्थ्य स्कोर')}</h3>
                    <p className="text-indigo-100">{t('Overall Wellness', 'समग्र विकास')}</p>
                  </div>

                  <div className="flex items-end justify-between">
                    <span className="text-6xl font-bold tracking-tighter">{healthScore}</span>
                    <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-md">
                      {t('+2% this week', 'इस सप्ताह +2%')}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </MotionItem>

        {[
          { label: 'Prescriptions', value: stats.prescriptions, color: 'text-blue-500', bg: 'bg-blue-500/10', icon: FileText, view: 'prescriptions' as ViewType },
          { label: 'Appointments', value: stats.appointments, color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: Calendar, view: 'appointments' as ViewType },
          { label: 'Reminders', value: stats.reminders, color: 'text-orange-500', bg: 'bg-orange-500/10', icon: Bell, view: 'reminders' as ViewType },
          { label: 'Timeline', value: stats.timeline, color: 'text-purple-500', bg: 'bg-purple-500/10', icon: Clock, view: 'timeline' as ViewType },
        ].map((stat) => (
          <MotionItem key={stat.label} className="col-span-1">
            <GlassCard onClick={() => !isLoadingStats && setActiveView(stat.view)}
              className={`p-4 md:p-5 h-36 md:h-40 flex flex-col justify-between cursor-pointer transition-colors group relative overflow-hidden ${isLoadingStats ? 'animate-pulse bg-gray-100/50 dark:bg-white/5' : 'hover:bg-white/80 dark:hover:bg-slate-800/80'
                }`}>
              {!isLoadingStats ? (
                <>
                  <div className="flex justify-between items-start">
                    <div className={`p-2 md:p-2.5 rounded-xl ${stat.bg} ${stat.color}`}>
                      <stat.icon className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 group-hover:text-gray-400 dark:group-hover:text-gray-400 transition-colors" />
                  </div>
                  <div>
                    <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{stat.value}</p>
                    <p className="text-[10px] md:text-sm text-gray-500 font-medium">{t(stat.label,
                      stat.label === 'Prescriptions' ? 'नुस्खे' :
                        stat.label === 'Appointments' ? 'अपॉइंटमेंट' :
                          stat.label === 'Reminders' ? 'रिमाइंडर' :
                            stat.label === 'Timeline' ? 'टाइमलाइन' : stat.label
                    )}</p>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gray-200 dark:bg-slate-700"></div>
                  <div className="space-y-2">
                    <div className="h-5 w-10 md:h-6 md:w-12 bg-gray-200 dark:bg-slate-700 rounded-md"></div>
                    <div className="h-3 w-16 md:h-4 md:w-20 bg-gray-200 dark:bg-slate-700 rounded-md"></div>
                  </div>
                </div>
              )}
            </GlassCard>
          </MotionItem>
        ))}
      </StaggerContainer>

      {/* Quick Actions - iOS Action Icons */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 ml-1">{t('Quick Actions', 'त्वरित कार्रवाई')}</h3>
        <GlassCard className="p-2">
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            {[
              { label: 'Upload Files', hindiLabel: 'फ़ाइलें अपलोड करें', icon: FileText, color: 'bg-blue-500', view: 'prescriptions' as ViewType },
              { label: 'Add Records', hindiLabel: 'रिकॉर्ड जोड़ें', icon: Sparkles, color: 'bg-amber-500', action: () => setIsRecordModalOpen(true) },
              { label: 'AI Chat', hindiLabel: 'एआई चैट', icon: MessageSquare, color: 'bg-indigo-500', view: 'chat' as ViewType },
              { label: 'Risk Score', hindiLabel: 'जोखिम स्कोर', icon: Activity, color: 'bg-rose-500', view: 'risk-score' as ViewType },
              { label: 'Hospitals', hindiLabel: 'अस्पताल', icon: MapPin, color: 'bg-red-500', view: 'hospitals' as ViewType },
              {
                label: 'Emergency ID',
                hindiLabel: 'आपातकालीन आईडी',
                icon: Share2,
                color: 'bg-orange-600',
                action: () => {
                  const url = `${window.location.origin}/emergency/${user?.uid}`;
                  navigator.clipboard.writeText(url);
                  alert(t('Emergency Profile Link copied to clipboard!', 'आपातकालीन प्रोफ़ाइल लिंक क्लिपबोर्ड पर कॉपी किया गया!'));
                  window.open(url, '_blank');
                }
              },
            ].map((action) => (
              <MotionItem key={action.label}>
                <button
                  onClick={() => action.action ? action.action() : action.view ? setActiveView(action.view) : null}
                  className="w-full p-4 rounded-2xl md:rounded-2xl hover:bg-white/60 dark:hover:bg-white/5 transition-all flex items-center space-x-4 group text-left border border-transparent hover:border-indigo-500/10 active:scale-[0.98]"
                >
                  <div className={`w-11 h-11 rounded-xl ${action.color} flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform`}>
                    <action.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-gray-900 dark:text-gray-100">{t(action.label, action.hindiLabel)}</span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{t('Tap to expand', 'विस्तार के लिए टैप करें')}</span>
                  </div>
                </button>
              </MotionItem>
            ))}
          </StaggerContainer>
        </GlassCard>
      </div>

      <MedicalRecordUploadModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        patientId={user?.uid || ''}
        onUploadComplete={loadStats}
      />
    </div>
  );

  // Group nav items
  let lastSection = '';

  return (
    <div className="flex min-h-[100dvh] bg-transparent overflow-x-hidden font-sans">

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
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{t('System Operational', 'सिस्टम चालू है')}</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 space-y-0.5 scrollbar-hide">
          <div className="px-3 mb-4 flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('Language', 'भाषा')}</span>
            <div className="flex bg-gray-200/50 dark:bg-white/5 p-0.5 rounded-lg">
              <button
                onClick={() => setLang('en')}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${lang === 'en' ? 'bg-white dark:bg-slate-800 text-indigo-500 shadow-sm' : 'text-slate-500'}`}
              >
                EN
              </button>
              <button
                onClick={() => setLang('hi')}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${lang === 'hi' ? 'bg-white dark:bg-slate-800 text-indigo-500 shadow-sm' : 'text-slate-500'}`}
              >
                हिं
              </button>
            </div>
          </div>

          {NAV_ITEMS.map((item) => {
            const translatedLabel = t(item.label,
              item.id === 'overview' ? 'अवलोकन' :
                item.id === 'prescriptions' ? 'नुस्खे' :
                  item.id === 'appointments' ? 'अपॉइंटमेंट' :
                    item.id === 'reminders' ? 'रिमाइंडर' :
                      item.id === 'health-summary' ? 'स्वास्थ्य सारांश' :
                        item.id === 'chat' ? 'एआई चैट' :
                          item.id === 'health-plans' ? 'स्वास्थ्य योजनाएं' :
                            item.id === 'risk-score' ? 'जोखिम स्कोर' :
                              item.id === 'secure-share' ? 'सुरक्षित शेयर' :
                                item.id === 'hospitals' ? 'अस्पताल' :
                                  item.id === 'insurance' ? 'बीमा' :
                                    item.id === 'timeline' ? 'टाइमलाइन' :
                                      item.id === 'trends' ? 'स्वास्थ्य रुझान' :
                                        item.id === 'family' ? 'परिवार' :
                                          item.id === 'schemes' ? 'योजना मैचर' :
                                            item.id === 'settings' ? 'सेटिंग्स' : item.label
            );

            const translatedSection = item.section ? t(item.section,
              item.section === 'Core' ? 'मुख्य' :
                item.section === 'AI-Powered' ? 'एआई-संचालित' :
                  item.section === 'Advanced' ? 'उन्नत' :
                    item.section === 'Big Brain' ? 'स्मार्ट फीचर्स' : item.section
            ) : undefined;

            const isSection = translatedSection && translatedSection !== lastSection;
            if (isSection) lastSection = translatedSection!;

            return (
              <div key={item.id}>
                {isSection && (
                  <div className="px-3 mt-6 mb-2 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    {translatedSection}
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
                    <span>{translatedLabel}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${activeView === item.id
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                      }`}>
                      {t(item.badgeLabel || '',
                        item.badgeLabel === 'New' ? 'नया' :
                          item.badgeLabel === 'AI' ? 'एआई' :
                            item.badgeLabel === 'Beta' ? 'बीटा' : item.badgeLabel || ''
                      )}
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
            <span>{t('Sign Out', 'साइन आउट')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-72 min-h-[100dvh] pt-20 md:pt-6 px-4 md:px-8 pb-8 scroll-smooth">
        <div className="max-w-6xl mx-auto">
          {renderView()}
        </div>
      </main>

    </div>
  );
}
