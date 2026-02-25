import { useState, useEffect } from 'react';
import {
    Building2, Beaker, Landmark, Search, MapPin, Phone,
    Star, ShieldCheck, Filter, X, Globe, MessageSquare
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { PremiumButton } from '../ui/PremiumButton';
import { motion, AnimatePresence } from 'framer-motion';
import { affiliateService } from '../../services/dataService';

interface Affiliate {
    _id: string;
    name: string;
    type: 'hospital' | 'lab' | 'clinic';
    address: string;
    phone: string;
    website?: string;
    services: string[];
    rating: number;
    isVerified: boolean;
}

export default function DoctorNetworkIntegration() {
    const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'hospital' | 'lab' | 'clinic'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);
    const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);

    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    console.error("Geolocation error:", error);
                    // Fallback to a default location (e.g., Bangalore) if user denies permission
                    setUserLocation({ lat: 12.9716, lng: 77.5946 });
                }
            );
        }
    }, []);

    useEffect(() => {
        const fetchAffiliates = async () => {
            setIsLoading(true);
            try {
                const data = await affiliateService.getAll({
                    type: activeTab === 'all' ? undefined : activeTab,
                    query: searchQuery || undefined,
                    lat: userLocation?.lat,
                    lng: userLocation?.lng,
                    radius: 25000 // 25km radius
                });

                setAffiliates(data);
            } catch (error) {
                console.error('Error fetching affiliates:', error);
            } finally {
                setIsLoading(false);
            }
        };

        const timer = setTimeout(fetchAffiliates, searchQuery ? 500 : 0);
        return () => clearTimeout(timer);
    }, [activeTab, searchQuery, userLocation]);

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'hospital': return Building2;
            case 'lab': return Beaker;
            case 'clinic': return Landmark;
            default: return Building2;
        }
    };

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight text-glow">Professional Network</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">Coordinate with hospitals, pathology labs, and clinics</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Find facilities..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 rounded-xl bg-white/50 dark:bg-black/20 border border-transparent focus:border-indigo-500 transition-all w-64 text-sm outline-none backdrop-blur-sm shadow-inner"
                        />
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 p-1.5 bg-gray-100/50 dark:bg-white/5 rounded-2xl w-fit backdrop-blur-sm border border-gray-200/50 dark:border-white/5">
                {(['all', 'hospital', 'lab', 'clinic'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === tab
                            ? 'bg-white dark:bg-white/10 text-indigo-600 dark:text-indigo-400 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Scanning Network...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                        {affiliates.map((aff) => {
                            const Icon = getTypeIcon(aff.type);
                            return (
                                <motion.div
                                    key={aff._id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <GlassCard className="p-6 h-full flex flex-col group hover:border-indigo-500/50 transition-all duration-300">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className={`p-3 rounded-2xl ${aff.type === 'hospital' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600' :
                                                aff.type === 'lab' ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-600' :
                                                    'bg-amber-100 dark:bg-amber-500/20 text-amber-600'
                                                }`}>
                                                <Icon className="w-6 h-6" />
                                            </div>
                                            <div className="flex gap-2">
                                                {aff.isVerified && (
                                                    <div className="p-1 px-2 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 rounded-lg flex items-center gap-1">
                                                        <ShieldCheck className="w-3 h-3" />
                                                        <span className="text-[10px] font-bold uppercase">Verified</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                                                    <Star className="w-3 h-3 fill-current" />
                                                    {aff.rating}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-500 transition-colors">
                                                {aff.name}
                                            </h3>
                                            <div className="space-y-3 mb-6">
                                                <div className="flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400">
                                                    <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                                                    <span className="line-clamp-2">{aff.address}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                                    <Phone className="w-4 h-4 shrink-0" />
                                                    <span>{aff.phone}</span>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-2 mb-8">
                                                {aff.services.map((service, i) => (
                                                    <span key={i} className="px-2 py-1 bg-gray-100 dark:bg-white/5 rounded-lg text-[10px] font-bold text-gray-500 uppercase">
                                                        {service}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <PremiumButton
                                                variant="secondary"
                                                size="sm"
                                                className="flex-1 text-[10px]"
                                                onClick={() => setSelectedAffiliate(aff)}
                                            >
                                                Contact Info
                                            </PremiumButton>
                                            <PremiumButton
                                                variant="primary"
                                                size="sm"
                                                className="flex-1 text-[10px]"
                                                onClick={() => {
                                                    setSelectedAffiliate(aff);
                                                    setIsReferralModalOpen(true);
                                                }}
                                            >
                                                Send Referral
                                            </PremiumButton>
                                        </div>
                                    </GlassCard>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            {affiliates.length === 0 && !isLoading && (
                <div className="text-center py-20 bg-gray-100/30 dark:bg-white/5 rounded-[3rem] border border-dashed border-gray-200 dark:border-white/10">
                    <Filter className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-white/20" />
                    <p className="text-gray-500 dark:text-gray-400 font-bold">No facilities found matching your criteria.</p>
                </div>
            )}

            {/* Contact Modal */}
            <AnimatePresence>
                {selectedAffiliate && !isReferralModalOpen && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={() => setSelectedAffiliate(null)}>
                        <motion.div
                            initial={{ y: 20, opacity: 0, scale: 0.95 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: 20, opacity: 0, scale: 0.95 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl border border-gray-200 dark:border-white/10"
                        >
                            <div className="p-8 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-between">
                                <div className="text-white">
                                    <h3 className="text-2xl font-bold">{selectedAffiliate?.name}</h3>
                                    <p className="text-white/70 text-xs font-bold uppercase tracking-widest mt-1">{selectedAffiliate?.type}</p>
                                </div>
                                <button onClick={() => setSelectedAffiliate(null)} className="p-3 bg-white/20 hover:bg-white/30 rounded-2xl text-white transition-all"><X className="w-6 h-6" /></button>
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                                        <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl"><MapPin className="w-5 h-5" /></div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Location</p>
                                            <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{selectedAffiliate?.address}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                                        <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl"><Phone className="w-5 h-5" /></div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Phone</p>
                                            <p className="text-sm text-gray-700 dark:text-gray-300 font-bold">{selectedAffiliate?.phone}</p>
                                        </div>
                                    </div>

                                    {selectedAffiliate.website && (
                                        <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                                            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl"><Globe className="w-5 h-5" /></div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Website</p>
                                                <a href={selectedAffiliate.website} target="_blank" rel="noreferrer" className="text-sm text-indigo-500 font-bold hover:underline">{selectedAffiliate.website}</a>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4">
                                    <a href={`tel:${selectedAffiliate?.phone}`} className="flex items-center justify-center gap-3 py-4 bg-emerald-500 text-white rounded-2xl font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-emerald-500/30">
                                        <Phone className="w-4 h-4" /> Call Now
                                    </a>
                                    <button className="flex items-center justify-center gap-3 py-4 bg-gray-900 dark:bg-white text-white dark:text-black rounded-2xl font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-black/20">
                                        <MessageSquare className="w-4 h-4" /> In-App Chat
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Referral Modal Placeholder */}
                {isReferralModalOpen && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={() => setIsReferralModalOpen(false)}>
                        <motion.div
                            initial={{ y: 20, opacity: 0, scale: 0.95 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: 20, opacity: 0, scale: 0.95 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl border border-gray-200 dark:border-white/10"
                        >
                            <div className="p-8 text-center space-y-4">
                                <div className="w-20 h-20 bg-indigo-500/10 text-indigo-500 rounded-3xl mx-auto flex items-center justify-center">
                                    <MessageSquare className="w-10 h-10" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Smart Referral</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">Send a clinical referral for a patient to <strong>{selectedAffiliate?.name}</strong>. The history and medical records will be securely shared.</p>

                                <div className="space-y-3 pt-6">
                                    <select className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 outline-none focus:ring-2 focus:ring-indigo-500">
                                        <option value="">Select Patient...</option>
                                        <option value="1">Rajesh Kumar</option>
                                        <option value="2">Ananya Singh</option>
                                    </select>
                                    <textarea placeholder="Referral notes or specific instructions..." className="w-full h-32 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 outline-none focus:ring-2 focus:ring-indigo-500 resize-none"></textarea>
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <PremiumButton variant="secondary" className="flex-1" onClick={() => setIsReferralModalOpen(false)}>Cancel</PremiumButton>
                                    <PremiumButton variant="primary" className="flex-1" onClick={() => {
                                        alert('Referral request sent successfully!');
                                        setIsReferralModalOpen(false);
                                        setSelectedAffiliate(null);
                                    }}>Confirm Referral</PremiumButton>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
