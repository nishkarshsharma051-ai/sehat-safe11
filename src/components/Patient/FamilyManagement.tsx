import { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Trash2, User, ArrowRight, ChevronLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { FamilyMember } from '../../types';
import { familyService, prescriptionService, appointmentService, reminderService } from '../../services/dataService';
import { useLanguage } from '../../contexts/LanguageContext';

export default function FamilyManagement() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [members, setMembers] = useState<FamilyMember[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
    const [form, setForm] = useState({ name: '', relationship: '', age: '' });

    const loadMembers = useCallback(async () => {
        setMembers(await familyService.getAll(user?.uid || 'anonymous'));
    }, [user]);

    useEffect(() => {
        loadMembers();
    }, [loadMembers]);

    const addMember = async () => {
        if (!form.name || !form.relationship) return;
        const member: FamilyMember = {
            id: Date.now().toString(),
            parent_patient_id: user?.uid || 'anonymous',
            name: form.name,
            relationship: form.relationship,
            age: parseInt(form.age) || 0,
            profile_id: `family-${Date.now()}`,
        };
        await familyService.add(member);
        await loadMembers();
        setForm({ name: '', relationship: '', age: '' });
        setShowForm(false);
    };

    const removeMember = async (id: string) => {
        if (!confirm(t('Remove this family member?', 'इस परिवार के सदस्य को हटाएं?'))) return;
        await familyService.remove(id);
        await loadMembers();
    };

    const getMemberStats = useCallback(async (profileId: string) => ({
        prescriptions: (await prescriptionService.getAll(profileId)).length,
        appointments: (await appointmentService.getByPatient(profileId)).filter((a: { status: string }) => a.status !== 'cancelled').length,
        reminders: (await reminderService.getAll(profileId)).filter((r: { is_active: boolean }) => r.is_active).length,
    }), []);

    const relationshipColors: Record<string, string> = {
        'Father': 'from-blue-500 to-indigo-500',
        'Mother': 'from-pink-500 to-rose-500',
        'Spouse': 'from-emerald-500 to-teal-500',
        'Child': 'from-amber-500 to-orange-500',
        'Sibling': 'from-violet-500 to-purple-500',
    };

    const [memberStats, setMemberStats] = useState({ prescriptions: 0, appointments: 0, reminders: 0 });

    useEffect(() => {
        if (selectedMember) {
            const load = async () => {
                setMemberStats(await getMemberStats(selectedMember.profile_id));
            };
            load();
        }
    }, [selectedMember, getMemberStats]);

    const getColor = (rel: string) => relationshipColors[rel] || 'from-gray-500 to-gray-600';

    const getRelLabel = (rel: string) => {
        const labels: Record<string, string> = {
            'Father': t('Father', 'पिता'),
            'Mother': t('Mother', 'माता'),
            'Spouse': t('Spouse', 'जीवनसाथी'),
            'Child': t('Child', 'बच्चा'),
            'Sibling': t('Sibling', 'भाई/बहन'),
            'Other': t('Other', 'अन्य'),
        };
        return labels[rel] || rel;
    };

    if (selectedMember) {
        return (
            <div className="space-y-6">
                <div className="glass-card p-6">
                    <button onClick={() => setSelectedMember(null)}
                        className="flex items-center space-x-2 text-sm text-gray-600 hover:text-blue-600 mb-4 transition-all">
                        <ChevronLeft className="w-4 h-4" /><span>{t('Back to family', 'परिवार पर वापस जाएं')}</span>
                    </button>

                    <div className="flex items-center space-x-4 mb-6">
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getColor(selectedMember.relationship)} flex items-center justify-center shadow-lg`}>
                            <span className="text-2xl font-bold text-white">{selectedMember.name[0]}</span>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-gray-800">{selectedMember.name}</h3>
                            <p className="text-gray-500">{getRelLabel(selectedMember.relationship)} • {selectedMember.age} {t('years', 'वर्ष')}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-blue-50 rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-blue-700">{memberStats.prescriptions}</p>
                            <p className="text-xs text-gray-500">{t('Prescriptions', 'नुस्खे')}</p>
                        </div>
                        <div className="bg-green-50 rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-green-700">{memberStats.appointments}</p>
                            <p className="text-xs text-gray-500">{t('Appointments', 'अपॉइंटमेंट')}</p>
                        </div>
                        <div className="bg-yellow-50 rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-yellow-700">{memberStats.reminders}</p>
                            <p className="text-xs text-gray-500">{t('Active Reminders', 'सक्रिय रिमाइंडर')}</p>
                        </div>
                    </div>

                    <div className="mt-6 p-4 bg-gray-50 rounded-xl text-sm text-gray-600">
                        <p>💡 <strong>{t('Tip:', 'सुझाव:')}</strong> {t(`To add prescriptions, appointments, or reminders for ${selectedMember.name}, switch to their profile from the main dashboard. Each family member's data is stored separately for privacy.`, `${selectedMember.name} के लिए नुस्खे, अपॉइंटमेंट या रिमाइंडर जोड़ने के लिए, मुख्य डैशबोर्ड से उनके प्रोफ़ाइल पर स्विच करें। प्रत्येक परिवार के सदस्य का डेटा गोपनीयता के लिए अलग से संग्रहीत किया जाता है।`)}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                        <div className="bg-amber-100 p-2 rounded-xl"><Users className="w-6 h-6 text-amber-600" /></div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">{t('Family Health Management', 'परिवार स्वास्थ्य प्रबंधन')}</h3>
                            <p className="text-sm text-gray-500">{t("Manage your family members' health records", 'अपने परिवार के सदस्यों के स्वास्थ्य रिकॉर्ड प्रबंधित करें')}</p>
                        </div>
                    </div>
                    <button onClick={() => setShowForm(!showForm)}
                        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:shadow-lg transition-all text-sm">
                        <Plus className="w-4 h-4" /><span>{t('Add Member', 'सदस्य जोड़ें')}</span>
                    </button>
                </div>

                {showForm && (
                    <div className="mb-6 p-4 bg-amber-50/50 rounded-xl space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                className="px-3 py-2 rounded-lg glass-input text-sm" placeholder={t('Full Name', 'पूरा नाम')} />
                            <select value={form.relationship} onChange={e => setForm({ ...form, relationship: e.target.value })}
                                className="px-3 py-2 rounded-lg glass-input text-sm">
                                <option value="">{t('Relationship', 'रिश्ता')}</option>
                                <option value="Father">{t('Father', 'पिता')}</option>
                                <option value="Mother">{t('Mother', 'माता')}</option>
                                <option value="Spouse">{t('Spouse', 'जीवनसाथी')}</option>
                                <option value="Child">{t('Child', 'बच्चा')}</option>
                                <option value="Sibling">{t('Sibling', 'भाई/बहन')}</option>
                                <option value="Other">{t('Other', 'अन्य')}</option>
                            </select>
                            <input type="number" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })}
                                className="px-3 py-2 rounded-lg glass-input text-sm" placeholder={t('Age', 'उम्र')} />
                        </div>
                        <div className="flex justify-end space-x-2">
                            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600 text-sm">{t('Cancel', 'रद्द करें')}</button>
                            <button onClick={addMember} className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm">{t('Add', 'जोड़ें')}</button>
                        </div>
                    </div>
                )}

                {/* Self card */}
                <div className="mb-4 p-4 bg-blue-50/50 rounded-xl border-2 border-blue-200/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                                <User className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="font-bold text-gray-800">{user?.displayName || t('You', 'आप')}</p>
                                <p className="text-sm text-gray-500">{t('Self (Primary Account)', 'स्वयं (प्राथमिक खाता)')}</p>
                            </div>
                        </div>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">{t('Active', 'सक्रिय')}</span>
                    </div>
                </div>

                {members.length === 0 ? (
                    <div className="text-center py-8">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">{t('No family members added yet', 'अभी तक कोई परिवार का सदस्य नहीं जोड़ा गया है')}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {members.map(member => (
                            <div key={member.id} className="p-4 bg-white/40 rounded-xl border border-gray-100 hover:shadow-md transition-all group">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getColor(member.relationship)} flex items-center justify-center shadow`}>
                                            <span className="text-xl font-bold text-white">{member.name[0]}</span>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800">{member.name}</p>
                                            <p className="text-sm text-gray-500">{getRelLabel(member.relationship)} • {member.age} {t('years', 'वर्ष')}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button onClick={() => setSelectedMember(member)}
                                            className="p-2 hover:bg-blue-100 rounded-lg transition-all">
                                            <ArrowRight className="w-4 h-4 text-blue-500" />
                                        </button>
                                        <button onClick={() => removeMember(member.id)}
                                            className="p-2 hover:bg-red-100 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
