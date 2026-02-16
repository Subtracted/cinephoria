import { useState, useEffect } from 'react';
import { cinemaAPI, filmAPI } from '../../services/api';

const FilmFilter = ({ onFilterChange }) => {
  const [cinemas, setCinemas] = useState([]);
  const [genres, setGenres] = useState([]);
  const [filters, setFilters] = useState({
    cinema: '',
    genre: '',
    day: '',
  });

  useEffect(() => {
    const loadFilterData = async () => {
      try {
        const [cinemasRes, genresRes] = await Promise.all([
          cinemaAPI.getAll(),
          filmAPI.getGenres(),
        ]);
        setCinemas(cinemasRes.data);
        setGenres(genresRes.data);
      } catch (error) {
        console.error('Erreur chargement filtres:', error);
      }
    };
    loadFilterData();
  }, []);

  const handleChange = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const resetFilters = () => {
    const reset = { cinema: '', genre: '', day: '' };
    setFilters(reset);
    onFilterChange(reset);
  };

  return (
    <div className="card mb-8">
      <div className="flex flex-wrap items-end gap-4">
        {/* Filtre cinéma */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-400 mb-1">Cinéma</label>
          <select
            value={filters.cinema}
            onChange={(e) => handleChange('cinema', e.target.value)}
            className="input-field"
          >
            <option value="">Tous les cinémas</option>
            {cinemas.map((cinema) => (
              <option key={cinema.id} value={cinema.id}>
                {cinema.name} ({cinema.city})
              </option>
            ))}
          </select>
        </div>

        {/* Filtre genre */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-400 mb-1">Genre</label>
          <select
            value={filters.genre}
            onChange={(e) => handleChange('genre', e.target.value)}
            className="input-field"
          >
            <option value="">Tous les genres</option>
            {genres.map((genre) => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>
        </div>

        {/* Filtre jour */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-400 mb-1">Jour</label>
          <input
            type="date"
            value={filters.day}
            onChange={(e) => handleChange('day', e.target.value)}
            className="input-field"
          />
        </div>

        {/* Reset */}
        <button onClick={resetFilters} className="btn-secondary py-3">
          Réinitialiser
        </button>
      </div>
    </div>
  );
};

export default FilmFilter;
