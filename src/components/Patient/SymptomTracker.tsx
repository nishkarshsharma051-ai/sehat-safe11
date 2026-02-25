import { useState, useEffect } from 'react';
import { Activity, Plus, History, AlertCircle } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { PremiumButton } from '../ui/PremiumButton';
import { NeumorphicBadge } from '../ui/NeumorphicBadge';
import { motion, AnimatePresence } from 'framer-motion';
import { symptomService } from '../../services/dataService';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function SymptomTracker() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [logs, setLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLogging, setIsLogging] = useState(false);
    const [newLog, setNewLog] = useState({
        name: '',
        severity: 5,
        notes: ''
    });

    useEffect(() => {
        loadLogs();
    }, [user]);

    const loadLogs = async () => {
        if (!user?.uid) return;
        try {
            const data = await symptomService.getAll(user.uid);
            setLogs(data);
        } catch (error) {
            console.error('Failed to load symptom logs:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddLog = async () => {
        if (!user?.uid || !newLog.name) return;
        try {
            await symptomService.add(user.uid, [{
                name: newLog.name,
                severity: newLog.severity,
                notes: newLog.notes
            }]);
            setNewLog({ name: '', severity: 5, notes: '' });
            setIsLogging(false);
            loadLogs();
        } catch (error) {
            alert('Failed to add symptom log');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t('Symptom Tracker', 'लक्षण ट्रैकर')}</h2>
                    <p className="text-gray-500 dark:text-gray-400">{t('Log and monitor your symptoms over time', 'समय के साथ अपने लक्षणों को लॉग करें और उनकी निगरानी करें')}</p>
                </div>
                <PremiumButton variant="primary" size="sm" onClick={() => setIsLogging(true)} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" /> {t('Log Symptom', 'लक्षण लॉग करें')}
                </PremiumButton>
            </div>

            <AnimatePresence>
                {isLogging && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <GlassCard className="p-6">
                            <h3 className="text-lg font-bold mb-4">{t('New Symptom Entry', 'नई लक्षण प्रविष्टि')}</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{t('Symptom Name', 'लक्षण का नाम')}</label>
                                    <input
                                        type="text"
                                        placeholder={t('e.g. Headache', 'जैसे कि सिरदर्द')}
                                        value={newLog.name}
                                        onChange={e => setNewLog({ ...newLog, name: e.target.value })}
                                        className="w-full p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-white/10 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                                        {t('Severity', 'तनाव')} ({newLog.severity}/10)
                                    </label>
                                    <input
                                        type="range"
                                        min="1"
                                        max="10"
                                        value={newLog.severity}
                                        onChange={e => setNewLog({ ...newLog, severity: parseInt(e.target.value) })}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                    />
                                    <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                                        <span>{t('Mild', 'हल्का')}</span>
                                        <span>{t('Moderate', 'मध्यम')}</span>
                                        <span>{t('Severe', 'गंभीर')}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{t('Notes', 'नोट्स')}</label>
                                    <textarea
                                        placeholder={t('Any additional details...', 'कोई अतिरिक्त विवरण...')}
                                        value={newLog.notes}
                                        onChange={e => setNewLog({ ...newLog, notes: e.target.value })}
                                        className="w-full p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-white/10 outline-none min-h-[100px]"
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <PremiumButton variant="primary" className="flex-1" onClick={handleAddLog}>
                                        {t('Save Log', 'लॉग सहेजें')}
                                    </PremiumButton>
                                    <button
                                        onClick={() => setIsLogging(false)}
                                        className="flex-1 py-3 px-6 rounded-2xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-200 transition-all shadow-sm active:scale-95"
                                    >
                                        {t('Cancel', 'रद्द करें')}
                                    </button>
                                </div>
                            </div>
                        </GlassCard>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <GlassCard className="p-6">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <History className="w-5 h-5 text-indigo-500" />
                        {t('Recent Activity', 'हाल की गतिविधि')}
                    </h3>
                    <div className="space-y-4">
                        {isLoading ? (
                            <div className="py-10 text-center text-gray-400">{t('Loading logs...', 'लॉग लोड हो रहे हैं...')}</div>
                        ) : logs.length === 0 ? (
                            <div className="py-10 text-center text-gray-400">
                                <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-20" />
                                {t('No symptoms logged yet', 'अभी तक कोई लक्षण लॉग नहीं किया गया है')}
                            </div>
                        ) : (
                            logs.slice(0, 5).map((log, i) => (
                                <div key={log._id || i} className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            {log.symptoms.map((s: any, si: number) => (
                                                <h4 key={si} className="font-bold text-gray-800 dark:text-white capitalize">{s.name}</h4>
                                            ))}
                                            <p className="text-[10px] text-gray-400">{new Date(log.date).toLocaleString()}</p>
                                        </div>
                                        <NeumorphicBadge variant={log.symptoms[0].severity > 7 ? 'error' : log.symptoms[0].severity > 4 ? 'warning' : 'success'}>
                                            {t('Severity', 'तनाव')}: {log.symptoms[0].severity}/10
                                        </NeumorphicBadge>
                                    </div>
                                    {log.symptoms[0].notes && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-black/20 p-2 rounded-lg mt-2 italic">
                                            "{log.symptoms[0].notes}"
                                        </p>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </GlassCard>

                <GlassCard className="p-6 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border-indigo-100 dark:border-indigo-500/20">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-purple-500" />
                        {t('Symptom Trends', 'लक्षण रुझान')}
                    </h3>

                    {logs.length >= 2 ? (
                        <div className="h-64 mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={logs.slice(0, 10).reverse().map(log => ({
                                    date: new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                                    severity: log.symptoms[0]?.severity || 0,
                                    name: log.symptoms[0]?.name || ''
                                }))}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                    <XAxis dataKey="date" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                                    <YAxis domain={[0, 10]} stroke="#9ca3af" tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        labelStyle={{ fontWeight: 'bold', color: '#374151' }}
                                        formatter={(value: any, _name: any, props: any) => [
                                            `${value}/10 - ${props.payload.name}`,
                                            t('Severity', 'तनाव')
                                        ]}
                                    />
                                    <Line type="monotone" dataKey="severity" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="p-6 text-center space-y-4">
                            <div className="w-20 h-20 bg-indigo-500 rounded-3xl mx-auto flex items-center justify-center text-white text-3xl shadow-xl shadow-indigo-500/20">
                                📊
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 font-medium leading-relaxed">
                                {t('Log at least 2 symptoms to see your trends graph.', 'अपना रुझान ग्राफ़ देखने के लिए कम से कम 2 लक्षण लॉग करें।')}
                            </p>
                            <div className="pt-4">
                                <NeumorphicBadge variant="info" className="text-[10px]">
                                    {t('AI Pro Tip', 'एआई प्रो टिप')}
                                </NeumorphicBadge>
                                <p className="text-xs text-indigo-500 mt-2 font-bold tracking-tight">
                                    {t('Consistent logging helps your doctor identify trends and triggers for your conditions.', 'लगातार लॉगिंग आपके डॉक्टर को आपकी स्थितियों के लिए रुझानों और ट्रिगर्स की पहचान करने में मदद करती है।')}
                                </p>
                            </div>
                        </div>
                    )}
                </GlassCard>
            </div>
        </div>
    );
}
