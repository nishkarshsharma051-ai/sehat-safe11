import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Heart, Phone, AlertTriangle, Shield, User, Droplets, Info } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { emergencyService } from '../services/dataService';
import { motion } from 'framer-motion';

export default function EmergencyProfile() {
    const { patientId } = useParams<{ patientId: string }>();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!patientId) return;
            try {
                const data = await emergencyService.getPublicProfile(patientId);
                setProfile(data);
            } catch (err: any) {
                setError(err.message || 'Failed to load emergency profile');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [patientId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-rose-50 flex items-center justify-center">
                <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="text-rose-500"
                >
                    <Heart size={48} fill="currentColor" />
                </motion.div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="min-h-screen bg-rose-50 p-6 flex flex-col items-center justify-center text-center">
                <AlertTriangle size={64} className="text-rose-500 mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Emergency Profile Not Found</h1>
                <p className="text-gray-600 mb-6">Unable to retrieve critical medical information for this patient ID.</p>
                <a href="/" className="bg-rose-500 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-rose-500/30">
                    Return to Sehat Safe
                </a>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F2F2F7] p-4 md:p-8 font-sans">
            <div className="max-w-xl mx-auto space-y-6">
                {/* Emergency Header */}
                <div className="bg-rose-600 text-white p-6 rounded-[2.5rem] shadow-xl shadow-rose-600/20 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-24 bg-white/10 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none"></div>
                    <AlertTriangle className="w-12 h-12 mx-auto mb-4 animate-pulse" />
                    <h1 className="text-3xl font-black tracking-tight mb-1 uppercase">Medical ID</h1>
                    <p className="text-rose-100 font-bold uppercase tracking-widest text-xs">Emergency Critical Information</p>
                </div>

                {/* Core Identity */}
                <GlassCard className="p-6 border-rose-100 dark:border-rose-900/20 !bg-white">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center text-gray-400">
                            <User size={40} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-extrabold text-gray-900 leading-tight">{profile.patientName}</h2>
                            <p className="text-gray-500 font-bold">{profile.age} years old</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100">
                            <p className="text-[10px] font-black text-rose-400 uppercase tracking-wider mb-1">Blood Group</p>
                            <div className="flex items-center gap-2">
                                <Droplets className="text-rose-500 w-5 h-5" />
                                <span className="text-2xl font-black text-rose-700">{profile.bloodGroup || 'N/A'}</span>
                            </div>
                        </div>
                        <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-wider mb-1">Status</p>
                            <div className="flex items-center gap-2">
                                <Shield className="text-indigo-500 w-5 h-5" />
                                <span className="text-lg font-black text-indigo-700 uppercase">Registered</span>
                            </div>
                        </div>
                    </div>
                </GlassCard>

                {/* Critical Info Sections */}
                <div className="space-y-4">
                    <section>
                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest px-4 mb-2 flex items-center gap-2">
                            <AlertTriangle size={14} className="text-rose-500" /> Allergies
                        </h3>
                        <GlassCard className="p-4 !bg-white">
                            {profile.allergies?.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {profile.allergies.map((a: string, i: number) => (
                                        <span key={i} className="bg-rose-100 text-rose-600 px-3 py-1.5 rounded-xl font-bold text-sm border border-rose-200 uppercase tracking-tight">
                                            {a}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-400 font-medium italic">No known allergies reported.</p>
                            )}
                        </GlassCard>
                    </section>

                    <section>
                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest px-4 mb-2 flex items-center gap-2">
                            <Info size={14} className="text-indigo-500" /> Chronic Conditions
                        </h3>
                        <GlassCard className="p-4 !bg-white">
                            {profile.chronicConditions?.length > 0 ? (
                                <div className="space-y-2">
                                    {profile.chronicConditions.map((c: string, i: number) => (
                                        <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                            <span className="font-bold text-gray-700">{c}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-400 font-medium italic">No chronic conditions reported.</p>
                            )}
                        </GlassCard>
                    </section>

                    <section>
                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest px-4 mb-2 flex items-center gap-2">
                            <Phone size={14} className="text-emerald-500" /> Emergency Contacts
                        </h3>
                        <div className="space-y-3">
                            {profile.emergencyContacts?.map((contact: any, i: number) => (
                                <a key={i} href={`tel:${contact.phone}`} className="block">
                                    <GlassCard className="p-4 flex items-center justify-between hover:bg-emerald-50 transition-colors border-emerald-100 !bg-white group">
                                        <div>
                                            <h4 className="font-extrabold text-gray-900 group-hover:text-emerald-700 transition-colors">{contact.name}</h4>
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{contact.relationship}</p>
                                        </div>
                                        <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                                            <Phone />
                                        </div>
                                    </GlassCard>
                                </a>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Footer Warning */}
                <div className="py-8 text-center px-4">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] leading-loose">
                        Information provided by Sehat Safe securely.<br />
                        Verified Registry Member.
                    </p>
                </div>
            </div>
        </div>
    );
}
