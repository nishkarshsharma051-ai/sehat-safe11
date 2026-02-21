import { useCallback, useEffect, useState } from 'react';
import { Calendar, Clock, Search, Plus, MapPin } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Appointment, Doctor } from '../../types';
import { appointmentService, doctorService } from '../../services/dataService';

export default function AppointmentBooking() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    doctor_id: '',
    appointment_date: '',
    appointment_time: '',
    reason: '',
  });

  const loadData = useCallback(async () => {
    try {
      const appts = await appointmentService.getByPatient(user?.uid || 'anonymous');
      setAppointments(appts);
      const docs = await doctorService.getAll();
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

    const appointmentDateTime = `${formData.appointment_date}T${formData.appointment_time}:00`;
    const doctor = doctors.find(d => d.id === formData.doctor_id);

    try {
      const newAppointment: Appointment = {
        id: Date.now().toString(),
        patient_id: user?.uid || 'anonymous',
        doctor_id: formData.doctor_id,
        appointment_date: appointmentDateTime,
        reason: formData.reason,
        status: 'pending',
        doctor: doctor,
      };

      await appointmentService.add(newAppointment);
      setAppointments(prev => [newAppointment, ...prev]);

      setShowBooking(false);
      setFormData({
        doctor_id: '',
        appointment_date: '',
        appointment_time: '',
        reason: '',
      });
    } catch (error) {
      console.error('Error booking appointment:', error);
    }
  };

  const filteredDoctors = doctors.filter(
    (doc) =>
      doc.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'completed':
        return 'bg-blue-100 text-blue-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-gray-600">Loading appointments...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowBooking(true)}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Book New Appointment</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {appointments.length === 0 ? (
          <div className="col-span-2 glass-card p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">No Appointments</h3>
            <p className="text-gray-500">Book your first appointment with a doctor</p>
          </div>
        ) : (
          appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="glass-card p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-gray-800">
                    Dr. {appointment.doctor?.full_name || 'Doctor'}
                  </h3>
                  <p className="text-sm text-gray-600">{appointment.doctor?.specialization}</p>
                  {appointment.doctor?.hospital_name && (
                    <p className="text-xs text-gray-500 flex items-center mt-1">
                      <MapPin className="w-3 h-3 mr-1" />
                      {appointment.doctor.hospital_name}
                    </p>
                  )}
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}
                >
                  {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  {new Date(appointment.appointment_date).toLocaleDateString('en-IN', {
                    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
                  })}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="w-4 h-4 mr-2" />
                  {new Date(appointment.appointment_date).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>

              <div className="mb-4">
                <p className="text-xs text-gray-600 mb-1">Reason:</p>
                <p className="text-sm text-gray-800">{appointment.reason}</p>
              </div>

              {appointment.notes && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Doctor's Notes:</p>
                  <p className="text-sm text-gray-800">{appointment.notes}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {showBooking && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 z-50 pt-24"
          onClick={() => setShowBooking(false)}
        >
          <div
            className="glass-card p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Book Appointment</h3>

            <form onSubmit={bookAppointment} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Doctor
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name or specialization"
                    className="w-full pl-10 pr-4 py-3 rounded-xl glass-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Doctor
                </label>
                {filteredDoctors.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {filteredDoctors.map((doctor) => (
                      <label
                        key={doctor.id}
                        className={`flex items-center p-3 rounded-xl cursor-pointer transition-all ${formData.doctor_id === doctor.id
                          ? 'bg-blue-100 border-2 border-blue-400'
                          : 'bg-white/30 border-2 border-transparent hover:bg-white/50'
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
                        <div className="bg-blue-100 p-2 rounded-lg mr-3">
                          <Calendar className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">Dr. {doctor.full_name}</p>
                          <p className="text-xs text-gray-500">
                            {doctor.specialization}{doctor.hospital_name && ` • ${doctor.hospital_name}`}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 p-3">No doctors found</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={formData.appointment_date}
                    onChange={(e) =>
                      setFormData({ ...formData, appointment_date: e.target.value })
                    }
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full px-4 py-3 rounded-xl glass-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                  <input
                    type="time"
                    value={formData.appointment_time}
                    onChange={(e) =>
                      setFormData({ ...formData, appointment_time: e.target.value })
                    }
                    required
                    className="w-full px-4 py-3 rounded-xl glass-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Visit
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  required
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl glass-input resize-none"
                  placeholder="Describe your symptoms or reason for consultation"
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={!formData.doctor_id}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
                >
                  Book Appointment
                </button>
                <button
                  type="button"
                  onClick={() => setShowBooking(false)}
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
