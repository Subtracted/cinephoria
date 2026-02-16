import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';

// Pages
import Home from './pages/Home';
import Films from './pages/Films';
import FilmDetail from './pages/FilmDetail';
import Reservation from './pages/Reservation';
import Login from './pages/Login';
import Register from './pages/Register';
import Contact from './pages/Contact';
import ForgotPassword from './pages/ForgotPassword';
import ChangePassword from './pages/ChangePassword';
import UserSpace from './pages/UserSpace';
import EmployeeSpace from './pages/EmployeeSpace';
import AdminDashboard from './pages/AdminDashboard';

// Route protégée
const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-primary-400 text-xl">Chargement...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <Layout>
      <Routes>
        {/* Routes publiques */}
        <Route path="/" element={<Home />} />
        <Route path="/films" element={<Films />} />
        <Route path="/films/:id" element={<FilmDetail />} />
        <Route path="/reservation" element={<Reservation />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Routes protégées - Utilisateur */}
        <Route
          path="/mon-espace"
          element={
            <ProtectedRoute roles={['user', 'employee', 'admin']}>
              <UserSpace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/change-password"
          element={
            <ProtectedRoute roles={['user', 'employee', 'admin']}>
              <ChangePassword />
            </ProtectedRoute>
          }
        />

        {/* Routes protégées - Employé */}
        <Route
          path="/intranet"
          element={
            <ProtectedRoute roles={['employee', 'admin']}>
              <EmployeeSpace />
            </ProtectedRoute>
          }
        />

        {/* Routes protégées - Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route
          path="*"
          element={
            <div className="min-h-[60vh] flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-primary-400 mb-4">404</h1>
                <p className="text-gray-400 text-xl mb-6">Page non trouvée</p>
                <a href="/" className="btn-primary">Retour à l'accueil</a>
              </div>
            </div>
          }
        />
      </Routes>
    </Layout>
  );
}

export default App;
