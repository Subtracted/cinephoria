import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cinemaAPI, sessionAPI, reservationAPI } from '../services/api';

const Reservation = () => {
  const { isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [cinemas, setCinemas] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionDetail, setSessionDetail] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [step, setStep] = useState(1); // 1: choix cinéma/film, 2: choix séance, 3: choix sièges, 4: confirmation

  const [selectedCinema, setSelectedCinema] = useState(searchParams.get('cinema') || '');
  const [selectedFilm, setSelectedFilm] = useState(searchParams.get('film') || '');
  const [films, setFilms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Charger les cinémas
  useEffect(() => {
    const loadCinemas = async () => {
      try {
        const response = await cinemaAPI.getAll();
        setCinemas(response.data);
      } catch (err) {
        console.error('Erreur chargement cinémas:', err);
      }
    };
    loadCinemas();
  }, []);

  // Charger les séances quand cinéma et/ou film changent
  useEffect(() => {
    if (selectedCinema) {
      loadSessions();
    }
  }, [selectedCinema, selectedFilm]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedCinema) params.cinema = selectedCinema;
      if (selectedFilm) params.film = selectedFilm;

      const response = await sessionAPI.getAll(params);
      setSessions(response.data);

      // Extraire les films uniques
      const uniqueFilms = [];
      const seen = new Set();
      response.data.forEach((s) => {
        if (!seen.has(s.film_id)) {
          seen.add(s.film_id);
          uniqueFilms.push({ id: s.film_id, title: s.film_title });
        }
      });
      setFilms(uniqueFilms);
    } catch (err) {
      console.error('Erreur chargement séances:', err);
    } finally {
      setLoading(false);
    }
  };

  // Charger le détail d'une séance (sièges)
  const selectSession = async (session) => {
    setSelectedSession(session);
    try {
      const response = await sessionAPI.getById(session.id);
      setSessionDetail(response.data);
      setSelectedSeats([]);
      setStep(3);
    } catch (err) {
      console.error('Erreur chargement séance:', err);
    }
  };

  // Toggle sélection siège
  const toggleSeat = (seat) => {
    if (!seat.is_free || !seat.is_available) return;
    setSelectedSeats((prev) =>
      prev.find((s) => s.id === seat.id)
        ? prev.filter((s) => s.id !== seat.id)
        : [...prev, seat]
    );
  };

  // Confirmer la réservation
  const confirmReservation = async () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/reservation');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await reservationAPI.create({
        sessionId: selectedSession.id,
        seatIds: selectedSeats.map((s) => s.id),
      });
      setSuccess('Réservation confirmée ! Vous pouvez la retrouver dans votre espace.');
      setStep(4);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la réservation');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const formatTime = (dateStr) => new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const totalPrice = selectedSession
    ? (parseFloat(selectedSession.price) * selectedSeats.length).toFixed(2)
    : '0.00';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-2">Réservation</h1>
      <p className="text-gray-400 mb-8">Réservez vos places en quelques clics</p>

      {/* Indicateur d'étapes */}
      <div className="flex items-center mb-8 gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= s ? 'bg-primary-500 text-white' : 'bg-dark-700 text-gray-500'}`}>
              {s}
            </div>
            {s < 4 && <div className={`w-12 h-0.5 ${step > s ? 'bg-primary-500' : 'bg-dark-700'}`} />}
          </div>
        ))}
        <div className="ml-4 text-gray-400 text-sm">
          {step === 1 && 'Choisir un cinéma et un film'}
          {step === 2 && 'Choisir une séance'}
          {step === 3 && 'Choisir vos sièges'}
          {step === 4 && 'Confirmation'}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-primary-500/10 border border-primary-500/50 text-primary-400 px-4 py-3 rounded-lg mb-6">
          {success}
        </div>
      )}

      {/* Étape 1 : Choix cinéma et film */}
      {step >= 1 && step < 4 && (
        <div className="card mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Cinéma et film</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Cinéma</label>
              <select
                value={selectedCinema}
                onChange={(e) => { setSelectedCinema(e.target.value); setSelectedFilm(''); setStep(1); }}
                className="input-field"
              >
                <option value="">Sélectionner un cinéma</option>
                {cinemas.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.city})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Film</label>
              <select
                value={selectedFilm}
                onChange={(e) => { setSelectedFilm(e.target.value); setStep(2); }}
                className="input-field"
                disabled={!selectedCinema}
              >
                <option value="">Tous les films</option>
                {films.map((f) => (
                  <option key={f.id} value={f.id}>{f.title}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Étape 2 : Choix séance */}
      {step >= 2 && step < 4 && sessions.length > 0 && (
        <div className="card mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Choisir une séance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sessions.filter((s) => s.available_seats > 0).map((session) => (
              <button
                key={session.id}
                onClick={() => selectSession(session)}
                className={`p-4 rounded-lg text-left transition-all border ${
                  selectedSession?.id === session.id
                    ? 'bg-primary-500/10 border-primary-500'
                    : 'bg-dark-700 border-dark-600 hover:border-primary-500/50'
                }`}
              >
                <p className="text-white font-medium">{session.film_title}</p>
                <p className="text-gray-400 text-sm">{formatDate(session.start_time)}</p>
                <p className="text-gray-400 text-sm">
                  {formatTime(session.start_time)} - {formatTime(session.end_time)}
                </p>
                <div className="flex justify-between mt-2">
                  <span className="text-gray-500 text-xs">Salle {session.room_number} • {session.quality}</span>
                  <span className="text-primary-400 font-bold">{parseFloat(session.price).toFixed(2)}€</span>
                </div>
                <p className="text-gray-500 text-xs mt-1">{session.available_seats} places disponibles</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Étape 3 : Choix sièges */}
      {step === 3 && sessionDetail && (
        <div className="card mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Choisir vos sièges</h2>

          {/* Écran */}
          <div className="text-center mb-6">
            <div className="w-3/4 mx-auto h-2 bg-primary-500/30 rounded-full mb-2" />
            <p className="text-gray-500 text-sm">Écran</p>
          </div>

          {/* Grille des sièges */}
          <div className="flex flex-col items-center gap-1 mb-6">
            {(() => {
              const rows = {};
              sessionDetail.seats.forEach((seat) => {
                if (!rows[seat.seat_row]) rows[seat.seat_row] = [];
                rows[seat.seat_row].push(seat);
              });

              return Object.entries(rows).map(([row, seats]) => (
                <div key={row} className="flex items-center gap-1">
                  <span className="w-6 text-gray-500 text-sm text-right">{row}</span>
                  {seats.map((seat) => {
                    const isSelected = selectedSeats.find((s) => s.id === seat.id);
                    const isTaken = !seat.is_free;
                    const isPMR = seat.is_pmr;

                    return (
                      <button
                        key={seat.id}
                        onClick={() => toggleSeat(seat)}
                        disabled={isTaken || !seat.is_available}
                        className={`w-8 h-8 rounded text-xs font-bold transition-all ${
                          isTaken
                            ? 'bg-red-500/30 text-red-400 cursor-not-allowed'
                            : isSelected
                            ? 'bg-primary-500 text-white'
                            : isPMR
                            ? 'bg-blue-500/30 text-blue-400 hover:bg-blue-500/50'
                            : 'bg-dark-600 text-gray-400 hover:bg-dark-500'
                        }`}
                        title={`${row}${seat.seat_number}${isPMR ? ' (PMR)' : ''}${isTaken ? ' (Occupé)' : ''}`}
                      >
                        {seat.seat_number}
                      </button>
                    );
                  })}
                </div>
              ));
            })()}
          </div>

          {/* Légende */}
          <div className="flex justify-center gap-6 mb-6 text-sm">
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-dark-600" /> Disponible</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-primary-500" /> Sélectionné</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-red-500/30" /> Occupé</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-blue-500/30" /> PMR</div>
          </div>

          {/* Récapitulatif */}
          {selectedSeats.length > 0 && (
            <div className="bg-dark-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-white font-medium">
                    {selectedSeats.length} siège{selectedSeats.length > 1 ? 's' : ''} sélectionné{selectedSeats.length > 1 ? 's' : ''}
                  </p>
                  <p className="text-gray-400 text-sm">
                    Places : {selectedSeats.map((s) => `${s.seat_row}${s.seat_number}`).join(', ')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-primary-400 font-bold text-2xl">{totalPrice}€</p>
                  <p className="text-gray-500 text-sm">{parseFloat(selectedSession.price).toFixed(2)}€ × {selectedSeats.length}</p>
                </div>
              </div>

              {!isAuthenticated && (
                <p className="text-yellow-400 text-sm mb-3">
                  ⚠️ Vous devez être connecté pour valider votre réservation
                </p>
              )}

              <button
                onClick={confirmReservation}
                disabled={loading}
                className="btn-primary w-full py-3 text-lg"
              >
                {loading ? 'Réservation en cours...' : isAuthenticated ? 'Confirmer la réservation' : 'Se connecter pour réserver'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Étape 4 : Confirmation */}
      {step === 4 && (
        <div className="card text-center py-12">
          <span className="text-6xl mb-4 block">🎉</span>
          <h2 className="text-2xl font-bold text-primary-400 mb-2">Réservation confirmée !</h2>
          <p className="text-gray-400 mb-6">
            Votre réservation est enregistrée. Retrouvez-la dans votre espace personnel.
          </p>
          <div className="flex gap-4 justify-center">
            <button onClick={() => navigate('/mon-espace')} className="btn-primary">
              Mon espace
            </button>
            <button onClick={() => { setStep(1); setSelectedSeats([]); setSuccess(''); }} className="btn-secondary">
              Nouvelle réservation
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reservation;
