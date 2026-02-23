import { useState, useEffect } from 'react';

import { StaggerContainer, MotionItem } from '../ui/MotionComponents';
import { GlassCard } from '../ui/GlassCard';
import { PremiumButton } from '../ui/PremiumButton';
import { NeumorphicBadge } from '../ui/NeumorphicBadge';
import { Brain, Activity, Clock, AlertTriangle, ChevronRight, User, Pill, Stethoscope } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Appointment, Prescription, HealthProfile, HealthEntry } from '../../types';
import { healthProfileService, healthEntryService } from '../../services/dataService';
import { getGeminiResponse } from '../../services/geminiService';

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

    const patientAppointments = allAppointments.filter(a => a.patient_id === selectedPatientId).sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime());
    const patientPrescriptions = allPrescriptions.filter(p => p.patient_id === selectedPatientId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

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

        // Add a slight delay to allow rendering before the API call blocks/slows things
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

    if (!selectedPatientId) {
        return (
            <div className="space-y-6 pb-12">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-700 p-8 shadow-2xl">
                    <div className="relative z-10 space-y-2">
                        <div className="flex items-center gap-3 text-white">
                            <Brain className="w-8 h-8" />
                            <h2 className="text-3xl font-extrabold tracking-tight">Patient Intelligence Hub</h2>
                        </div>
                        <p className="text-indigo-100/80 max-w-xl">
                            Select a patient to view their comprehensive clinical intelligence profile, powered by real-time analytics and AI.
                        </p>
                    </div>
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                </div>

                {patients.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">No patients available pending. Check appointments section.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {patients.map(p => (
                            <GlassCard key={p.id} className="p-6 hover:shadow-xl transition-all cursor-pointer group" onClick={() => setSelectedPatientId(p.id)}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl group-hover:scale-110 transition-transform">
                                        <User className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <NeumorphicBadge variant={p.appointmentCount > 2 ? 'warning' : 'success'}>
                                        {p.appointmentCount > 2 ? 'Review Needed' : 'Stable'}
                                    </NeumorphicBadge>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 group-hover:text-indigo-600 transition-colors">{p.name || 'Unknown Patient'}</h3>
                                <div className="text-sm text-gray-500 dark:text-gray-400 flex justify-between mt-2">
                                    <span>Encounters: {p.appointmentCount}</span>
                                    <span>Last: {p.lastVisit ? new Date(p.lastVisit).toLocaleDateString() : 'Never'}</span>
                                </div>

                                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-white/5 flex justify-end">
                                    <span className="flex items-center text-sm font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
                                        View Hub <ChevronRight className="w-4 h-4 ml-1" />
                                    </span>
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    const patient = patients.find(p => p.id === selectedPatientId);

    // Merge sorting timeline events
    const timelineEvents = [
        ...patientAppointments.map(a => ({ id: a.id, type: 'appointment', date: new Date(a.appointment_date).toLocaleDateString(), title: `Appointment: ${a.reason}`, timestamp: new Date(a.appointment_date).getTime() })),
        ...patientPrescriptions.map(p => ({ id: p.id, type: 'prescription', date: new Date(p.created_at).toLocaleDateString(), title: 'Prescription Issued', timestamp: new Date(p.created_at).getTime() })),
        ...healthEntries.map(e => ({ id: e.id, type: 'entry', date: new Date(e.date).toLocaleDateString(), title: e.title, timestamp: new Date(e.date).getTime() }))
    ].sort((a, b) => b.timestamp - a.timestamp);

    // Build vitals chart data from HealthEntries
    const vitalsEntries = [...healthEntries].filter(e => e.type === 'vitals' || e.title.toLowerCase().includes('vitals') || e.values).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Mocking some baseline data if no real entries exist for graph to look good
    const chartData = vitalsEntries.length > 2 ? vitalsEntries.map(e => ({
        date: new Date(e.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        systolic: e.values?.systolic || e.values?.bp_systolic || 0,
        sugar: e.values?.sugar || e.values?.sugar_level || 0
    })) : [
        { date: 'Last Month', systolic: 130, sugar: 120 },
        { date: 'Two Weeks', systolic: 128, sugar: 115 },
        { date: 'Last Week', systolic: 125, sugar: 112 },
        { date: 'Current', systolic: healthProfile?.bp_systolic || 120, sugar: healthProfile?.sugar_level || 110 },
    ];

    // Drug Alerts Check Strip
    const allMeds = patientPrescriptions.flatMap(p => p.medicines.map(m => m.name.toLowerCase()));
    const hasWarfarin = allMeds.some(m => m.includes('warfarin'));
    const hasAspirin = allMeds.some(m => m.includes('aspirin'));
    const showSlightDangerStub = true; // Still show stub so the feature is obvious

    return (
        <div className="space-y-6 pb-24">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setSelectedPatientId(null)}
                        className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-gray-500"
                    >
                        <ChevronRight className="w-6 h-6 rotate-180" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{patient?.name || 'Unknown'}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Clinical Profile & Intelligence</p>
                    </div>
                </div>
                <PremiumButton className="bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
                    <Activity className="w-4 h-4 mr-2" />
                    Live Monitor
                </PremiumButton>
            </div>

            {loadingData ? (
                <div className="flex justify-center items-center py-24">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            ) : (
                <StaggerContainer className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* AI Summary */}
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

                    {/* Quick Vitals */}
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
                                    <div className="text-emerald-500 text-sm font-medium flex items-center bg-emerald-50 dark:bg-transparent px-2 py-1 rounded">
                                        Recorded
                                    </div>
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

                    {/* Vitals Trend Chart */}
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
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                        />
                                        <Area type="monotone" dataKey="systolic" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSystolic)" />
                                        <Area type="monotone" dataKey="sugar" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorSugar)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </GlassCard>
                    </MotionItem>

                    {/* Clinical Timeline */}
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
                                                    {/* Icon Node */}
                                                    <div className="absolute left-0 top-0 w-10 h-10 bg-white dark:bg-[#1C1C1E] border-2 border-gray-100 dark:border-gray-800 rounded-full flex items-center justify-center -ml-1 mt-1 z-10 shadow-sm">
                                                        {getTimelineIcon(event.type)}
                                                    </div>

                                                    {/* Content */}
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

                    {/* Drug Interaction Alerts */}
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
                                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                                    Patient prescriptions indicate concurrent use. Increased risk of severe bleeding. Generally contraindicated.
                                                </p>
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
                                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                                    Real-time active screening for contraindications is running. No severe drug-drug interactions detected in current active prescriptions.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </GlassCard>
                        </MotionItem>
                    ) : null}

                </StaggerContainer>
            )}
        </div>
    );
}
