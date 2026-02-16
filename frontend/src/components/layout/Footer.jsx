import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-dark-950 border-t border-dark-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Informations */}
          <div>
            <h3 className="text-lg font-bold text-primary-400 mb-4">🎬 Cinéphoria</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Cinéphoria est un cinéma responsable qui reverse 20% de son chiffre d'affaires
              pour soutenir des initiatives écologiques.
            </p>
            <p className="text-primary-500 text-sm mt-2 font-medium">
              🌿 20% de notre CA pour la planète
            </p>
          </div>

          {/* Adresse et contact */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Contact</h4>
            <div className="space-y-2 text-gray-400 text-sm">
              <p>📍 88 Boulevard Haussmann, 75008 Paris</p>
              <p>📞 +33 1 42 00 00 03</p>
              <p>✉️ contact@cinephoria.fr</p>
            </div>
          </div>

          {/* Horaires */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Horaires</h4>
            <div className="space-y-2 text-gray-400 text-sm">
              <p>🕐 Lundi - Vendredi : 10h00 - 23h00</p>
              <p>🕐 Samedi - Dimanche : 09h00 - 00h00</p>
            </div>
            <div className="mt-4">
              <h5 className="text-sm font-semibold text-white mb-2">Nos cinémas</h5>
              <p className="text-gray-400 text-xs">
                Nantes • Bordeaux • Paris • Toulouse • Lille • Charleroi • Liège
              </p>
            </div>
          </div>
        </div>

        {/* Navigation bas */}
        <div className="border-t border-dark-700 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm">
            © 2026 Cinéphoria. Tous droits réservés.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link to="/films" className="text-gray-400 hover:text-primary-400 text-sm">Films</Link>
            <Link to="/reservation" className="text-gray-400 hover:text-primary-400 text-sm">Réservation</Link>
            <Link to="/contact" className="text-gray-400 hover:text-primary-400 text-sm">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
