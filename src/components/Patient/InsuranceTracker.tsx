import { useState, useEffect } from 'react';
import { Shield, Plus, Trash2, AlertTriangle, Calendar, DollarSign, FileText } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { InsuranceRecord, InsuranceClaim } from '../../types';
import { insuranceService } from '../../services/dataService';

export default function InsuranceTracker() {
    const { user } = useAuth();
    const [records, setRecords] = useState<InsuranceRecord[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [showClaimForm, setShowClaimForm] = useState<string | null>(null);
    const [form, setForm] = useState({ provider: '', policy_number: '', coverage_type: '', expiry_date: '', premium: '' });
    const [claimForm, setClaimForm] = useState({ description: '', amount: '', date: new Date().toISOString().split('T')[0] });

    useEffect(() => {
        const load = async () => {
            setRecords(await insuranceService.getAll(user?.uid || 'anonymous'));
        };
        load();
    }, [user]);

    const addRecord = async () => {
        if (!form.provider || !form.policy_number) return;
        const record: InsuranceRecord = {
            id: Date.now().toString(), patient_id: user?.uid || 'anonymous',
            provider: form.provider, policy_number: form.policy_number,
            coverage_type: form.coverage_type || 'Health',
            expiry_date: form.expiry_date, premium: form.premium ? parseFloat(form.premium) : undefined,
            claims: [], created_at: new Date().toISOString(),
        };
        await insuranceService.add(record);
        setRecords(await insuranceService.getAll(user?.uid || 'anonymous'));
        setForm({ provider: '', policy_number: '', coverage_type: '', expiry_date: '', premium: '' });
        setShowForm(false);
    };

    const addClaim = async (recordId: string) => {
        if (!claimForm.description || !claimForm.amount) return;
        const claim: InsuranceClaim = {
            id: Date.now().toString(), date: claimForm.date,
            amount: parseFloat(claimForm.amount), status: 'pending',
            description: claimForm.description,
        };
        await insuranceService.addClaim(recordId, claim);
        setRecords(await insuranceService.getAll(user?.uid || 'anonymous'));
        setClaimForm({ description: '', amount: '', date: new Date().toISOString().split('T')[0] });
        setShowClaimForm(null);
    };

    const deleteRecord = async (id: string) => {
        if (!confirm('Delete this insurance record?')) return;
        await insuranceService.remove(id);
        setRecords(await insuranceService.getAll(user?.uid || 'anonymous'));
    };

    const daysUntilExpiry = (date: string) => {
        const diff = new Date(date).getTime() - Date.now();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    return (
        <div className="space-y-6">
            <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                        <div className="bg-emerald-100 p-2 rounded-xl"><Shield className="w-6 h-6 text-emerald-600" /></div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">Insurance Tracker</h3>
                            <p className="text-sm text-gray-500">Manage your health insurance policies</p>
                        </div>
                    </div>
                    <button onClick={() => setShowForm(!showForm)}
                        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg hover:shadow-lg transition-all text-sm">
                        <Plus className="w-4 h-4" /><span>Add Policy</span>
                    </button>
                </div>

                {showForm && (
                    <div className="mb-6 p-4 bg-blue-50/50 rounded-xl space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input value={form.provider} onChange={e => setForm({ ...form, provider: e.target.value })}
                                className="px-3 py-2 rounded-lg glass-input text-sm" placeholder="Insurance Provider" />
                            <input value={form.policy_number} onChange={e => setForm({ ...form, policy_number: e.target.value })}
                                className="px-3 py-2 rounded-lg glass-input text-sm" placeholder="Policy Number" />
                            <select value={form.coverage_type} onChange={e => setForm({ ...form, coverage_type: e.target.value })}
                                className="px-3 py-2 rounded-lg glass-input text-sm">
                                <option value="">Coverage Type</option>
                                <option value="Health">Health</option>
                                <option value="Life">Life</option>
                                <option value="Accident">Accident</option>
                                <option value="Critical Illness">Critical Illness</option>
                            </select>
                            <input type="date" value={form.expiry_date} onChange={e => setForm({ ...form, expiry_date: e.target.value })}
                                className="px-3 py-2 rounded-lg glass-input text-sm" />
                            <input type="number" value={form.premium} onChange={e => setForm({ ...form, premium: e.target.value })}
                                className="px-3 py-2 rounded-lg glass-input text-sm" placeholder="Annual Premium (₹)" />
                        </div>
                        <div className="flex justify-end space-x-2">
                            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600 text-sm">Cancel</button>
                            <button onClick={addRecord} className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm hover:bg-emerald-600 transition-all">Save</button>
                        </div>
                    </div>
                )}

                {records.length === 0 ? (
                    <div className="text-center py-12">
                        <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h4 className="text-lg font-bold text-gray-600 mb-2">No Insurance Policies</h4>
                        <p className="text-gray-500 text-sm">Add your first insurance policy above</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {records.map(record => {
                            const days = record.expiry_date ? daysUntilExpiry(record.expiry_date) : null;
                            const expiringSoon = days !== null && days <= 30 && days > 0;
                            const expired = days !== null && days <= 0;
                            return (
                                <div key={record.id} className={`p-5 rounded-xl border ${expired ? 'bg-red-50/50 border-red-200' : expiringSoon ? 'bg-yellow-50/50 border-yellow-200' : 'bg-white/40 border-gray-100'}`}>
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h4 className="font-bold text-gray-800 text-lg">{record.provider}</h4>
                                            <p className="text-sm text-gray-500">
                                                <span className="font-mono">{record.policy_number}</span> • {record.coverage_type}
                                            </p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            {expired && <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-bold">Expired</span>}
                                            {expiringSoon && <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold flex items-center"><AlertTriangle className="w-3 h-3 mr-1" />{days} days left</span>}
                                            <button onClick={() => deleteRecord(record.id)} className="p-1.5 hover:bg-red-100 rounded-lg">
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                                        {record.expiry_date && (
                                            <div className="flex items-center text-sm text-gray-600">
                                                <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                                                Expires: {new Date(record.expiry_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </div>
                                        )}
                                        {record.premium && (
                                            <div className="flex items-center text-sm text-gray-600">
                                                <DollarSign className="w-4 h-4 mr-1 text-gray-400" />
                                                Premium: ₹{record.premium.toLocaleString()}/yr
                                            </div>
                                        )}
                                        <div className="flex items-center text-sm text-gray-600">
                                            <FileText className="w-4 h-4 mr-1 text-gray-400" />
                                            Claims: {record.claims.length}
                                        </div>
                                    </div>

                                    {record.claims.length > 0 && (
                                        <div className="mb-3">
                                            <p className="text-xs font-semibold text-gray-500 mb-2">Claim History:</p>
                                            <div className="space-y-1">
                                                {record.claims.map(claim => (
                                                    <div key={claim.id} className="flex items-center justify-between text-sm p-2 bg-white/50 rounded-lg">
                                                        <span className="text-gray-700">{claim.description}</span>
                                                        <div className="flex items-center space-x-2">
                                                            <span className="font-medium">₹{claim.amount.toLocaleString()}</span>
                                                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${claim.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                                claim.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                                    'bg-yellow-100 text-yellow-700'}`}>{claim.status}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {showClaimForm === record.id ? (
                                        <div className="p-3 bg-blue-50/50 rounded-lg space-y-2">
                                            <div className="grid grid-cols-3 gap-2">
                                                <input value={claimForm.description} onChange={e => setClaimForm({ ...claimForm, description: e.target.value })}
                                                    className="col-span-2 px-2 py-1.5 rounded glass-input text-xs" placeholder="Claim description" />
                                                <input type="number" value={claimForm.amount} onChange={e => setClaimForm({ ...claimForm, amount: e.target.value })}
                                                    className="px-2 py-1.5 rounded glass-input text-xs" placeholder="Amount (₹)" />
                                            </div>
                                            <div className="flex justify-end space-x-2">
                                                <button onClick={() => setShowClaimForm(null)} className="text-xs text-gray-500">Cancel</button>
                                                <button onClick={() => addClaim(record.id)} className="px-3 py-1 bg-blue-500 text-white rounded text-xs">Add Claim</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button onClick={() => setShowClaimForm(record.id)}
                                            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1">
                                            <Plus className="w-3 h-3" /><span>Add Claim</span>
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
