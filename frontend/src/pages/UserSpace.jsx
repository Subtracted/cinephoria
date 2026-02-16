import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { reservationAPI, reviewAPI } from '../services/api';

const UserSpace = () => {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewData, setReviewData] = useState({ rating: 5, description: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
    try {
      const response = await reservationAPI.getMine();
      setReservations(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const isPast = (dateStr) => new Date(dateStr) < new Date();

  const submitReview = async () => {
    try {
      await reviewAPI.create({
        filmId: reviewModal.film_id,
        reservationId: reviewModal.id,
        rating: reviewData.rating,
        description: reviewData.description,
      });
      setMessage('Avis soumis avec succès ! Il sera visible après validation.');
      setReviewModal(null);
      setReviewData({ rating: 5, description: '' });
    } catch (error) {
      setMessage(error.response?.data?.error || 'Erreur');
    }
  };

  const cancelReservation = async (id) => {
    if (!confirm('Annuler cette réservation ?')) return;
    try {
      await reservationAPI.cancel(id);
      loadReservations();
      setMessage('Réservation annulée');
    } catch (error) {
      setMessage(error.response?.data?.error || 'Erreur');
    }
  };

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const formatTime = (dateStr) => new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Mon espace</h1>
          <p className="text-gray-400 mt-1">Bienvenue, {user?.firstName} {user?.lastName}</p>
        </div>
      </div>

      {message && (
        <div className="bg-primary-500/10 border border-primary-500/50 text-primary-400 px-4 py-3 rounded-lg mb-6">
          {message}
          <button onClick={() => setMessage('')} className="ml-4 text-primary-300">✕</button>
        </div>
      )}

      <h2 className="text-xl font-semibold text-white mb-4">Mes réservations</h2>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-6 bg-dark-700 rounded w-1/3 mb-2" />
              <div className="h-4 bg-dark-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : reservations.length > 0 ? (
        <div className="space-y-4">
          {reservations.map((res) => (
            <div key={res.id} className="card">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-white">{res.film_title}</h3>
                    <span className={`badge text-xs ${
                      res.status === 'confirmed' ? 'bg-primary-500/20 text-primary-400' :
                      res.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {res.status === 'confirmed' ? 'Confirmée' :
                       res.status === 'cancelled' ? 'Annulée' :
                       res.status === 'used' ? 'Utilisée' : res.status}
                    </span>
                  </div>
                  <p className="text-gray-400">{res.cinema_name} ({res.city})</p>
                  <p className="text-gray-400 text-sm">
                    {formatDate(res.start_time)} • {formatTime(res.start_time)} - {formatTime(res.end_time)}
                  </p>
                  <p className="text-gray-500 text-sm">
                    Salle {res.room_number} • {res.quality} •
                    Places : {res.seats.map((s) => `${s.seatRow}${s.seatNumber}`).join(', ')}
                  </p>
                </div>

                <div className="text-right space-y-2">
                  <p className="text-primary-400 font-bold text-xl">{parseFloat(res.total_price).toFixed(2)}€</p>
                  <p className="text-gray-500 text-sm">{res.num_seats} place{res.num_seats > 1 ? 's' : ''}</p>

                  <div className="flex gap-2 justify-end">
                    {res.status === 'confirmed' && !isPast(res.start_time) && (
                      <button onClick={() => cancelReservation(res.id)} className="btn-danger text-xs py-1 px-3">
                        Annuler
                      </button>
                    )}
                    {res.status === 'confirmed' && isPast(res.end_time) && (
                      <button onClick={() => setReviewModal(res)} className="btn-primary text-xs py-1 px-3">
                        Donner un avis
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <span className="text-6xl mb-4 block">🎟️</span>
          <p className="text-gray-400">Vous n'avez aucune réservation pour le moment.</p>
        </div>
      )}

      {/* Modal de notation */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">Noter : {reviewModal.film_title}</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">Note</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    onClick={() => setReviewData({ ...reviewData, rating: i })}
                    className={`text-3xl ${i <= reviewData.rating ? 'text-yellow-400' : 'text-gray-600'}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-1">Commentaire</label>
              <textarea
                value={reviewData.description}
                onChange={(e) => setReviewData({ ...reviewData, description: e.target.value })}
                className="input-field min-h-[100px]"
                placeholder="Votre avis sur le film..."
              />
            </div>

            <div className="flex gap-3">
              <button onClick={submitReview} className="btn-primary flex-1">Soumettre</button>
              <button onClick={() => setReviewModal(null)} className="btn-secondary flex-1">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSpace;
