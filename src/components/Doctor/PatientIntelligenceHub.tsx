import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';

import { StaggerContainer, MotionItem } from '../ui/MotionComponents';
import { GlassCard } from '../ui/GlassCard';
import { PremiumButton } from '../ui/PremiumButton';
import { NeumorphicBadge } from '../ui/NeumorphicBadge';
import { Brain, Activity, Clock, AlertTriangle, ChevronRight, User, Pill, Stethoscope, Zap, FilePlus } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Appointment, Prescription, HealthProfile, HealthEntry } from '../../types';
import { healthProfileService, healthEntryService } from '../../services/dataService';
import { getGeminiResponse } from '../../services/geminiService';
import { SmartPrescribingModal } from './SmartPrescribingModal';
import MedicalRecordUploadModal from '../Patient/MedicalRecordUploadModal';
import HealthTimeline from '../Patient/HealthTimeline';

interface PatientIntelligenceHubProps {
    patients: any[];
    allAppointments: Appointment[];
    allPrescriptions: Prescription[];
}

export default function PatientIntelligenceHub({ patients, allAppointments, allPrescriptions }: PatientIntelligenceHubProps) {
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
    const [healthProfile, setHealthProfile] = useState<HealthProfile | null>(null);
    const [healthEntries, setHealthEntries] = useState<HealthEntry[]>([]);
    const [loadingData, setLoadingData] = useState(false);
    const [aiSummary, setAiSummary] = useState<string | null>(null);
    const [loadingAi, setLoadingAi] = useState(false);
    const [isPrescribingModalOpen, setIsPrescribingModalOpen] = useState(false);
    const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'records'>('overview');

    useEffect(() => {
        if (!selectedPatientId) return;

        const fetchData = async () => {
            setLoadingData(true);
            try {
                const profile = await healthProfileService.get(selectedPatientId);
                const entries = await healthEntryService.getAll(selectedPatientId);
                setHealthProfile(profile);
                setHealthEntries(entries);
            } catch (err) {
                console.error("Failed to fetch patient data", err);
            } finally {
                setLoadingData(false);
            }
        };

        fetchData();
        setAiSummary(null); // Reset summary
    }, [selectedPatientId]);

    const patientAppointments = useMemo(() => allAppointments.filter(a => a.patient_id === selectedPatientId).sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime()), [allAppointments, selectedPatientId]);
    const patientPrescriptions = useMemo(() => allPrescriptions.filter(p => p.patient_id === selectedPatientId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()), [allPrescriptions, selectedPatientId]);

    // Generate AI Summary
    useEffect(() => {
        if (!selectedPatientId || loadingData) return;
        const patient = patients.find(p => p.id === selectedPatientId);

        const generateAi = async () => {
            setLoadingAi(true);
            try {
                const prompt = `
You are an expert clinical AI assistant. Summarize the following patient's clinical status in 2-3 short sentences.
Name: ${patient?.name || 'Unknown'}
Age: ${healthProfile?.age || 'Unknown'}
Chronic Conditions: ${healthProfile?.chronic_conditions?.join(', ') || 'None reported'}
Recent Vitals: BP ${healthProfile?.bp_systolic || '?'}/${healthProfile?.bp_diastolic || '?'} mmHg, Sugar ${healthProfile?.sugar_level || '?'} mg/dL

Recent Visits: ${patientAppointments.slice(0, 2).map(a => `${a.appointment_date} (${a.reason})`).join(', ')}
Recent Meds: ${patientPrescriptions.slice(0, 2).map(p => p.medicines.map(m => m.name).join(', ')).join('; ')}

Format requirements: No markdown headers. Provide a brief objective summary paragraph, followed by a second paragraph starting with "**Recommendation:**" highlighting any action the doctor should take immediately based on the provided data. Make it sound extremely professional, just like a true medical record summary.
                `;
                const res = await getGeminiResponse(prompt);
                setAiSummary(res);
            } catch (err) {
                console.error("Failed to get AI summary", err);
                setAiSummary("Unable to generate AI summary at this time.");
            } finally {
                setLoadingAi(false);
            }
        };

        const t = setTimeout(generateAi, 500);
        return () => clearTimeout(t);
    }, [selectedPatientId, loadingData, healthProfile, patients, patientAppointments, patientPrescriptions]);

    const getTimelineIcon = (type: string) => {
        switch (type) {
            case 'appointment': return <Stethoscope className="w-5 h-5 text-indigo-500" />;
            case 'prescription': return <Pill className="w-5 h-5 text-purple-500" />;
            default: return <Clock className="w-5 h-5 text-gray-500" />;
        }
    };

    const sortedPatients = useMemo(() => {
        return [...patients].sort((a, b) => a.name.localeCompare(b.name));
    }, [patients]);

    if (!selectedPatientId) {
        return (
            <div className="space-y-6 pb-12">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Patient Intelligence Hub</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Select a patient to view AI-powered clinical insights</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortedPatients.map((patient) => (
                        <GlassCard
                            key={patient.id}
                            onClick={() => setSelectedPatientId(patient.id)}
                            className="p-5 cursor-pointer hover:shadow-xl hover:border-indigo-500 group transition-all"
                        >
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/20 group-hover:text-indigo-500 transition-colors">
                                    <User className="w-6 h-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-gray-800 dark:text-white truncate group-hover:text-indigo-600 transition-colors uppercase">{patient.name}</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{patient.phone || 'No phone'}</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-500 transition-colors" />
                            </div>
                        </GlassCard>
                    ))}
                </div>
            </div>
        );
    }

    const patient = patients.find(p => p.id === selectedPatientId);
    const hasWarfarin = patientPrescriptions.some(p => p.medicines.some(m => m.name.toLowerCase().includes('warfarin')));
    const hasAspirin = patientPrescriptions.some(p => p.medicines.some(m => m.name.toLowerCase().includes('aspirin')));
    const showSlightDangerStub = healthEntries.some(e => e.type === 'surgery');

    const chartData = [
        { date: '10 Feb', systolic: 128, sugar: 110 },
        { date: '15 Feb', systolic: 132, sugar: 145 },
        { date: '20 Feb', systolic: 125, sugar: 120 },
        { date: 'Today', systolic: healthProfile?.bp_systolic || 125, sugar: healthProfile?.sugar_level || 120 },
    ];

    const timelineEvents = [
        ...patientAppointments.map(a => ({ id: a.id, type: 'appointment', title: a.reason, date: new Date(a.appointment_date).toLocaleDateString() })),
        ...patientPrescriptions.map(p => ({ id: p.id, type: 'prescription', title: `Prescribed ${p.medicines.length} medicines`, date: new Date(p.created_at).toLocaleDateString() }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

    return (
        <div className="space-y-6 pb-20">
            {/* Context Header */}
            <div className="flex items-center justify-between mb-8 overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => setSelectedPatientId(null)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full text-gray-500 transition-colors"
                    >
                        <ChevronRight className="w-6 h-6 rotate-180" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white uppercase">{patient?.name}</h2>
                            <NeumorphicBadge variant="info">Patient ID: #{selectedPatientId.slice(-4)}</NeumorphicBadge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                            <span>{patient?.gender || 'Unknown'}, {healthProfile?.age || 'Unknown'} years</span>
                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                            <span>{patient?.phone}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <PremiumButton
                        variant="primary"
                        size="md"
                        onClick={() => setIsPrescribingModalOpen(true)}
                        className="flex items-center gap-2"
                    >
                        <Zap className="w-4 h-4" /> Smart Prescribe
                    </PremiumButton>
                    <button
                        onClick={() => setIsRecordModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 rounded-xl hover:bg-purple-500/20 transition-all text-sm font-bold"
                    >
                        <FilePlus className="w-4 h-4" /> Add Record
                    </button>
                </div>
            </div>

            <div className="flex gap-4 mb-6 border-b border-gray-100 dark:border-white/5 pb-px">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-6 py-3 text-sm font-bold transition-all relative ${activeTab === 'overview' ? 'text-indigo-600' : 'text-gray-400'}`}
                >
                    Intelligence Overview
                    {activeTab === 'overview' && <motion.div layoutId="patientTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />}
                </button>
                <button
                    onClick={() => setActiveTab('records')}
                    className={`px-6 py-3 text-sm font-bold transition-all relative ${activeTab === 'records' ? 'text-indigo-600' : 'text-gray-400'}`}
                >
                    Full History & Records
                    {activeTab === 'records' && <motion.div layoutId="patientTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />}
                </button>
            </div>

            {loadingData ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            ) : activeTab === 'overview' ? (
                <StaggerContainer className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <MotionItem className="lg:col-span-2">
                        <GlassCard className="p-6 border-indigo-200/50 dark:border-indigo-800/50 h-full">
                            <div className="flex items-center gap-3 mb-4 border-b border-gray-100 dark:border-white/5 pb-4">
                                <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg">
                                    <Brain className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">AI Clinical Summary</h3>
                                <NeumorphicBadge variant="info" className="ml-auto text-xs">Generated Just Now</NeumorphicBadge>
                            </div>
                            <div className="prose prose-indigo dark:prose-invert">
                                {loadingAi ? (
                                    <div className="flex items-center gap-2 text-indigo-600 animate-pulse">
                                        <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                        <span>Analyzing medical records...</span>
                                    </div>
                                ) : aiSummary ? (
                                    <div className="text-gray-600 dark:text-gray-300 leading-relaxed text-[15px] whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: aiSummary.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                                ) : (
                                    <p className="text-gray-500">Summary not available.</p>
                                )}
                            </div>
                        </GlassCard>
                    </MotionItem>

                    <MotionItem>
                        <GlassCard className="p-6 border-emerald-200/50 dark:border-emerald-800/50 h-full flex flex-col">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg">
                                    <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Current Vitals</h3>
                            </div>

                            <div className="space-y-4 flex-1 flex flex-col justify-center">
                                <div className="bg-white/50 dark:bg-black/20 p-4 rounded-xl border border-gray-100 dark:border-white/5 flex justify-between items-center">
                                    <div>
                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Blood Pressure</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{healthProfile?.bp_systolic || '-'}<span className="text-sm text-gray-400 font-normal">/{healthProfile?.bp_diastolic || '-'}</span></p>
                                    </div>
                                    <div className="text-emerald-500 text-sm font-medium flex items-center bg-emerald-50 dark:bg-transparent px-2 py-1 rounded">Recorded</div>
                                </div>
                                <div className="bg-white/50 dark:bg-black/20 p-4 rounded-xl border border-gray-100 dark:border-white/5 flex justify-between items-center">
                                    <div>
                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Fasting Sugar</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{healthProfile?.sugar_level || '-'} <span className="text-sm text-gray-400 font-normal">mg/dL</span></p>
                                    </div>
                                </div>
                                <div className="bg-white/50 dark:bg-black/20 p-4 rounded-xl border border-gray-100 dark:border-white/5 flex justify-between items-center">
                                    <div>
                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Weight / Height</p>
                                        <p className="text-xl font-bold text-gray-900 dark:text-white">{healthProfile?.weight || '-'}kg / <span className="text-sm text-gray-400 font-normal">{healthProfile?.height || '-'}cm</span></p>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    </MotionItem>

                    <MotionItem className="lg:col-span-2">
                        <GlassCard className="p-6 border-blue-200/50 dark:border-blue-800/50 h-[400px] flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Vitals Trend (Estimated)</h3>
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                        <span className="text-xs text-gray-500">Systolic BP</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                                        <span className="text-xs text-gray-500">Fasting Sugar</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 w-full min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorSystolic" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorSugar" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.5} />
                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dx={-10} domain={['dataMin - 10', 'dataMax + 10']} />
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                                        <Area type="monotone" dataKey="systolic" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSystolic)" />
                                        <Area type="monotone" dataKey="sugar" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorSugar)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </GlassCard>
                    </MotionItem>

                    <MotionItem>
                        <GlassCard className="p-6 border-purple-200/50 dark:border-purple-800/50 h-[400px] flex flex-col">
                            <div className="flex items-center gap-3 mb-6 shrink-0">
                                <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg">
                                    <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Clinical Timeline</h3>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 relative">
                                {timelineEvents.length === 0 ? (
                                    <div className="text-gray-500 text-center py-6">No clinical events recorded yet.</div>
                                ) : (
                                    <>
                                        <div className="absolute left-[19px] top-2 bottom-2 w-px bg-gray-200 dark:bg-gray-800"></div>
                                        <div className="space-y-6">
                                            {timelineEvents.map((event) => (
                                                <div key={event.id} className="relative pl-12">
                                                    <div className="absolute left-0 top-0 w-10 h-10 bg-white dark:bg-[#1C1C1E] border-2 border-gray-100 dark:border-gray-800 rounded-full flex items-center justify-center -ml-1 mt-1 z-10 shadow-sm">
                                                        {getTimelineIcon(event.type)}
                                                    </div>
                                                    <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 border border-gray-100 dark:border-white/5">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <h4 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-1 mr-2">{event.title}</h4>
                                                            <span className="text-[10px] font-semibold text-gray-400 bg-white dark:bg-black/30 px-2 py-1 rounded-md shrink-0">{event.date}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </GlassCard>
                    </MotionItem>

                    {(hasWarfarin && hasAspirin) || showSlightDangerStub ? (
                        <MotionItem className="lg:col-span-3">
                            <GlassCard className="p-6 border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="bg-red-100 dark:bg-red-900/50 p-2 rounded-lg">
                                        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Drug Interaction Alerts</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {hasWarfarin && hasAspirin && (
                                        <div className="p-4 bg-white/60 dark:bg-slate-800/60 rounded-xl border border-red-100 dark:border-red-800 flex gap-4 items-start shadow-sm">
                                            <div className="bg-red-100 dark:bg-red-900/50 p-2 rounded-lg shrink-0">
                                                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-bold text-red-700 dark:text-red-400">Warfarin + Aspirin Detected</h4>
                                                    <NeumorphicBadge variant="error" className="scale-75 origin-left">High Risk</NeumorphicBadge>
                                                </div>
                                                <p className="text-sm text-gray-700 dark:text-gray-300">Patient prescriptions indicate concurrent use. Increased risk of serious bleeding.</p>
                                            </div>
                                        </div>
                                    )}
                                    {showSlightDangerStub && !hasWarfarin && (
                                        <div className="p-4 bg-white/60 dark:bg-slate-800/60 rounded-xl border border-orange-100 dark:border-orange-800 flex gap-4 items-start shadow-sm">
                                            <div className="bg-orange-100 dark:bg-orange-900/50 p-2 rounded-lg shrink-0">
                                                <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-bold text-orange-700 dark:text-orange-400">AI Safety Check Enabled</h4>
                                                    <NeumorphicBadge variant="warning" className="scale-75 origin-left">Monitoring</NeumorphicBadge>
                                                </div>
                                                <p className="text-sm text-gray-700 dark:text-gray-300">Real-time screening for contraindications is running.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </GlassCard>
                        </MotionItem>
                    ) : null}
                </StaggerContainer>
            ) : (
                <MotionItem>
                    <GlassCard className="p-1">
                        <div className="max-h-[800px] overflow-y-auto custom-scrollbar">
                            <HealthTimeline
                                patientId={selectedPatientId}
                                onEntryAdded={() => {
                                    if (selectedPatientId) {
                                        healthProfileService.get(selectedPatientId).then(setHealthProfile);
                                        healthEntryService.getAll(selectedPatientId).then(setHealthEntries);
                                    }
                                }}
                            />
                        </div>
                    </GlassCard>
                </MotionItem>
            )}

            <SmartPrescribingModal
                isOpen={isPrescribingModalOpen}
                onClose={() => setIsPrescribingModalOpen(false)}
                patientName={patient?.name || ''}
                patientProfile={healthProfile}
            />

            <MedicalRecordUploadModal
                isOpen={isRecordModalOpen}
                onClose={() => setIsRecordModalOpen(false)}
                patientId={selectedPatientId}
                onUploadComplete={() => {
                    if (selectedPatientId) {
                        const profile = healthProfileService.get(selectedPatientId);
                        const entries = healthEntryService.getAll(selectedPatientId);
                        Promise.all([profile, entries]).then(([p, e]) => {
                            setHealthProfile(p);
                            setHealthEntries(e);
                        });
                    }
                }}
            />
        </div>
    );
}
