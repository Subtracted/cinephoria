const API_URL = 'http://localhost:5000/api';
let token = null;
let currentUser = null;

// =====================
// Authentification
// =====================
async function handleLogin() {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');
  errorEl.classList.add('hidden');

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      errorEl.textContent = data.error || 'Erreur de connexion';
      errorEl.classList.remove('hidden');
      return;
    }

    if (!['employee', 'admin'].includes(data.user.role)) {
      errorEl.textContent = 'Accès réservé aux employés';
      errorEl.classList.remove('hidden');
      return;
    }

    token = data.token;
    currentUser = data.user;
    document.getElementById('user-name').textContent =
      `${currentUser.firstName} ${currentUser.lastName}`;

    document.getElementById('login-page').classList.add('hidden');
    document.getElementById('main-page').classList.remove('hidden');

    loadRooms();
    loadIncidents();
  } catch (error) {
    errorEl.textContent = 'Impossible de se connecter au serveur';
    errorEl.classList.remove('hidden');
  }
}

function handleLogout() {
  token = null;
  currentUser = null;
  document.getElementById('main-page').classList.add('hidden');
  document.getElementById('login-page').classList.remove('hidden');
  document.getElementById('login-email').value = '';
  document.getElementById('login-password').value = '';
}

// Enter key support
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !document.getElementById('login-page').classList.contains('hidden')) {
    handleLogin();
  }
});

// =====================
// Onglets
// =====================
function switchTab(tabId, btn) {
  document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('tab-incidents').classList.add('hidden');
  document.getElementById('tab-new-incident').classList.add('hidden');
  document.getElementById(`tab-${tabId}`).classList.remove('hidden');
}

// =====================
// Salles
// =====================
async function loadRooms() {
  try {
    const response = await fetch(`${API_URL}/rooms`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const rooms = await response.json();

    const options = rooms.map(
      (r) => `<option value="${r.id}">Salle ${r.room_number} - ${r.cinema_name} (${r.quality})</option>`
    );

    document.getElementById('filter-room').innerHTML =
      '<option value="">Toutes les salles</option>' + options.join('');
    document.getElementById('incident-room').innerHTML =
      '<option value="">Sélectionner une salle</option>' + options.join('');
  } catch (error) {
    console.error('Erreur chargement salles:', error);
  }
}

// =====================
// Incidents
// =====================
async function loadIncidents() {
  const room = document.getElementById('filter-room').value;
  const status = document.getElementById('filter-status').value;

  let url = `${API_URL}/incidents?`;
  if (room) url += `room=${room}&`;
  if (status) url += `status=${status}&`;

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const incidents = await response.json();

    const listEl = document.getElementById('incidents-list');

    if (incidents.length === 0) {
      listEl.innerHTML = '<p style="color: #94a3b8; text-align: center; padding: 20px;">Aucun incident trouvé.</p>';
      return;
    }

    listEl.innerHTML = incidents
      .map(
        (inc) => `
      <div class="incident-item">
        <div class="incident-info">
          <p><span class="label">Salle</span> <span class="value">${inc.room_number} - ${inc.cinema_name} (${inc.city})</span></p>
          ${inc.seat_number ? `<p><span class="label">Siège</span> <span class="value">${inc.seat_number}</span></p>` : ''}
          <p><span class="label">Description</span> <span class="value">${inc.description}</span></p>
          <p><span class="label">Signalé par</span> <span class="value">${inc.reported_by}</span></p>
          <p><span class="label">Date</span> <span class="value">${new Date(inc.created_at).toLocaleDateString('fr-FR')}</span></p>
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px; align-items: flex-end;">
          <span class="badge badge-${inc.status}">
            ${inc.status === 'open' ? 'Ouvert' : inc.status === 'in_progress' ? 'En cours' : 'Résolu'}
          </span>
          ${
            inc.status !== 'resolved'
              ? `<select onchange="updateIncidentStatus(${inc.id}, this.value)" style="width: 140px; padding: 4px 8px; font-size: 12px;">
                <option value="">Changer...</option>
                <option value="open">Ouvert</option>
                <option value="in_progress">En cours</option>
                <option value="resolved">Résolu</option>
              </select>`
              : ''
          }
        </div>
      </div>
    `
      )
      .join('');
  } catch (error) {
    console.error('Erreur chargement incidents:', error);
  }
}

async function submitIncident() {
  const roomId = document.getElementById('incident-room').value;
  const description = document.getElementById('incident-description').value;
  const seatNumber = document.getElementById('incident-seat').value;
  const messageEl = document.getElementById('incident-message');

  if (!roomId || !description) {
    messageEl.innerHTML = '<p class="error">Veuillez remplir tous les champs obligatoires.</p>';
    return;
  }

  try {
    const response = await fetch(`${API_URL}/incidents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ roomId: parseInt(roomId), description, seatNumber: seatNumber || null }),
    });

    if (response.ok) {
      messageEl.innerHTML = '<p class="success">Incident signalé avec succès !</p>';
      document.getElementById('incident-description').value = '';
      document.getElementById('incident-seat').value = '';
      loadIncidents();
    } else {
      const data = await response.json();
      messageEl.innerHTML = `<p class="error">${data.error || 'Erreur'}</p>`;
    }
  } catch (error) {
    messageEl.innerHTML = '<p class="error">Erreur de connexion au serveur</p>';
  }
}

async function updateIncidentStatus(id, status) {
  if (!status) return;

  try {
    await fetch(`${API_URL}/incidents/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    loadIncidents();
  } catch (error) {
    console.error('Erreur mise à jour:', error);
  }
}
