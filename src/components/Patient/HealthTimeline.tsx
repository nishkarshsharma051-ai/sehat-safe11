import { useState, useEffect } from 'react';
import { Clock, Plus, Trash2, FileText, Activity, Scissors, ClipboardList, Heart, LucideIcon, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { HealthEntry } from '../../types';
import { healthEntryService } from '../../services/dataService';
import { useLanguage } from '../../contexts/LanguageContext';
import MedicalRecordUploadModal from './MedicalRecordUploadModal';

const TYPE_CONFIG: (t: (en: string, hi: string) => string) => Record<string, { icon: LucideIcon; color: string; bg: string; label: string }> = (t) => ({
    test: { icon: Activity, color: 'text-blue-600', bg: 'bg-blue-100', label: t('Lab Test', 'लैब टेस्ट') },
    prescription: { icon: FileText, color: 'text-green-600', bg: 'bg-green-100', label: t('Prescription', 'नुस्खा') },
    surgery: { icon: Scissors, color: 'text-red-600', bg: 'bg-red-100', label: t('Surgery', 'सर्जरी') },
    report: { icon: ClipboardList, color: 'text-purple-600', bg: 'bg-purple-100', label: t('Report', 'रिपोर्ट') },
    vitals: { icon: Heart, color: 'text-rose-600', bg: 'bg-rose-100', label: t('Vitals', 'वाइटल्स') },
});

interface HealthTimelineProps {
    patientId?: string;
    onEntryAdded?: () => void;
}

export default function HealthTimeline({ patientId, onEntryAdded }: HealthTimelineProps) {
    const { user } = useAuth();
    const targetPatientId = patientId || user?.uid || 'anonymous';
    const isDoctorView = !!patientId && patientId !== user?.uid;

    const { t, lang } = useLanguage();
    const typeConfig = TYPE_CONFIG(t);
    const [entries, setEntries] = useState<HealthEntry[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [filter, setFilter] = useState('all');
    const [form, setForm] = useState({ type: 'test', title: '', description: '', date: new Date().toISOString().split('T')[0] });

    const load = async () => {
        const data = await healthEntryService.getAll(targetPatientId);
        setEntries(data);
    };

    useEffect(() => {
        load();

        const handleUpdate = () => load();
        window.addEventListener('health-entries-updated', handleUpdate);
        return () => window.removeEventListener('health-entries-updated', handleUpdate);
    }, [targetPatientId]);

    const addEntry = async () => {
        if (!form.title) return;
        await healthEntryService.add({
            id: Date.now().toString(),
            patient_id: targetPatientId,
            date: form.date,
            type: form.type as HealthEntry['type'],
            title: form.title,
            description: form.description,
            created_at: new Date().toISOString(),
        });
        load();
        if (onEntryAdded) onEntryAdded();
        setForm({ type: 'test', title: '', description: '', date: new Date().toISOString().split('T')[0] });
        setShowForm(false);
    };

    const removeEntry = async (id: string) => {
        await healthEntryService.remove(id);
        load();
    };

    const filtered = filter === 'all' ? entries : entries.filter(e => e.type === filter);

    // Group by month-year
    const grouped: Record<string, HealthEntry[]> = {};
    filtered.forEach((e: HealthEntry) => {
        const key = new Date(e.date).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { month: 'long', year: 'numeric' });
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(e);
    });

    return (
        <div className="space-y-6">
            <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                        <div className="bg-indigo-100 p-2 rounded-xl"><Clock className="w-6 h-6 text-indigo-600" /></div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">{t('Health Records', 'स्वास्थ्य रिकॉर्ड')}</h3>
                            <p className="text-sm text-gray-500">{t('Visual history of your medical events', 'आपके चिकित्सा कार्यक्रमों का ऐतिहासिक विवरण')}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsUploadModalOpen(true)}
                            className="flex items-center space-x-2 px-4 py-2 bg-indigo-500/10 text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-500/20 transition-all text-sm font-bold"
                        >
                            <Sparkles className="w-4 h-4" />
                            <span>{t('AI Upload', 'एआई अपलोड')}</span>
                        </button>
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="flex items-center space-x-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-all text-sm font-medium shadow-md shadow-black/10"
                        >
                            <Plus className="w-4 h-4" />
                            <span>{t('Add Event', 'इवेंट जोड़ें')}</span>
                        </button>
                    </div>
                </div>

                {showForm && (
                    <div className="mb-6 p-4 bg-indigo-50/50 rounded-xl space-y-3 border border-indigo-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <select
                                value={form.type}
                                onChange={e => setForm({ ...form, type: e.target.value })}
                                className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm"
                            >
                                {Object.entries(typeConfig).map(([key, config]) => (
                                    <option key={key} value={key}>{config.label}</option>
                                ))}
                            </select>
                            <input
                                type="date"
                                value={form.date}
                                onChange={e => setForm({ ...form, date: e.target.value })}
                                className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm"
                            />
                            <input
                                value={form.title}
                                onChange={e => setForm({ ...form, title: e.target.value })}
                                className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm"
                                placeholder={t('Event title', 'इवेंट का शीर्षक')}
                            />
                            <input
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm"
                                placeholder={t('Description (optional)', 'विवरण (वैकल्पिक)')}
                            />
                        </div>
                        <div className="flex justify-end space-x-2">
                            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600 text-sm hover:text-gray-800 transition-colors">{t('Cancel', 'रद्द करें')}</button>
                            <button onClick={addEntry} className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm hover:bg-indigo-600 transition-colors">{t('Add', 'जोड़ें')}</button>
                        </div>
                    </div>
                )}

                <div className="flex flex-wrap gap-2 mb-6">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filter === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                        {t('All', 'सभी')} ({entries.length})
                    </button>
                    {Object.entries(typeConfig).map(([key, config]) => {
                        const count = entries.filter(e => e.type === key).length;
                        return (
                            <button
                                key={key}
                                onClick={() => setFilter(key)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filter === key ? `${config.bg} ${config.color}` : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                {config.label} ({count})
                            </button>
                        );
                    })}
                </div>

                {filtered.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                        <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h4 className="text-lg font-bold text-gray-600 mb-2">{t('No Events Yet', 'अभी तक कोई इवेंट नहीं है')}</h4>
                        <p className="text-gray-500 text-sm">{t('Add medical events or use AI Upload to build your health timeline', 'अपनी स्वास्थ्य समयरेखा बनाने के लिए चिकित्सा इवेंट जोड़ें या एआई अपलोड का उपयोग करें')}</p>
                    </div>
                ) : (
                    <div className="relative pl-6">
                        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-200 via-purple-200 to-pink-200 rounded" />

                        {Object.entries(grouped).map(([month, events]) => (
                            <div key={month} className="mb-10 last:mb-0">
                                <div className="relative flex items-center mb-6">
                                    <div className="absolute -left-12 w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center z-10 shadow-lg border-4 border-white">
                                        <span className="text-white text-[10px] font-bold uppercase">{month.split(' ')[0].slice(0, 3)}</span>
                                    </div>
                                    <span className="ml-4 text-sm font-bold text-gray-400 uppercase tracking-widest">{month}</span>
                                </div>

                                <div className="space-y-4">
                                    {events.map((entry: HealthEntry) => {
                                        const config = typeConfig[entry.type] || typeConfig.test;
                                        const Icon = config.icon;
                                        return (
                                            <div key={entry.id} className="relative flex items-start group">
                                                <div className={`absolute -left-6.5 mt-4 w-3 h-3 rounded-full ${config.bg} border-2 border-white shadow-sm z-10 transition-transform group-hover:scale-125`} />
                                                <div className="flex-1 p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all group-hover:border-indigo-100">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-start space-x-4">
                                                            <div className={`p-2.5 rounded-xl ${config.bg} shadow-sm`}>
                                                                <Icon className={`w-5 h-5 ${config.color}`} />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <p className="font-bold text-gray-900">{entry.title}</p>
                                                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${config.bg} ${config.color}`}>
                                                                        {config.label}
                                                                    </span>
                                                                </div>
                                                                {entry.description && <p className="text-sm text-gray-500 leading-relaxed">{entry.description}</p>}
                                                                <p className="text-[11px] text-gray-400 mt-2 font-medium flex items-center gap-1">
                                                                    <Clock className="w-3 h-3" />
                                                                    {new Date(entry.date).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                                </p>

                                                                {entry.values && Object.keys(entry.values).length > 0 && (
                                                                    <div className="flex flex-wrap gap-2 mt-3">
                                                                        {Object.entries(entry.values).map(([k, v]: [string, any]) => (
                                                                            <div key={k} className="px-2 py-1 bg-gray-50 border border-gray-100 rounded-lg flex items-center gap-2">
                                                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{k.replace(/_/g, ' ')}</span>
                                                                                <span className="text-xs font-bold text-indigo-600">{v}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => removeEntry(entry.id)}
                                                            className="p-2 hover:bg-red-50 text-gray-300 hover:text-red-500 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <MedicalRecordUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                patientId={user?.uid || ''}
                onUploadComplete={load}
            />
        </div>
    );
}

export function HealthRecordsView(props: HealthTimelineProps) {
    return <HealthTimeline {...props} />;
}
