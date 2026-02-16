import { useState, useEffect } from 'react';
import { filmAPI, sessionAPI, roomAPI, reviewAPI } from '../services/api';

const EmployeeSpace = () => {
  const [activeTab, setActiveTab] = useState('films');
  const [films, setFilms] = useState([]);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // Formulaire film
  const [filmForm, setFilmForm] = useState({
    title: '', description: '', genre: '', duration: '', minAge: 0,
    isCoupDeCoeur: false, posterUrl: '',
  });
  const [editingFilm, setEditingFilm] = useState(null);

  // Formulaire séance
  const [sessionForm, setSessionForm] = useState({
    filmId: '', roomId: '', startTime: '', endTime: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [filmsRes, reviewsRes, roomsRes] = await Promise.all([
        filmAPI.getAll(),
        reviewAPI.getPending(),
        roomAPI.getAll(),
      ]);
      setFilms(filmsRes.data);
      setPendingReviews(reviewsRes.data);
      setRooms(roomsRes.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  // Films CRUD
  const handleFilmSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingFilm) {
        await filmAPI.update(editingFilm.id, filmForm);
        setMessage('Film modifié');
      } else {
        await filmAPI.create(filmForm);
        setMessage('Film créé');
      }
      setEditingFilm(null);
      setFilmForm({ title: '', description: '', genre: '', duration: '', minAge: 0, isCoupDeCoeur: false, posterUrl: '' });
      loadData();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Erreur');
    }
  };

  const deleteFilm = async (id) => {
    if (!confirm('Supprimer ce film ?')) return;
    try {
      await filmAPI.delete(id);
      loadData();
      setMessage('Film supprimé');
    } catch (error) {
      setMessage(error.response?.data?.error || 'Erreur');
    }
  };

  const editFilm = (film) => {
    setEditingFilm(film);
    setFilmForm({
      title: film.title, description: film.description || '', genre: film.genre,
      duration: film.duration, minAge: film.min_age, isCoupDeCoeur: film.is_coup_de_coeur,
      posterUrl: film.poster_url || '',
    });
    setActiveTab('films');
  };

  // Séances
  const handleSessionSubmit = async (e) => {
    e.preventDefault();
    try {
      await sessionAPI.create(sessionForm);
      setMessage('Séance créée');
      setSessionForm({ filmId: '', roomId: '', startTime: '', endTime: '' });
    } catch (error) {
      setMessage(error.response?.data?.error || 'Erreur');
    }
  };

  // Avis
  const moderateReview = async (id, status) => {
    try {
      await reviewAPI.moderate(id, status);
      loadData();
      setMessage(`Avis ${status === 'approved' ? 'approuvé' : 'rejeté'}`);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Erreur');
    }
  };

  const tabs = [
    { id: 'films', label: 'Films' },
    { id: 'sessions', label: 'Séances' },
    { id: 'reviews', label: `Avis (${pendingReviews.length})` },
    { id: 'rooms', label: 'Salles' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-2">Intranet Employé</h1>
      <p className="text-gray-400 mb-8">Gestion des films, séances et avis</p>

      {message && (
        <div className="bg-primary-500/10 border border-primary-500/50 text-primary-400 px-4 py-3 rounded-lg mb-6">
          {message}
          <button onClick={() => setMessage('')} className="ml-4">✕</button>
        </div>
      )}

      {/* Onglets */}
      <div className="flex gap-2 mb-6 border-b border-dark-700 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
              activeTab === tab.id ? 'bg-primary-500/20 text-primary-400 border-b-2 border-primary-500' : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Onglet Films */}
      {activeTab === 'films' && (
        <div>
          <form onSubmit={handleFilmSubmit} className="card mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              {editingFilm ? 'Modifier le film' : 'Ajouter un film'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="Titre *" value={filmForm.title}
                onChange={(e) => setFilmForm({ ...filmForm, title: e.target.value })}
                className="input-field" required />
              <input type="text" placeholder="Genre *" value={filmForm.genre}
                onChange={(e) => setFilmForm({ ...filmForm, genre: e.target.value })}
                className="input-field" required />
              <input type="number" placeholder="Durée (min) *" value={filmForm.duration}
                onChange={(e) => setFilmForm({ ...filmForm, duration: e.target.value })}
                className="input-field" required />
              <input type="number" placeholder="Âge minimum" value={filmForm.minAge}
                onChange={(e) => setFilmForm({ ...filmForm, minAge: parseInt(e.target.value) })}
                className="input-field" />
              <input type="text" placeholder="URL de l'affiche" value={filmForm.posterUrl}
                onChange={(e) => setFilmForm({ ...filmForm, posterUrl: e.target.value })}
                className="input-field" />
              <label className="flex items-center gap-2 text-gray-300">
                <input type="checkbox" checked={filmForm.isCoupDeCoeur}
                  onChange={(e) => setFilmForm({ ...filmForm, isCoupDeCoeur: e.target.checked })}
                  className="w-4 h-4" />
                Coup de cœur
              </label>
            </div>
            <textarea placeholder="Description" value={filmForm.description}
              onChange={(e) => setFilmForm({ ...filmForm, description: e.target.value })}
              className="input-field mt-4 min-h-[80px]" />
            <div className="flex gap-2 mt-4">
              <button type="submit" className="btn-primary">
                {editingFilm ? 'Modifier' : 'Ajouter'}
              </button>
              {editingFilm && (
                <button type="button" onClick={() => { setEditingFilm(null); setFilmForm({ title: '', description: '', genre: '', duration: '', minAge: 0, isCoupDeCoeur: false, posterUrl: '' }); }} className="btn-secondary">
                  Annuler
                </button>
              )}
            </div>
          </form>

          <div className="space-y-2">
            {films.map((film) => (
              <div key={film.id} className="card flex items-center justify-between">
                <div>
                  <h4 className="text-white font-medium">{film.title}</h4>
                  <p className="text-gray-400 text-sm">{film.genre} • {film.duration} min</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => editFilm(film)} className="btn-secondary text-xs py-1 px-3">Modifier</button>
                  <button onClick={() => deleteFilm(film.id)} className="btn-danger text-xs py-1 px-3">Supprimer</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Onglet Séances */}
      {activeTab === 'sessions' && (
        <form onSubmit={handleSessionSubmit} className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Créer une séance</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select value={sessionForm.filmId} onChange={(e) => setSessionForm({ ...sessionForm, filmId: e.target.value })}
              className="input-field" required>
              <option value="">Film *</option>
              {films.map((f) => <option key={f.id} value={f.id}>{f.title}</option>)}
            </select>
            <select value={sessionForm.roomId} onChange={(e) => setSessionForm({ ...sessionForm, roomId: e.target.value })}
              className="input-field" required>
              <option value="">Salle *</option>
              {rooms.map((r) => <option key={r.id} value={r.id}>Salle {r.room_number} - {r.cinema_name} ({r.quality})</option>)}
            </select>
            <div>
              <label className="text-gray-400 text-sm">Début *</label>
              <input type="datetime-local" value={sessionForm.startTime}
                onChange={(e) => setSessionForm({ ...sessionForm, startTime: e.target.value })}
                className="input-field" required />
            </div>
            <div>
              <label className="text-gray-400 text-sm">Fin *</label>
              <input type="datetime-local" value={sessionForm.endTime}
                onChange={(e) => setSessionForm({ ...sessionForm, endTime: e.target.value })}
                className="input-field" required />
            </div>
          </div>
          <button type="submit" className="btn-primary mt-4">Créer la séance</button>
        </form>
      )}

      {/* Onglet Avis */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          {pendingReviews.length > 0 ? pendingReviews.map((review) => (
            <div key={review.id} className="card">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white font-medium">{review.film_title}</p>
                  <p className="text-gray-400 text-sm">Par {review.first_name} {review.last_name}</p>
                  <div className="flex mt-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <span key={i} className={i <= review.rating ? 'text-yellow-400' : 'text-gray-600'}>★</span>
                    ))}
                  </div>
                  {review.description && <p className="text-gray-300 mt-2">{review.description}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => moderateReview(review.id, 'approved')} className="btn-primary text-xs py-1 px-3">Approuver</button>
                  <button onClick={() => moderateReview(review.id, 'rejected')} className="btn-danger text-xs py-1 px-3">Rejeter</button>
                </div>
              </div>
            </div>
          )) : (
            <div className="card text-center py-8">
              <p className="text-gray-400">Aucun avis en attente de validation.</p>
            </div>
          )}
        </div>
      )}

      {/* Onglet Salles */}
      {activeTab === 'rooms' && (
        <div className="space-y-2">
          {rooms.map((room) => (
            <div key={room.id} className="card flex items-center justify-between">
              <div>
                <h4 className="text-white font-medium">Salle {room.room_number} - {room.cinema_name}</h4>
                <p className="text-gray-400 text-sm">{room.quality} • {room.capacity} places • {parseFloat(room.price).toFixed(2)}€</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmployeeSpace;
