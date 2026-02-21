import { useState, useEffect } from 'react';
import { Clock, Plus, Trash2, FileText, Activity, Scissors, ClipboardList, Heart, LucideIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { HealthEntry } from '../../types';
import { healthEntryService } from '../../services/dataService';

const TYPE_CONFIG: Record<string, { icon: LucideIcon; color: string; bg: string; label: string }> = {
    test: { icon: Activity, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Lab Test' },
    prescription: { icon: FileText, color: 'text-green-600', bg: 'bg-green-100', label: 'Prescription' },
    surgery: { icon: Scissors, color: 'text-red-600', bg: 'bg-red-100', label: 'Surgery' },
    report: { icon: ClipboardList, color: 'text-purple-600', bg: 'bg-purple-100', label: 'Report' },
    vitals: { icon: Heart, color: 'text-rose-600', bg: 'bg-rose-100', label: 'Vitals' },
};

export default function HealthTimeline() {
    const { user } = useAuth();
    const [entries, setEntries] = useState<HealthEntry[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [filter, setFilter] = useState('all');
    const [form, setForm] = useState({ type: 'test', title: '', description: '', date: new Date().toISOString().split('T')[0] });

    useEffect(() => {
        const load = async () => {
            setEntries(await healthEntryService.getAll(user?.uid || 'anonymous'));
        };
        load();
    }, [user]);

    const addEntry = async () => {
        if (!form.title) return;
        await healthEntryService.add({
            id: Date.now().toString(), patient_id: user?.uid || 'anonymous',
            date: form.date, type: form.type as HealthEntry['type'],
            title: form.title, description: form.description,
            created_at: new Date().toISOString(),
        });
        setEntries(await healthEntryService.getAll(user?.uid || 'anonymous'));
        setForm({ type: 'test', title: '', description: '', date: new Date().toISOString().split('T')[0] });
        setShowForm(false);
    };

    const removeEntry = async (id: string) => {
        await healthEntryService.remove(id);
        setEntries(await healthEntryService.getAll(user?.uid || 'anonymous'));
    };

    const filtered = filter === 'all' ? entries : entries.filter(e => e.type === filter);

    // Group by month-year
    const grouped: Record<string, HealthEntry[]> = {};
    filtered.forEach(e => {
        const key = new Date(e.date).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
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
                            <h3 className="text-lg font-bold text-gray-800">Health Timeline</h3>
                            <p className="text-sm text-gray-500">Visual history of your medical events</p>
                        </div>
                    </div>
                    <button onClick={() => setShowForm(!showForm)}
                        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all text-sm">
                        <Plus className="w-4 h-4" /><span>Add Event</span>
                    </button>
                </div>

                {showForm && (
                    <div className="mb-6 p-4 bg-indigo-50/50 rounded-xl space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                                className="px-3 py-2 rounded-lg glass-input text-sm">
                                {Object.entries(TYPE_CONFIG).map(([key, config]) => (
                                    <option key={key} value={key}>{config.label}</option>
                                ))}
                            </select>
                            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                                className="px-3 py-2 rounded-lg glass-input text-sm" />
                            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                                className="px-3 py-2 rounded-lg glass-input text-sm" placeholder="Event title" />
                            <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                                className="px-3 py-2 rounded-lg glass-input text-sm" placeholder="Description (optional)" />
                        </div>
                        <div className="flex justify-end space-x-2">
                            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600 text-sm">Cancel</button>
                            <button onClick={addEntry} className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm">Add</button>
                        </div>
                    </div>
                )}

                {/* Filter chips */}
                <div className="flex flex-wrap gap-2 mb-6">
                    <button onClick={() => setFilter('all')}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filter === 'all' ? 'bg-gray-800 text-white' : 'bg-white/50 text-gray-600 hover:bg-white/70'}`}>
                        All ({entries.length})
                    </button>
                    {Object.entries(TYPE_CONFIG).map(([key, config]) => {
                        const count = entries.filter(e => e.type === key).length;
                        return (
                            <button key={key} onClick={() => setFilter(key)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filter === key ? `${config.bg} ${config.color}` : 'bg-white/50 text-gray-600 hover:bg-white/70'}`}>
                                {config.label} ({count})
                            </button>
                        );
                    })}
                </div>

                {filtered.length === 0 ? (
                    <div className="text-center py-12">
                        <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h4 className="text-lg font-bold text-gray-600 mb-2">No Events Yet</h4>
                        <p className="text-gray-500 text-sm">Add medical events to build your health timeline</p>
                    </div>
                ) : (
                    <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-400 via-purple-400 to-pink-400 rounded" />

                        {Object.entries(grouped).map(([month, events]) => (
                            <div key={month} className="mb-8">
                                <div className="relative flex items-center mb-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center z-10 shadow-lg">
                                        <span className="text-white text-xs font-bold">{month.split(' ')[0].slice(0, 3)}</span>
                                    </div>
                                    <span className="ml-4 text-sm font-semibold text-gray-500">{month}</span>
                                </div>

                                <div className="ml-6 space-y-3 pl-8 border-l-0">
                                    {events.map(entry => {
                                        const config = TYPE_CONFIG[entry.type] || TYPE_CONFIG.test;
                                        const Icon = config.icon;
                                        return (
                                            <div key={entry.id} className="relative flex items-start group">
                                                {/* Dot */}
                                                <div className={`absolute -left-[2.35rem] w-3 h-3 rounded-full ${config.bg} border-2 border-white shadow z-10`} />
                                                <div className="flex-1 p-4 bg-white/40 rounded-xl border border-gray-100 hover:shadow-md transition-all">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-start space-x-3">
                                                            <div className={`p-1.5 rounded-lg ${config.bg}`}>
                                                                <Icon className={`w-4 h-4 ${config.color}`} />
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-gray-800">{entry.title}</p>
                                                                {entry.description && <p className="text-sm text-gray-500 mt-0.5">{entry.description}</p>}
                                                                <p className="text-xs text-gray-400 mt-1">
                                                                    {new Date(entry.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <button onClick={() => removeEntry(entry.id)}
                                                            className="p-1 hover:bg-red-100 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                                                            <Trash2 className="w-3 h-3 text-red-500" />
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
        </div>
    );
}
