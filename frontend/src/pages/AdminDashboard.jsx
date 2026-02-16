import { useState, useEffect } from 'react';
import { adminAPI, cinemaAPI } from '../services/api';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // Formulaire employé
  const [employeeForm, setEmployeeForm] = useState({
    email: '', password: '', firstName: '', lastName: '', username: '', cinemaId: '',
  });

  // Reset password
  const [resetForm, setResetForm] = useState({ employeeId: '', newPassword: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [dashRes, empRes, cinRes] = await Promise.all([
        adminAPI.getDashboard(),
        adminAPI.getEmployees(),
        cinemaAPI.getAll(),
      ]);
      setDashboardData(dashRes.data);
      setEmployees(empRes.data);
      setCinemas(cinRes.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const createEmployee = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.createEmployee(employeeForm);
      setMessage('Compte employé créé avec succès');
      setEmployeeForm({ email: '', password: '', firstName: '', lastName: '', username: '', cinemaId: '' });
      loadData();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Erreur');
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.resetPassword(resetForm.employeeId, resetForm.newPassword);
      setMessage('Mot de passe réinitialisé');
      setResetForm({ employeeId: '', newPassword: '' });
    } catch (error) {
      setMessage(error.response?.data?.error || 'Erreur');
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'employees', label: 'Employés' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-2">Administration</h1>
      <p className="text-gray-400 mb-8">Tableau de bord et gestion des employés</p>

      {message && (
        <div className="bg-primary-500/10 border border-primary-500/50 text-primary-400 px-4 py-3 rounded-lg mb-6">
          {message}
          <button onClick={() => setMessage('')} className="ml-4">✕</button>
        </div>
      )}

      <div className="flex gap-2 mb-6 border-b border-dark-700 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
              activeTab === tab.id ? 'bg-primary-500/20 text-primary-400 border-b-2 border-primary-500' : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dashboard */}
      {activeTab === 'dashboard' && (
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">
            Réservations sur 7 jours
            {dashboardData?.warning && (
              <span className="text-yellow-400 text-sm ml-2">({dashboardData.warning})</span>
            )}
          </h2>

          {dashboardData?.reservationsByFilm?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Par film */}
              <div className="card">
                <h3 className="text-lg font-semibold text-white mb-4">Par film</h3>
                <div className="space-y-3">
                  {dashboardData.reservationsByFilm.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
                      <span className="text-white">{item._id}</span>
                      <div className="text-right">
                        <span className="text-primary-400 font-bold">{item.totalReservations}</span>
                        <span className="text-gray-500 text-sm ml-2">réservations</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Par jour */}
              <div className="card">
                <h3 className="text-lg font-semibold text-white mb-4">Par jour</h3>
                <div className="space-y-3">
                  {dashboardData.reservationsByDay.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
                      <span className="text-white">{item._id}</span>
                      <div className="text-right">
                        <span className="text-primary-400 font-bold">{item.totalReservations}</span>
                        <span className="text-gray-500 text-sm ml-2">
                          ({parseFloat(item.totalRevenue || 0).toFixed(2)}€)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="card text-center py-8">
              <p className="text-gray-400">Aucune donnée statistique disponible pour les 7 derniers jours.</p>
              <p className="text-gray-500 text-sm mt-2">Les statistiques proviennent de MongoDB et seront alimentées par les réservations.</p>
            </div>
          )}
        </div>
      )}

      {/* Employés */}
      {activeTab === 'employees' && (
        <div className="space-y-6">
          {/* Formulaire création */}
          <form onSubmit={createEmployee} className="card">
            <h3 className="text-lg font-semibold text-white mb-4">Créer un compte employé</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="Prénom *" value={employeeForm.firstName}
                onChange={(e) => setEmployeeForm({ ...employeeForm, firstName: e.target.value })}
                className="input-field" required />
              <input type="text" placeholder="Nom *" value={employeeForm.lastName}
                onChange={(e) => setEmployeeForm({ ...employeeForm, lastName: e.target.value })}
                className="input-field" required />
              <input type="text" placeholder="Nom d'utilisateur *" value={employeeForm.username}
                onChange={(e) => setEmployeeForm({ ...employeeForm, username: e.target.value })}
                className="input-field" required />
              <input type="email" placeholder="Email *" value={employeeForm.email}
                onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                className="input-field" required />
              <input type="password" placeholder="Mot de passe *" value={employeeForm.password}
                onChange={(e) => setEmployeeForm({ ...employeeForm, password: e.target.value })}
                className="input-field" required />
              <select value={employeeForm.cinemaId}
                onChange={(e) => setEmployeeForm({ ...employeeForm, cinemaId: e.target.value })}
                className="input-field" required>
                <option value="">Cinéma *</option>
                {cinemas.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.city})</option>)}
              </select>
            </div>
            <button type="submit" className="btn-primary mt-4">Créer le compte</button>
          </form>

          {/* Reset mot de passe */}
          <form onSubmit={resetPassword} className="card">
            <h3 className="text-lg font-semibold text-white mb-4">Réinitialiser un mot de passe</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select value={resetForm.employeeId}
                onChange={(e) => setResetForm({ ...resetForm, employeeId: e.target.value })}
                className="input-field" required>
                <option value="">Employé *</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} ({emp.email})</option>
                ))}
              </select>
              <input type="password" placeholder="Nouveau mot de passe *" value={resetForm.newPassword}
                onChange={(e) => setResetForm({ ...resetForm, newPassword: e.target.value })}
                className="input-field" required />
            </div>
            <button type="submit" className="btn-primary mt-4">Réinitialiser</button>
          </form>

          {/* Liste employés */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Liste des employés</h3>
            <div className="space-y-2">
              {employees.map((emp) => (
                <div key={emp.id} className="card flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{emp.first_name} {emp.last_name}</p>
                    <p className="text-gray-400 text-sm">{emp.email} • {emp.cinema_name} ({emp.city})</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
