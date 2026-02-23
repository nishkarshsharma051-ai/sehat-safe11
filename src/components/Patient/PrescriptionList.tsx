import { useCallback, useEffect, useState } from 'react';
import { FileText, Trash2, ExternalLink, Calendar, Pill, X, Download, Filter, Tag, Stethoscope } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Prescription } from '../../types';
import { prescriptionService } from '../../services/dataService';
import { downloadPrescriptionPdf } from '../../utils/prescriptionPdf';
import { useLanguage } from '../../contexts/LanguageContext';

const CATEGORY_LABELS: Record<string, { en: string; hi: string }> = {
  prescription: { en: 'Prescription', hi: 'नुस्खा' },
  lab: { en: 'Lab Report', hi: 'लैब रिपोर्ट' },
  scan: { en: 'Scan', hi: 'स्कैन' },
  discharge: { en: 'Discharge', hi: 'डिस्चार्ज' },
};

export default function PrescriptionList() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const loadPrescriptions = useCallback(async () => {
    try {
      const data = await prescriptionService.getFiltered(user?.uid || 'anonymous', {
        category: filterCategory || undefined,
        tag: filterTag || undefined,
        from: filterFrom || undefined,
        to: filterTo || undefined,
      });
      setPrescriptions(data);
    } catch (error) {
      console.error('Error loading prescriptions:', error);
    } finally {
      setLoading(false);
    }
  }, [user, filterCategory, filterTag, filterFrom, filterTo]);

  useEffect(() => {
    loadPrescriptions();
  }, [loadPrescriptions]);

  useEffect(() => {
    const handleReload = () => loadPrescriptions();
    window.addEventListener('prescriptions-updated', handleReload);
    return () => window.removeEventListener('prescriptions-updated', handleReload);
  }, [loadPrescriptions]);

  const deletePrescription = async (id: string) => {
    if (!confirm(t('Are you sure you want to delete this prescription?', 'क्या आप वाकई इस नुस्खे को हटाना चाहते हैं?'))) return;
    try {
      await prescriptionService.remove(id);
      setPrescriptions(prescriptions.filter((p) => p.id !== id));
      alert(t('Prescription deleted successfully', 'नुस्खा सफलतापूर्वक हटा दिया गया'));
    } catch (error) {
      console.error('Error deleting prescription:', error);
      alert(t('Failed to delete prescription: ', 'नुस्खा हटाने में विफल: ') + (error as any).message);
    }
  };

  const downloadPrescription = (p: Prescription) => downloadPrescriptionPdf(p);

  const allTags = Array.from(new Set(prescriptions.flatMap(p => p.tags || [])));

  const clearFilters = () => {
    setFilterCategory('');
    setFilterTag('');
    setFilterFrom('');
    setFilterTo('');
  };

  if (loading) {
    return <div className="glass-card p-8 text-center"><p className="text-gray-600">{t('Loading prescriptions...', 'नुस्खे लोड हो रहे हैं...')}</p></div>;
  }

  if (prescriptions.length === 0 && !filterCategory && !filterTag && !filterFrom && !filterTo) {
    return (
      <div className="glass-card p-12 text-center">
        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-700 mb-2">{t('No Prescriptions', 'कोई नुस्खा नहीं')}</h3>
        <p className="text-gray-500">{t('Upload your first prescription above to get started', 'शुरू करने के लिए ऊपर अपना पहला नुस्खा अपलोड करें')}</p>
      </div>
    );
  }

  return (
    <>
      {/* Filters */}
      <div className="glass-card p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-all">
            <Filter className="w-4 h-4" /><span>{t('Filters', 'फ़िल्टर')}</span>
            {(filterCategory || filterTag || filterFrom || filterTo) && (
              <span className="w-2 h-2 bg-blue-500 rounded-full" />
            )}
          </button>
          {(filterCategory || filterTag || filterFrom || filterTo) && (
            <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-600">{t('Clear All', 'सभी साफ करें')}</button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-gray-200/50">
            <div>
              <label className="text-xs text-gray-500">{t('Category', 'श्रेणी')}</label>
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                className="w-full mt-1 px-2 py-1.5 rounded-lg glass-input text-sm">
                <option value="">{t('All', 'सभी')}</option>
                <option value="prescription">{t('Prescription', 'नुस्खा')}</option>
                <option value="lab">{t('Lab Report', 'लैब रिपोर्ट')}</option>
                <option value="scan">{t('Scan', 'स्कैन')}</option>
                <option value="discharge">{t('Discharge', 'डिस्चार्ज')}</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">{t('Tag', 'टैग')}</label>
              <select value={filterTag} onChange={e => setFilterTag(e.target.value)}
                className="w-full mt-1 px-2 py-1.5 rounded-lg glass-input text-sm">
                <option value="">{t('All', 'सभी')}</option>
                {allTags.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">{t('From', 'से')}</label>
              <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)}
                className="w-full mt-1 px-2 py-1.5 rounded-lg glass-input text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-500">{t('To', 'तक')}</label>
              <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)}
                className="w-full mt-1 px-2 py-1.5 rounded-lg glass-input text-sm" />
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                <th className="px-6 py-4 text-sm font-semibold tracking-wide">#</th>
                <th className="px-6 py-4 text-sm font-semibold tracking-wide">{t('Date', 'तारीख')}</th>
                <th className="px-6 py-4 text-sm font-semibold tracking-wide">{t('Time', 'समय')}</th>
                <th className="px-6 py-4 text-sm font-semibold tracking-wide">{t('Category', 'श्रेणी')}</th>
                <th className="px-6 py-4 text-sm font-semibold tracking-wide">{t('Diagnosis', 'रोग का निदान')}</th>
                <th className="px-6 py-4 text-sm font-semibold tracking-wide">{t('Medicines', 'दवाएं')}</th>
                <th className="px-6 py-4 text-sm font-semibold tracking-wide text-center">{t('Actions', 'कार्रवाई')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/60">
              {prescriptions.map((prescription, index) => {
                const uploadDate = new Date(prescription.created_at);
                return (
                  <tr key={prescription.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-sm font-bold">
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-800 font-medium">
                        <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                        {uploadDate.toLocaleDateString(t('en-IN', 'hi-IN'), { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700 font-medium">
                        {uploadDate.toLocaleTimeString(t('en-IN', 'hi-IN'), { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded-full">
                        {prescription.category ? t(CATEGORY_LABELS[prescription.category]?.en || prescription.category,
                          CATEGORY_LABELS[prescription.category]?.hi || prescription.category
                        ) : '—'}
                      </span>
                      {prescription.tags && prescription.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {prescription.tags.map((tag, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px] font-medium flex items-center">
                              <Tag className="w-2 h-2 mr-0.5" />{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-[200px]">
                        <span className="text-sm text-gray-700 font-medium line-clamp-2" title={prescription.diagnosis}>
                          {prescription.diagnosis || '—'}
                        </span>
                        {prescription.doctor_name && (
                          <p className="text-xs text-gray-400 mt-1 flex items-center">
                            <Stethoscope className="w-3 h-3 mr-1" />
                            {prescription.doctor_name}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {prescription.medicines && Array.isArray(prescription.medicines) && prescription.medicines.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {prescription.medicines.map((med: { name: string }, idx: number) => (
                            <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              <Pill className="w-3 h-3 mr-1" />{med.name}
                            </span>
                          ))}
                        </div>
                      ) : <span className="text-sm text-gray-400">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-1">
                        <button onClick={() => setSelectedPrescription(prescription)}
                          className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:shadow-lg transition-all text-xs font-medium">
                          {t('View', 'देखें')}
                        </button>
                        <button onClick={() => downloadPrescription(prescription)}
                          className="p-1.5 bg-white/60 rounded-lg hover:bg-white/90 transition-all" title="Download">
                          <Download className="w-4 h-4 text-gray-600" />
                        </button>
                        {prescription.file_url && (
                          <a href={prescription.file_url} target="_blank" rel="noopener noreferrer"
                            className="p-1.5 bg-white/60 rounded-lg hover:bg-white/90 transition-all">
                            <ExternalLink className="w-4 h-4 text-gray-600" />
                          </a>
                        )}
                        <button onClick={() => deletePrescription(prescription.id)}
                          className="p-1.5 hover:bg-red-100 rounded-lg transition-all">
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {prescriptions.length === 0 && (filterCategory || filterTag || filterFrom || filterTo) && (
          <div className="p-8 text-center">
            <p className="text-gray-500">{t('No prescriptions match your filters', 'आपके फ़िल्टर से कोई नुस्खा मेल नहीं खाता')}</p>
          </div>
        )}
      </div>

      {selectedPrescription && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedPrescription(null)}>
          <div className="glass-card p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">{t('Prescription Details', 'नुस्खे का विवरण')}</h3>
              <button onClick={() => setSelectedPrescription(null)} className="p-2 hover:bg-white/50 rounded-lg transition-all">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {selectedPrescription.doctor_name && (
              <div className="mb-4 p-3 bg-gray-50 rounded-xl text-sm">
                <span className="text-gray-500">{t('Doctor:', 'डॉक्टर:')}</span> <strong>{selectedPrescription.doctor_name}</strong>
              </div>
            )}

            {selectedPrescription.ai_summary && (
              <div className="mb-6 p-4 bg-blue-50 rounded-xl">
                <p className="text-sm font-medium text-blue-900 mb-2">{t('AI Health Summary:', 'एआई स्वास्थ्य सारांश:')}</p>
                <p className="text-gray-700">{selectedPrescription.ai_summary}</p>
              </div>
            )}

            {selectedPrescription.diagnosis && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">{t('Diagnosis:', 'रोग का निदान:')}</p>
                <p className="text-gray-800">{selectedPrescription.diagnosis}</p>
              </div>
            )}

            {selectedPrescription.medicines && Array.isArray(selectedPrescription.medicines) && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">{t('Medicines:', 'दवाएं:')}</p>
                <div className="space-y-3">
                  {selectedPrescription.medicines.map((med: { name: string; dosage?: string; frequency?: string; duration?: string }, idx: number) => (
                    <div key={idx} className="p-3 bg-white/50 rounded-lg">
                      <p className="font-medium text-gray-800 flex items-center">
                        <Pill className="w-4 h-4 mr-2 text-blue-500" />{med.name}
                      </p>
                      <div className="ml-6 mt-1 space-y-0.5">
                        <p className="text-sm text-gray-600">{t('Dosage:', 'खुराक:') || 'Dosage:'} {med.dosage}</p>
                        <p className="text-sm text-gray-600">{t('Frequency:', 'आवृत्ति:') || 'Frequency:'} {med.frequency}</p>
                        {med.duration && <p className="text-sm text-gray-600">{t('Duration:', 'अवधि:') || 'Duration:'} {med.duration}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedPrescription.extracted_text && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">{t('Extracted Text:', 'निकाला गया टेक्स्ट:')}</p>
                <div className="p-4 bg-gray-50 rounded-lg max-h-64 overflow-y-auto">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedPrescription.extracted_text}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
