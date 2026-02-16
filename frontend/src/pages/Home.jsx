import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { filmAPI } from '../services/api';
import FilmCard from '../components/films/FilmCard';

const Home = () => {
  const [latestFilms, setLatestFilms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFilms = async () => {
      try {
        const response = await filmAPI.getLatest();
        setLatestFilms(response.data);
      } catch (error) {
        console.error('Erreur chargement films:', error);
      } finally {
        setLoading(false);
      }
    };
    loadFilms();
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Bienvenue chez{' '}
            <span className="text-primary-400">Cinéphoria</span>
          </h1>
          <p className="text-xl text-gray-400 mb-4 max-w-2xl mx-auto">
            Votre cinéma responsable en France et en Belgique.
            Vivez des expériences cinématographiques uniques.
          </p>
          <p className="text-primary-500 font-medium mb-8">
            🌿 20% de notre chiffre d'affaires reversé pour la planète
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/reservation" className="btn-primary text-lg py-3 px-8">
              Réserver une séance
            </Link>
            <Link to="/films" className="btn-secondary text-lg py-3 px-8">
              Voir tous les films
            </Link>
          </div>
        </div>
      </section>

      {/* Films de la semaine */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white">Films de la semaine</h2>
            <p className="text-gray-400 mt-1">Les dernières nouveautés à l'affiche</p>
          </div>
          <Link to="/films" className="btn-secondary">
            Voir tout →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="aspect-[2/3] bg-dark-700 rounded-lg mb-4" />
                <div className="h-5 bg-dark-700 rounded mb-2" />
                <div className="h-4 bg-dark-700 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : latestFilms.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {latestFilms.map((film) => (
              <FilmCard key={film.id} film={film} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 card">
            <p className="text-gray-400 text-lg">Aucun nouveau film cette semaine.</p>
            <Link to="/films" className="text-primary-400 mt-2 inline-block">
              Parcourir tous les films →
            </Link>
          </div>
        )}
      </section>

      {/* Nos cinémas */}
      <section className="bg-dark-800 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Nos 7 cinémas</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {['Nantes', 'Bordeaux', 'Paris', 'Toulouse', 'Lille', 'Charleroi', 'Liège'].map((city) => (
              <div key={city} className="text-center p-4 rounded-xl bg-dark-700/50 hover:bg-dark-700 transition-colors">
                <span className="text-3xl mb-2 block">🏛️</span>
                <p className="text-white font-medium">{city}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Qualités */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-12">Nos qualités de projection</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { name: 'Standard', price: '9,50€', icon: '🎥' },
            { name: '3D', price: '13,00€', icon: '🥽' },
            { name: '4K', price: '14,50€', icon: '✨' },
            { name: 'IMAX', price: '16,00€', icon: '🖥️' },
            { name: '4DX', price: '18,00€', icon: '🎢' },
          ].map((q) => (
            <div key={q.name} className="card text-center hover:border-primary-500/50">
              <span className="text-4xl mb-3 block">{q.icon}</span>
              <h3 className="text-lg font-bold text-white">{q.name}</h3>
              <p className="text-primary-400 font-semibold text-xl mt-1">{q.price}</p>
              <p className="text-gray-500 text-sm mt-1">par personne</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
