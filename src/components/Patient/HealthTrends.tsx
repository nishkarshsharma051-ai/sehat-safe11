import { useState, useEffect } from 'react';
import { TrendingUp, Plus, Droplet, Heart, Scale } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { HealthEntry } from '../../types';
import { healthEntryService } from '../../services/dataService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const METRICS = [
    { key: 'sugar', label: 'Blood Sugar', unit: 'mg/dL', color: '#f59e0b', icon: Droplet, normal: '80–130' },
    { key: 'bp_systolic', label: 'BP Systolic', unit: 'mmHg', color: '#ef4444', icon: Heart, normal: '< 120' },
    { key: 'bp_diastolic', label: 'BP Diastolic', unit: 'mmHg', color: '#ec4899', icon: Heart, normal: '< 80' },
    { key: 'weight', label: 'Weight', unit: 'kg', color: '#6366f1', icon: Scale, normal: 'BMI 18.5–25' },
];

export default function HealthTrends() {
    const { user } = useAuth();
    const [entries, setEntries] = useState<HealthEntry[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [activeMetric, setActiveMetric] = useState('sugar');
    const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], sugar: '', bp_systolic: '', bp_diastolic: '', weight: '' });

    useEffect(() => {
        loadEntries();
    }, [user]);

    const loadEntries = async () => {
        setEntries(await healthEntryService.getByType(user?.uid || 'anonymous', 'vitals'));
    };

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

    const currentMetric = METRICS.find(m => m.key === activeMetric)!;

    // Build chart data sorted by date
    const chartData = entries
        .filter(e => e.values && e.values[activeMetric] !== undefined)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(e => ({
            date: new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
            value: e.values![activeMetric],
        }));

    const latestValue = chartData.length > 0 ? chartData[chartData.length - 1].value : null;
    const prevValue = chartData.length > 1 ? chartData[chartData.length - 2].value : null;
    const trend = latestValue !== null && prevValue !== null
        ? latestValue > prevValue ? 'up' : latestValue < prevValue ? 'down' : 'stable'
        : null;

    return (
        <div className="space-y-6">
            <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                        <div className="bg-indigo-100 p-2 rounded-xl"><TrendingUp className="w-6 h-6 text-indigo-600" /></div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">Health Trends</h3>
                            <p className="text-sm text-gray-500">Track your vitals over time</p>
                        </div>
                    </div>
                    <button onClick={() => setShowForm(!showForm)}
                        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all text-sm">
                        <Plus className="w-4 h-4" /><span>Add Reading</span>
                    </button>
                </div>

                {showForm && (
                    <div className="mb-6 p-4 bg-indigo-50/50 rounded-xl space-y-3">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                                className="px-3 py-2 rounded-lg glass-input text-sm" />
                            <input type="number" value={form.sugar} onChange={e => setForm({ ...form, sugar: e.target.value })}
                                className="px-3 py-2 rounded-lg glass-input text-sm" placeholder="Sugar (mg/dL)" />
                            <input type="number" value={form.bp_systolic} onChange={e => setForm({ ...form, bp_systolic: e.target.value })}
                                className="px-3 py-2 rounded-lg glass-input text-sm" placeholder="BP Systolic" />
                            <input type="number" value={form.bp_diastolic} onChange={e => setForm({ ...form, bp_diastolic: e.target.value })}
                                className="px-3 py-2 rounded-lg glass-input text-sm" placeholder="BP Diastolic" />
                            <input type="number" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })}
                                className="px-3 py-2 rounded-lg glass-input text-sm" placeholder="Weight (kg)" />
                        </div>
                        <div className="flex justify-end space-x-2">
                            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600 text-sm">Cancel</button>
                            <button onClick={addReading} className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm">Save</button>
                        </div>
                    </div>
                )}

                {/* Metric selector */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    {METRICS.map(metric => {
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
                                <p className="text-xs text-gray-400">Normal: {metric.normal}</p>
                            </button>
                        );
                    })}
                </div>

                {/* Chart */}
                <div className="bg-white/40 rounded-xl p-4">
                    {chartData.length < 2 ? (
                        <div className="text-center py-12">
                            <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 text-sm">Add at least 2 readings to see the trend graph</p>
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
                    <div className="mt-4 p-3 bg-blue-50/50 rounded-xl flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">
                                Latest <strong>{currentMetric.label}</strong>: <span className="text-lg font-bold" style={{ color: currentMetric.color }}>{latestValue}</span> {currentMetric.unit}
                            </p>
                            <p className="text-xs text-gray-400">Normal range: {currentMetric.normal}</p>
                        </div>
                        {trend && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${trend === 'up' ? 'bg-red-100 text-red-600' : trend === 'down' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                                {trend === 'up' ? '↑ Increasing' : trend === 'down' ? '↓ Decreasing' : '→ Stable'}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
