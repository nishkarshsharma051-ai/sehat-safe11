import { useCallback, useEffect, useState } from 'react';
import { Calendar, Clock, Search, Plus, MapPin, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Appointment, Doctor } from '../../types';
import { appointmentService, doctorService } from '../../services/dataService';
import { useLanguage } from '../../contexts/LanguageContext';

export default function AppointmentBooking() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const [booking, setBooking] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    doctor_id: '',
    appointment_date: '',
    appointment_time: '',
    reason: '',
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [appts, docs] = await Promise.all([
        appointmentService.getByPatient(user?.uid || 'anonymous'),
        doctorService.getAll(),
      ]);
      setAppointments(appts);
      setDoctors(docs);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const bookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setBooking(true);

    try {
      await appointmentService.add({
        patient_id: user?.uid || 'anonymous',
        doctor_id: formData.doctor_id,
        appointment_date: `${formData.appointment_date}T${formData.appointment_time}:00`,
        reason: formData.reason,
        status: 'pending',
      });

      // Reload from backend so we get the real MongoDB _id
      await loadData();

      setShowBooking(false);
      setFormData({ doctor_id: '', appointment_date: '', appointment_time: '', reason: '' });
      setSearchTerm('');
      setSuccess(t('Appointment booked successfully!', 'अपॉइंटमेंट सफलतापूर्वक बुक हो गया!'));
      setTimeout(() => setSuccess(''), 4000);
    } catch (error) {
      console.error('Error booking appointment:', error);
    } finally {
      setBooking(false);
    }
  };

  const cancelAppointment = async (id: string) => {
    if (!confirm(t('Are you sure you want to cancel this appointment?', 'क्या आप वाकई इस अपॉइंटमेंट को रद्द करना चाहते हैं?'))) return;
    try {
      await appointmentService.updateStatus(id, 'cancelled');
      setAppointments(prev =>
        prev.map(apt => apt.id === id ? { ...apt, status: 'cancelled' } : apt)
      );
    } catch (error) {
      console.error('Error cancelling appointment:', error);
    }
  };

  const filteredDoctors = doctors.filter(
    (doc) =>
      doc.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400';
      case 'pending': return 'bg-yellow-100 text-yellow-700 dark:bg-amber-500/20 dark:text-amber-400';
      case 'completed': return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400';
      case 'cancelled': return 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const translateStatus = (status: string) => {
    switch (status) {
      case 'confirmed': return t('Confirmed', 'पुष्टीकृत');
      case 'pending': return t('Pending', 'लंबित');
      case 'completed': return t('Completed', 'पूरा हुआ');
      case 'cancelled': return t('Cancelled', 'रद्द');
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">{t('Loading appointments...', 'अपॉइंटमेंट लोड हो रहे हैं...')}</p>
      </div>
    );
  }

  const activeAppointments = appointments.filter(a => a.status !== 'cancelled');
  const cancelledAppointments = appointments.filter(a => a.status === 'cancelled');

  return (
    <div className="space-y-6">
      {success && (
        <div className="flex items-center space-x-2 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{success}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t('My Appointments', 'मेरे अपॉइंटमेंट')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {activeAppointments.length} {t('active appointment', 'सक्रिय अपॉइंटमेंट')}{activeAppointments.length !== 1 ? t('s', '') : ''}
          </p>
        </div>
        <button
          onClick={() => setShowBooking(true)}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg hover:scale-[1.02] transition-all flex items-center space-x-2 shadow-blue-500/20 shadow-lg"
        >
          <Plus className="w-5 h-5" />
          <span>{t('Book Appointment', 'अपॉइंटमेंट बुक करें')}</span>
        </button>
      </div>

      {/* Active Appointments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {activeAppointments.length === 0 ? (
          <div className="col-span-2 glass-card p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700 dark:text-white mb-2">{t('No Appointments', 'कोई अपॉइंटमेंट नहीं')}</h3>
            <p className="text-gray-500 dark:text-gray-400">{t('Book your first appointment with a doctor below.', 'नीचे डॉक्टर के साथ अपना पहला अपॉइंटमेंट बुक करें।')}</p>
          </div>
        ) : (
          activeAppointments.map((appointment) => (
            <div
              key={appointment.id}
              className="glass-card p-6 border-l-4 border-l-blue-500 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-white text-lg">
                    {t('Dr.', 'डॉ.')} {appointment.doctor?.full_name || t('Doctor', 'डॉक्टर')}
                  </h3>
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">{appointment.doctor?.specialization ? t(appointment.doctor.specialization, appointment.doctor.specialization) : t('General Physician', 'सामान्य चिकित्सक')}</p>
                  {appointment.doctor?.hospital_name && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-1">
                      <MapPin className="w-3 h-3 mr-1" />
                      {appointment.doctor.hospital_name}
                    </p>
                  )}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(appointment.status)}`}>
                  {translateStatus(appointment.status)}
                </span>
              </div>

              <div className="space-y-2 mb-4 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                  {new Date(appointment.appointment_date).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <Clock className="w-4 h-4 mr-2 text-indigo-500" />
                  {new Date(appointment.appointment_date).toLocaleTimeString(t('en-IN', 'hi-IN'), {
                    hour: '2-digit', minute: '2-digit',
                  })}
                </div>
              </div>

              <div className="mb-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide font-bold">{t('Reason', 'कारण')}</p>
                <p className="text-sm text-gray-800 dark:text-gray-200">{appointment.reason}</p>
              </div>

              {appointment.notes && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl mb-4">
                  <p className="text-xs text-blue-600 dark:text-blue-400 mb-1 font-bold uppercase tracking-wide">{t("Doctor's Notes", "डॉक्टर के नोट्स")}</p>
                  <p className="text-sm text-gray-800 dark:text-gray-200">{appointment.notes}</p>
                </div>
              )}

              {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                <button
                  onClick={() => cancelAppointment(appointment.id)}
                  className="w-full py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-medium transition-colors flex items-center justify-center space-x-1"
                >
                  <X className="w-4 h-4" />
                  <span>{t('Cancel Appointment', 'अपॉइंटमेंट रद्द करें')}</span>
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Cancelled */}
      {cancelledAppointments.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {t('Cancelled', 'रद्द')} ({cancelledAppointments.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cancelledAppointments.map(appointment => (
              <div key={appointment.id} className="glass-card p-4 opacity-60 border-l-4 border-l-red-400">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-700 dark:text-gray-300">{t('Dr.', 'डॉ.')} {appointment.doctor?.full_name || t('Doctor', 'डॉक्टर')}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(appointment.appointment_date).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-lg font-bold">{t('Cancelled', 'रद्द')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBooking && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setShowBooking(false)}
        >
          <div
            className="glass-card p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{t('Book Appointment', 'अपॉइंटमेंट बुक करें')}</h3>
              <button onClick={() => setShowBooking(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={bookAppointment} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                  {t('Search Doctor', 'डॉक्टर खोजें')}
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t("Search by name or specialization", "नाम या विशेषज्ञता के आधार पर खोजें")}
                    className="w-full pl-10 pr-4 py-3 rounded-xl glass-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                  {t('Select Doctor', 'डॉक्टर चुनें')}
                </label>
                {filteredDoctors.length > 0 ? (
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {filteredDoctors.map((doctor) => (
                      <label
                        key={doctor.id}
                        className={`flex items-center p-3 rounded-xl cursor-pointer transition-all ${formData.doctor_id === doctor.id
                          ? 'bg-blue-500/10 border-2 border-blue-400'
                          : 'bg-white/30 dark:bg-white/5 border-2 border-transparent hover:bg-white/50 dark:hover:bg-white/10'
                          }`}
                      >
                        <input
                          type="radio"
                          name="doctor"
                          value={doctor.id}
                          checked={formData.doctor_id === doctor.id}
                          onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value })}
                          className="hidden"
                        />
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 font-bold text-lg mr-3">
                          {doctor.full_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-white">{t('Dr.', 'डॉ.')} {doctor.full_name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {t(doctor.specialization, doctor.specialization)}{doctor.hospital_name && ` • ${doctor.hospital_name}`}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 p-3 text-center">{t('No doctors found', 'कोई डॉक्टर नहीं मिला')}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">{t('Date', 'तारीख')}</label>
                  <input
                    type="date"
                    value={formData.appointment_date}
                    onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full px-4 py-3 rounded-xl glass-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">{t('Time', 'समय')}</label>
                  <input
                    type="time"
                    value={formData.appointment_time}
                    onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-xl glass-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                  {t('Reason for Visit', 'डॉक्टर से मिलने का कारण')}
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  required
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl glass-input resize-none"
                  placeholder={t("Describe your symptoms or reason for consultation", "अपने लक्षणों या परामर्श के कारण का वर्णन करें")}
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={!formData.doctor_id || booking}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {booking ? (
                    <><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span><span>{t('Booking...', 'बुकिंग हो रही है...')}</span></>
                  ) : (
                    <><Calendar className="w-4 h-4" /><span>{t('Confirm Booking', 'बुकिंग की पुष्टि करें')}</span></>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowBooking(false)}
                  className="flex-1 py-3 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-white/20 transition-all"
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
