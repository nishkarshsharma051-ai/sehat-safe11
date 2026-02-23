import { useState, useEffect } from 'react';
import { Activity, Heart, Droplet, Scale, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { healthProfileService } from '../../services/dataService';
import { useLanguage } from '../../contexts/LanguageContext';

interface RiskFactors {
    age: number;
    weight: number;
    bpSystolic: number;
    bpDiastolic: number;
    sugarLevel: number;
    bmi: number;
}

function calculateRisk(f: RiskFactors, t: (en: string, hi: string) => string): { score: number; level: 'low' | 'moderate' | 'high'; details: string[] } {
    let score = 0;
    const details: string[] = [];

    // Age factor
    if (f.age > 60) { score += 25; details.push(t('Age above 60 increases cardiovascular risk', '60 से अधिक आयु हृदय जोखिम बढ़ाती है')); }
    else if (f.age > 45) { score += 15; details.push(t('Age above 45 — moderate age risk', '45 से अधिक आयु — मध्यम आयु जोखिम')); }
    else if (f.age > 30) { score += 5; }

    // BMI factor
    if (f.bmi > 30) { score += 25; details.push(t('BMI indicates obesity — high metabolic risk', 'बीएमआई मोटापा दर्शाता है — उच्च चयापचय जोखिम')); }
    else if (f.bmi > 25) { score += 15; details.push(t('BMI indicates overweight — moderate risk', 'बीएमआई अधिक वजन दर्शाता है — मध्यम जोखिम')); }
    else if (f.bmi < 18.5) { score += 10; details.push(t('BMI indicates underweight — nutritional concern', 'बीएमआई कम वजन दर्शाता है — पोषण संबंधी चिंता')); }

    // BP
    if (f.bpSystolic >= 140 || f.bpDiastolic >= 90) { score += 25; details.push(t('Blood pressure is high (Stage 2 hypertension)', 'रक्तचाप उच्च है (चरण 2 उच्च रक्तचाप)')); }
    else if (f.bpSystolic >= 130 || f.bpDiastolic >= 80) { score += 15; details.push(t('Blood pressure is elevated (Stage 1)', 'रक्तचाप बढ़ा हुआ है (चरण 1)')); }

    // Sugar
    if (f.sugarLevel > 200) { score += 25; details.push(t('Blood sugar is very high — diabetic range', 'ब्लड शुगर बहुत अधिक है — मधुमेह सीमा')); }
    else if (f.sugarLevel > 140) { score += 15; details.push(t('Blood sugar is elevated — pre-diabetic range', 'ब्लड शुगर बढ़ा हुआ है — प्री-डायबिटिक रेंज')); }

    score = Math.min(score, 100);
    const level = score >= 60 ? 'high' : score >= 30 ? 'moderate' : 'low';
    return { score, level, details };
}

export default function HealthRiskScore() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [form, setForm] = useState({ age: '', weight: '', height: '', bpSystolic: '', bpDiastolic: '', sugarLevel: '' });
    const [result, setResult] = useState<ReturnType<typeof calculateRisk> | null>(null);

    useEffect(() => {
        const load = async () => {
            const profile = await healthProfileService.get(user?.uid || 'anonymous');
            if (profile) {
                setForm({
                    age: profile.age?.toString() || '',
                    weight: profile.weight?.toString() || '',
                    height: profile.height?.toString() || '',
                    bpSystolic: profile.bp_systolic?.toString() || '',
                    bpDiastolic: profile.bp_diastolic?.toString() || '',
                    sugarLevel: profile.sugar_level?.toString() || '',
                });
            }
        };
        load();
    }, [user]);

    const handleCalculate = () => {
        const age = parseFloat(form.age) || 30;
        const weight = parseFloat(form.weight) || 70;
        const height = parseFloat(form.height) || 170;
        const bpSystolic = parseFloat(form.bpSystolic) || 120;
        const bpDiastolic = parseFloat(form.bpDiastolic) || 80;
        const sugarLevel = parseFloat(form.sugarLevel) || 100;
        const bmi = weight / ((height / 100) ** 2);

        setResult(calculateRisk({ age, weight, bpSystolic, bpDiastolic, sugarLevel, bmi }, t));
    };

    const colorMap = { low: 'green', moderate: 'yellow', high: 'red' };
    const iconMap = { low: TrendingDown, moderate: Minus, high: TrendingUp };
    const labelMap = { low: t('Low Risk', 'कम जोखिम'), moderate: t('Moderate Risk', 'मध्यम जोखिम'), high: t('High Risk', 'उच्च जोखिम') };

    return (
        <div className="space-y-6">
            <div className="glass-card p-6">
                <div className="flex items-center space-x-3 mb-6">
                    <div className="bg-indigo-100 p-2 rounded-xl"><Activity className="w-6 h-6 text-indigo-600" /></div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">{t('Health Risk Assessment', 'स्वास्थ्य जोखिम मूल्यांकन')}</h3>
                        <p className="text-sm text-gray-500">{t('Enter your vitals to calculate your health risk score', 'अपना स्वास्थ्य जोखिम स्कोर जांचने के लिए अपने विवरण दर्ज करें')}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    {[
                        { label: t('Age', 'आयु'), key: 'age', icon: Heart, placeholder: '30', unit: t('years', 'वर्ष') },
                        { label: t('Weight', 'वजन'), key: 'weight', icon: Scale, placeholder: '70', unit: t('kg', 'किग्रा') },
                        { label: t('Height', 'ऊंचाई'), key: 'height', icon: Activity, placeholder: '170', unit: t('cm', 'सेमी') },
                        { label: t('BP Systolic', 'बीपी सिस्टोलिक'), key: 'bpSystolic', icon: Heart, placeholder: '120', unit: 'mmHg' },
                        { label: t('BP Diastolic', 'बीपी डायस्टोलिक'), key: 'bpDiastolic', icon: Heart, placeholder: '80', unit: 'mmHg' },
                        { label: t('Sugar Level', 'शुगर लेवल'), key: 'sugarLevel', icon: Droplet, placeholder: '100', unit: 'mg/dL' },
                    ].map(field => (
                        <div key={field.key}>
                            <label className="text-xs text-gray-600 font-medium flex items-center space-x-1">
                                <field.icon className="w-3 h-3" /><span>{field.label}</span>
                            </label>
                            <div className="relative mt-1">
                                <input type="number" value={(form as Record<string, string>)[field.key]}
                                    onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg glass-input text-sm"
                                    placeholder={field.placeholder} />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{field.unit}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <button onClick={handleCalculate}
                    className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all">
                    {t('Calculate Health Risk Score', 'स्वास्थ्य जोखिम स्कोर की गणना करें')}
                </button>
            </div>

            {result && (
                <div className="glass-card p-6">
                    <div className="text-center mb-6">
                        <div className={`inline-flex items-center justify-center w-28 h-28 rounded-full bg-${colorMap[result.level]}-100 mb-4`}>
                            <div className="text-center">
                                <p className={`text-3xl font-black text-${colorMap[result.level]}-600`}>{result.score}</p>
                                <p className={`text-xs font-semibold text-${colorMap[result.level]}-500`}>/100</p>
                            </div>
                        </div>
                        {(() => {
                            const Icon = iconMap[result.level]; return (
                                <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-${colorMap[result.level]}-100 text-${colorMap[result.level]}-700 font-bold`}>
                                    <Icon className="w-5 h-5" />
                                    <span>{labelMap[result.level]}</span>
                                </div>
                            );
                        })()}
                    </div>

                    {form.weight && form.height && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-xl text-sm text-center">
                            <p className="text-gray-600">{t('Your BMI:', 'आपकी बीएमआई:')} <strong className="text-blue-700">{(parseFloat(form.weight) / ((parseFloat(form.height) / 100) ** 2)).toFixed(1)}</strong></p>
                        </div>
                    )}

                    {result.details.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-sm font-semibold text-gray-700">{t('Risk Factors:', 'जोखिम कारक:')}</p>
                            {result.details.map((d, i) => (
                                <div key={i} className="flex items-start space-x-2 p-2 bg-white/40 rounded-lg">
                                    <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm text-gray-700">{d}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {result.level === 'low' && (
                        <div className="mt-4 p-3 bg-green-50 rounded-xl text-sm text-green-700">
                            {t('✅ Great news! Your health indicators are within normal ranges. Keep up the healthy lifestyle!', '✅ अच्छी खबर! आपके स्वास्थ्य संकेतक सामान्य सीमा के भीतर हैं। स्वस्थ जीवनशैली बनाए रखें!')}
                        </div>
                    )}

                    <p className="text-xs text-gray-400 mt-4 text-center">
                        {t('⚠️ This is an approximate assessment. Always consult a healthcare professional for accurate diagnosis.', '⚠️ यह एक अनुमानित मूल्यांकन है। सटीक निदान के लिए हमेशा स्वास्थ्य देखभाल पेशेवर से परामर्श लें।')}
                    </p>
                </div>
            )}
        </div>
    );
}
