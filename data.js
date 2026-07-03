// ── Persistent Data Store ──
const DB = {
  // Load from localStorage or use defaults
  load() {
    try {
      const raw = localStorage.getItem('lmr_data');
      if (raw) {
        const parsed = JSON.parse(raw);
        this.coureurs = parsed.coureurs || this._defaultCoureurs();
        this.pronostics = parsed.pronostics || [];
        this.classementCoureurs = parsed.classementCoureurs || [];
        this.participants = parsed.participants || this._defaultParticipants();
      } else {
        this.coureurs = this._defaultCoureurs();
        this.pronostics = [];
        this.classementCoureurs = [];
        this.participants = this._defaultParticipants();
      }
    } catch (e) {
      this.coureurs = this._defaultCoureurs();
      this.pronostics = [];
      this.classementCoureurs = [];
      this.participants = this._defaultParticipants();
    }
  },

  save() {
    localStorage.setItem('lmr_data', JSON.stringify({
      coureurs: this.coureurs,
      pronostics: this.pronostics,
      classementCoureurs: this.classementCoureurs,
      participants: this.participants,
    }));
  },

  nextId(arr) {
    return arr.length ? Math.max(...arr.map(x => x.id)) + 1 : 1;
  },

  _defaultCoureurs() {
    return [
      { id: 1, nom: 'Marcel Hirscher', statut: 'active', photo: '' },
      { id: 2, nom: 'Christina Geiger', statut: 'active', photo: '' },
      { id: 3, nom: 'Maximilian Pichler', statut: 'active', photo: '' },
      { id: 4, nom: 'Julia Ertl-Rubner', statut: 'active', photo: '' },
      { id: 5, nom: 'Andreas Prommegger', statut: 'active', photo: '' },
      { id: 6, nom: 'Michaela Schweizer', statut: 'inactive', photo: '' },
      { id: 7, nom: 'Stefan Geisler', statut: 'active', photo: '' },
    ];
  },

  _defaultParticipants() {
    return [];
  },
};

DB.load();

// Migration: clear old default participants
if (!localStorage.getItem('lmr_migr_v1')) {
  const defaults = ['Alexandre Dumoulin','Jean-Marc Lavoix','Marie-Jo Théolier','Pierre Gobert','Suzanne Dumoulin'];
  DB.participants = DB.participants.filter(p => !defaults.includes(p.nom));
  DB.save();
  localStorage.setItem('lmr_migr_v1', '1');
}
