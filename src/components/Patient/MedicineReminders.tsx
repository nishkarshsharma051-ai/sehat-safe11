import { useCallback, useEffect, useState } from 'react';
import { Bell, Plus, Trash2, ToggleLeft, ToggleRight, Clock, Pill } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { MedicineReminder } from '../../types';
import { reminderService } from '../../services/dataService';

export default function MedicineReminders() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<MedicineReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
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
    if (!confirm('Are you sure you want to delete this reminder?')) return;
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
        <p className="text-gray-600">Loading reminders...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowAdd(true)}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Reminder</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reminders.length === 0 ? (
          <div className="col-span-3 glass-card p-12 text-center">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">No Reminders Set</h3>
            <p className="text-gray-500">Add a medicine reminder to stay on track with your dosage</p>
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
                    <p className="text-sm text-gray-600">{reminder.dosage}</p>
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
                  <span className="text-gray-600">Frequency: </span>
                  <span className="text-gray-800 font-medium">{reminder.frequency}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">Duration: </span>
                  <span className="text-gray-800">
                    {new Date(reminder.start_date).toLocaleDateString()} –{' '}
                    {new Date(reminder.end_date).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-xs text-gray-600 mb-2 flex items-center">
                  <Clock className="w-3 h-3 mr-1" /> Reminder Times:
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
                <span className="text-sm">Delete</span>
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
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Add Medicine Reminder</h3>

            <form onSubmit={addReminder} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medicine Name
                </label>
                <input
                  type="text"
                  value={formData.medicine_name}
                  onChange={(e) => setFormData({ ...formData, medicine_name: e.target.value })}
                  required
                  placeholder="e.g., Paracetamol"
                  className="w-full px-4 py-3 rounded-xl glass-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dosage</label>
                  <input
                    type="text"
                    value={formData.dosage}
                    onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                    required
                    placeholder="e.g., 500mg"
                    className="w-full px-4 py-3 rounded-xl glass-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frequency
                  </label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-xl glass-input"
                  >
                    <option value="">Select</option>
                    <option value="Once daily">Once daily</option>
                    <option value="Twice daily">Twice daily</option>
                    <option value="Three times daily">Three times daily</option>
                    <option value="Before meals">Before meals</option>
                    <option value="After meals">After meals</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
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
                  Reminder Times
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
                    + Add another time
                  </button>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                >
                  Add Reminder
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
