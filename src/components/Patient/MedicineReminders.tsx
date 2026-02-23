import { useCallback, useEffect, useState } from 'react';
import { Bell, Plus, Trash2, ToggleLeft, ToggleRight, Clock, Pill } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { MedicineReminder } from '../../types';
import { reminderService } from '../../services/dataService';
import { useLanguage } from '../../contexts/LanguageContext';

export default function MedicineReminders() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const [reminders, setReminders] = useState<MedicineReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const QUICK_PRESETS = [
    { name: t('Probiotic', 'प्रोबायोटिक'), dosage: '1 Capsule', freq: 'Once daily' },
    { name: t('Vitamin D', 'विटामिन डी'), dosage: '60k IU', freq: 'Weekly' },
    { name: t('B12 Supplement', 'बी12 सप्लीमेंट'), dosage: '1500mcg', freq: 'Once daily' },
  ];

  const [formData, setFormData] = useState({
    medicine_name: '',
    dosage: '',
    frequency: '',
    start_date: '',
    end_date: '',
    reminder_times: ['09:00', '21:00'],
  });

  const loadReminders = useCallback(async () => {
    try {
      const data = await reminderService.getAll(user?.uid || 'anonymous');
      setReminders(data);
    } catch (error) {
      console.error('Error loading reminders:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  const addReminder = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const newReminder: MedicineReminder = {
        id: Date.now().toString(),
        patient_id: user?.uid || 'anonymous',
        medicine_name: formData.medicine_name,
        dosage: formData.dosage,
        frequency: formData.frequency,
        start_date: formData.start_date,
        end_date: formData.end_date,
        reminder_times: formData.reminder_times,
        is_active: true,
        created_at: new Date().toISOString(),
      };
      await reminderService.add(newReminder);
      setReminders((prev) => [newReminder, ...prev]);
      setShowAdd(false);
      setFormData({
        medicine_name: '',
        dosage: '',
        frequency: '',
        start_date: '',
        end_date: '',
        reminder_times: ['09:00', '21:00'],
      });
    } catch (error) {
      console.error('Error adding reminder:', error);
    }
  };

  const toggleReminder = async (id: string) => {
    try {
      await reminderService.toggle(id);
      setReminders((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_active: !r.is_active } : r))
      );
    } catch (error) {
      console.error('Error toggling reminder:', error);
    }
  };

  const deleteReminder = async (id: string) => {
    if (!confirm(t('Are you sure you want to delete this reminder?', 'क्या आप वाकई इस रिमाइंडर को हटाना चाहते हैं?'))) return;
    try {
      await reminderService.remove(id);
      setReminders(reminders.filter((r) => r.id !== id));
    } catch (error) {
      console.error('Error deleting reminder:', error);
    }
  };

  const addReminderTime = () => {
    setFormData({
      ...formData,
      reminder_times: [...formData.reminder_times, '12:00'],
    });
  };

  const updateReminderTime = (index: number, value: string) => {
    const newTimes = [...formData.reminder_times];
    newTimes[index] = value;
    setFormData({ ...formData, reminder_times: newTimes });
  };

  const removeReminderTime = (index: number) => {
    setFormData({
      ...formData,
      reminder_times: formData.reminder_times.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-gray-600">{t('Loading reminders...', 'रिमाइंडर लोड हो रहे हैं...')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <button
          onClick={() => setShowAdd(true)}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>{t('Add New Reminder', 'नया रिमाइंडर जोड़ें')}</span>
        </button>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2 whitespace-nowrap">{t('Quick Add:', 'क्विक जोड़ें:')}</span>
          {QUICK_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={async () => {
                const newRem: MedicineReminder = {
                  id: Date.now().toString(),
                  patient_id: user?.uid || 'anonymous',
                  medicine_name: preset.name,
                  dosage: preset.dosage,
                  frequency: preset.freq,
                  reminder_times: ['09:00'],
                  is_active: true,
                  created_at: new Date().toISOString(),
                };
                try {
                  await reminderService.add(newRem);
                  setReminders(prev => [newRem, ...prev]);
                } catch (err) {
                  console.error('Quick add failed:', err);
                }
              }}
              className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-500 transition-all whitespace-nowrap"
            >
              + {preset.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reminders.length === 0 ? (
          <div className="col-span-3 glass-card p-12 text-center">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">{t('No Reminders Set', 'कोई रिमाइंडर सेट नहीं है')}</h3>
            <p className="text-gray-500">{t('Add a medicine reminder to stay on track with your dosage', 'अपनी खुराक के साथ ट्रैक पर रहने के लिए एक दवा रिमाइंडर जोड़ें')}</p>
          </div>
        ) : (
          reminders.map((reminder) => (
            <div
              key={reminder.id}
              className={`glass-card p-6 ${!reminder.is_active && 'opacity-60'}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-xl ${reminder.is_active ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <Pill className={`w-5 h-5 ${reminder.is_active ? 'text-green-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{reminder.medicine_name}</h3>
                    <p className="text-sm text-gray-600">{t('Dosage:', 'खुराक:')} {reminder.dosage}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleReminder(reminder.id)}
                  className="p-2 hover:bg-white/50 rounded-lg transition-all"
                >
                  {reminder.is_active ? (
                    <ToggleRight className="w-6 h-6 text-green-600" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-gray-400" />
                  )}
                </button>
              </div>

              <div className="space-y-2 mb-4">
                <div className="text-sm">
                  <span className="text-gray-600">{t('Frequency:', 'आवृत्ति:')} </span>
                  <span className="text-gray-800 font-medium">{t(reminder.frequency, reminder.frequency)}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">{t('Duration:', 'अवधि:')} </span>
                  <span className="text-gray-800">
                    {reminder.start_date ? new Date(reminder.start_date).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN') : t('N/A', 'उपलब्ध नहीं')} –{' '}
                    {reminder.end_date ? new Date(reminder.end_date).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN') : t('N/A', 'उपलब्ध नहीं')}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-xs text-gray-600 mb-2 flex items-center">
                  <Clock className="w-3 h-3 mr-1" /> {t('Reminder Times:', 'रिमाइंडर का समय:')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(reminder.reminder_times) &&
                    reminder.reminder_times.map((time, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full"
                      >
                        {time}
                      </span>
                    ))}
                </div>
              </div>

              <button
                onClick={() => deleteReminder(reminder.id)}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-sm">{t('Delete', 'हटाएं')}</span>
              </button>
            </div>
          ))
        )}
      </div>

      {showAdd && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 z-50 pt-24"
          onClick={() => setShowAdd(false)}
        >
          <div
            className="glass-card p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-gray-800 mb-6">{t('Add Medicine Reminder', 'दवा रिमाइंडर जोड़ें')}</h3>

            <form onSubmit={addReminder} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('Medicine Name', 'दवा का नाम')}
                </label>
                <input
                  type="text"
                  value={formData.medicine_name}
                  onChange={(e) => setFormData({ ...formData, medicine_name: e.target.value })}
                  required
                  placeholder={t('e.g., Paracetamol', 'जैसे: पैरासिटामोल')}
                  className="w-full px-4 py-3 rounded-xl glass-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('Dosage', 'खुराक')}</label>
                  <input
                    type="text"
                    value={formData.dosage}
                    onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                    required
                    placeholder={t('e.g., 500mg', 'जैसे: 500मिग्रा')}
                    className="w-full px-4 py-3 rounded-xl glass-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('Frequency', 'आवृत्ति')}
                  </label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-xl glass-input"
                  >
                    <option value="">{t('Select', 'चुनें')}</option>
                    <option value="Once daily">{t('Once daily', 'दिन में एक बार')}</option>
                    <option value="Twice daily">{t('Twice daily', 'दिन में दो बार')}</option>
                    <option value="Three times daily">{t('Three times daily', 'दिन में तीन बार')}</option>
                    <option value="Before meals">{t('Before meals', 'खाने से पहले')}</option>
                    <option value="After meals">{t('After meals', 'खाने के बाद')}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('Start Date', 'शुरू करने की तारीख')}
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-xl glass-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('End Date', 'समाप्ति की तारीख')}</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-xl glass-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('Reminder Times', 'रिमाइंडर का समय')}
                </label>
                <div className="space-y-2">
                  {formData.reminder_times.map((time, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="time"
                        value={time}
                        onChange={(e) => updateReminderTime(index, e.target.value)}
                        className="flex-1 px-4 py-3 rounded-xl glass-input"
                      />
                      {formData.reminder_times.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeReminderTime(index)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addReminderTime}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    + {t('Add another time', 'एक और समय जोड़ें')}
                  </button>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                >
                  {t('Add Reminder', 'रिमाइंडर जोड़ें')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-all"
                >
                  {t('Cancel', 'रद्द करें')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
