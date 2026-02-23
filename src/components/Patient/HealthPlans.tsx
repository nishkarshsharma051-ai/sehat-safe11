import { useState, useEffect } from 'react';
import {
    Activity, ChevronRight,
    Info, Target, Zap, Waves, Calendar, Flame, Wind, Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { HealthPlan, PatientActivePlan } from '../../types';
import { generateHealthPlansWithAI } from '../../utils/healthPlanUtils';
import { healthProfileService, healthPlanService } from '../../services/dataService';
import { getGeminiResponse } from '../../services/geminiService';
import { calculateHealthScore } from '../../utils/healthScoreUtils';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { GlassCard } from '../ui/GlassCard';
import { PremiumButton } from '../ui/PremiumButton';
import { NeumorphicBadge } from '../ui/NeumorphicBadge';
import { StaggerContainer, MotionItem } from '../ui/MotionComponents';

export default function HealthPlans() {
    const { user } = useAuth();
    const [plans, setPlans] = useState<HealthPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState<HealthPlan | null>(null);
    const [activePlan, setActivePlan] = useState<PatientActivePlan | null>(null);
    const { lang, setLang, t } = useLanguage();
    const [initializing, setInitializing] = useState(false);
    const [generatingActivityId, setGeneratingActivityId] = useState<string | null>(null);
    const [aiPlanResult, setAiPlanResult] = useState<{ title: string, content: string } | null>(null);

    useEffect(() => {
        const loadPlansData = async () => {
            if (!user?.uid) return;
            try {
                const profile = await healthProfileService.get(user.uid);
                const active = await healthPlanService.getActive(user.uid);
                setActivePlan(active);

                const score = calculateHealthScore(profile);
                const recommended = await generateHealthPlansWithAI(profile, score, lang);
                setPlans(recommended);

                // If there's an active plan, select it by default
                if (active) {
                    const matchedPlan = recommended.find(p => p.id === active.planId);
                    if (matchedPlan) setSelectedPlan(matchedPlan);
                    else if (recommended.length > 0) setSelectedPlan(recommended[0]);
                } else if (selectedPlan) {
                    const stillExists = recommended.find(p => p.id === selectedPlan.id);
                    if (stillExists) setSelectedPlan(stillExists);
                    else if (recommended.length > 0) setSelectedPlan(recommended[0]);
                } else if (recommended.length > 0) {
                    setSelectedPlan(recommended[0]);
                }
            } catch (err) {
                console.error('Error loading health plans:', err);
            } finally {
                setLoading(false);
            }
        };
        loadPlansData();
    }, [user, lang]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-10 pb-20">
                {/* Hero Section with Mesh Gradient */}
                <div className="relative overflow-hidden rounded-[3rem] bg-[#020617] p-1 md:p-1.5 shadow-2xl">
                    <div className="relative overflow-hidden rounded-[2.85rem] bg-slate-950 p-10 md:p-16">
                        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/30 blur-[120px] rounded-full animate-pulse"></div>
                        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 blur-[120px] rounded-full delay-1000 animate-pulse"></div>
                        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-blue-500/20 blur-[100px] rounded-full delay-700 animate-pulse"></div>

                        <div className="relative z-10 max-w-2xl">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-indigo-400 text-xs font-bold uppercase tracking-widest backdrop-blur-xl">
                                        <Zap className="w-3 h-3 fill-current" /> {t('AI-Driven Precision', 'AI-संचालित सटीक जानकारी')}
                                    </span>

                                    {/* Language Switcher */}
                                    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-xl">
                                        <button
                                            onClick={() => setLang('en')}
                                            className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${lang === 'en' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:text-white'}`}
                                        >
                                            ENGLISH
                                        </button>
                                        <button
                                            onClick={() => setLang('hi')}
                                            className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${lang === 'hi' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:text-white'}`}
                                        >
                                            हिंदी
                                        </button>
                                    </div>
                                </div>

                                <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight text-white">
                                    {t('Your Health', 'आपका')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-400 to-purple-400">{t('Blueprint', 'स्वास्थ्य ब्लूप्रिंट')}</span>
                                </h1>
                                <p className="text-slate-400 text-xl leading-relaxed font-medium">
                                    {t('Scientifically optimized medical protocols and wellness trajectories tailored to your biomarkers.', 'वैज्ञानिक रूप से अनुकूलित चिकित्सा प्रोटोकॉल और आपके बायोमार्कर के लिए तैयार कल्याण प्रक्षेपवक्र।')}
                                </p>
                            </motion.div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                    <div className="lg:col-span-4 space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em]">{t('Recommendations', 'सिफारिशें')}</h3>
                            <span className="text-[10px] font-bold text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-md uppercase tracking-widest">{t('Live', 'लाइव')}</span>
                        </div>

                        <div className="space-y-4">
                            {plans.map((plan, idx) => (
                                <motion.div
                                    key={plan.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                >
                                    <div
                                        onClick={() => setSelectedPlan(plan)}
                                        className={`group relative p-6 cursor-pointer rounded-3xl transition-all duration-500 overflow-hidden ${selectedPlan?.id === plan.id
                                            ? 'bg-white dark:bg-slate-900 shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800'
                                            : 'bg-slate-100/50 dark:bg-slate-900/30 hover:bg-white dark:hover:bg-slate-900 ring-1 ring-transparent hover:ring-slate-200 dark:hover:ring-slate-800'
                                            }`}
                                    >
                                        {selectedPlan?.id === plan.id && (
                                            <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
                                        )}
                                        <div className="flex justify-between items-start mb-3">
                                            <div className={`p-2 rounded-xl transition-colors ${selectedPlan?.id === plan.id ? 'bg-indigo-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/40 group-hover:text-indigo-500'
                                                }`}>
                                                <Activity className="w-4 h-4" />
                                            </div>
                                            <NeumorphicBadge
                                                variant={plan.intensity === 'High' ? 'warning' : 'info'}
                                                className="text-[9px] uppercase tracking-tighter"
                                            >
                                                {plan.intensity}
                                            </NeumorphicBadge>
                                        </div>
                                        <h4 className={`font-bold transition-colors ${selectedPlan?.id === plan.id ? 'text-gray-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-gray-900 dark:group-hover:text-white'
                                            }`}>
                                            {plan.name}
                                        </h4>
                                        <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed font-medium">{plan.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <div className="lg:col-span-8">
                        <AnimatePresence mode="wait">
                            {selectedPlan && (
                                <motion.div
                                    key={selectedPlan.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                    className="space-y-8"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <GlassCard className="md:col-span-2 p-8 border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-500/10 transition-colors"></div>

                                            <div className="relative z-10 h-full flex flex-col justify-between">
                                                <div>
                                                    <div className="flex items-center gap-4 mb-6">
                                                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
                                                            <Target className="w-8 h-8" />
                                                        </div>
                                                        <div>
                                                            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{selectedPlan.name}</h2>
                                                            <p className="text-indigo-500 font-bold text-sm tracking-wide uppercase mt-1">{selectedPlan.category} {t('PROTOCOL', 'प्रोटोकॉल')}</p>
                                                        </div>
                                                    </div>
                                                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-500/10 mb-8">
                                                        <div className="flex gap-3 text-indigo-700 dark:text-indigo-300">
                                                            <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                                            <p className="text-sm font-medium leading-relaxed italic">{selectedPlan.recommendation_reason}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between mt-auto">
                                                    <div className="flex gap-8">
                                                        <div>
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1">{t('Timeframe', 'समय सीमा')}</span>
                                                            <span className="text-xl font-bold text-gray-900 dark:text-white">{selectedPlan.duration}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1">{t('Items', 'आइटम')}</span>
                                                            <span className="text-xl font-bold text-gray-900 dark:text-white">{selectedPlan.activities.length} {t('Steps', 'कदम')}</span>
                                                        </div>
                                                    </div>
                                                    <PremiumButton
                                                        variant="primary"
                                                        size="lg"
                                                        className="px-10 shadow-2xl shadow-indigo-500/30 font-bold tracking-tight rounded-2xl"
                                                        disabled={initializing || activePlan?.planId === selectedPlan.id}
                                                        onClick={async () => {
                                                            if (!user?.uid) return;
                                                            setInitializing(true);
                                                            try {
                                                                const newActive = await healthPlanService.initialize(user.uid, selectedPlan);
                                                                setActivePlan(newActive);
                                                            } catch (err) {
                                                                console.error('Failed to initialize plan:', err);
                                                            } finally {
                                                                setInitializing(false);
                                                            }
                                                        }}
                                                    >
                                                        {initializing ? t('Initializing...', 'शुरू कर रहा है...') : (activePlan?.planId === selectedPlan.id ? t('Plan Active', 'योजना सक्रिय है') : t('Initialize Plan', 'योजना शुरू करें'))}
                                                    </PremiumButton>
                                                </div>
                                            </div>
                                        </GlassCard>

                                        <GlassCard className="md:col-span-1 p-8 border-slate-200 dark:border-slate-800 flex flex-col justify-between bg-slate-900 text-white">
                                            <div className="flex items-center justify-between mb-8">
                                                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                                                    <Waves className="w-6 h-6 text-blue-400" />
                                                </div>
                                                <NeumorphicBadge className="bg-blue-500 text-white border-none">{t('Active', 'सक्रिय')}</NeumorphicBadge>
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mb-2">{t('Completion', 'पूर्णता')}</p>
                                                <div className="flex items-end gap-2 mb-4">
                                                    <span className="text-5xl font-black tracking-tighter">
                                                        {activePlan?.planId === selectedPlan.id
                                                            ? Math.round((activePlan.completedActivities.length / selectedPlan.activities.length) * 100)
                                                            : 0}%
                                                    </span>
                                                    <span className="text-slate-500 font-bold text-sm mb-2">
                                                        {activePlan?.planId === selectedPlan.id
                                                            ? `${activePlan.completedActivities.length}/${selectedPlan.activities.length}`
                                                            : t('Tracked', 'ट्रैक किया गया')}
                                                    </span>
                                                </div>
                                                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{
                                                            width: activePlan?.planId === selectedPlan.id
                                                                ? `${(activePlan.completedActivities.length / selectedPlan.activities.length) * 100}%`
                                                                : "0%"
                                                        }}
                                                        className="h-full bg-gradient-to-r from-blue-400 to-indigo-400"
                                                    ></motion.div>
                                                </div>
                                            </div>
                                        </GlassCard>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em]">{t('Protocol Steps', 'प्रोटोकॉल के चरण')}</h3>
                                            <span className="text-xs font-bold text-slate-400">{t('Personalized Tasks', 'व्यक्तिगत कार्य')}</span>
                                        </div>

                                        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {selectedPlan.activities.map((activity, ridx) => (
                                                <MotionItem key={activity.id} className={ridx === 0 ? "md:col-span-2" : ""}>
                                                    <div className="group h-full p-8 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 transition-all duration-500 relative overflow-hidden">
                                                        <div className="absolute top-0 right-0 p-16 bg-slate-100 dark:bg-slate-800/30 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 transition-colors"></div>

                                                        <div className="relative z-10 flex flex-col h-full">
                                                            <div className="flex items-center justify-between mb-6">
                                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${activity.type === 'exercise' ? 'bg-orange-500 text-white shadow-orange-500/20' :
                                                                    activity.type === 'diet' ? 'bg-emerald-500 text-white shadow-emerald-500/20' :
                                                                        activity.type === 'checkup' ? 'bg-blue-500 text-white shadow-blue-500/20' :
                                                                            activity.type === 'meditation' ? 'bg-purple-500 text-white shadow-purple-500/20' :
                                                                                activity.type === 'wellness' ? 'bg-indigo-500 text-white shadow-indigo-500/20' :
                                                                                    'bg-slate-500 text-white shadow-slate-500/20'
                                                                    }`}>
                                                                    {activity.type === 'exercise' ? <Flame className="w-6 h-6" /> :
                                                                        activity.type === 'diet' ? <Waves className="w-6 h-6" /> :
                                                                            activity.type === 'checkup' ? <Calendar className="w-6 h-6" /> :
                                                                                activity.type === 'meditation' ? <Wind className="w-6 h-6" /> :
                                                                                    activity.type === 'wellness' ? <Moon className="w-6 h-6" /> :
                                                                                        <Activity className="w-6 h-6" />}
                                                                </div>
                                                                {activity.frequency === t('Daily', 'दैनिक') && (
                                                                    <div className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                                                                        {t('Daily', 'दैनिक')}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div>
                                                                <h5 className="text-xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight group-hover:text-indigo-500 transition-colors">{activity.title}</h5>
                                                                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-medium mb-6">{activity.description}</p>
                                                            </div>

                                                            <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
                                                                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${activity.type === 'exercise' ? 'text-orange-500' :
                                                                    activity.type === 'diet' ? 'text-emerald-500' :
                                                                        activity.type === 'checkup' ? 'text-blue-500' :
                                                                            activity.type === 'meditation' ? 'text-purple-500' :
                                                                                activity.type === 'wellness' ? 'text-indigo-500' :
                                                                                    'text-slate-500'
                                                                    }`}>{t(activity.type,
                                                                        activity.type === 'exercise' ? 'व्यायाम' :
                                                                            activity.type === 'diet' ? 'आहार' :
                                                                                activity.type === 'checkup' ? 'चेकअप' :
                                                                                    activity.type === 'meditation' ? 'ध्यान' :
                                                                                        activity.type === 'wellness' ? 'कल्याण' : activity.type
                                                                    )}</span>
                                                                <div className="flex items-center gap-4">
                                                                    {activity.type === 'diet' && (
                                                                        <button
                                                                            disabled={generatingActivityId === activity.id}
                                                                            onClick={async () => {
                                                                                if (!user?.uid) return;
                                                                                setGeneratingActivityId(activity.id);
                                                                                try {
                                                                                    const prompt = `You are a world-class clinical AI dietician. Generate a specific, highly optimized 1-day diet plan tailored for the goal: "${activity.title}" (${activity.description}). Provide concrete meal examples (Breakfast, Lunch, Dinner, Snacks) and explain why it helps. Make it concise and actionable. No markdown headers.`;
                                                                                    const response = await getGeminiResponse(prompt, [], { name: user.uid, role: 'patient', language: lang === 'hi' ? 'Hindi' : 'English' });
                                                                                    setAiPlanResult({ title: `AI Diet Plan: ${activity.title}`, content: response });
                                                                                } catch (err) {
                                                                                    console.error('Failed to generate diet plan', err);
                                                                                } finally {
                                                                                    setGeneratingActivityId(null);
                                                                                }
                                                                            }}
                                                                            className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-600 transition-colors"
                                                                        >
                                                                            {generatingActivityId === activity.id ? t('Generating...', 'बना रहा है...') : t('AI Diet Plan', 'एआई आहार योजना')}
                                                                            {generatingActivityId !== activity.id && <Zap className="w-3 h-3 fill-current" />}
                                                                        </button>
                                                                    )}
                                                                    {activity.type === 'meditation' && (
                                                                        <button
                                                                            disabled={generatingActivityId === activity.id}
                                                                            onClick={async () => {
                                                                                if (!user?.uid) return;
                                                                                setGeneratingActivityId(activity.id);
                                                                                try {
                                                                                    const prompt = `You are a world-class clinical AI mindfulness guide. Generate a specific, highly optimized 1-day guided meditation/mindfulness routine tailored for the goal: "${activity.title}" (${activity.description}). Provide concrete steps (Morning, Afternoon, Evening) and explain why it helps. Make it concise and actionable. No markdown headers.`;
                                                                                    const response = await getGeminiResponse(prompt, [], { name: user.uid, role: 'patient', language: lang === 'hi' ? 'Hindi' : 'English' });
                                                                                    setAiPlanResult({ title: `AI Guided Meditation: ${activity.title}`, content: response });
                                                                                } catch (err) {
                                                                                    console.error('Failed to generate meditation plan', err);
                                                                                } finally {
                                                                                    setGeneratingActivityId(null);
                                                                                }
                                                                            }}
                                                                            className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-purple-500 hover:text-purple-600 transition-colors"
                                                                        >
                                                                            {generatingActivityId === activity.id ? t('Generating...', 'बना रहा है...') : t('AI Guide', 'एआई गाइड')}
                                                                            {generatingActivityId !== activity.id && <Zap className="w-3 h-3 fill-current" />}
                                                                        </button>
                                                                    )}
                                                                    {activity.type === 'wellness' && (
                                                                        <button
                                                                            disabled={generatingActivityId === activity.id}
                                                                            onClick={async () => {
                                                                                if (!user?.uid) return;
                                                                                setGeneratingActivityId(activity.id);
                                                                                try {
                                                                                    const prompt = `You are a world-class clinical AI wellness expert. Generate a specific, highly optimized 1-day routine tailored for the goal: "${activity.title}" (${activity.description}). Provide concrete steps (Morning, Afternoon, Evening) and explain why it helps. Make it concise and actionable. No markdown headers.`;
                                                                                    const response = await getGeminiResponse(prompt, [], { name: user.uid, role: 'patient', language: lang === 'hi' ? 'Hindi' : 'English' });
                                                                                    setAiPlanResult({ title: `AI Wellness Guide: ${activity.title}`, content: response });
                                                                                } catch (err) {
                                                                                    console.error('Failed to generate wellness plan', err);
                                                                                } finally {
                                                                                    setGeneratingActivityId(null);
                                                                                }
                                                                            }}
                                                                            className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-600 transition-colors"
                                                                        >
                                                                            {generatingActivityId === activity.id ? t('Generating...', 'बना रहा है...') : t('AI Guide', 'एआई गाइड')}
                                                                            {generatingActivityId !== activity.id && <Zap className="w-3 h-3 fill-current" />}
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        disabled={activePlan?.planId !== selectedPlan.id || activePlan.completedActivities.includes(activity.id)}
                                                                        onClick={async () => {
                                                                            if (!user?.uid || !activePlan) return;
                                                                            try {
                                                                                const updated = await healthPlanService.completeActivity(user.uid, selectedPlan.id, activity.id);
                                                                                setActivePlan(updated);
                                                                            } catch (err) {
                                                                                console.error('Failed to complete activity:', err);
                                                                            }
                                                                        }}
                                                                        className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-colors group/btn ${activePlan?.completedActivities.includes(activity.id)
                                                                            ? 'text-emerald-500 cursor-default'
                                                                            : activePlan?.planId === selectedPlan.id
                                                                                ? 'text-indigo-400 hover:text-indigo-600'
                                                                                : 'text-slate-600 cursor-not-allowed'
                                                                            }`}
                                                                    >
                                                                        {activePlan?.completedActivities.includes(activity.id)
                                                                            ? t('Completed', 'पूर्ण हुआ')
                                                                            : t('Mark Done', 'हो गया')}
                                                                        {!activePlan?.completedActivities.includes(activity.id) && (
                                                                            <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </MotionItem>
                                            ))}
                                        </StaggerContainer>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* AI Diet Plan Modal */}
            <AnimatePresence>
                {aiPlanResult && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
                        onClick={() => setAiPlanResult(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
                        >
                            <div className="p-8">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl">
                                        <Zap className="w-8 h-8 fill-current" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{aiPlanResult.title}</h3>
                                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">AI-GENERATED PROTOCOL</p>
                                    </div>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl max-h-[60vh] overflow-y-auto">
                                    <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed font-medium">
                                        {aiPlanResult.content}
                                    </p>
                                </div>
                                <div className="mt-8 flex justify-end">
                                    <PremiumButton variant="primary" onClick={() => setAiPlanResult(null)}>
                                        {t('Close', 'बंद करें')}
                                    </PremiumButton>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
