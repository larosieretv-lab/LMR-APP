// ── Utility ──
const BANNED_WORDS = [
  'merde', 'putain', 'connard', 'connasse', 'salope', 'fdp', 'pd', 'bite',
  'couille', 'cul', 'enculé', 'encule', 'batard', 'bâtard', 'nique', 'fuck',
  'shit', 'bastard', 'con', 'chier', 'trou du cul', 'ta gueule', 'gueule'
];

function containsBannedWord(str) {
  const lower = str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return BANNED_WORDS.some(w => {
    const wn = w.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return lower.includes(wn);
  });
}

function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function showToast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2600);
}
function confirmDelete(msg, onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'confirm-overlay';
  overlay.innerHTML = `
    <div class="confirm-box">
      <div class="confirm-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg></div>
      <div class="confirm-title">Supprimer</div>
      <div class="confirm-msg">${escHtml(msg)}</div>
      <div class="confirm-btns">
        <button class="btn-confirm-cancel">Annuler</button>
        <button class="btn-confirm-delete">Supprimer</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('.btn-confirm-cancel').onclick = () => overlay.remove();
  overlay.querySelector('.btn-confirm-delete').onclick = () => { overlay.remove(); onConfirm(); };
}

// ── Tour Counter ──
function computeTours() {
  const start = new Date('2026-07-04T10:00:00');
  const now = new Date();
  if (now < start) return 0;
  const heures = Math.floor((now - start) / (1000 * 60 * 60));
  return Math.min(heures + 1, 100);
}

function updateTourCounter() {
  const tours = computeTours();
  const tens = document.getElementById('tour-digit-tens');
  const ones = document.getElementById('tour-digit-ones');
  if (tens) tens.textContent = Math.floor(tours / 10);
  if (ones) ones.textContent = tours % 10;
}

updateTourCounter();
setInterval(updateTourCounter, 60 * 1000);

// ── Navigation ──
let currentPage = 'coureurs';
const pages = document.querySelectorAll('.page');
const navBtns = document.querySelectorAll('.nav-btn');

function navigate(page) {
  currentPage = page;
  pages.forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${page}`).classList.add('active');
  navBtns.forEach(b => b.classList.toggle('active', b.dataset.page === page));
  renderPage(page);
}

navBtns.forEach(btn => btn.addEventListener('click', () => navigate(btn.dataset.page)));

// ── Drawer ──
const drawer = document.getElementById('drawer');
const drawerOverlay = document.getElementById('drawer-overlay');

function openDrawer() {
  drawer.classList.remove('hidden');
  drawerOverlay.classList.remove('hidden');
}
function closeDrawer() {
  drawer.classList.add('hidden');
  drawerOverlay.classList.add('hidden');
}
drawerOverlay.addEventListener('click', closeDrawer);
document.getElementById('drawer-close').addEventListener('click', closeDrawer);
document.querySelectorAll('.drawer-link').forEach(link => {
  link.addEventListener('click', () => { closeDrawer(); navigate(link.dataset.page); });
});

// ── Modal ──
const modalOverlay = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const btnSave = document.getElementById('btn-save');
const btnCancel = document.getElementById('btn-cancel');
const modalClose = document.getElementById('modal-close');
let _saveCallback = null;

function openModal(title, bodyHTML, onSave) {
  modalTitle.textContent = title;
  modalBody.innerHTML = bodyHTML;
  _saveCallback = onSave;
  modalOverlay.classList.remove('hidden');
}
function closeModal() {
  modalOverlay.classList.add('hidden');
  _saveCallback = null;
}
btnSave.addEventListener('click', () => { if (_saveCallback) _saveCallback(); });
btnCancel.addEventListener('click', closeModal);
modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });

// ── Page Render Router ──
function renderPage(page) {
  switch(page) {
    case 'coureurs': renderCoureurs(); break;
    case 'pronostics': renderPronostics(); break;
    case 'classement-prono': renderClassementProno(); break;
    case 'classement-coureurs': renderClassementCoureurs(); break;
  }
}

// ─────────────────────────────────────────────
// PAGE: COUREURS
// ─────────────────────────────────────────────
let coureursSearch = '';
let coureursFilter = 'all';

function renderCoureurs() {
  const page = document.getElementById('page-coureurs');
  page.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <button class="hamburger-btn" onclick="openDrawer()">
          <span></span><span></span><span></span>
        </button>
        <h1 class="page-title">Riders</h1>
      </div>
    </div>
    <div class="search-wrap">
      <div class="search-bar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" placeholder="Recherche" id="coureurs-search" value="${escHtml(coureursSearch)}" />
      </div>
    </div>
    <div class="content">
      <div class="rider-cards" id="rider-cards-container"></div>
    </div>`;

  document.getElementById('coureurs-search').addEventListener('input', e => {
    coureursSearch = e.target.value;
    renderRiderCards();
  });
  renderRiderCards();
}

function renderRiderCards() {
  const container = document.getElementById('rider-cards-container');
  if (!container) return;
  const q = coureursSearch.toLowerCase();
  const filtered = DB.coureurs.filter(c => c.nom.toLowerCase().includes(q));

  if (!filtered.length) {
    container.innerHTML = `<div class="empty-state">
      <div class="empty-state-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="5" r="2"/><path d="M12 7c-2 0-4 1-5 3l-2 5h3l1 4h6l1-4h3l-2-5c-1-2-3-3-5-3z"/><circle cx="5" cy="18" r="2"/><circle cx="19" cy="18" r="2"/></svg></div>
      <div class="empty-state-text">Aucun coureur trouvé</div>
      <div class="empty-state-sub">Aucun coureur n'a encore été ajouté.</div>
    </div>`;
    return;
  }

  container.innerHTML = filtered.map(c => {
    const start = new Date('2026-07-04T10:00:00');
    const raceStarted = new Date() >= start;
    const elimTour = c.eliminatedAt ? Math.min(Math.floor((new Date(c.eliminatedAt) - start) / (1000*60*60)) + 1, 100) : null;
    const statusBadge = c.eliminatedAt
      ? `<div class="rider-status-elim">Éliminé — Tour ${elimTour}</div>`
      : raceStarted ? `<div class="rider-status-active">En course</div>` : '';
    return `
    <div class="rider-card${c.eliminatedAt ? ' rider-card-eliminated' : ''}">
      ${c.photo
        ? `<img class="rider-card-img" src="${escHtml(c.photo)}" alt="${escHtml(c.nom)}" />`
        : `<div class="rider-card-img-placeholder"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48"><circle cx="12" cy="5" r="2"/><path d="M12 7c-2 0-4 1-5 3l-2 5h3l1 4h6l1-4h3l-2-5c-1-2-3-3-5-3z"/><circle cx="5" cy="18" r="2"/><circle cx="19" cy="18" r="2"/></svg></div>`}
      <div class="rider-card-info">
        <div class="rider-card-name">${escHtml(c.nom)}</div>
        ${statusBadge}
      </div>
    </div>`;
  }).join('');
}

function coureurFormHTML(c = {}) {
  return `
    <div class="form-group img-upload-wrap">
      <div class="img-preview" id="img-preview-wrap">
        ${c.photo ? `<img src="${escHtml(c.photo)}" id="img-preview" />` : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48"><circle cx="12" cy="5" r="2"/><path d="M12 7c-2 0-4 1-5 3l-2 5h3l1 4h6l1-4h3l-2-5c-1-2-3-3-5-3z"/><circle cx="5" cy="18" r="2"/><circle cx="19" cy="18" r="2"/></svg>`}
      </div>
      <input type="file" id="photo-input" accept="image/*" style="display:none" />
      <button class="btn-upload" onclick="document.getElementById('photo-input').click()">Choisir une photo</button>
    </div>
    <div class="form-group">
      <label class="form-label">Nom du coureur</label>
      <input class="form-input" id="f-nom" type="text" placeholder="Ex: Marcel Hirscher" value="${escHtml(c.nom || '')}" />
    </div>
    <div class="form-group">
      <label class="form-label">Statut</label>
      <select class="form-select" id="f-statut">
        <option value="active" ${(c.statut||'active')==='active'?'selected':''}>Actif</option>
        <option value="inactive" ${c.statut==='inactive'?'selected':''}>Inactif</option>
      </select>
    </div>`;
}

function setupPhotoInput(existingPhoto) {
  let photoData = existingPhoto || '';
  const input = document.getElementById('photo-input');
  input.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      photoData = ev.target.result;
      const wrap = document.getElementById('img-preview-wrap');
      wrap.innerHTML = `<img src="${photoData}" id="img-preview" />`;
    };
    reader.readAsDataURL(file);
  });
  return () => photoData;
}

function openAddCoureur() {
  openModal('Ajouter un coureur', coureurFormHTML(), () => {
    const nom = document.getElementById('f-nom').value.trim();
    const statut = document.getElementById('f-statut').value;
    const photoInput = document.getElementById('photo-input');
    if (!nom) { showToast('Le nom est requis'); return; }
    const newC = { id: DB.nextId(DB.coureurs), nom, cote: 0, rang: 0, statut, photo: '' };
    if (photoInput.files[0]) {
      const reader = new FileReader();
      reader.onload = ev => {
        newC.photo = ev.target.result;
        DB.coureurs.push(newC);
        DB.save();
        closeModal();
        renderRiderCards();
        showToast('Coureur ajouté');
      };
      reader.readAsDataURL(photoInput.files[0]);
    } else {
      DB.coureurs.push(newC);
      DB.save();
      closeModal();
      renderRiderCards();
      showToast('Coureur ajouté');
    }
  });
}

function openEditCoureur(id) {
  const c = DB.coureurs.find(x => x.id === id);
  if (!c) return;
  openModal('Modifier le coureur', coureurFormHTML(c), () => {
    const nom = document.getElementById('f-nom').value.trim();
    const statut = document.getElementById('f-statut').value;
    const photoInput = document.getElementById('photo-input');
    if (!nom) { showToast('Le nom est requis'); return; }
    const doSave = (photo) => {
      Object.assign(c, { nom, statut, photo });
      DB.save();
      closeModal();
      renderRiderCards();
      showToast('Coureur modifié');
    };
    if (photoInput.files[0]) {
      const reader = new FileReader();
      reader.onload = ev => doSave(ev.target.result);
      reader.readAsDataURL(photoInput.files[0]);
    } else {
      doSave(c.photo);
    }
  });
}

function deleteCoureur(id) {
  const c = DB.coureurs.find(x => x.id === id);
  if (!c) return;
  confirmDelete(`Supprimer "${c.nom}" ?`, () => {
    DB.coureurs = DB.coureurs.filter(x => x.id !== id);
    DB.save();
    renderRiderCards();
    showToast('Coureur supprimé');
  });
}

// ─────────────────────────────────────────────
// PAGE: PRONOSTICS
// ─────────────────────────────────────────────
let pronosticsSearch = '';
let remotePronostics = [];

function renderPronostics() {
  const page = document.getElementById('page-pronostics');
  page.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <button class="hamburger-btn" onclick="openDrawer()">
          <span></span><span></span><span></span>
        </button>
        <h1 class="page-title">Pronostics</h1>
      </div>
      <button class="btn-add" onclick="openAddPronostic()">+ Add</button>
    </div>
    <div class="search-wrap">
      <div class="search-bar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" placeholder="Recherche" id="pronostics-search" value="${escHtml(pronosticsSearch)}" />
      </div>
    </div>
    <div class="content">
      <div id="pronostics-list"><div class="empty-state"><div class="empty-state-sub" style="padding:40px">Chargement...</div></div></div>
    </div>`;

  document.getElementById('pronostics-search').addEventListener('input', e => {
    pronosticsSearch = e.target.value;
    renderPronosticsList();
  });

  SB.get('pronostics').then(data => {
    remotePronostics = data;
    DB.pronostics = data.map(p => ({ id: p.id, participant: p.participant, coureur: p.coureur, temps: p.temps || '' }));
    renderPronosticsList();
  }).catch(() => {
    showToast('Erreur de connexion — affichage local');
    remotePronostics = DB.pronostics;
    renderPronosticsList();
  });
}

function renderPronosticsList() {
  const container = document.getElementById('pronostics-list');
  if (!container) return;
  const q = pronosticsSearch.toLowerCase();
  const filtered = remotePronostics.filter(p =>
    p.participant.toLowerCase().includes(q) ||
    p.coureur.toLowerCase().includes(q)
  );

  if (!filtered.length) {
    container.innerHTML = `<div class="empty-state">
      <div class="empty-state-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg></div>
      <div class="empty-state-text">Aucun pronostic</div>
      <div class="empty-state-sub">Appuyez sur + Add pour voter</div>
    </div>`;
    return;
  }

  // Group by participant
  const groups = {};
  filtered.forEach(p => {
    if (!groups[p.participant]) groups[p.participant] = [];
    groups[p.participant].push(p);
  });

  container.innerHTML = Object.entries(groups).map(([nom, pronos]) => `
    <div class="prono-group">
      <div class="prono-group-header">
        <span class="prono-group-name">${escHtml(nom)}</span>
        <span class="prono-group-count">${pronos.length} pronostic${pronos.length > 1 ? 's' : ''}</span>
      </div>
      ${pronos.map(p => `
        <div class="prono-row">
          <div class="prono-cell">${escHtml(p.coureur)}</div>
          <div class="prono-cell muted">${escHtml(p.temps || '')}</div>
        </div>`).join('')}
    </div>`).join('');
}

function pronosticFormHTML(p = {}) {
  const actifs = DB.coureurs.filter(c => c.statut === 'active');
  const inactifs = DB.coureurs.filter(c => c.statut !== 'active');
  const coureurOptions = [
    ...actifs.map(c => `<option value="${escHtml(c.nom)}" ${p.coureur===c.nom?'selected':''}>${escHtml(c.nom)}</option>`),
    ...(inactifs.length ? [`<option disabled>── Inactifs ──</option>`] : []),
    ...inactifs.map(c => `<option value="${escHtml(c.nom)}" ${p.coureur===c.nom?'selected':''} style="color:#aaa">${escHtml(c.nom)} (inactif)</option>`),
  ].join('');
  const noCoureurs = DB.coureurs.length === 0;
  return `
    <div class="form-group">
      <label class="form-label">Ton prénom / nom</label>
      <input class="form-input" id="f-participant" type="text" placeholder="Ex: Jean Dupont" value="${escHtml(p.participant||'')}" />
    </div>
    <div class="form-group">
      <label class="form-label">Coureur choisi</label>
      ${noCoureurs
        ? `<div style="background:var(--gray-input);border-radius:10px;padding:12px 14px;font-size:14px;color:var(--text-muted)">Aucun coureur disponible — ajoutez d'abord des coureurs.</div>`
        : `<select class="form-select" id="f-coureur">
            <option value="">-- Choisir parmi les coureurs --</option>
            ${coureurOptions}
          </select>`
      }
    </div>
    <div class="form-group">
      <label class="form-label">Nombre de tours prévu</label>
      <select class="form-select" id="f-temps">
        <option value="">-- Choisir un nombre de tours --</option>
        ${Array.from({length: 100}, (_, i) => i + 1).map(n => `<option value="${n} tour${n > 1 ? 's' : ''}" ${p.temps === `${n} tour${n > 1 ? 's' : ''}`?'selected':''}>${n} tour${n > 1 ? 's' : ''}</option>`).join('')}
      </select>
    </div>`;
}


const COOLDOWN_KEY = 'lmr_prono_last';
const COOLDOWN_MS = 12 * 60 * 60 * 1000;

function getCooldownRemaining() {
  const last = parseInt(localStorage.getItem(COOLDOWN_KEY) || '0');
  return Math.max(0, COOLDOWN_MS - (Date.now() - last));
}

function formatCooldown(ms) {
  const totalSec = Math.ceil(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return h + 'h ' + m + 'm';
  if (m > 0) return m + 'm ' + s + 's';
  return s + 's';
}

function openAddPronostic() {
  const remaining = getCooldownRemaining();
  if (remaining > 0) {
    showToast('Attends encore ' + formatCooldown(remaining) + ' avant de voter à nouveau');
    return;
  }
  openModal('Ajouter un pronostic', pronosticFormHTML(), () => {
    const participant = document.getElementById('f-participant').value.trim();
    const coureurEl = document.getElementById('f-coureur');
    const coureur = coureurEl ? coureurEl.value : '';
    const temps = document.getElementById('f-temps').value.trim();
    if (!participant) { showToast('Le participant est requis'); return; }
    if (containsBannedWord(participant)) { showToast('Nom invalide — langage inapproprié'); return; }
    if (!coureur) { showToast('Le coureur choisi est requis'); return; }
    const already = remotePronostics.find(x => x.participant.toLowerCase() === participant.toLowerCase());
    if (already) { showToast('Un pronostic existe déjà pour ce nom'); return; }
    closeModal();
    showToast('Enregistrement...');
    SB.insert('pronostics', { participant, coureur, temps }).then(() => {
      localStorage.setItem(COOLDOWN_KEY, Date.now().toString());
      showToast('Pronostic ajouté !');
      renderPronostics();
    }).catch(() => showToast('Erreur lors de l’enregistrement'));
  });
}

function openEditPronostic(id) {
  const p = remotePronostics.find(x => x.id === id);
  if (!p) return;
  openModal('Modifier le pronostic', pronosticFormHTML(p), () => {
    const participant = document.getElementById('f-participant').value.trim();
    const coureurEl = document.getElementById('f-coureur');
    const coureur = coureurEl ? coureurEl.value : p.coureur;
    const temps = document.getElementById('f-temps').value.trim();
    if (!participant) { showToast('Le participant est requis'); return; }
    if (containsBannedWord(participant)) { showToast('Nom invalide — langage inapproprié'); return; }
    if (!coureur) { showToast('Le coureur choisi est requis'); return; }
    closeModal();
    showToast('Enregistrement...');
    SB.update('pronostics', id, { participant, coureur, temps }).then(() => {
      showToast('Pronostic modifié !');
      renderPronostics();
    }).catch(() => showToast('Erreur lors de la modification'));
  });
}

// ─────────────────────────────────────────────
// PAGE: CLASSEMENT PRONOSTIQUEURS
// ─────────────────────────────────────────────
let classementPronoSearch = '';

function computeClassementProno() {
  // Group pronostics by participant, compute score based on cote of chosen coureur
  // Score = sum of cotes of chosen runners (simplified scoring logic)
  // Real scoring would need race results; here we show the current total cote as points
  const scores = {};
  DB.pronostics.forEach(p => {
    const coureur = DB.coureurs.find(c => c.nom === p.coureur);
    const pts = coureur ? parseFloat(coureur.cote) : 0;
    if (!scores[p.participant]) scores[p.participant] = { nom: p.participant, total: 0, count: 0, pronostics: [] };
    scores[p.participant].total += pts;
    scores[p.participant].count++;
    scores[p.participant].pronostics.push(p.coureur);
  });
  return Object.values(scores).sort((a, b) => b.total - a.total);
}

function renderClassementProno() {
  const page = document.getElementById('page-classement-prono');
  page.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <button class="hamburger-btn" onclick="openDrawer()">
          <span></span><span></span><span></span>
        </button>
        <h1 class="page-title">Pronostiqueurs</h1>
      </div>
    </div>
    <div class="search-wrap">
      <div class="search-bar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" placeholder="Recherche" id="prono-search" value="${escHtml(classementPronoSearch)}" />
      </div>
    </div>
    <div class="content">
      <div id="prono-list"><div class="empty-state"><div class="empty-state-sub" style="padding:40px">Chargement...</div></div></div>
    </div>`;

  document.getElementById('prono-search').addEventListener('input', e => {
    classementPronoSearch = e.target.value;
    renderPronoList();
  });
  if (DB.pronostics.length) renderPronoList();
}

function renderPronoList() {
  const container = document.getElementById('prono-list');
  if (!container) return;
  const q = classementPronoSearch.toLowerCase();
  const scores = computeClassementProno();
  const filtered = scores.filter(s => s.nom.toLowerCase().includes(q));

  if (!filtered.length) {
    container.innerHTML = `<div class="empty-state">
      <div class="empty-state-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg></div>
      <div class="empty-state-text">Aucun pronostiqueur</div>
      <div class="empty-state-sub">Les pronostics apparaîtront ici</div>
    </div>`;
    return;
  }

  const merged = filtered.sort((a,b) => b.count - a.count);

  container.innerHTML = merged.map((s, i) => {
    const rankClass = i===0?'top1':i===1?'top2':i===2?'top3':'';
    return `
    <div class="ranking-row" onclick="openParticipantDetail('${escHtml(s.nom)}')">
      <div class="rank-number ${rankClass}">${i+1}</div>
      <div class="ranking-info">
        <div class="ranking-name">${escHtml(s.nom)}</div>
        <div class="ranking-sub">${s.count} pronostic${s.count > 1 ? 's' : ''}</div>
      </div>
      <div class="list-row-chevron">›</div>
    </div>`;
  }).join('');
}

function openParticipantDetail(nom) {
  const pronos = DB.pronostics.filter(p => p.participant === nom);
  const bodyHTML = `
    <div class="form-group">
      <label class="form-label">Participant</label>
      <div style="font-size:16px;font-weight:700;padding:8px 0">${escHtml(nom)}</div>
    </div>
    <div class="form-group">
      <label class="form-label">Pronostics (${pronos.length})</label>
      ${pronos.length ? pronos.map(p => `
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee">
          <span>${escHtml(p.coureur)}</span>
          <span style="color:#888;font-size:13px">${escHtml(p.temps)}</span>
        </div>`).join('') : '<div style="color:#888;font-size:14px;padding:8px 0">Aucun pronostic</div>'}
    </div>`;

  openModal(nom, bodyHTML, null);
  document.getElementById('btn-save').style.display = 'none';
  document.querySelector('.modal-footer').style.justifyContent = 'center';
}

function openAddParticipant() {
  openModal('Ajouter un participant', `
    <div class="form-group">
      <label class="form-label">Nom du participant</label>
      <input class="form-input" id="f-participant-nom" type="text" placeholder="Ex: Jean Dupont" />
    </div>`, () => {
    const nom = document.getElementById('f-participant-nom').value.trim();
    if (!nom) { showToast('Le nom est requis'); return; }
    if (DB.participants.find(p => p.nom === nom)) { showToast('Participant déjà existant'); return; }
    DB.participants.push({ id: DB.nextId(DB.participants), nom });
    DB.save();
    closeModal();
    renderPronoList();
    showToast('Participant ajouté');
  });
  document.getElementById('btn-save').style.display = '';
}

function deleteParticipant(nom) {
  confirmDelete(`Supprimer "${nom}" et ses pronostics ?`, () => {
    DB.participants = DB.participants.filter(p => p.nom !== nom);
    DB.pronostics = DB.pronostics.filter(p => p.participant !== nom);
    DB.save();
    renderPronoList();
    showToast('Participant supprimé');
  });
}

// ─────────────────────────────────────────────
// PAGE: CLASSEMENT COUREURS (Manual)
// ─────────────────────────────────────────────
let classementCoureursSearch = '';

function renderClassementCoureurs() {
  const page = document.getElementById('page-classement-coureurs');
  page.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <button class="hamburger-btn" onclick="openDrawer()">
          <span></span><span></span><span></span>
        </button>
        <h1 class="page-title">Coureurs</h1>
      </div>
    </div>
    <div class="search-wrap">
      <div class="search-bar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" placeholder="Recherche" id="cc-search" value="${escHtml(classementCoureursSearch)}" />
      </div>
    </div>
    <div class="content">
      <div id="cc-list"></div>
    </div>`;

  document.getElementById('cc-search').addEventListener('input', e => {
    classementCoureursSearch = e.target.value;
    renderCCList();
  });
  renderCCList();
}

function renderCCList() {
  const container = document.getElementById('cc-list');
  if (!container) return;
  const q = classementCoureursSearch.toLowerCase();
  const list = DB.classementCoureurs.filter(c => c.nom.toLowerCase().includes(q));

  if (!list.length) {
    container.innerHTML = `<div class="empty-state">
      <div class="empty-state-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="18 20 18 10"/><polyline points="12 20 12 4"/><polyline points="6 20 6 14"/></svg></div>
      <div class="empty-state-text">Classement vide</div>
      <div class="empty-state-sub">Entrez le classement manuellement avec + Add</div>
    </div>`;
    return;
  }

  container.innerHTML = list.map((c, i) => {
    const coureur = DB.coureurs.find(x => x.nom === c.nom);
    const photo = coureur ? coureur.photo : '';
    const statut = coureur ? coureur.statut : 'active';
    const rankClass = i===0?'top1':i===1?'top2':i===2?'top3':'';
    return `
    <div class="list-row">
      ${photo
        ? `<img class="list-row-avatar" src="${escHtml(photo)}" alt="${escHtml(c.nom)}" />`
        : `<div class="list-row-avatar-placeholder"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><circle cx="12" cy="5" r="2"/><path d="M12 7c-2 0-4 1-5 3l-2 5h3l1 4h6l1-4h3l-2-5c-1-2-3-3-5-3z"/><circle cx="5" cy="18" r="2"/><circle cx="19" cy="18" r="2"/></svg></div>`}
      <div class="list-row-info">
        <div class="status-badge ${statut}">${statut === 'active' ? 'ACTIVE' : 'INACTIVE'}</div>
        <div class="list-row-name">${escHtml(c.nom)}</div>
        <div class="list-row-sub">${parseFloat(c.score||0).toFixed(2)}</div>
      </div>
      <div class="rank-number ${rankClass}" style="margin-left:auto">#${c.position||i+1}</div>
    </div>`;
  }).join('');
}

function classementCoureurFormHTML(c = {}) {
  const coureurOptions = DB.coureurs.map(x =>
    `<option value="${escHtml(x.nom)}" ${c.nom===x.nom?'selected':''}>${escHtml(x.nom)}</option>`
  ).join('');
  return `
    <div class="form-group">
      <label class="form-label">Coureur</label>
      <select class="form-select" id="f-cc-nom">
        <option value="">-- Choisir --</option>
        ${coureurOptions}
      </select>
      <input class="form-input" id="f-cc-custom" type="text" placeholder="Ou saisir manuellement..." value="${!DB.coureurs.find(x=>x.nom===c.nom)&&c.nom?escHtml(c.nom):''}" style="margin-top:6px"/>
    </div>
    <div class="form-group">
      <label class="form-label">Position (rang final)</label>
      <input class="form-input" id="f-cc-position" type="number" min="1" placeholder="Ex: 1" value="${c.position||''}" />
    </div>
    <div class="form-group">
      <label class="form-label">Score / Points</label>
      <input class="form-input" id="f-cc-score" type="number" step="0.01" placeholder="Ex: 100.00" value="${c.score!==undefined?c.score:''}" />
    </div>
    <div class="form-group">
      <label class="form-label">Temps (optionnel)</label>
      <input class="form-input" id="f-cc-temps" type="text" placeholder="Ex: 3:45.21" value="${escHtml(c.temps||'')}" />
    </div>`;
}

function openAddClassementCoureur() {
  openModal('Ajouter au classement', classementCoureurFormHTML(), () => {
    const selectVal = document.getElementById('f-cc-nom').value;
    const customVal = document.getElementById('f-cc-custom').value.trim();
    const nom = customVal || selectVal;
    const position = parseInt(document.getElementById('f-cc-position').value);
    const score = parseFloat(document.getElementById('f-cc-score').value);
    const temps = document.getElementById('f-cc-temps').value.trim();
    if (!nom) { showToast('Le nom est requis'); return; }
    DB.classementCoureurs.push({
      id: DB.nextId(DB.classementCoureurs),
      nom,
      position: isNaN(position) ? DB.classementCoureurs.length + 1 : position,
      score: isNaN(score) ? 0 : score,
      temps,
    });
    DB.classementCoureurs.sort((a,b) => a.position - b.position);
    DB.save();
    closeModal();
    renderCCList();
    showToast('Entrée ajoutée');
  });
}

function openEditClassementCoureur(id) {
  const c = DB.classementCoureurs.find(x => x.id === id);
  if (!c) return;
  openModal('Modifier le classement', classementCoureurFormHTML(c), () => {
    const selectVal = document.getElementById('f-cc-nom').value;
    const customVal = document.getElementById('f-cc-custom').value.trim();
    const nom = customVal || selectVal;
    const position = parseInt(document.getElementById('f-cc-position').value);
    const score = parseFloat(document.getElementById('f-cc-score').value);
    const temps = document.getElementById('f-cc-temps').value.trim();
    if (!nom) { showToast('Le nom est requis'); return; }
    Object.assign(c, { nom, position: isNaN(position)?c.position:position, score: isNaN(score)?0:score, temps });
    DB.classementCoureurs.sort((a,b) => a.position - b.position);
    DB.save();
    closeModal();
    renderCCList();
    showToast('Classement modifié');
  });
  const footer = document.querySelector('.modal-footer');
  const delBtn = document.createElement('button');
  delBtn.className = 'btn-cancel';
  delBtn.style.background = '#fce4e4';
  delBtn.style.color = '#e53935';
  delBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>';
  delBtn.onclick = () => {
    closeModal();
    confirmDelete(`Supprimer "${c.nom}" du classement ?`, () => {
      DB.classementCoureurs = DB.classementCoureurs.filter(x => x.id !== id);
      DB.save();
      renderCCList();
      showToast('Entrée supprimée');
    });
  };
  footer.insertBefore(delBtn, footer.firstChild);
}

function deleteClassementCoureur(id) {
  const c = DB.classementCoureurs.find(x => x.id === id);
  if (!c) return;
  confirmDelete(`Supprimer "${c.nom}" du classement ?`, () => {
    DB.classementCoureurs = DB.classementCoureurs.filter(x => x.id !== id);
    DB.save();
    renderCCList();
    showToast('Entrée supprimée');
  });
}

// ── Init ──
Promise.all([
  SB.get('coureurs').catch(() => null),
  SB.get('pronostics').catch(() => null)
]).then(([coureurs, pronostics]) => {
  if (coureurs) DB.coureurs = coureurs;
  if (pronostics) {
    remotePronostics = pronostics;
    DB.pronostics = pronostics.map(p => ({ id: p.id, participant: p.participant, coureur: p.coureur, temps: p.temps || '' }));
  }
  if (currentPage === 'coureurs') renderRiderCards();
  if (currentPage === 'pronostics') renderPronosticsList();
});

navigate('coureurs');
