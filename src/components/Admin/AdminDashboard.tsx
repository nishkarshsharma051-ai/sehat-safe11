import { useState, useEffect } from 'react';
import { Users, FileText, Calendar, Activity, Download, Eye } from 'lucide-react';
import Navbar from '../Layout/Navbar';
import { UserProfile, Appointment, Prescription } from '../../types';
import { userService, appointmentService, prescriptionService } from '../../services/dataService';

export default function AdminDashboard() {
  const [currentView, setCurrentView] = useState('overview');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [_loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [fetchedUsers, fetchedAppointments, fetchedPrescriptions] = await Promise.all([
        userService.getAll(),
        appointmentService.getAll(),
        prescriptionService.getAllGlobal()
      ]);

      setUsers(fetchedUsers);
      setAppointments(fetchedAppointments);
      setPrescriptions(fetchedPrescriptions);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPatientName = (id: string) => {
    const user = users.find(u => u.id === id);
    return user ? user.full_name : 'Unknown Patient';
  };

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'prescriptions', label: 'Prescriptions', icon: FileText },
  ];

  const stats = {
    totalUsers: users.length,
    patients: users.filter((u) => u.role === 'patient').length,
    doctors: users.filter((u) => u.role === 'doctor').length,
    totalAppointments: appointments.length,
    totalPrescriptions: prescriptions.length,
    pendingAppointments: appointments.filter((a) => a.status === 'pending').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Navbar currentView={currentView} onViewChange={setCurrentView} />

      <div className="flex">
        <aside className="w-64 min-h-screen glass-sidebar p-6 hidden md:block">
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${currentView === item.id
                    ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-white/50'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 p-8 overflow-x-hidden">
          {currentView === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-800">Admin Dashboard</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="glass-card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Total Users</p>
                      <p className="text-3xl font-bold text-gray-800 mt-2">{stats.totalUsers}</p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-xl">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="glass-card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Patients</p>
                      <p className="text-3xl font-bold text-gray-800 mt-2">{stats.patients}</p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-xl">
                      <Users className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="glass-card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Doctors</p>
                      <p className="text-3xl font-bold text-gray-800 mt-2">{stats.doctors}</p>
                    </div>
                    <div className="bg-purple-100 p-3 rounded-xl">
                      <Users className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </div>

                <div className="glass-card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Total Appointments</p>
                      <p className="text-3xl font-bold text-gray-800 mt-2">
                        {stats.totalAppointments}
                      </p>
                    </div>
                    <div className="bg-yellow-100 p-3 rounded-xl">
                      <Calendar className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                </div>

                <div className="glass-card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Pending Appointments</p>
                      <p className="text-3xl font-bold text-gray-800 mt-2">
                        {stats.pendingAppointments}
                      </p>
                    </div>
                    <div className="bg-orange-100 p-3 rounded-xl">
                      <Calendar className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                </div>

                <div className="glass-card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Total Prescriptions</p>
                      <p className="text-3xl font-bold text-gray-800 mt-2">
                        {stats.totalPrescriptions}
                      </p>
                    </div>
                    <div className="bg-red-100 p-3 rounded-xl">
                      <FileText className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentView === 'users' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-800">User Management</h2>

              <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                          Name
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                          Role
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                          Phone
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                          Specialization
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                          Joined
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-white/30 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-800 font-medium">
                            {user.full_name}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${user.role === 'admin' // Fixed quote escaping
                                ? 'bg-red-100 text-red-700'
                                : user.role === 'doctor' // Fixed quote escaping
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-green-100 text-green-700'
                                }`}
                            >
                              {user.role.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {user.phone || '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {user.specialization || '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                          </td>
                        </tr>
                      ))}
                      {users.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                            No users found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {currentView === 'appointments' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-800">All Appointments</h2>

              <div className="space-y-4">
                {appointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="glass-card p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-gray-800">
                          Patient: {apt.patient?.full_name || getPatientName(apt.patient_id)}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Doctor: Dr. {apt.doctor?.full_name}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${apt.status === 'confirmed'
                          ? 'bg-green-100 text-green-700'
                          : apt.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : apt.status === 'completed'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                      >
                        {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Date & Time:</p>
                        <p className="text-gray-800 font-medium">
                          {new Date(apt.appointment_date).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Reason:</p>
                        <p className="text-gray-800">{apt.reason}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {appointments.length === 0 && (
                  <div className="glass-card p-8 text-center text-gray-500">
                    No appointments found.
                  </div>
                )}
              </div>
            </div>
          )}

          {currentView === 'prescriptions' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-gray-800">Prescription Records</h2>
                <div className="flex space-x-2">
                  {/* Placeholder for future export/filter actions */}
                </div>
              </div>

              <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Date</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Patient</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Doctor</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Diagnosis</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Medicines</th>
                        <th className="px-6 py-4 text-right text-sm font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {prescriptions.map((p) => {
                        const patientName = getPatientName(p.patient_id);
                        return (
                          <tr key={p.id} className="hover:bg-white/30 transition-colors">
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {new Date(p.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                                  <span className="text-xs font-bold">
                                    {patientName.charAt(0)}
                                  </span>
                                </div>
                                <span className="text-sm font-medium text-gray-800">
                                  {patientName}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {p.doctor_name || 'Uploaded Record'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-800">
                              {p.diagnosis || <span className="text-gray-400 italic">No diagnosis</span>}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {p.medicines?.length || 0} meds
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <a
                                  href={p.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="View Prescription"
                                >
                                  <Eye className="w-4 h-4" />
                                </a>
                                <a
                                  href={p.file_url}
                                  download
                                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                  title="Download"
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      {prescriptions.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                            <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                            <p>No prescription records found.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
