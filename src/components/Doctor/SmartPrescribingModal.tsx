import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Shield, Zap, FileText, CheckCircle2, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';

import { PremiumButton } from '../ui/PremiumButton';
import { GlassCard } from '../ui/GlassCard';
import { insuranceService } from '../../services/insuranceService';
import { generateDrugAlternatives, generatePriorAuthorization } from '../../services/geminiService';
import { InsuranceCoverage, DrugAlternative } from '../../types';


interface SmartPrescribingModalProps {
    isOpen: boolean;
    onClose: () => void;
    patientName: string;
    patientProfile: any; // Used for PA generation
}

type Step = 'search' | 'alternatives' | 'pa_generation' | 'review';

export function SmartPrescribingModal({ isOpen, onClose, patientName, patientProfile }: SmartPrescribingModalProps) {
    const [step, setStep] = useState<Step>('search');

    // Search & Coverage State
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [coverageInfo, setCoverageInfo] = useState<InsuranceCoverage | null>(null);
    const [diagnosis, setDiagnosis] = useState('');

    // Alternatives State
    const [isGeneratingAlts, setIsGeneratingAlts] = useState(false);
    const [alternatives, setAlternatives] = useState<DrugAlternative[]>([]);
    const [selectedDrug, setSelectedDrug] = useState<string>('');

    // PA State
    const [isGeneratingPA, setIsGeneratingPA] = useState(false);
    const [paJustification, setPaJustification] = useState('');

    // Reset when modal opens
    useEffect(() => {
        if (isOpen) {
            setStep('search');
            setSearchQuery('');
            setCoverageInfo(null);
            setDiagnosis('');
            setAlternatives([]);
            setPaJustification('');
            setSelectedDrug('');
        }
    }, [isOpen]);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const coverage = await insuranceService.checkCoverage(searchQuery);
            setCoverageInfo(coverage);
            setSelectedDrug(coverage.drugName);
        } catch (error) {
            console.error('Error checking coverage', error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleGenerateAlternatives = async () => {
        if (!coverageInfo || !diagnosis) return;
        setStep('alternatives');
        setIsGeneratingAlts(true);
        try {
            const alts = await generateDrugAlternatives(coverageInfo.drugName, diagnosis);
            setAlternatives(alts);
        } catch (error) {
            console.error('Failed to generate alternatives', error);
        } finally {
            setIsGeneratingAlts(false);
        }
    };

    const handleGeneratePA = async () => {
        setStep('pa_generation');
        setIsGeneratingPA(true);
        try {
            const justification = await generatePriorAuthorization(selectedDrug, diagnosis, patientProfile);
            setPaJustification(justification);
        } catch (error) {
            console.error('Error generating PA', error);
        } finally {
            setIsGeneratingPA(false);
        }
    };

    const handleSignPrescription = () => {
        // Here we would normally save the prescription to the backend
        // including the insurance status and PA status
        alert(`Prescription for ${selectedDrug} signed and sent to pharmacy!`);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
                <motion.div
                    initial={{ x: '100%', opacity: 0.5 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: '100%', opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="w-full max-w-xl h-full bg-white dark:bg-slate-900 shadow-2xl overflow-y-auto border-l border-slate-200 dark:border-slate-800"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-6 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Zap className="w-5 h-5 text-indigo-500" />
                                Smart Prescribe
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                Patient: <span className="font-semibold text-slate-700 dark:text-slate-300">{patientName}</span>
                            </p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-6 space-y-8">
                        {/* Step 1: Search & Coverage */}
                        {step === 'search' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Medication Search</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                            placeholder="e.g. Lipitor, Semaglutide..."
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all dark:text-white"
                                        />
                                        <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
                                        <button
                                            onClick={handleSearch}
                                            disabled={isSearching || !searchQuery}
                                            className="absolute right-2 top-2 bottom-2 px-4 bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                                        >
                                            {isSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Check'}
                                        </button>
                                    </div>
                                </div>

                                {coverageInfo && (
                                    <GlassCard className="p-6 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700">
                                        <div className="flex items-start justify-between mb-6">
                                            <div>
                                                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                                                    {coverageInfo.drugName}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-2">
                                                    {coverageInfo.covered ? (
                                                        <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-wider rounded-full flex items-center gap-1">
                                                            <CheckCircle2 className="w-3.5 h-3.5" /> Covered
                                                        </span>
                                                    ) : (
                                                        <span className="px-2.5 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-xs font-black uppercase tracking-wider rounded-full flex items-center gap-1">
                                                            <X className="w-3.5 h-3.5" /> Not Covered
                                                        </span>
                                                    )}
                                                    <span className="px-2.5 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-wider rounded-full">
                                                        Tier {coverageInfo.tier}
                                                    </span>
                                                    {coverageInfo.paRequired && (
                                                        <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-black uppercase tracking-wider rounded-full flex items-center gap-1">
                                                            <AlertCircle className="w-3.5 h-3.5" /> PA Required
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Est. Copay</p>
                                                <p className="text-3xl font-black text-slate-900 dark:text-white">${coverageInfo.copay}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Primary Diagnosis for Prescription</label>
                                                <input
                                                    type="text"
                                                    value={diagnosis}
                                                    onChange={(e) => setDiagnosis(e.target.value)}
                                                    placeholder="e.g. Type 2 Diabetes, Hyperlipidemia..."
                                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                                                />
                                            </div>

                                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                                                {(!coverageInfo.covered || coverageInfo.tier >= 3) && (
                                                    <PremiumButton
                                                        variant="primary"
                                                        className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                                                        onClick={handleGenerateAlternatives}
                                                        disabled={!diagnosis}
                                                    >
                                                        <Sparkles className="w-4 h-4 mr-2" />
                                                        Find Cheaper Alternatives
                                                    </PremiumButton>
                                                )}
                                                <PremiumButton
                                                    variant={coverageInfo.paRequired ? "secondary" : "primary"}
                                                    className="flex-1"
                                                    disabled={!diagnosis}
                                                    onClick={() => coverageInfo.paRequired ? handleGeneratePA() : setStep('review')}
                                                >
                                                    {coverageInfo.paRequired ? 'Draft Prior Auth' : 'Proceed to Prescribe'}
                                                </PremiumButton>
                                            </div>
                                        </div>
                                    </GlassCard>
                                )}
                            </motion.div>
                        )}

                        {/* Step 2: AI Alternatives */}
                        {step === 'alternatives' && (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl">
                                        <Sparkles className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Covered Alternatives</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Clinical equivalents for {coverageInfo?.drugName}</p>
                                    </div>
                                </div>

                                {isGeneratingAlts ? (
                                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
                                        <p className="text-slate-600 dark:text-slate-400 font-medium animate-pulse">Consulting clinical guidelines...</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {alternatives.map((alt, idx) => (
                                            <div key={idx} className="p-5 border-2 border-slate-100 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors rounded-2xl bg-white dark:bg-slate-900 cursor-pointer"
                                                onClick={() => {
                                                    setSelectedDrug(alt.name);
                                                    setStep('review');
                                                }}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h4 className="text-lg font-bold text-slate-900 dark:text-white">{alt.name}</h4>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider rounded-md">Tier {alt.tier}</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-2xl font-black text-emerald-500">${alt.estimatedCopay}</p>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-3">{alt.reason}</p>
                                            </div>
                                        ))}

                                        <button
                                            onClick={() => setStep('search')}
                                            className="w-full py-3 text-sm font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                                        >
                                            Cancel & Go Back
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Step 3: Prior Auth Generation */}
                        {step === 'pa_generation' && (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Prior Authorization Draft</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Generated for {selectedDrug}</p>
                                    </div>
                                </div>

                                {isGeneratingPA ? (
                                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
                                        <p className="text-slate-600 dark:text-slate-400 font-medium animate-pulse">Drafting clinical justification...</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl max-h-96 overflow-y-auto font-serif text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                                            {paJustification}
                                        </div>

                                        <div className="flex gap-4 pt-4">
                                            <PremiumButton variant="secondary" onClick={() => setStep('search')} className="flex-1">
                                                Cancel
                                            </PremiumButton>
                                            <PremiumButton variant="primary" onClick={() => setStep('review')} className="flex-1 bg-amber-500 hover:bg-amber-600">
                                                Approve & Prescribe
                                            </PremiumButton>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Step 4: Final Review */}
                        {step === 'review' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                <div className="text-center py-6">
                                    <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Shield className="w-8 h-8 text-indigo-500" />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">Ready to Sign</h3>
                                    <p className="text-slate-500 dark:text-slate-400 mt-2">Please confirm the prescription details below.</p>
                                </div>

                                <GlassCard className="p-6 border border-slate-200 dark:border-slate-700 space-y-4">
                                    <div className="flex justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                                        <span className="text-slate-500 dark:text-slate-400 font-medium">Medication</span>
                                        <span className="text-slate-900 dark:text-white font-bold">{selectedDrug}</span>
                                    </div>
                                    <div className="flex justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                                        <span className="text-slate-500 dark:text-slate-400 font-medium">Diagnosis</span>
                                        <span className="text-slate-900 dark:text-white font-bold">{diagnosis}</span>
                                    </div>
                                    <div className="flex justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                                        <span className="text-slate-500 dark:text-slate-400 font-medium">Prior Auth Status</span>
                                        <span className="text-slate-900 dark:text-white font-bold">{paJustification ? 'Drafted & Attached' : 'Not Required'}</span>
                                    </div>
                                    <div className="flex justify-between pt-2">
                                        <span className="text-slate-500 dark:text-slate-400 font-bold">Estimated Patient Cost</span>
                                        <span className="text-emerald-500 font-black text-xl">
                                            ${selectedDrug === coverageInfo?.drugName ? coverageInfo.copay : alternatives.find(a => a.name === selectedDrug)?.estimatedCopay || '0'}
                                        </span>
                                    </div>
                                </GlassCard>

                                <PremiumButton variant="primary" className="w-full text-lg py-4" onClick={handleSignPrescription}>
                                    Sign & Send to Pharmacy
                                </PremiumButton>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

