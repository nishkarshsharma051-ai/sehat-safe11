import { useState, useEffect, useCallback } from 'react';
import { Link, Copy, Clock, Trash2, CheckCircle, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { SecureShareLink } from '../../types';
import { secureShareService } from '../../services/dataService';
import { useLanguage } from '../../contexts/LanguageContext';

export default function SecureShare() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [links, setLinks] = useState<SecureShareLink[]>([]);
    const [expiryHours, setExpiryHours] = useState(24);
    const [copied, setCopied] = useState('');


    const loadLinks = useCallback(async () => {
        setLinks(await secureShareService.getAll(user?.uid || 'anonymous'));
    }, [user]);

    useEffect(() => {
        loadLinks();
    }, [loadLinks]);

    const createLink = async () => {
        await secureShareService.create(user?.uid || 'anonymous', expiryHours);
        await loadLinks();
    };

    const revokeLink = async (id: string) => {
        await secureShareService.revoke(id);
        await loadLinks();
    };

    const copyToken = (token: string) => {
        navigator.clipboard.writeText(`${window.location.origin}/shared/${token}`);
        setCopied(token);
        setTimeout(() => setCopied(''), 2000);
    };

    const isExpired = (link: SecureShareLink) => new Date() > new Date(link.expires_at);

    return (
        <div className="space-y-6">
            <div className="glass-card p-6">
                <div className="flex items-center space-x-3 mb-6">
                    <div className="bg-indigo-100 p-2 rounded-xl"><Shield className="w-6 h-6 text-indigo-600" /></div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">{t('Secure Share', 'सुरक्षित साझा')}</h3>
                        <p className="text-sm text-gray-500">{t('Generate temporary links to share your medical records', 'अपने मेडिकल रिकॉर्ड साझा करने के लिए अस्थायी लिंक बनाएं')}</p>
                    </div>
                </div>

                <div className="flex items-end gap-4 mb-6 p-4 bg-blue-50/50 rounded-xl">
                    <div className="flex-1">
                        <label className="text-sm text-gray-600 font-medium">{t('Link Expiry', 'लिंक समाप्ति')}</label>
                        <select value={expiryHours} onChange={e => setExpiryHours(parseInt(e.target.value))}
                            className="w-full mt-1 px-3 py-2 rounded-lg glass-input text-sm">
                            <option value={1}>{t('1 Hour', '1 घंटा')}</option>
                            <option value={6}>{t('6 Hours', '6 घंटे')}</option>
                            <option value={24}>{t('24 Hours', '24 घंटे')}</option>
                            <option value={48}>{t('48 Hours', '48 घंटे')}</option>
                            <option value={168}>{t('7 Days', '7 दिन')}</option>
                        </select>
                    </div>
                    <button onClick={createLink}
                        className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium flex items-center space-x-2">
                        <Link className="w-4 h-4" /><span>{t('Generate Link', 'लिंक बनाएं')}</span>
                    </button>
                </div>

                {links.length === 0 ? (
                    <div className="text-center py-8">
                        <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">{t('No share links created yet', 'अभी तक कोई साझा लिंक नहीं बनाया गया है')}</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {links.map(link => {
                            const expired = isExpired(link);
                            const revoked = link.revoked;
                            const active = !expired && !revoked;
                            return (
                                <div key={link.id} className={`p-4 rounded-xl border ${active ? 'bg-white/40 border-green-200' : 'bg-gray-50/50 border-gray-200 opacity-60'}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className={`p-1.5 rounded-lg ${active ? 'bg-green-100' : 'bg-gray-100'}`}>
                                                {active ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Clock className="w-4 h-4 text-gray-400" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-800 font-mono">
                                                    ...{link.token.slice(-12)}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {t('Created', 'बनाया गया')} {new Date(link.created_at).toLocaleDateString(t('en-IN', 'hi-IN'), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                    {' • '}{t('Expires', 'समाप्त होगा')} {new Date(link.expires_at).toLocaleDateString(t('en-IN', 'hi-IN'), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${revoked ? 'bg-red-100 text-red-600' : expired ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'}`}>
                                                {revoked ? t('Revoked', 'रद्द') : expired ? t('Expired', 'समाप्त') : t('Active', 'सक्रिय')}
                                            </span>
                                            {active && (
                                                <>
                                                    <button onClick={() => copyToken(link.token)}
                                                        className="p-1.5 hover:bg-blue-100 rounded-lg transition-all">
                                                        {copied === link.token ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-blue-500" />}
                                                    </button>
                                                    <button onClick={() => revokeLink(link.id)}
                                                        className="p-1.5 hover:bg-red-100 rounded-lg transition-all">
                                                        <Trash2 className="w-4 h-4 text-red-500" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
