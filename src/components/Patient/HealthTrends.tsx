import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Plus, Droplet, Heart, Scale } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { HealthEntry } from '../../types';
import { healthEntryService } from '../../services/dataService';
import { useLanguage } from '../../contexts/LanguageContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getGeminiResponse } from '../../services/geminiService';

const METRICS: (t: (en: string, hi: string) => string) => any[] = (t) => [
    { key: 'sugar', label: t('Blood Sugar', 'ब्लड शुगर'), unit: 'mg/dL', color: '#f59e0b', icon: Droplet, normal: '80–130' },
    { key: 'bp_systolic', label: t('BP Systolic', 'बीपी सिस्टोलिक'), unit: 'mmHg', color: '#ef4444', icon: Heart, normal: '< 120' },
    { key: 'bp_diastolic', label: t('BP Diastolic', 'बीपी डायस्टोलिक'), unit: 'mmHg', color: '#ec4899', icon: Heart, normal: '< 80' },
    { key: 'weight', label: t('Weight', 'वजन'), unit: t('kg', 'किग्रा'), color: '#6366f1', icon: Scale, normal: 'BMI 18.5–25' },
];

export default function HealthTrends() {
    const { user } = useAuth();
    const { t, lang } = useLanguage();
    const metricsConfig = METRICS(t);
    const [entries, setEntries] = useState<HealthEntry[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [activeMetric, setActiveMetric] = useState('sugar');
    const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], sugar: '', bp_systolic: '', bp_diastolic: '', weight: '' });
    const [aiInsight, setAiInsight] = useState<string | null>(null);
    const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);

    const loadEntries = useCallback(async () => {
        setEntries(await healthEntryService.getByType(user?.uid || 'anonymous', 'vitals'));
    }, [user]);

    useEffect(() => {
        loadEntries();
    }, [loadEntries]);

    const addReading = async () => {
        const values: Record<string, number> = {};
        if (form.sugar) values.sugar = parseFloat(form.sugar);
        if (form.bp_systolic) values.bp_systolic = parseFloat(form.bp_systolic);
        if (form.bp_diastolic) values.bp_diastolic = parseFloat(form.bp_diastolic);
        if (form.weight) values.weight = parseFloat(form.weight);

        if (Object.keys(values).length === 0) return;

        await healthEntryService.add({
            id: Date.now().toString(), patient_id: user?.uid || 'anonymous',
            date: form.date, type: 'vitals', title: 'Vitals Reading',
            description: Object.entries(values).map(([k, v]) => `${k}: ${v}`).join(', '),
            values, created_at: new Date().toISOString(),
        });
        await loadEntries();
        setForm({ date: new Date().toISOString().split('T')[0], sugar: '', bp_systolic: '', bp_diastolic: '', weight: '' });
        setShowForm(false);
    };

    const currentMetric = metricsConfig.find(m => m.key === activeMetric)!;

    // Build chart data sorted by date
    const chartData = entries
        .filter(e => e.values && e.values[activeMetric] !== undefined)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(e => ({
            date: new Date(e.date).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short' }),
            value: e.values![activeMetric],
        }));

    const latestValue = chartData.length > 0 ? chartData[chartData.length - 1].value : null;
    const prevValue = chartData.length > 1 ? chartData[chartData.length - 2].value : null;
    const trend = latestValue !== null && prevValue !== null
        ? latestValue > prevValue ? 'up' : latestValue < prevValue ? 'down' : 'stable'
        : null;

    useEffect(() => {
        const generateInsight = async () => {
            if (chartData.length < 2) {
                setAiInsight(null);
                return;
            }
            setIsGeneratingInsight(true);
            try {
                const prompt = `Analyze this health trend data for ${currentMetric.label} (Normal range: ${currentMetric.normal}). 
                Recent values: ${chartData.map(d => `${d.date}: ${d.value}`).join(', ')}. 
                Provide a very brief (2-3 sentences max) clinical insight on the trend and a simple recommendation. Do not use markdown headers.`;
                const insight = await getGeminiResponse(prompt);
                setAiInsight(insight);
            } catch (error) {
                console.error('Error generating AI insight:', error);
                setAiInsight(null);
            } finally {
                setIsGeneratingInsight(false);
            }
        };

        generateInsight();
    }, [activeMetric, entries, currentMetric.label, currentMetric.normal]);

    const handlePrintSupport = () => {
        window.print();
    };

    return (
        <div className="space-y-6 print:m-0 print:p-0">
            <div className="glass-card p-6 print:shadow-none print:border-none print:bg-white">
                <div className="flex items-center justify-between mb-6 print:mb-2">
                    <div className="flex items-center space-x-3">
                        <div className="bg-indigo-100 p-2 rounded-xl"><TrendingUp className="w-6 h-6 text-indigo-600" /></div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">{t('Health Trends', 'स्वास्थ्य रुझान')}</h3>
                            <p className="text-sm text-gray-500">{t('Track your vitals over time', 'समय के साथ अपने मुख्य संकेतों को ट्रैक करें')}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 print:hidden">
                        <button onClick={handlePrintSupport}
                            className="flex items-center space-x-2 px-4 py-2 bg-white/50 text-indigo-600 rounded-lg shadow border border-indigo-100 hover:bg-white text-sm transition-all font-medium">
                            <Droplet className="w-4 h-4 hidden" />  <span>Export PDF</span>
                        </button>
                        <button onClick={() => setShowForm(!showForm)}
                            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium">
                            <Plus className="w-4 h-4" /><span>{t('Add Reading', 'रीडिंग जोड़ें')}</span>
                        </button>
                    </div>
                </div>

                {showForm && (
                    <div className="mb-6 p-4 bg-indigo-50/50 rounded-xl space-y-3">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                                className="px-3 py-2 rounded-lg glass-input text-sm" />
                            <input type="number" value={form.sugar} onChange={e => setForm({ ...form, sugar: e.target.value })}
                                className="px-3 py-2 rounded-lg glass-input text-sm" placeholder={t('Sugar (mg/dL)', 'शुगर (mg/dL)')} />
                            <input type="number" value={form.bp_systolic} onChange={e => setForm({ ...form, bp_systolic: e.target.value })}
                                className="px-3 py-2 rounded-lg glass-input text-sm" placeholder={t('BP Systolic', 'बीपी सिस्टोलिक')} />
                            <input type="number" value={form.bp_diastolic} onChange={e => setForm({ ...form, bp_diastolic: e.target.value })}
                                className="px-3 py-2 rounded-lg glass-input text-sm" placeholder={t('BP Diastolic', 'बीपी डायस्टोलिक')} />
                            <input type="number" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })}
                                className="px-3 py-2 rounded-lg glass-input text-sm" placeholder={t('Weight (kg)', 'वजन (किग्रा)')} />
                        </div>
                        <div className="flex justify-end space-x-2">
                            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600 text-sm">{t('Cancel', 'रद्द करें')}</button>
                            <button onClick={addReading} className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm">{t('Save', 'सहेजें')}</button>
                        </div>
                    </div>
                )}

                {/* Metric selector */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    {metricsConfig.map(metric => {
                        const Icon = metric.icon;
                        const isActive = activeMetric === metric.key;
                        const lastVal = entries.filter(e => e.values?.[metric.key] !== undefined).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.values?.[metric.key];
                        return (
                            <button key={metric.key} onClick={() => setActiveMetric(metric.key)}
                                className={`p-4 rounded-xl text-left transition-all ${isActive ? 'ring-2 shadow-md' : 'bg-white/40 hover:bg-white/60'}`}
                                style={isActive ? { borderColor: metric.color, backgroundColor: `${metric.color}10` } : {}}>
                                <div className="flex items-center space-x-2 mb-1">
                                    <Icon className="w-4 h-4" style={{ color: metric.color }} />
                                    <span className="text-xs font-medium text-gray-600">{metric.label}</span>
                                </div>
                                <p className="text-xl font-bold text-gray-800">{lastVal !== undefined ? lastVal : '—'}</p>
                                <p className="text-xs text-gray-400">{t('Normal:', 'सामान्य:')} {metric.normal}</p>
                            </button>
                        );
                    })}
                </div>

                {/* Chart */}
                <div className="bg-white/40 rounded-xl p-4">
                    {chartData.length < 2 ? (
                        <div className="text-center py-12">
                            <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 text-sm">{t('Add at least 2 readings to see the trend graph', 'ट्रेंड ग्राफ देखने के लिए कम से कम 2 रीडिंग जोड़ें')}</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                <Legend />
                                <Line type="monotone" dataKey="value" name={currentMetric.label}
                                    stroke={currentMetric.color} strokeWidth={3}
                                    dot={{ r: 5, fill: currentMetric.color }} activeDot={{ r: 7 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Latest reading summary */}
                {latestValue !== null && (
                    <div className="mt-4 p-3 bg-blue-50/50 rounded-xl flex items-center justify-between print:break-inside-avoid">
                        <div>
                            <p className="text-sm text-gray-600">
                                {t('Latest', 'नवीनतम')} <strong>{currentMetric.label}</strong>: <span className="text-lg font-bold" style={{ color: currentMetric.color }}>{latestValue}</span> {currentMetric.unit}
                            </p>
                            <p className="text-xs text-gray-400">{t('Normal range:', 'सामान्य सीमा:')} {currentMetric.normal}</p>
                        </div>
                        {trend && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${trend === 'up' ? 'bg-red-100 text-red-600' : trend === 'down' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                                {trend === 'up' ? t('↑ Increasing', '↑ बढ़ रहा है') : trend === 'down' ? t('↓ Decreasing', '↓ घट रहा है') : t('→ Stable', '→ स्थिर')}
                            </span>
                        )}
                    </div>
                )}

                {/* AI Insight Section */}
                {chartData.length >= 2 && (
                    <div className="mt-6 p-5 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100/50 print:border-gray-300 print:break-inside-avoid">
                        <h4 className="text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
                            <span className="text-xl">✨</span> AI Trend Analysis
                        </h4>
                        {isGeneratingInsight ? (
                            <div className="animate-pulse flex space-x-4">
                                <div className="flex-1 space-y-2 py-1">
                                    <div className="h-3 bg-indigo-200/50 rounded w-3/4"></div>
                                    <div className="h-3 bg-indigo-200/50 rounded"></div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-indigo-800/80 leading-relaxed font-medium">
                                {aiInsight || "Sufficient data recorded to monitor trends. Continue logging daily for deeper insights."}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
