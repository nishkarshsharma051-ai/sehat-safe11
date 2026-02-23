import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, RefreshCw, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';
import { GlassCard } from '../ui/GlassCard';
import { PremiumButton } from '../ui/PremiumButton';
import { healthEntryService } from '../../services/dataService';

interface MedicalRecordUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    patientId: string;
    onUploadComplete?: () => void;
    children?: React.ReactNode;
}

export default function MedicalRecordUploadModal({ isOpen, onClose, patientId, onUploadComplete, children }: MedicalRecordUploadModalProps) {
    const { t } = useLanguage();
    const [uiState, setUiState] = useState<'idle' | 'uploading' | 'ocr' | 'success' | 'error'>('idle');
    const [progress, setProgress] = useState(0);
    const [ocrStepText, setOcrStepText] = useState('');
    const [extractionResult, setExtractionResult] = useState<any>(null);
    const [errorMessage, setErrorMessage] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) startUploadFlow(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) startUploadFlow(file);
    };

    const startUploadFlow = (file: File) => {
        if (file.size > 20 * 1024 * 1024) {
            setErrorMessage(t('File too large (Max 20MB)', 'फ़ाइल बहुत बड़ी है (अधिकतम 20MB)'));
            setUiState('error');
            return;
        }

        setUiState('uploading');
        setProgress(0);

        let p = 0;
        const interval = setInterval(() => {
            p += Math.random() * 15;
            if (p > 90) {
                clearInterval(interval);
                setProgress(100);
                setTimeout(() => runActualUpload(file), 400);
            } else {
                setProgress(Math.min(90, p));
            }
        }, 150);
    };

    const runActualUpload = async (file: File) => {
        setUiState('ocr');
        setOcrStepText(t('Digitizing document...', 'दस्तावेज़ को डिजिटल किया जा रहा है...'));

        try {
            const steps = [
                t('Extracting clinical text...', 'क्लिनिकल टेक्स्ट निकाला जा रहा है...'),
                t('AI Categorizing...', 'एआई वर्गीकरण कर रहा है...'),
                t('Parsing metrics & values...', 'मेट्रिक्स और वैल्यू का विश्लेषण...'),
                t('Syncing to Health Timeline...', 'हेल्थ टाइमलाइन के साथ सिंक हो रहा है...')
            ];
            let stepIdx = 0;
            const stepInterval = setInterval(() => {
                setOcrStepText(steps[stepIdx++ % steps.length]);
            }, 1800);

            const result = await healthEntryService.uploadMedicalRecord(file, patientId);

            clearInterval(stepInterval);
            setExtractionResult(result.entry);
            setUiState('success');

            if (onUploadComplete) onUploadComplete();
            // Notify other components to refresh
            window.dispatchEvent(new CustomEvent('health-entries-updated'));

        } catch (err: any) {
            console.error(err);
            setErrorMessage(err.message || t('Analysis failed', 'विश्लेषण विफल रहा'));
            setUiState('error');
        }
    };

    const reset = () => {
        setUiState('idle');
        setExtractionResult(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-2xl"
            >
                <GlassCard className="p-0 overflow-hidden shadow-2xl border-white/20">
                    {/* Header */}
                    <div className="p-6 border-b border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                                <Sparkles className="w-6 h-6 text-indigo-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white tracking-tight">
                                    {t('Universal Record Upload', 'यूनिवर्सल रिकॉर्ड अपलोड')}
                                </h2>
                                <p className="text-xs text-gray-400 font-medium">AI-Powered clinical data extraction</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>

                    <div className="p-8">
                        <AnimatePresence mode="wait">
                            {uiState === 'idle' && (
                                <motion.div
                                    key="idle"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="flex flex-col items-center"
                                >
                                    {children}
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('border-indigo-500/50', 'bg-indigo-500/5'); }}
                                        onDragLeave={e => e.currentTarget.classList.remove('border-indigo-500/50', 'bg-indigo-500/5')}
                                        onDrop={handleDrop}
                                        className="w-full border-2 border-dashed border-white/10 rounded-2xl p-12 text-center hover:border-indigo-500/30 hover:bg-white/5 transition-all cursor-pointer group"
                                    >
                                        <input type="file" ref={fileInputRef} className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileSelect} />
                                        <div className="w-20 h-20 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
                                            <Upload className="w-10 h-10" />
                                        </div>
                                        <h3 className="text-lg font-bold text-white mb-2">
                                            {t('Drop medical documents here', 'मेडिकल दस्तावेज़ यहाँ छोड़ें')}
                                        </h3>
                                        <p className="text-sm text-gray-400 max-w-xs mx-auto">
                                            Lab reports, previous prescriptions, or scans. We'll extract the data for you.
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {uiState === 'uploading' && (
                                <motion.div
                                    key="uploading"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex flex-col items-center py-10"
                                >
                                    <div className="relative w-24 h-24 mb-6">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                                            <motion.circle
                                                cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="8" fill="transparent"
                                                strokeDasharray={276}
                                                strokeDashoffset={276 - (276 * progress) / 100}
                                                className="text-indigo-500"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center font-bold text-white">
                                            {Math.round(progress)}%
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2">{t('Uploading...', 'अपलोड हो रहा है...')}</h3>
                                    <p className="text-sm text-gray-400">Securely transferring to AI server</p>
                                </motion.div>
                            )}

                            {uiState === 'ocr' && (
                                <motion.div
                                    key="ocr"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex flex-col items-center py-10"
                                >
                                    <div className="w-20 h-20 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mb-6 animate-pulse">
                                        <FileText className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">{t('AI Extraction in Progress', 'एआई एक्सट्रैक्शन चल रहा है')}</h3>
                                    <div className="flex items-center gap-2 text-indigo-400 font-medium">
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        {ocrStepText}
                                    </div>
                                </motion.div>
                            )}

                            {uiState === 'success' && extractionResult && (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex flex-col items-center"
                                >
                                    <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mb-6">
                                        <CheckCircle className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2">{t('Record Successfully Filed', 'रिकॉर्ड सफलतापूर्वक फाइल किया गया')}</h3>
                                    <p className="text-gray-400 mb-8 text-center px-10">
                                        The document was identified as a <span className="text-indigo-400 font-bold uppercase">{extractionResult.type}</span> and added to the patient's continuous health chart.
                                    </p>

                                    <div className="w-full bg-white/5 rounded-2xl border border-white/10 p-5 mb-8">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h4 className="text-white font-bold">{extractionResult.title}</h4>
                                                <p className="text-xs text-gray-400">{extractionResult.date}</p>
                                            </div>
                                            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-lg text-xs font-bold uppercase">
                                                {extractionResult.type}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-300 italic mb-4">"{extractionResult.description}"</p>

                                        {extractionResult.values && Object.keys(extractionResult.values).length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {Object.entries(extractionResult.values).map(([key, value]: [string, any]) => (
                                                    <div key={key} className="px-3 py-1.5 bg-black/40 border border-white/5 rounded-xl flex items-center gap-2">
                                                        <span className="text-[10px] font-bold text-gray-500 uppercase">{key.replace(/_/g, ' ')}</span>
                                                        <span className="text-sm font-bold text-green-400">{value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <PremiumButton onClick={reset} variant="secondary">
                                            {t('Upload Another', 'एक और अपलोड करें')}
                                        </PremiumButton>
                                        <PremiumButton onClick={onClose} variant="primary">
                                            {t('Close', 'बंद करें')}
                                        </PremiumButton>
                                    </div>
                                </motion.div>
                            )}

                            {uiState === 'error' && (
                                <motion.div
                                    key="error"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex flex-col items-center py-10"
                                >
                                    <div className="w-20 h-20 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mb-6">
                                        <AlertCircle className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">{t('Upload Failed', 'अपलोड विफल रहा')}</h3>
                                    <p className="text-red-400 text-sm mb-8 text-center px-10">{errorMessage}</p>
                                    <PremiumButton onClick={reset} variant="primary">
                                        {t('Try Again', 'पुनः प्रयास करें')}
                                    </PremiumButton>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-black/20 border-t border-white/10 flex items-center justify-center gap-6">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            Grok AI Engine v2.0
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                            Secure End-to-End
                        </div>
                    </div>
                </GlassCard>
            </motion.div>
        </div>
    );
}
