import { useState, useEffect, useMemo } from 'react';
import { Users, Activity, TrendingUp, AlertTriangle, Sparkles, Download, ShieldCheck } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { PremiumButton } from '../ui/PremiumButton';
import { Patient, Prescription } from '../../types';
import { patientService, prescriptionService } from '../../services/dataService';
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';

export default function PatientIntelligenceHub() {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [pts, prescs] = await Promise.all([
                    patientService.getAll(),
                    prescriptionService.getAll()
                ]);
                setPatients(pts as Patient[]);
                setPrescriptions(prescs);
            } catch (error) {
                console.error("Error loading intelligence data", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const stats = useMemo(() => {
        if (!patients.length) return { total: 0, atRisk: 0, active: 0 };
        return {
            total: patients.length,
            atRisk: Math.floor(patients.length * 0.15), // Mock calculation
            active: Math.floor(patients.length * 0.8), // Mock calculation
            avgAge: 45
        };
    }, [patients]);

    // Mock Data for Charts (In a real app, this would be computed from healthEntries)
    const riskDistributionData = [
        { name: 'Low Risk', value: 65, color: '#10b981' },
        { name: 'Moderate', value: 25, color: '#f59e0b' },
        { name: 'High Risk', value: 10, color: '#ef4444' },
    ];

    const conditionTrendsData = [
        { month: 'Jan', diabetes: 40, hypertension: 55, asthma: 20 },
        { month: 'Feb', diabetes: 42, hypertension: 52, asthma: 22 },
        { month: 'Mar', diabetes: 45, hypertension: 58, asthma: 18 },
        { month: 'Apr', diabetes: 41, hypertension: 54, asthma: 25 },
        { month: 'May', diabetes: 48, hypertension: 60, asthma: 28 },
    ];

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Compiling Population Analytics...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                        <Sparkles className="w-8 h-8 text-indigo-500" />
                        Patient Intelligence Hub
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">AI-driven population health analytics</p>
                </div>
                <PremiumButton className="flex items-center gap-2">
                    <Download className="w-4 h-4" /> Export Report
                </PremiumButton>
            </div>

            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <GlassCard className="p-6 border-indigo-100 dark:border-indigo-500/20">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg">
                            <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <p className="text-sm font-bold text-gray-500">Total Population</p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                </GlassCard>

                <GlassCard className="p-6 border-emerald-100 dark:border-emerald-500/20">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg">
                            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <p className="text-sm font-bold text-gray-500">Active Monitoring</p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.active}</p>
                </GlassCard>

                <GlassCard className="p-6 border-red-100 dark:border-red-500/20">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-100 dark:bg-red-500/20 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <p className="text-sm font-bold text-gray-500">High Risk Cohort</p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.atRisk}</p>
                </GlassCard>

                <GlassCard className="p-6 border-amber-100 dark:border-amber-500/20">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-amber-100 dark:bg-amber-500/20 rounded-lg">
                            <Activity className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <p className="text-sm font-bold text-gray-500">Interventions</p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{prescriptions.length}</p>
                </GlassCard>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <GlassCard className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Risk Stratification</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={riskDistributionData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {riskDistributionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    itemStyle={{ fontWeight: 'bold' }}
                                />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>

                <GlassCard className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Chronic Condition Trends</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={conditionTrendsData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                                <XAxis dataKey="month" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                                <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="diabetes" name="Diabetes" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} />
                                <Line type="monotone" dataKey="hypertension" name="Hypertension" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
                                <Line type="monotone" dataKey="asthma" name="Asthma" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>
            </div>

            {/* AI Insights Panel */}
            <GlassCard className="p-8 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 border-indigo-200 dark:border-indigo-500/20">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-indigo-500 rounded-xl">
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">AI Population Insights</h3>
                </div>

                <div className="space-y-4">
                    <div className="p-5 bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center flex-shrink-0">
                            <TrendingUp className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 dark:text-white text-sm">Hypertension Spike Detected</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                An unusual 15% increase in elevated systolic readings was observed in the 45-60 age cohort over the last month. Consider a mass notification for blood pressure checkups.
                            </p>
                        </div>
                    </div>

                    <div className="p-5 bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                            <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 dark:text-white text-sm">Medication Adherence Improvement</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Patients utilizing the new digital reminder system show a 22% higher adherence rate to diabetic medications compared to the baseline.
                            </p>
                        </div>
                    </div>
                </div>
            </GlassCard>

        </div>
    );
}
