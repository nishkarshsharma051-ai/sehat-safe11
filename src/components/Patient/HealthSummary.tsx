import { useState, useEffect } from 'react';
import { Heart, AlertTriangle, Shield, Droplet, Phone, User, Edit2, Save, Plus, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { HealthProfile, EmergencyContact } from '../../types';
import { healthProfileService } from '../../services/dataService';

export default function HealthSummary() {
    const { user } = useAuth();
    const [profile, setProfile] = useState<HealthProfile | null>(null);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({
        age: '', weight: '', height: '', blood_group: '',
        bp_systolic: '', bp_diastolic: '', sugar_level: '',
        allergies: '' as string, chronic_conditions: '' as string,
    });
    const [contacts, setContacts] = useState<EmergencyContact[]>([]);
    const [newContact, setNewContact] = useState({ name: '', phone: '', relationship: '' });

    useEffect(() => {
        const load = async () => {
            const p = await healthProfileService.get(user?.uid || 'anonymous');
            if (p) {
                setProfile(p);
                setForm({
                    age: p.age?.toString() || '', weight: p.weight?.toString() || '',
                    height: p.height?.toString() || '', blood_group: p.blood_group || '',
                    bp_systolic: p.bp_systolic?.toString() || '', bp_diastolic: p.bp_diastolic?.toString() || '',
                    sugar_level: p.sugar_level?.toString() || '',
                    allergies: p.allergies.join(', '), chronic_conditions: p.chronic_conditions.join(', '),
                });
                setContacts(p.emergency_contacts || []);
            }
        };
        load();
    }, [user]);

    const saveProfile = async () => {
        const p: HealthProfile = {
            id: profile?.id || Date.now().toString(),
            patient_id: user?.uid || 'anonymous',
            age: form.age ? parseInt(form.age) : undefined,
            weight: form.weight ? parseFloat(form.weight) : undefined,
            height: form.height ? parseFloat(form.height) : undefined,
            blood_group: form.blood_group || undefined,
            bp_systolic: form.bp_systolic ? parseInt(form.bp_systolic) : undefined,
            bp_diastolic: form.bp_diastolic ? parseInt(form.bp_diastolic) : undefined,
            sugar_level: form.sugar_level ? parseFloat(form.sugar_level) : undefined,
            allergies: form.allergies ? form.allergies.split(',').map(s => s.trim()).filter(Boolean) : [],
            chronic_conditions: form.chronic_conditions ? form.chronic_conditions.split(',').map(s => s.trim()).filter(Boolean) : [],
            emergency_contacts: contacts,
        };
        await healthProfileService.save(p);
        setProfile(p);
        setEditing(false);
    };

    const addContact = () => {
        if (!newContact.name || !newContact.phone) return;
        setContacts([...contacts, newContact]);
        setNewContact({ name: '', phone: '', relationship: '' });
    };

    const removeContact = (idx: number) => setContacts(contacts.filter((_, i) => i !== idx));

    return (
        <div className="space-y-6">
            {/* Emergency Info Card */}
            <div className="glass-card p-6 border-2 border-red-200/50">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        <div className="bg-red-100 p-2 rounded-xl"><AlertTriangle className="w-6 h-6 text-red-600" /></div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">Emergency Health Card</h3>
                            <p className="text-sm text-gray-500">Quick access info for emergencies</p>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-red-50 rounded-xl p-4 text-center">
                        <Droplet className="w-6 h-6 text-red-500 mx-auto mb-1" />
                        <p className="text-xs text-gray-500">Blood Group</p>
                        <p className="text-xl font-bold text-red-700">{profile?.blood_group || '—'}</p>
                    </div>
                    <div className="bg-orange-50 rounded-xl p-4 text-center">
                        <AlertTriangle className="w-6 h-6 text-orange-500 mx-auto mb-1" />
                        <p className="text-xs text-gray-500">Allergies</p>
                        <p className="text-sm font-semibold text-orange-700">{profile?.allergies?.length ? profile.allergies.join(', ') : 'None'}</p>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-4 text-center">
                        <Heart className="w-6 h-6 text-purple-500 mx-auto mb-1" />
                        <p className="text-xs text-gray-500">Conditions</p>
                        <p className="text-sm font-semibold text-purple-700">{profile?.chronic_conditions?.length ? profile.chronic_conditions.join(', ') : 'None'}</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4 text-center">
                        <Phone className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                        <p className="text-xs text-gray-500">Emergency Contact</p>
                        <p className="text-sm font-semibold text-blue-700">{contacts.length > 0 ? contacts[0].name : '—'}</p>
                        {contacts.length > 0 && <p className="text-xs text-blue-500">{contacts[0].phone}</p>}
                    </div>
                </div>
            </div>

            {/* Health Profile Form */}
            <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                        <div className="bg-green-100 p-2 rounded-xl"><Shield className="w-6 h-6 text-green-600" /></div>
                        <h3 className="text-lg font-bold text-gray-800">Health Profile</h3>
                    </div>
                    <button onClick={() => editing ? saveProfile() : setEditing(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:shadow-lg transition-all text-sm">
                        {editing ? <><Save className="w-4 h-4" /><span>Save</span></> : <><Edit2 className="w-4 h-4" /><span>Edit</span></>}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { label: 'Age', key: 'age', type: 'number', suffix: 'years' },
                        { label: 'Weight', key: 'weight', type: 'number', suffix: 'kg' },
                        { label: 'Height', key: 'height', type: 'number', suffix: 'cm' },
                        { label: 'Blood Group', key: 'blood_group', type: 'text', suffix: '' },
                        { label: 'BP Systolic', key: 'bp_systolic', type: 'number', suffix: 'mmHg' },
                        { label: 'BP Diastolic', key: 'bp_diastolic', type: 'number', suffix: 'mmHg' },
                        { label: 'Sugar Level', key: 'sugar_level', type: 'number', suffix: 'mg/dL' },
                    ].map(field => (
                        <div key={field.key}>
                            <label className="text-sm text-gray-600 font-medium">{field.label}</label>
                            {editing ? (
                                <input type={field.type} value={(form as any)[field.key]}
                                    onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                                    className="w-full mt-1 px-3 py-2 rounded-lg glass-input text-sm"
                                    placeholder={field.label} />
                            ) : (
                                <p className="mt-1 text-gray-800 font-medium">
                                    {(form as any)[field.key] || '—'} {(form as any)[field.key] && field.suffix}
                                </p>
                            )}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                        <label className="text-sm text-gray-600 font-medium">Allergies (comma-separated)</label>
                        {editing ? (
                            <input value={form.allergies} onChange={e => setForm({ ...form, allergies: e.target.value })}
                                className="w-full mt-1 px-3 py-2 rounded-lg glass-input text-sm" placeholder="e.g. Peanuts, Penicillin" />
                        ) : (
                            <div className="mt-1 flex flex-wrap gap-1">
                                {profile?.allergies?.length ? profile.allergies.map((a, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">{a}</span>
                                )) : <span className="text-gray-400 text-sm">None</span>}
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="text-sm text-gray-600 font-medium">Chronic Conditions (comma-separated)</label>
                        {editing ? (
                            <input value={form.chronic_conditions} onChange={e => setForm({ ...form, chronic_conditions: e.target.value })}
                                className="w-full mt-1 px-3 py-2 rounded-lg glass-input text-sm" placeholder="e.g. Diabetes, Hypertension" />
                        ) : (
                            <div className="mt-1 flex flex-wrap gap-1">
                                {profile?.chronic_conditions?.length ? profile.chronic_conditions.map((c, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">{c}</span>
                                )) : <span className="text-gray-400 text-sm">None</span>}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Emergency Contacts */}
            <div className="glass-card p-6">
                <div className="flex items-center space-x-3 mb-4">
                    <div className="bg-blue-100 p-2 rounded-xl"><Phone className="w-6 h-6 text-blue-600" /></div>
                    <h3 className="text-lg font-bold text-gray-800">Emergency Contacts</h3>
                </div>

                {contacts.length > 0 && (
                    <div className="space-y-2 mb-4">
                        {contacts.map((c, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-white/40 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <User className="w-4 h-4 text-gray-500" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">{c.name}</p>
                                        <p className="text-xs text-gray-500">{c.relationship} • {c.phone}</p>
                                    </div>
                                </div>
                                {editing && (
                                    <button onClick={() => removeContact(i)} className="p-1 hover:bg-red-100 rounded-lg">
                                        <X className="w-4 h-4 text-red-500" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {editing && (
                    <div className="flex flex-wrap gap-2">
                        <input value={newContact.name} onChange={e => setNewContact({ ...newContact, name: e.target.value })}
                            className="flex-1 min-w-[120px] px-3 py-2 rounded-lg glass-input text-sm" placeholder="Name" />
                        <input value={newContact.phone} onChange={e => setNewContact({ ...newContact, phone: e.target.value })}
                            className="flex-1 min-w-[120px] px-3 py-2 rounded-lg glass-input text-sm" placeholder="Phone" />
                        <input value={newContact.relationship} onChange={e => setNewContact({ ...newContact, relationship: e.target.value })}
                            className="flex-1 min-w-[100px] px-3 py-2 rounded-lg glass-input text-sm" placeholder="Relationship" />
                        <button onClick={addContact}
                            className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all text-sm">
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* Auto-generated Summary */}
            {profile && (profile.age || profile.weight || profile.chronic_conditions?.length) && (
                <div className="glass-card p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-3">🤖 AI Health Summary</h3>
                    <div className="bg-blue-50 rounded-xl p-4 text-sm text-gray-700 leading-relaxed">
                        <p>
                            {profile.age ? `Patient is ${profile.age} years old` : 'Patient age not recorded'}
                            {profile.weight ? `, weighing ${profile.weight} kg` : ''}
                            {profile.height ? ` with height ${profile.height} cm` : ''}.
                            {profile.blood_group ? ` Blood group: ${profile.blood_group}.` : ''}
                        </p>
                        {profile.bp_systolic && profile.bp_diastolic && (
                            <p className="mt-2">
                                Blood pressure reading: <strong>{profile.bp_systolic}/{profile.bp_diastolic} mmHg</strong>
                                {profile.bp_systolic >= 140 || profile.bp_diastolic >= 90
                                    ? ' — ⚠️ Elevated, consult your doctor.'
                                    : ' — ✅ Within normal range.'}
                            </p>
                        )}
                        {profile.sugar_level && (
                            <p className="mt-2">
                                Blood sugar: <strong>{profile.sugar_level} mg/dL</strong>
                                {profile.sugar_level > 200
                                    ? ' — ⚠️ High, seek medical advice.'
                                    : profile.sugar_level > 140
                                        ? ' — ⚠️ Pre-diabetic range.'
                                        : ' — ✅ Normal range.'}
                            </p>
                        )}
                        {profile.chronic_conditions?.length > 0 && (
                            <p className="mt-2">Chronic conditions: <strong>{profile.chronic_conditions.join(', ')}</strong>. Regular follow-ups recommended.</p>
                        )}
                        {profile.allergies?.length > 0 && (
                            <p className="mt-2">Known allergies: <strong>{profile.allergies.join(', ')}</strong>. Ensure all prescribing doctors are informed.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
