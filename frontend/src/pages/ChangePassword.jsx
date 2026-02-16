import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const ChangePassword = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#+\-_])[A-Za-z\d@$!%*?&#+\-_]{8,}$/;
    if (!pwdRegex.test(formData.newPassword)) {
      setError('Le mot de passe doit contenir au minimum 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial');
      return;
    }

    setLoading(true);
    try {
      await authAPI.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors du changement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="card">
          <div className="text-center mb-8">
            <span className="text-4xl">🔐</span>
            <h1 className="text-2xl font-bold text-white mt-2">Changer le mot de passe</h1>
            <p className="text-gray-400 mt-1">Vous devez modifier votre mot de passe</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Mot de passe actuel</label>
              <input type="password" name="currentPassword" value={formData.currentPassword}
                onChange={handleChange} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Nouveau mot de passe</label>
              <input type="password" name="newPassword" value={formData.newPassword}
                onChange={handleChange} className="input-field"
                placeholder="Min. 8 car., 1 maj., 1 chiffre, 1 spécial" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Confirmer</label>
              <input type="password" name="confirmPassword" value={formData.confirmPassword}
                onChange={handleChange} className="input-field" required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Modification...' : 'Modifier le mot de passe'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
