import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock, Activity, Pill, Stethoscope, MessageSquare,
    Camera, Watch, FileText, CheckCircle2, RotateCw, AlertTriangle
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { PremiumButton } from '../ui/PremiumButton';
import { NeumorphicBadge } from '../ui/NeumorphicBadge';
import { useAuth } from '../../contexts/AuthContext';
import { timelineService } from '../../services/dataService';
import { extractHealthEventsFromSource } from '../../services/geminiService';
import { TimelineEvent } from '../../types';

// Mock unstructured data to simulate syncing
const MOCK_SOURCES = [
    {
        type: 'text' as const,
        data: "I felt a really sharp pain in my lower back yesterday after lifting those boxes. It lasted for about two hours. I took an ibuprofen and rested, which helped."
    },
    {
        type: 'wearable' as const,
        data: "APPLE_HEALTH_DUMP: Date: 2023-10-24T08:00:00Z. Metric: HeartRate. Value: 120bpm (Resting). Flag: Unusually High. Status: Alert Triggered."
    },
    {
        type: 'emr' as const,
        data: "CLINICAL_NOTE_SUMMARY: Patient visited complaining of persistent dry cough for 3 weeks. Diagnosed with mild bronchitis. Prescribed Azithromycin 500mg for 5 days. Advised rest."
    },
    {
        type: 'photo' as const,
        data: "IMAGE_METADATA: Skin_rash_arm.jpg. Uploaded: 2023-10-20. User Note: This red itchy rash appeared on my left forearm after I tried that new detergent. It's raised and warm to the touch."
    }
];

const CategoryIcon = ({ category, source }: { category: TimelineEvent['category'], source: TimelineEvent['source'] }) => {
    // Source indicator badge (small icon overlay)
    const SourceOverlay = () => {
        const props = { className: "w-3 h-3 text-white absolute -bottom-1 -right-1 rounded-full bg-gray-800 p-[1px] border border-white dark:border-gray-800" };
        switch (source) {
            case 'text': return <MessageSquare {...props} />;
            case 'wearable': return <Watch {...props} />;
            case 'emr': return <FileText {...props} />;
            case 'photo': return <Camera {...props} />;
            default: return null;
        }
    };

    const BaseIcon = () => {
        const props = { className: "w-6 h-6" };
        switch (category) {
            case 'symptom': return <AlertTriangle {...props} className="w-5 h-5 text-orange-500" />;
            case 'vitals': return <Activity {...props} className="w-5 h-5 text-blue-500" />;
            case 'medication': return <Pill {...props} className="w-5 h-5 text-purple-500" />;
            case 'diagnosis': return <Stethoscope {...props} className="w-5 h-5 text-indigo-500" />;
            case 'activity': return <CheckCircle2 {...props} className="w-5 h-5 text-emerald-500" />;
            default: return <Clock {...props} className="w-5 h-5 text-gray-500" />;
        }
    };

    return (
        <div className="relative w-10 h-10 rounded-xl flex items-center justify-center bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-sm">
            <BaseIcon />
            <SourceOverlay />
        </div>
    );
};

export default function UnifiedTimeline() {
    const { user } = useAuth();
    const [events, setEvents] = useState<TimelineEvent[]>([]);
    const [isSyncing, setIsSyncing] = useState(false);
    const [filter, setFilter] = useState<'all' | 'symptom' | 'vitals' | 'medication' | 'diagnosis'>('all');

    useEffect(() => {
        if (user?.uid) loadTimeline();
    }, [user]);

    const loadTimeline = async () => {
        if (!user?.uid) return;
        const data = await timelineService.getAll(user.uid);
        setEvents(data);
    };

    const handleSync = async () => {
        if (!user?.uid) return;
        setIsSyncing(true);
        try {
            // Simulate extracting from multiple sources in parallel
            const extractedPromises = MOCK_SOURCES.map(source =>
                extractHealthEventsFromSource(source.data, source.type)
            );

            const rawResults = await Promise.all(extractedPromises);

            // Flatten and map to TimelineEvent structure
            const newEvents: TimelineEvent[] = [];
            rawResults.forEach((sourceEvents, index) => {
                const sourceType = MOCK_SOURCES[index].type;
                if (Array.isArray(sourceEvents)) {
                    sourceEvents.forEach(evt => {
                        newEvents.push({
                            id: Math.random().toString(36).substring(7),
                            patient_id: user.uid,
                            date: evt.date || new Date().toISOString(),
                            title: evt.title || 'Extracted Health Event',
                            description: evt.description || 'No description available.',
                            source: sourceType,
                            category: evt.category || 'activity',
                            ai_insight: evt.ai_insight
                        });
                    });
                }
            });

            // If we successfully got new events, clear old mock ones and add new ones
            if (newEvents.length > 0) {
                await timelineService.clear(user.uid);
                await timelineService.addMultiple(newEvents);
                await loadTimeline();
            }
        } catch (error) {
            console.error("Failed to sync sources:", error);
        } finally {
            setIsSyncing(false);
        }
    };

    const filteredEvents = filter === 'all'
        ? events
        : events.filter(e => e.category === filter);

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold font-display text-gray-900 dark:text-white flex items-center gap-2">
                        <Clock className="w-6 h-6 text-indigo-500" />
                        Unified Health Timeline
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Your health story, automatically curated from all your sync sources.
                    </p>
                </div>

                <PremiumButton
                    variant="primary"
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="flex items-center gap-2"
                >
                    <motion.div animate={{ rotate: isSyncing ? 360 : 0 }} transition={{ repeat: isSyncing ? Infinity : 0, duration: 1, ease: "linear" }}>
                        <RotateCw className="w-4 h-4" />
                    </motion.div>
                    {isSyncing ? 'Extracting via AI...' : 'Sync All Sources'}
                </PremiumButton>
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {['all', 'symptom', 'vitals', 'medication', 'diagnosis'].map(cat => (
                    <button
                        key={cat}
                        onClick={() => setFilter(cat as any)}
                        className={`capitalize px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap
                            ${filter === cat
                                ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                                : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Timeline Feed */}
            <GlassCard className="p-6 relative">
                {/* Vertical Line */}
                <div className="absolute left-[44px] top-6 bottom-6 w-[2px] bg-gradient-to-b from-indigo-500/50 via-purple-500/20 to-transparent"></div>

                <div className="space-y-6">
                    <AnimatePresence>
                        {events.length === 0 && !isSyncing && (
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="py-12 text-center text-gray-400 pl-12"
                            >
                                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4 border border-dashed border-gray-300 dark:border-gray-600">
                                    <Clock className="w-8 h-8 opacity-20" />
                                </div>
                                <p className="font-medium text-gray-600 dark:text-gray-300">No events synced yet.</p>
                                <p className="text-sm mt-1">Click "Sync All Sources" to let the AI build your timeline.</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {filteredEvents.map((event, index) => (
                            <motion.div
                                key={event.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: index * 0.1 }}
                                className="relative pl-14 group"
                            >
                                {/* Group container for hover effects */}
                                <div className="absolute left-0 top-1 transition-transform group-hover:scale-110">
                                    <CategoryIcon category={event.category} source={event.source} />
                                </div>

                                <div className="bg-white/50 dark:bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-gray-100 dark:border-white/5 hover:border-indigo-500/30 transition-colors shadow-sm">
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                                        <div>
                                            <h4 className="text-base font-bold text-gray-900 dark:text-white">
                                                {event.title}
                                            </h4>
                                            <p className="text-xs text-gray-400 font-medium">
                                                {new Date(event.date).toLocaleDateString(undefined, {
                                                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                        <NeumorphicBadge variant="neutral" className="w-fit text-[10px] uppercase tracking-wider opacity-80">
                                            Auto-Synced via {event.source}
                                        </NeumorphicBadge>
                                    </div>

                                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl">
                                        {event.description}
                                    </p>

                                    {event.ai_insight && (
                                        <div className="mt-4 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl p-3 flex gap-3 items-start">
                                            <div className="mt-0.5"><Activity className="w-4 h-4 text-indigo-500" /></div>
                                            <div>
                                                <p className="text-xs font-bold text-indigo-800 dark:text-indigo-300 mb-0.5">Grok AI Insight</p>
                                                <p className="text-xs text-indigo-700/80 dark:text-indigo-200/80">{event.ai_insight}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </GlassCard>
        </div>
    );
}
