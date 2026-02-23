import { useState, useRef, useEffect } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, RefreshCw, Server, Download } from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';
import { GlassCard } from '../ui/GlassCard';
import { PremiumButton } from '../ui/PremiumButton';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';
import { API_BASE_URL } from '../../config';
import { downloadPrescriptionPdf } from '../../utils/prescriptionPdf';


export default function PrescriptionUpload({ onUploadComplete }: { onUploadComplete?: () => void }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('prescription');
  const [tags, setTags] = useState('');
  const [serverStatus, setServerStatus] = useState<'unknown' | 'online' | 'error'>('unknown');
  const [uiState, setUiState] = useState<'idle' | 'uploading' | 'ocr' | 'success' | 'error'>('idle');

  const [progress, setProgress] = useState(0);
  const [ocrStepText, setOcrStepText] = useState(t('Extracting text from document...', 'दस्तावेज़ से टेक्स्ट निकाला जा रहा है...'));
  const [ocrResult, setOcrResult] = useState<{ doctor: string; date: string; medicines: { name: string }[]; diagnosis: string } | null>(null);
  const [uploadedPrescriptionId, setUploadedPrescriptionId] = useState<string | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkServer();
  }, []);

  const checkServer = async () => {
    setServerStatus('unknown');
    try {
      const res = await fetch(`${API_BASE_URL}/api/health`);
      if (res.ok) setServerStatus('online');
      else setServerStatus('error');
    } catch {
      setServerStatus('error');
    }
  };

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

    // 1. Simulate Upload Progress
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 10;
      if (p > 90) {
        clearInterval(interval);
        setProgress(100);
        // Start Real OCR after simulation
        setTimeout(() => runActualUpload(file), 500);
      } else {
        setProgress(Math.min(90, p));
      }
    }, 200);
  };

  const runActualUpload = async (file: File) => {
    setUiState('ocr');
    setOcrStepText(t('Sending to backend...', 'सर्वर पर भेजा जा रहा है...'));

    try {
      if (!user) throw new Error("User not authenticated");

      // Step messages rotation
      const steps = [
        t('Extracting text...', 'टेक्स्ट निकाल रहा है...'),
        t('Detecting doctor...', 'डॉक्टर का पता लगा रहा है...'),
        t('Reading medicines...', 'दवाएं पढ़ रहा है...'),
        t('Finishing up...', 'समाप्त कर रहा है...')
      ];
      let stepIdx = 0;
      const stepInterval = setInterval(() => {
        setOcrStepText(steps[stepIdx++ % steps.length]);
      }, 1500);

      // a. Send to Backend directly (No Firebase Storage)
      const formData = new FormData();
      formData.append('image', file);
      formData.append('patientId', user.uid);

      const token = localStorage.getItem('auth_token');

      const response = await fetch(`${API_BASE_URL}/api/prescriptions/process-prescription`, {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: formData
      });

      clearInterval(stepInterval);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server Error (${response.status}): ${errorText || response.statusText}`);
      }

      const result = await response.json();
      const { analysis, medicines } = result;

      // Extract relevant data for display in UI
      const finalData = {
        doctor: analysis['Doctor Name'] || t('Unknown', 'अज्ञात'),
        date: analysis['Date'] || new Date().toLocaleDateString(),
        medicines: medicines || [], // Use medicines from backend result
        diagnosis: analysis['Diagnosis'] || t('Unknown', 'अज्ञात')
      };

      // Success State
      setOcrResult(finalData);
      setUploadedPrescriptionId(result.prescriptionId || null);
      setUploadedFileUrl(result.fileUrl || null);
      setUiState('success');
      // Notify PrescriptionList to reload
      window.dispatchEvent(new CustomEvent('prescriptions-updated'));
      if (onUploadComplete) onUploadComplete();

    } catch (err) {
      console.error(err);
      setErrorMessage((err as Error).message || t('Upload failed', 'अपलोड विफल रहा'));
      setUiState('error');
    }
  };

  const reset = () => {
    setUiState('idle');
    setOcrResult(null);
    setUploadedPrescriptionId(null);
    setUploadedFileUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <GlassCard className="p-8 relative overflow-hidden">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Upload className="w-6 h-6 text-indigo-500" />
              {t('Upload Prescription', 'नुस्खा अपलोड करें')}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t('Upload and analyze your medical documents automatically.', 'अपने मेडिकल दस्तावेज़ों को स्वचालित रूप से अपलोड और विश्लेषण करें।')}</p>
          </div>
          <button
            onClick={checkServer}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
              ${serverStatus === 'online' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20' :
                serverStatus === 'error' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20' :
                  'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'}
            `}
          >
            <Server className="w-3 h-3" />
            {serverStatus === 'online' ? t('Server Online', 'सर्वर ऑनलाइन') : serverStatus === 'error' ? t('Server Offline', 'सर्वर ऑफलाइन') : t('Checking...', 'जाँच हो रही है...')}
          </button>
        </div>

        {/* Configurations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">{t('Category', 'श्रेणी')}</label>
            <div className="flex flex-wrap gap-2">
              {['prescription', 'lab', 'scan', 'discharge'].map(ct => (
                <button
                  key={ct}
                  onClick={() => setActiveTab(ct)}
                  className={`
                    px-4 py-2 rounded-xl text-sm font-medium transition-all
                    ${activeTab === ct
                      ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                      : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'}
                  `}
                >
                  {t(ct.charAt(0).toUpperCase() + ct.slice(1),
                    ct === 'prescription' ? 'नुस्खा' :
                      ct === 'lab' ? 'लैब' :
                        ct === 'scan' ? 'स्कैन' :
                          ct === 'discharge' ? 'डिस्चार्ज' : ct
                  )}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">{t('Health Tags', 'स्वास्थ्य टैग')}</label>
            <input
              type="text"
              placeholder={t('e.g. Diabetes, Fever (comma separated)', 'जैसे मधुमेह, बुखार (अल्पविराम द्वारा अलग)')}
              value={tags}
              onChange={e => setTags(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Drop Zone */}
        <div
          className={`
            relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-200
            flex flex-col items-center justify-center min-h-[260px]
            ${uiState === 'idle'
              ? 'border-gray-300 dark:border-white/20 hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5 cursor-pointer'
              : 'border-transparent bg-gray-50 dark:bg-white/5'}
          `}
          onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('border-indigo-500'); }}
          onDragLeave={e => e.currentTarget.classList.remove('border-indigo-500')}
          onDrop={handleDrop}
          onClick={() => uiState === 'idle' && fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={handleFileSelect}
            disabled={uiState !== 'idle'}
          />

          <AnimatePresence mode="wait">
            {uiState === 'idle' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center"
              >
                <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">{t('Click to upload or drag and drop', 'अपलोड करने के लिए क्लिक करें या खींचकर छोड़ें')}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('PDF, PNG, JPG (max 20MB)', 'पी़डीएफ, पीएनजी, जेपीजी (अधिकतम 20MB)')}</p>
              </motion.div>
            )}

            {uiState === 'uploading' && (
              <motion.div
                key="uploading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full max-w-sm flex flex-col items-center"
              >
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                <h3 className="font-bold text-gray-800 dark:text-white mb-2">{t('Uploading Document...', 'दस्तावेज़ अपलोड हो रहा है...')}</h3>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${progress}%` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 font-mono">{Math.round(progress)}%</p>
              </motion.div>
            )}

            {uiState === 'ocr' && (
              <motion.div
                key="ocr"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center"
              >
                <div className="w-14 h-14 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mb-4 animate-pulse">
                  <FileText className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">{t('Analyzing Document', 'दस्तावेज़ का विश्लेषण')}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">{ocrStepText}</p>
              </motion.div>
            )}

            {uiState === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center w-full"
              >
                <div className="w-16 h-16 bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{t('Analysis Complete', 'विश्लेषण पूरा हुआ')}</h3>

                {/* Result Grid */}
                {ocrResult && (
                  <div className="w-full max-w-lg bg-white dark:bg-black/20 rounded-xl border border-gray-200 dark:border-white/10 p-4 mb-6 text-left">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="block text-xs font-bold text-gray-400 uppercase">{t('Doctor', 'डॉक्टर')}</span>
                        <span className="font-medium text-gray-800 dark:text-white">{ocrResult.doctor}</span>
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-gray-400 uppercase">{t('Date', 'तारीख')}</span>
                        <span className="font-medium text-gray-800 dark:text-white">{ocrResult.date}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="block text-xs font-bold text-gray-400 uppercase">{t('Medicines', 'दवाएं')}</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {ocrResult.medicines.map((m, i) => (
                            <span key={i} className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded text-xs font-bold">
                              {m.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-3 justify-center">
                  <PremiumButton
                    onClick={() => {
                      if (uploadedPrescriptionId || uploadedFileUrl) {
                        downloadPrescriptionPdf({
                          id: uploadedPrescriptionId || '',
                          doctor_name: ocrResult?.doctor,
                          diagnosis: ocrResult?.diagnosis,
                          medicines: ocrResult?.medicines || [],
                          file_url: uploadedFileUrl || undefined,
                          created_at: new Date().toISOString(),
                        } as any);
                      }
                    }}
                    variant="primary"
                    icon={<Download className="w-4 h-4" />}
                    disabled={!uploadedPrescriptionId && !uploadedFileUrl}
                  >
                    {t('Download PDF', 'पीडीएफ डाउनलोड करें')}
                  </PremiumButton>
                  <PremiumButton onClick={reset} variant="secondary" icon={<RefreshCw className="w-4 h-4" />}>
                    {t('Upload Another', 'एक और अपलोड करें')}
                  </PremiumButton>
                </div>
              </motion.div>
            )}

            {uiState === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center"
              >
                <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">{t('Upload Failed', 'अपलोड विफल')}</h3>
                <p className="text-red-500 text-sm mb-6 max-w-xs">{errorMessage}</p>
                <PremiumButton onClick={reset} variant="secondary" icon={<RefreshCw className="w-4 h-4" />}>
                  {t('Try Again', 'फिर से प्रयास करें')}
                </PremiumButton>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Info Footer */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-white/10 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{t('Tesseract OCR Engine v5.0', 'टेसेरैक्ट ओसीआर इंजन v5.0')}</span>
          </div>
          <span>{t('Secure • Local Processing', 'सुरक्षित • स्थानीय प्रसंस्करण')}</span>
        </div>
      </GlassCard>
    </div>
  );
}
