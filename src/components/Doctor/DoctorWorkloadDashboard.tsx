import { useState, useEffect } from 'react';
import {
    BarChart3, Users, Clock, AlertTriangle, ArrowLeftRight,
    TrendingUp, Filter, Sparkles
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { PremiumButton } from '../ui/PremiumButton';
import { NeumorphicBadge } from '../ui/NeumorphicBadge';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { workloadService, schedulingService } from '../../services/dataService';

interface WorkloadData {
    census: number;
    averageAcuity: number;
    estimatedHours: number;
    burnoutRisk: {
        isAtRisk: boolean;
        trend: number;
        recommendation: string;
        totalHoursThisWeek: number;
    };
}

interface Colleague {
    userId: string;
    name?: string;
    specialization: string;
}

export default function DoctorWorkloadDashboard() {
    const { user } = useAuth();
    const [data, setData] = useState<WorkloadData | null>(null);
    const [colleagues, setColleagues] = useState<Colleague[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchWorkload = async () => {
            if (!user?.uid) return;
            try {
                const workloadData = await workloadService.get(user.uid);
                setData(workloadData);

                const colleaguesList = await schedulingService.getColleagues(user.uid);
                setColleagues(colleaguesList.map((c: any) => ({
                    userId: c.userId,
                    name: c.userId?.name || 'Dr. Colleague',
                    specialization: c.specialization
                })));

                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching workload data:', error);
                setIsLoading(false);
            }
        };

        fetchWorkload();
    }, [user]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Auditing Census & Acuity...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Load Balancing</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">Real-time patient census and acuity audit</p>
                </div>
                <NeumorphicBadge variant={data?.burnoutRisk?.isAtRisk ? 'info' : 'success'} className="px-4 py-2">
                    Status: {data?.burnoutRisk?.isAtRisk ? 'High Load' : 'Optimal'}
                </NeumorphicBadge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <GlassCard className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-lg">
                            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <p className="text-sm font-bold text-gray-500">Patient Census</p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{data?.census}</p>
                    <p className="text-xs text-gray-400 mt-2 font-medium">Active patients in ward</p>
                </GlassCard>

                <GlassCard className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-amber-100 dark:bg-amber-500/20 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <p className="text-sm font-bold text-gray-500">Avg. Acuity</p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{data?.averageAcuity}/5</p>
                    <p className="text-xs text-gray-400 mt-2 font-medium">Weighted patient severity</p>
                </GlassCard>

                <GlassCard className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg">
                            <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <p className="text-sm font-bold text-gray-500">Est. Shift Hours</p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{data?.estimatedHours}h</p>
                    <p className="text-xs text-gray-400 mt-2 font-medium">Based on current census</p>
                </GlassCard>

                <GlassCard className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-100 dark:bg-purple-500/20 rounded-lg">
                            <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <p className="text-sm font-bold text-gray-500">Weekly Total</p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{data?.burnoutRisk?.totalHoursThisWeek}h</p>
                    <p className="text-xs text-gray-400 mt-2 font-medium">Trending toward burnout</p>
                </GlassCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <GlassCard className="p-8">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-500" /> Burnout Risk Audit
                    </h3>
                    <div className="space-y-6">
                        <div className="relative h-4 bg-gray-100 dark:bg-black/40 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(data?.burnoutRisk?.trend || 0) * 100}%` }}
                                className={`absolute top-0 left-0 h-full rounded-full ${data?.burnoutRisk?.isAtRisk ? 'bg-gradient-to-r from-amber-500 to-red-500' : 'bg-gradient-to-r from-indigo-500 to-emerald-500'}`}
                            />
                        </div>
                        <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                            <span>0h</span>
                            <span>20h</span>
                            <span>40h (Limit)</span>
                            <span>50h</span>
                        </div>
                        <div className="p-5 bg-amber-500/5 rounded-2xl border border-amber-500/20">
                            <p className="text-sm text-amber-700 dark:text-amber-400 leading-relaxed font-medium">
                                {data?.burnoutRisk?.recommendation}
                            </p>
                        </div>
                    </div>
                </GlassCard>

                <GlassCard className="p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <ArrowLeftRight className="w-5 h-5 text-indigo-500" /> Smart Shift Swaps
                        </h3>
                        <PremiumButton variant="secondary" size="sm" className="text-[10px]">
                            <Sparkles className="w-3 h-3 mr-1" /> Auto-Suggest
                        </PremiumButton>
                    </div>
                    <div className="space-y-4">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Available Colleagues (Low Load)</p>
                        {colleagues.map((col) => (
                            <div key={col.userId} className="flex items-center justify-between p-4 bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 group hover:border-indigo-500/30 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                                        {col.name?.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-800 dark:text-white">{col.name}</h4>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase">{col.specialization}</p>
                                    </div>
                                </div>
                                <PremiumButton variant="secondary" size="sm" className="px-3 py-1 text-[10px]">
                                    Request Trade
                                </PremiumButton>
                            </div>
                        ))}
                        <button className="w-full py-3 text-xs font-bold text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all border border-dashed border-indigo-200 dark:border-indigo-500/30">
                            Broadcast Shift Availability
                        </button>
                    </div>
                </GlassCard>
            </div>

            <GlassCard className="p-8">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <Filter className="w-5 h-5 text-purple-500" /> Historic Load Trend
                </h3>
                <div className="h-64 flex items-end justify-between gap-2 px-4 pb-4">
                    {[45, 30, 52, 38, 48, 42, 45].map((val, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${(val / 60) * 100}%` }}
                                className={`w-full max-w-[40px] rounded-t-lg ${val > 40 ? 'bg-gradient-to-t from-amber-500/20 to-red-500' : 'bg-gradient-to-t from-indigo-500/20 to-indigo-500'}`}
                            />
                            <span className="text-[10px] font-bold text-gray-400 uppercase">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][idx]}</span>
                        </div>
                    ))}
                </div>
            </GlassCard>
        </div>
    );
}
