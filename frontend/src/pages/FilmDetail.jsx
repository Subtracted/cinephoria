import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { filmAPI } from '../services/api';

const FilmDetail = () => {
  const { id } = useParams();
  const [film, setFilm] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFilm = async () => {
      try {
        const response = await filmAPI.getById(id);
        setFilm(response.data);
      } catch (error) {
        console.error('Erreur chargement film:', error);
      } finally {
        setLoading(false);
      }
    };
    loadFilm();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-dark-700 rounded w-1/3 mb-4" />
          <div className="h-64 bg-dark-700 rounded mb-4" />
        </div>
      </div>
    );
  }

  if (!film) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-400 text-xl">Film non trouvé</p>
        <Link to="/films" className="btn-primary mt-4 inline-block">Retour aux films</Link>
      </div>
    );
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long',
    });
  };

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString('fr-FR', {
      hour: '2-digit', minute: '2-digit',
    });
  };

  // Grouper les séances par cinéma puis par jour
  const groupedSessions = {};
  (film.sessions || []).forEach((session) => {
    const key = session.cinema_name;
    if (!groupedSessions[key]) groupedSessions[key] = [];
    groupedSessions[key].push(session);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* En-tête du film */}
      <div className="flex flex-col md:flex-row gap-8 mb-12">
        {/* Affiche */}
        <div className="w-full md:w-1/3 lg:w-1/4">
          <div className="aspect-[2/3] bg-dark-700 rounded-xl overflow-hidden">
            {film.poster_url ? (
              <img src={film.poster_url} alt={film.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-8xl">🎬</div>
            )}
          </div>
        </div>

        {/* Informations */}
        <div className="flex-1">
          <div className="flex items-start gap-3 mb-4">
            <h1 className="text-3xl md:text-4xl font-bold text-white">{film.title}</h1>
            {film.is_coup_de_coeur && (
              <span className="badge bg-red-500/20 text-red-400 mt-1">❤️ Coup de cœur</span>
            )}
          </div>

          <div className="flex flex-wrap gap-3 mb-4">
            <span className="badge-primary">{film.genre}</span>
            <span className="badge bg-dark-600 text-gray-300">{film.duration} min</span>
            {film.min_age > 0 && (
              <span className="badge-warning">Interdit aux moins de {film.min_age} ans</span>
            )}
          </div>

          <div className="flex items-center gap-2 mb-6">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((i) => (
                <span key={i} className={`text-xl ${i <= Math.round(film.rating) ? 'text-yellow-400' : 'text-gray-600'}`}>★</span>
              ))}
            </div>
            <span className="text-gray-400">
              {film.rating > 0 ? `${film.rating}/5 (${film.review_count} avis)` : 'Pas encore noté'}
            </span>
          </div>

          <p className="text-gray-300 leading-relaxed text-lg">{film.description}</p>
        </div>
      </div>

      {/* Séances disponibles */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-6">Séances disponibles</h2>

        {Object.keys(groupedSessions).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedSessions).map(([cinemaName, sessions]) => (
              <div key={cinemaName} className="card">
                <h3 className="text-xl font-semibold text-primary-400 mb-4">{cinemaName}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {sessions.map((session) => (
                    <Link
                      key={session.id}
                      to={`/reservation?cinema=${session.cinema_id}&film=${film.id}&session=${session.id}`}
                      className="flex items-center justify-between p-4 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors border border-dark-600 hover:border-primary-500/50"
                    >
                      <div>
                        <p className="text-white font-medium">{formatDate(session.start_time)}</p>
                        <p className="text-gray-400 text-sm">
                          {formatTime(session.start_time)} - {formatTime(session.end_time)}
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                          Salle {session.room_number} • {session.quality}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-primary-400 font-bold text-lg">{parseFloat(session.price).toFixed(2)}€</p>
                        <p className="text-gray-500 text-xs">{session.available_seats} places</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-8">
            <p className="text-gray-400">Aucune séance disponible pour ce film.</p>
          </div>
        )}
      </section>

      {/* Avis */}
      {film.reviews && film.reviews.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-white mb-6">Avis des spectateurs</h2>
          <div className="space-y-4">
            {film.reviews.map((review) => (
              <div key={review.id} className="card">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{review.first_name}</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <span key={i} className={`text-sm ${i <= review.rating ? 'text-yellow-400' : 'text-gray-600'}`}>★</span>
                      ))}
                    </div>
                  </div>
                  <span className="text-gray-500 text-sm">
                    {new Date(review.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                {review.description && (
                  <p className="text-gray-300">{review.description}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default FilmDetail;
