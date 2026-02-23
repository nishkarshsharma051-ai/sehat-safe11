import { useState, useEffect } from 'react';
import { Shield, MapPin, IndianRupee, ExternalLink, CheckCircle, Info, AlertCircle } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { PremiumButton } from '../ui/PremiumButton';
import { NeumorphicBadge } from '../ui/NeumorphicBadge';
import { StaggerContainer, MotionItem } from '../ui/MotionComponents';
import { schemeService, userService } from '../../services/dataService';
import { Scheme } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function SchemeMatcher() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [schemes, setSchemes] = useState<Scheme[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingProfile, setEditingProfile] = useState(false);
    const [profileData, setProfileData] = useState({
        pin_code: '',
        annual_income: ''
    });

    const loadSchemes = async () => {
        try {
            setLoading(true);
            const data = await schemeService.getMatched();
            setSchemes(data);
        } catch (err: any) {
            setError(t('Failed to load recommended schemes', 'अनुशंसित योजनाओं को लोड करने में विफल'));
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSchemes();
    }, []);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            await userService.update({
                full_name: user?.displayName || '',
                pin_code: profileData.pin_code,
                annual_income: Number(profileData.annual_income)
            });
            setEditingProfile(false);
            await loadSchemes();
        } catch (err: any) {
            setError(t('Failed to update profile', 'प्रोफ़ाइल अपडेट करने में विफल'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 pb-12">
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-700 p-8 shadow-2xl">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <h2 className="text-3xl font-extrabold text-white tracking-tight">{t('Scheme Matching Engine', 'योजना मिलान इंजन')}</h2>
                        <p className="text-indigo-100/80 max-w-xl">
                            {t('Our AI matches your profile with thousands of government health schemes to find the best benefits for you.', 'हमारा एआई आपके प्रोफ़ाइल को हजारों सरकारी स्वास्थ्य योजनाओं के साथ मिलाता है ताकि आपके लिए सर्वोत्तम लाभ मिल सके।')}
                        </p>
                    </div>
                    {!editingProfile && (
                        <PremiumButton
                            variant="secondary"
                            className="bg-white/10 hover:bg-white/20 border-white/20 text-white backdrop-blur-md"
                            onClick={() => setEditingProfile(true)}
                        >
                            {t('Update Eligibility Data', 'अपनी पात्रता डेटा अपडेट करें')}
                        </PremiumButton>
                    )}
                </div>
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl" />
            </div>

            <AnimatePresence>
                {editingProfile && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <GlassCard className="p-8 border-indigo-200/50 dark:border-indigo-500/20 shadow-xl">
                            <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-indigo-500" />
                                        {t('PIN Code', 'पिन कोड')}
                                    </label>
                                    <input
                                        type="text"
                                        placeholder={t('e.g. 110001', 'जैसे 110001')}
                                        className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        value={profileData.pin_code}
                                        onChange={(e) => setProfileData({ ...profileData, pin_code: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                        <IndianRupee className="w-4 h-4 text-emerald-500" />
                                        {t('Annual Income (₹)', 'वार्षिक आय (₹)')}
                                    </label>
                                    <input
                                        type="number"
                                        placeholder={t('e.g. 250000', 'जैसे 250000')}
                                        className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        value={profileData.annual_income}
                                        onChange={(e) => setProfileData({ ...profileData, annual_income: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <PremiumButton type="submit" className="flex-1 bg-indigo-600 text-white shadow-indigo-200">
                                        {t('Update Matches', 'मिलान अपडेट करें')}
                                    </PremiumButton>
                                    <PremiumButton
                                        type="button"
                                        variant="secondary"
                                        onClick={() => setEditingProfile(false)}
                                    >
                                        {t('Cancel', 'रद्द करें')}
                                    </PremiumButton>
                                </div>
                            </form>
                        </GlassCard>
                    </motion.div>
                )}
            </AnimatePresence>

            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400">
                    <AlertCircle className="w-5 h-5" />
                    <p className="text-sm font-medium">{error}</p>
                    <PremiumButton size="sm" variant="ghost" className="ml-auto" onClick={() => setError(null)}>{t('Dismiss', 'खारिज करें')}</PremiumButton>
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-64 bg-gray-100 dark:bg-white/5 animate-pulse rounded-3xl" />
                    ))}
                </div>
            ) : schemes.length > 0 ? (
                <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {schemes.map((scheme) => (
                        <MotionItem key={scheme.id}>
                            <GlassCard className="h-full flex flex-col hover:shadow-2xl hover:border-indigo-400/50 transition-all duration-500 group">
                                <div className="p-6 space-y-4 flex-1">
                                    <div className="flex items-start justify-between">
                                        <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                            <Shield className="w-6 h-6" />
                                        </div>
                                        <NeumorphicBadge variant={scheme.category === 'central' ? 'info' : 'neutral'}>
                                            {scheme.category === 'central' ? t('CENTRAL', 'केंद्रीय') : t('STATE', 'राज्य')}
                                        </NeumorphicBadge>
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 transition-colors">
                                            {scheme.name}
                                        </h3>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2">
                                            {scheme.description}
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('Key Benefits', 'प्रमुख लाभ')}</p>
                                        <ul className="space-y-1.5">
                                            {(Array.isArray(scheme.benefits)
                                                ? scheme.benefits
                                                : (typeof (scheme.benefits as any) === 'string'
                                                    ? (scheme.benefits as any).split(',')
                                                    : [])
                                            ).slice(0, 3).map((benefit: string, idx: number) => (
                                                <li key={idx} className="flex items-center text-sm text-gray-600 dark:text-gray-300 gap-2">
                                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                                                    <span className="line-clamp-1">{benefit.trim()}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                <div className="p-6 bg-gray-50/50 dark:bg-white/5 border-t border-gray-100 dark:border-white/5 rounded-b-3xl">
                                    <PremiumButton
                                        className="w-full bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm hover:shadow-md border border-indigo-100 dark:border-slate-700"
                                        onClick={() => window.open(scheme.link, '_blank')}
                                    >
                                        {t('Apply for Benefits', 'लाभ के लिए आवेदन करें')}
                                        <ExternalLink className="w-4 h-4 ml-2" />
                                    </PremiumButton>
                                </div>
                            </GlassCard>
                        </MotionItem>
                    ))}
                </StaggerContainer>
            ) : (
                <GlassCard className="p-12 text-center space-y-4">
                    <div className="mx-auto w-20 h-20 rounded-full bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center">
                        <Info className="w-10 h-10 text-orange-500" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('No Matched Schemes Found', 'कोई मिलान वाली योजना नहीं मिली')}</h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                            {t('Try updating your profile with accurate income and location details to find relevant schemes.', 'प्रासंगिक योजनाओं को खोजने के लिए सटीक आय और स्थान विवरण के साथ अपना प्रोफ़ाइल अपडेट करने का प्रयास करें।')}
                        </p>
                    </div>
                    <PremiumButton onClick={() => setEditingProfile(true)}>
                        {t('Update My Profile', 'मेरी प्रोफ़ाइल अपडेट करें')}
                    </PremiumButton>
                </GlassCard>
            )}

            {/* AI Warning Badge */}
            <div className="flex items-center justify-center gap-2 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <p className="text-xs font-medium text-amber-700 dark:text-amber-500">
                    {t('Schemes are matched using AI based on available data. Please verify eligibility on the official portal before applying.', 'उपलब्ध डेटा के आधार पर एआई का उपयोग करके योजनाओं का मिलान किया जाता है। कृपया आवेदन करने से पहले आधिकारिक पोर्टल पर पात्रता सत्यापित करें।')}
                </p>
            </div>
        </div>
    );
}
