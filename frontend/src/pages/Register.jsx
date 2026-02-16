import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    username: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Vérification mot de passe
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    // Validation mot de passe
    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#+\-_])[A-Za-z\d@$!%*?&#+\-_]{8,}$/;
    if (!pwdRegex.test(formData.password)) {
      setError('Le mot de passe doit contenir au minimum 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial');
      return;
    }

    setLoading(true);

    try {
      await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
      });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="card">
          <div className="text-center mb-8">
            <span className="text-4xl">🎬</span>
            <h1 className="text-2xl font-bold text-white mt-2">Créer un compte</h1>
            <p className="text-gray-400 mt-1">Rejoignez la communauté Cinéphoria</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Prénom</label>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange}
                  className="input-field" placeholder="Jean" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Nom</label>
                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange}
                  className="input-field" placeholder="Dupont" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Nom d'utilisateur</label>
              <input type="text" name="username" value={formData.username} onChange={handleChange}
                className="input-field" placeholder="jdupont" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange}
                className="input-field" placeholder="jean@email.fr" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Mot de passe</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange}
                className="input-field" placeholder="Min. 8 car., 1 maj., 1 chiffre, 1 spécial" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Confirmer le mot de passe</label>
              <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                className="input-field" placeholder="Confirmer votre mot de passe" required />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Inscription...' : 'Créer mon compte'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Déjà un compte ?{' '}
              <Link to="/login" className="text-primary-400 font-medium">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
