import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, isEmployee, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-dark-800 border-b border-dark-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl">🎬</span>
            <span className="text-xl font-bold text-primary-400">Cinéphoria</span>
          </Link>

          {/* Navigation desktop */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-gray-300 hover:text-primary-400 transition-colors font-medium">
              Accueil
            </Link>
            <Link to="/films" className="text-gray-300 hover:text-primary-400 transition-colors font-medium">
              Films
            </Link>
            <Link to="/reservation" className="text-gray-300 hover:text-primary-400 transition-colors font-medium">
              Réservation
            </Link>
            <Link to="/contact" className="text-gray-300 hover:text-primary-400 transition-colors font-medium">
              Contact
            </Link>

            {isAuthenticated && (
              <Link to="/mon-espace" className="text-gray-300 hover:text-primary-400 transition-colors font-medium">
                Mon espace
              </Link>
            )}

            {isEmployee && (
              <Link to="/intranet" className="text-gray-300 hover:text-primary-400 transition-colors font-medium">
                Intranet
              </Link>
            )}

            {isAdmin && (
              <Link to="/admin" className="text-gray-300 hover:text-primary-400 transition-colors font-medium">
                Administration
              </Link>
            )}
          </div>

          {/* Boutons auth desktop */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-400">
                  {user.firstName} {user.lastName}
                </span>
                <button onClick={handleLogout} className="btn-secondary text-sm py-1.5 px-4">
                  Déconnexion
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn-primary text-sm py-1.5 px-4">
                Se connecter
              </Link>
            )}
          </div>

          {/* Menu burger mobile */}
          <button
            className="md:hidden text-gray-300 hover:text-primary-400"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Menu mobile */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link to="/" className="block py-2 text-gray-300 hover:text-primary-400" onClick={() => setMobileMenuOpen(false)}>Accueil</Link>
            <Link to="/films" className="block py-2 text-gray-300 hover:text-primary-400" onClick={() => setMobileMenuOpen(false)}>Films</Link>
            <Link to="/reservation" className="block py-2 text-gray-300 hover:text-primary-400" onClick={() => setMobileMenuOpen(false)}>Réservation</Link>
            <Link to="/contact" className="block py-2 text-gray-300 hover:text-primary-400" onClick={() => setMobileMenuOpen(false)}>Contact</Link>
            {isAuthenticated && <Link to="/mon-espace" className="block py-2 text-gray-300 hover:text-primary-400" onClick={() => setMobileMenuOpen(false)}>Mon espace</Link>}
            {isEmployee && <Link to="/intranet" className="block py-2 text-gray-300 hover:text-primary-400" onClick={() => setMobileMenuOpen(false)}>Intranet</Link>}
            {isAdmin && <Link to="/admin" className="block py-2 text-gray-300 hover:text-primary-400" onClick={() => setMobileMenuOpen(false)}>Administration</Link>}
            <div className="pt-2 border-t border-dark-700">
              {isAuthenticated ? (
                <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="btn-secondary w-full text-sm">Déconnexion</button>
              ) : (
                <Link to="/login" className="btn-primary block text-center text-sm" onClick={() => setMobileMenuOpen(false)}>Se connecter</Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
