import { useState, useEffect } from 'react';
import { filmAPI } from '../services/api';
import FilmCard from '../components/films/FilmCard';
import FilmFilter from '../components/films/FilmFilter';

const Films = () => {
  const [films, setFilms] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFilms = async (filters = {}) => {
    setLoading(true);
    try {
      const params = {};
      if (filters.cinema) params.cinema = filters.cinema;
      if (filters.genre) params.genre = filters.genre;
      if (filters.day) params.day = filters.day;

      const response = await filmAPI.getAll(params);
      setFilms(response.data);
    } catch (error) {
      console.error('Erreur chargement films:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFilms();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Tous les films</h1>
        <p className="text-gray-400 mt-1">Découvrez tous les films à l'affiche dans nos cinémas</p>
      </div>

      {/* Filtres */}
      <FilmFilter onFilterChange={loadFilms} />

      {/* Liste des films */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="aspect-[2/3] bg-dark-700 rounded-lg mb-4" />
              <div className="h-5 bg-dark-700 rounded mb-2" />
              <div className="h-4 bg-dark-700 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : films.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {films.map((film) => (
            <FilmCard key={film.id} film={film} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 card">
          <span className="text-6xl mb-4 block">🎬</span>
          <p className="text-gray-400 text-lg">Aucun film ne correspond à vos critères.</p>
        </div>
      )}
    </div>
  );
};

export default Films;
