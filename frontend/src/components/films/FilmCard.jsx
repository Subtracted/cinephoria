import { Link } from 'react-router-dom';

const StarRating = ({ rating }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <span key={i} className={i <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-600'}>
        ★
      </span>
    );
  }
  return <div className="flex items-center space-x-0.5">{stars}</div>;
};

const FilmCard = ({ film }) => {
  return (
    <Link to={`/films/${film.id}`} className="group">
      <div className="card hover:border-primary-500/50 transition-all duration-300 overflow-hidden">
        {/* Affiche */}
        <div className="relative aspect-[2/3] bg-dark-700 rounded-lg overflow-hidden mb-4">
          {film.poster_url ? (
            <img
              src={film.poster_url}
              alt={film.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">🎬</div>
          )}

          {/* Badge coup de coeur */}
          {film.is_coup_de_coeur && (
            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              ❤️ Coup de cœur
            </div>
          )}

          {/* Badge âge */}
          {film.min_age > 0 && (
            <div className="absolute bottom-2 left-2 bg-dark-900/80 text-white text-xs font-bold px-2 py-1 rounded">
              {film.min_age}+
            </div>
          )}
        </div>

        {/* Infos */}
        <h3 className="text-lg font-bold text-white group-hover:text-primary-400 transition-colors mb-1 truncate">
          {film.title}
        </h3>

        <div className="flex items-center justify-between mb-2">
          <span className="badge-primary text-xs">{film.genre}</span>
          <span className="text-gray-400 text-sm">{film.duration} min</span>
        </div>

        <p className="text-gray-400 text-sm line-clamp-2 mb-3">{film.description}</p>

        <div className="flex items-center justify-between">
          <StarRating rating={parseFloat(film.rating) || 0} />
          <span className="text-sm text-gray-500">
            {film.rating > 0 ? `${film.rating}/5` : 'Pas encore noté'}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default FilmCard;
