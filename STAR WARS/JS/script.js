const BASE_URL = 'https://swapi.dev/api';

const state = {
  activeTab: 'characters',
  searchQuery: '',
  searchTimeout: null,
  characters: { data: [], page: 1, count: 0, next: null, prev: null, cache: {} },
  planets:    { data: [], page: 1, count: 0, next: null, prev: null, cache: {} },
  ships:      { data: [], page: 1, count: 0, next: null, prev: null, cache: {} },
};


const els = {
  loader:       document.getElementById('loader'),
  searchInput:  document.getElementById('searchInput'),
  tabBtns:      document.querySelectorAll('.tab-btn'),
  tabSections:  document.querySelectorAll('.tab-section'),
  charGrid:     document.getElementById('characters-grid'),
  planetGrid:   document.getElementById('planets-grid'),
  shipGrid:     document.getElementById('ships-grid'),
  charCount:    document.getElementById('char-count'),
  planetCount:  document.getElementById('planet-count'),
  shipCount:    document.getElementById('ship-count'),
  charPag:      document.getElementById('char-pagination'),
  planetPag:    document.getElementById('planet-pagination'),
  shipPag:      document.getElementById('ship-pagination'),
  modalOverlay: document.getElementById('modal-overlay'),
  modal:        document.getElementById('modal'),
  modalContent: document.getElementById('modal-content'),
  modalClose:   document.getElementById('modal-close'),
};

const fmt = (val) => (val === 'unknown' || val === 'n/a' || !val) ? '–' : val;
const cap = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : '–';
const num = (val) => {
  if (!val || val === 'unknown' || val === 'n/a') return '–';
  return Number(val).toLocaleString('pt-BR');
};


function showLoader() { els.loader.classList.remove('hidden'); }
function hideLoader() { els.loader.classList.add('hidden'); }


async function fetchAPI(url) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`API error: ${resp.status}`);
  return resp.json();
}

async function loadTab(tab, page = 1, search = '') {
  showLoader();
  const endpoints = { characters: 'people', planets: 'planets', ships: 'starships' };
  const endpoint  = endpoints[tab];
  let url = `${BASE_URL}/${endpoint}/?page=${page}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;

  try {
    const json = await fetchAPI(url);
    const s = state[tab];
    s.data  = json.results;
    s.count = json.count;
    s.next  = json.next;
    s.prev  = json.previous;
    s.page  = page;
    renderTab(tab);
  } catch (e) {
    console.error(e);
    getGrid(tab).innerHTML = `<div class="empty-state"><div class="empty-icon">⚠</div><p>FALHA NA TRANSMISSÃO</p></div>`;
  } finally {
    hideLoader();
  }
}

function getGrid(tab)  { return { characters: els.charGrid,   planets: els.planetGrid,  ships: els.shipGrid  }[tab]; }
function getCount(tab) { return { characters: els.charCount,  planets: els.planetCount, ships: els.shipCount }[tab]; }
function getPag(tab)   { return { characters: els.charPag,    planets: els.planetPag,   ships: els.shipPag   }[tab]; }


function renderTab(tab) {
  const s    = state[tab];
  const grid = getGrid(tab);
  const countEl = getCount(tab);
  countEl.textContent = s.count;

  if (!s.data.length) {
    grid.innerHTML = `<div class="empty-state"><div class="empty-icon">◌</div><p>NENHUM RESULTADO ENCONTRADO</p></div>`;
    getPag(tab).innerHTML = '';
    return;
  }

  grid.innerHTML = '';
  s.data.forEach((item, i) => {
    const card = tab === 'characters' ? buildCharCard(item)
               : tab === 'planets'    ? buildPlanetCard(item)
               : buildShipCard(item);
    card.style.animationDelay = `${i * 0.06}s`;
    card.addEventListener('click', () => openModal(tab, item));
    grid.appendChild(card);
  });

  renderPagination(tab);
}


function buildCharCard(c) {
  const el = document.createElement('div');
  el.className = 'card';
  el.innerHTML = `
    <div class="card-type">PERSONAGEM · SWAPI</div>
    <div class="card-name">${fmt(c.name)}</div>
    <div class="card-stats">
      <div class="stat-row"><span class="stat-label">Altura</span><span class="stat-value">${fmt(c.height)} cm</span></div>
      <div class="stat-row"><span class="stat-label">Peso</span><span class="stat-value">${fmt(c.mass)} kg</span></div>
      <div class="stat-row"><span class="stat-label">Gênero</span><span class="stat-value">${cap(fmt(c.gender))}</span></div>
      <div class="stat-row"><span class="stat-label">Ano de nascimento</span><span class="stat-value highlight">${fmt(c.birth_year)}</span></div>
    </div>
    <div class="card-footer"><button class="btn-detail">VER DETALHES →</button></div>
  `;
  return el;
}

function buildPlanetCard(p) {
  const el = document.createElement('div');
  el.className = 'card';
  el.innerHTML = `
    <div class="card-type">PLANETA · SWAPI</div>
    <div class="card-name">${fmt(p.name)}</div>
    <div class="card-stats">
      <div class="stat-row"><span class="stat-label">Clima</span><span class="stat-value">${cap(fmt(p.climate))}</span></div>
      <div class="stat-row"><span class="stat-label">Terreno</span><span class="stat-value">${cap(fmt(p.terrain))}</span></div>
      <div class="stat-row"><span class="stat-label">População</span><span class="stat-value">${num(p.population)}</span></div>
      <div class="stat-row"><span class="stat-label">Período orbital</span><span class="stat-value highlight">${fmt(p.orbital_period)} dias</span></div>
    </div>
    <div class="card-footer"><button class="btn-detail">VER DETALHES →</button></div>
  `;
  return el;
}

function buildShipCard(s) {
  const el = document.createElement('div');
  el.className = 'card';
  el.innerHTML = `
    <div class="card-type">NAVE · SWAPI</div>
    <div class="card-name">${fmt(s.name)}</div>
    <div class="card-stats">
      <div class="stat-row"><span class="stat-label">Modelo</span><span class="stat-value">${fmt(s.model)}</span></div>
      <div class="stat-row"><span class="stat-label">Classe</span><span class="stat-value">${cap(fmt(s.starship_class))}</span></div>
      <div class="stat-row"><span class="stat-label">Tripulação</span><span class="stat-value">${fmt(s.crew)}</span></div>
      <div class="stat-row"><span class="stat-label">Velocidade</span><span class="stat-value highlight">${fmt(s.max_atmosphering_speed)} km/h</span></div>
    </div>
    <div class="card-footer"><button class="btn-detail">VER DETALHES →</button></div>
  `;
  return el;
}


function openModal(tab, item) {
  els.modalContent.innerHTML = tab === 'characters' ? buildCharModal(item)
                              : tab === 'planets'    ? buildPlanetModal(item)
                              : buildShipModal(item);
  els.modalOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  els.modalOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

function stat(label, value, accent = false) {
  return `
    <div class="modal-stat">
      <div class="modal-stat-label">${label}</div>
      <div class="modal-stat-value${accent ? ' accent' : ''}">${value}</div>
    </div>
  `;
}

function buildCharModal(c) {
  return `
    <div class="modal-title">${fmt(c.name)}</div>
    <div class="modal-subtitle">Personagem · Galáxia Muito, Muito Distante</div>
    <hr class="modal-divider">
    <div class="modal-grid">
      ${stat('Altura', fmt(c.height) + ' cm')}
      ${stat('Peso', fmt(c.mass) + ' kg')}
      ${stat('Cor do cabelo', cap(fmt(c.hair_color)))}
      ${stat('Cor dos olhos', cap(fmt(c.eye_color)))}
      ${stat('Cor da pele', cap(fmt(c.skin_color)))}
      ${stat('Gênero', cap(fmt(c.gender)))}
      ${stat('Ano de nascimento', fmt(c.birth_year), true)}
      ${stat('Filmes', c.films?.length || 0 + ' aparição(ões)')}
    </div>
  `;
}

function buildPlanetModal(p) {
  return `
    <div class="modal-title">${fmt(p.name)}</div>
    <div class="modal-subtitle">Planeta · Sistema Estelar Desconhecido</div>
    <hr class="modal-divider">
    <div class="modal-grid">
      ${stat('Clima', cap(fmt(p.climate)))}
      ${stat('Terreno', cap(fmt(p.terrain)))}
      ${stat('Diâmetro', num(p.diameter) + ' km')}
      ${stat('Gravidade', fmt(p.gravity))}
      ${stat('Período de rotação', fmt(p.rotation_period) + ' h')}
      ${stat('Período orbital', fmt(p.orbital_period) + ' dias', true)}
      ${stat('Superfície de água', fmt(p.surface_water) + '%')}
      ${stat('População', num(p.population))}
    </div>
  `;
}

function buildShipModal(s) {
  return `
    <div class="modal-title">${fmt(s.name)}</div>
    <div class="modal-subtitle">${cap(fmt(s.starship_class))} · ${fmt(s.manufacturer)}</div>
    <hr class="modal-divider">
    <div class="modal-grid">
      ${stat('Modelo', fmt(s.model))}
      ${stat('Classe', cap(fmt(s.starship_class)))}
      ${stat('Fabricante', fmt(s.manufacturer))}
      ${stat('Comprimento', fmt(s.length) + ' m')}
      ${stat('Tripulação', fmt(s.crew))}
      ${stat('Passageiros', fmt(s.passengers))}
      ${stat('Vel. máx.', fmt(s.max_atmosphering_speed) + ' km/h', true)}
      ${stat('Classificação Hyperdrive', fmt(s.hyperdrive_rating))}
      ${stat('MGLT', fmt(s.MGLT))}
      ${stat('Carga', num(s.cargo_capacity) + ' kg')}
      ${stat('Consumíveis', fmt(s.consumables))}
      ${stat('Custo (créditos)', num(s.cost_in_credits))}
    </div>
  `;
}


function renderPagination(tab) {
  const s   = state[tab];
  const pag = getPag(tab);
  const totalPages = Math.ceil(s.count / 10);
  if (totalPages <= 1) { pag.innerHTML = ''; return; }

  let html = '';
  html += `<button class="page-btn" data-page="${s.page - 1}" ${s.page <= 1 ? 'disabled' : ''}>← ANTERIOR</button>`;
  html += `<span class="page-info">${s.page} / ${totalPages}</span>`;
  html += `<button class="page-btn" data-page="${s.page + 1}" ${s.page >= totalPages ? 'disabled' : ''}>PRÓXIMA →</button>`;
  pag.innerHTML = html;

  pag.querySelectorAll('.page-btn:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = parseInt(btn.dataset.page);
      loadTab(tab, page, state.searchQuery);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}


function switchTab(tab) {
  state.activeTab = tab;
  state.searchQuery = '';
  els.searchInput.value = '';

  els.tabBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));
  els.tabSections.forEach(sec => sec.classList.toggle('active', sec.id === tab));

  const s = state[tab];
  if (!s.data.length) {
    loadTab(tab, 1);
  } else {
    renderTab(tab);
  }
}


els.searchInput.addEventListener('input', (e) => {
  clearTimeout(state.searchTimeout);
  state.searchQuery = e.target.value.trim();
  state.searchTimeout = setTimeout(() => {
    loadTab(state.activeTab, 1, state.searchQuery);
  }, 450);
});


els.tabBtns.forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

els.modalClose.addEventListener('click', closeModal);
els.modalOverlay.addEventListener('click', (e) => {
  if (e.target === els.modalOverlay) closeModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});


(function init() {
  loadTab('characters', 1);
})();

// ─── API com fallback ───
const APIS = [
  'https://swapi.dev/api',
  'https://swapi.tech/api',
];
let apiBase = APIS[0];

const state = {
  activeTab: 'characters',
  searchQuery: '',
  searchTimeout: null,
  characters: { data: [], page: 1, count: 0, next: null, prev: null },
  planets:    { data: [], page: 1, count: 0, next: null, prev: null },
  ships:      { data: [], page: 1, count: 0, next: null, prev: null },
};

const els = {
  loader:       document.getElementById('loader'),
  searchInput:  document.getElementById('searchInput'),
  tabBtns:      document.querySelectorAll('.tab-btn'),
  tabSections:  document.querySelectorAll('.tab-section'),
  charGrid:     document.getElementById('characters-grid'),
  planetGrid:   document.getElementById('planets-grid'),
  shipGrid:     document.getElementById('ships-grid'),
  charCount:    document.getElementById('char-count'),
  planetCount:  document.getElementById('planet-count'),
  shipCount:    document.getElementById('ship-count'),
  charPag:      document.getElementById('char-pagination'),
  planetPag:    document.getElementById('planet-pagination'),
  shipPag:      document.getElementById('ship-pagination'),
  modalOverlay: document.getElementById('modal-overlay'),
  modal:        document.getElementById('modal'),
  modalContent: document.getElementById('modal-content'),
  modalClose:   document.getElementById('modal-close'),
};

const fmt = (val) => (val === 'unknown' || val === 'n/a' || val === null || val === undefined || val === '') ? '–' : val;
const cap = (str) => str && str !== '–' ? str.charAt(0).toUpperCase() + str.slice(1) : '–';
const num = (val) => {
  if (!val || val === 'unknown' || val === 'n/a') return '–';
  const n = Number(val);
  return isNaN(n) ? val : n.toLocaleString('pt-BR');
};

function showLoader() { els.loader.classList.remove('hidden'); }
function hideLoader() { els.loader.classList.add('hidden'); }

// ─── fetchAPI com fallback automático entre mirrors ───
async function fetchAPI(url) {
  // Tenta a URL como está
  try {
    const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const json = await resp.json();
    // swapi.tech encapsula em { result: { properties: {...} } } para itens únicos
    // mas para listas usa { results: [...] } — vamos normalizar
    if (json.result && !json.results) {
      // item único do swapi.tech
      return { results: [json.result.properties || json.result], count: 1, next: null, previous: null };
    }
    return json;
  } catch (err) {
    // Se falhou com o mirror principal, tenta o outro
    if (url.startsWith(APIS[0])) {
      console.warn('swapi.dev falhou, tentando swapi.tech...', err.message);
      const fallbackUrl = url.replace(APIS[0], APIS[1]);
      const resp2 = await fetch(fallbackUrl, { signal: AbortSignal.timeout(8000) });
      if (!resp2.ok) throw new Error(`HTTP ${resp2.status}`);
      const json2 = await resp2.json();
      if (json2.result && !json2.results) {
        return { results: [json2.result.properties || json2.result], count: 1, next: null, previous: null };
      }
      // swapi.tech lista
      if (json2.results) return json2;
      // swapi.tech pode usar { result: [...] }
      if (Array.isArray(json2.result)) {
        return { results: json2.result.map(r => r.properties || r), count: json2.count || json2.result.length, next: null, previous: null };
      }
      return json2;
    }
    throw err;
  }
}

async function loadTab(tab, page = 1, search = '') {
  showLoader();
  const endpoints = { characters: 'people', planets: 'planets', ships: 'starships' };
  const endpoint  = endpoints[tab];
  let url = `${APIS[0]}/${endpoint}/?page=${page}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;

  try {
    const json = await fetchAPI(url);
    const s = state[tab];
    s.data  = json.results || [];
    s.count = json.count   || s.data.length;
    s.next  = json.next;
    s.prev  = json.previous;
    s.page  = page;
    renderTab(tab);
  } catch (e) {
    console.error('Erro ao carregar dados:', e);
    getGrid(tab).innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-icon">⚠</div>
        <p>FALHA NA TRANSMISSÃO</p>
        <p style="margin-top:12px;font-size:0.7rem;opacity:0.6;">Verifique sua conexão ou tente novamente</p>
        <button onclick="loadTab('${tab}',${page},'${search}')" style="margin-top:16px;font-family:var(--font-display);font-size:0.65rem;letter-spacing:0.15em;color:var(--gold);background:none;border:1px solid rgba(255,232,31,0.3);padding:10px 20px;border-radius:2px;cursor:pointer;">↺ TENTAR NOVAMENTE</button>
      </div>`;
    getPag(tab).innerHTML = '';
  } finally {
    hideLoader();
  }
}

function getGrid(tab)  { return { characters: els.charGrid,   planets: els.planetGrid,  ships: els.shipGrid  }[tab]; }
function getCount(tab) { return { characters: els.charCount,  planets: els.planetCount, ships: els.shipCount }[tab]; }
function getPag(tab)   { return { characters: els.charPag,    planets: els.planetPag,   ships: els.shipPag   }[tab]; }

function renderTab(tab) {
  const s    = state[tab];
  const grid = getGrid(tab);
  const countEl = getCount(tab);
  countEl.textContent = s.count;

  if (!s.data.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">◌</div><p>NENHUM RESULTADO ENCONTRADO</p></div>`;
    getPag(tab).innerHTML = '';
    return;
  }

  grid.innerHTML = '';
  s.data.forEach((item, i) => {
    const card = tab === 'characters' ? buildCharCard(item)
               : tab === 'planets'    ? buildPlanetCard(item)
               : buildShipCard(item);
    card.style.animationDelay = `${i * 0.06}s`;
    card.addEventListener('click', () => openModal(tab, item));
    grid.appendChild(card);
  });

  renderPagination(tab);
}

function buildCharCard(c) {
  const el = document.createElement('div');
  el.className = 'card';
  el.innerHTML = `
    <div class="card-type">PERSONAGEM · SWAPI</div>
    <div class="card-name">${fmt(c.name)}</div>
    <div class="card-stats">
      <div class="stat-row"><span class="stat-label">Altura</span><span class="stat-value">${fmt(c.height)} cm</span></div>
      <div class="stat-row"><span class="stat-label">Peso</span><span class="stat-value">${fmt(c.mass)} kg</span></div>
      <div class="stat-row"><span class="stat-label">Gênero</span><span class="stat-value">${cap(fmt(c.gender))}</span></div>
      <div class="stat-row"><span class="stat-label">Ano de nascimento</span><span class="stat-value highlight">${fmt(c.birth_year)}</span></div>
    </div>
    <div class="card-footer"><button class="btn-detail">VER DETALHES →</button></div>
  `;
  return el;
}

function buildPlanetCard(p) {
  const el = document.createElement('div');
  el.className = 'card';
  el.innerHTML = `
    <div class="card-type">PLANETA · SWAPI</div>
    <div class="card-name">${fmt(p.name)}</div>
    <div class="card-stats">
      <div class="stat-row"><span class="stat-label">Clima</span><span class="stat-value">${cap(fmt(p.climate))}</span></div>
      <div class="stat-row"><span class="stat-label">Terreno</span><span class="stat-value">${cap(fmt(p.terrain))}</span></div>
      <div class="stat-row"><span class="stat-label">População</span><span class="stat-value">${num(p.population)}</span></div>
      <div class="stat-row"><span class="stat-label">Período orbital</span><span class="stat-value highlight">${fmt(p.orbital_period)} dias</span></div>
    </div>
    <div class="card-footer"><button class="btn-detail">VER DETALHES →</button></div>
  `;
  return el;
}

function buildShipCard(s) {
  const el = document.createElement('div');
  el.className = 'card';
  el.innerHTML = `
    <div class="card-type">NAVE · SWAPI</div>
    <div class="card-name">${fmt(s.name)}</div>
    <div class="card-stats">
      <div class="stat-row"><span class="stat-label">Modelo</span><span class="stat-value">${fmt(s.model)}</span></div>
      <div class="stat-row"><span class="stat-label">Classe</span><span class="stat-value">${cap(fmt(s.starship_class))}</span></div>
      <div class="stat-row"><span class="stat-label">Tripulação</span><span class="stat-value">${fmt(s.crew)}</span></div>
      <div class="stat-row"><span class="stat-label">Velocidade</span><span class="stat-value highlight">${fmt(s.max_atmosphering_speed)} km/h</span></div>
    </div>
    <div class="card-footer"><button class="btn-detail">VER DETALHES →</button></div>
  `;
  return el;
}

function openModal(tab, item) {
  els.modalContent.innerHTML = tab === 'characters' ? buildCharModal(item)
                              : tab === 'planets'    ? buildPlanetModal(item)
                              : buildShipModal(item);
  els.modalOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  els.modalOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

function stat(label, value, accent = false) {
  return `
    <div class="modal-stat">
      <div class="modal-stat-label">${label}</div>
      <div class="modal-stat-value${accent ? ' accent' : ''}">${value}</div>
    </div>
  `;
}

function buildCharModal(c) {
  // BUG CORRIGIDO: parênteses ao redor de (c.films?.length || 0)
  const filmCount = (c.films?.length || 0);
  return `
    <div class="modal-title">${fmt(c.name)}</div>
    <div class="modal-subtitle">Personagem · Galáxia Muito, Muito Distante</div>
    <hr class="modal-divider">
    <div class="modal-grid">
      ${stat('Altura', fmt(c.height) + ' cm')}
      ${stat('Peso', fmt(c.mass) + ' kg')}
      ${stat('Cor do cabelo', cap(fmt(c.hair_color)))}
      ${stat('Cor dos olhos', cap(fmt(c.eye_color)))}
      ${stat('Cor da pele', cap(fmt(c.skin_color)))}
      ${stat('Gênero', cap(fmt(c.gender)))}
      ${stat('Ano de nascimento', fmt(c.birth_year), true)}
      ${stat('Filmes', filmCount + ' aparição(ões)')}
    </div>
  `;
}

function buildPlanetModal(p) {
  return `
    <div class="modal-title">${fmt(p.name)}</div>
    <div class="modal-subtitle">Planeta · Sistema Estelar Desconhecido</div>
    <hr class="modal-divider">
    <div class="modal-grid">
      ${stat('Clima', cap(fmt(p.climate)))}
      ${stat('Terreno', cap(fmt(p.terrain)))}
      ${stat('Diâmetro', num(p.diameter) + ' km')}
      ${stat('Gravidade', fmt(p.gravity))}
      ${stat('Período de rotação', fmt(p.rotation_period) + ' h')}
      ${stat('Período orbital', fmt(p.orbital_period) + ' dias', true)}
      ${stat('Superfície de água', fmt(p.surface_water) + '%')}
      ${stat('População', num(p.population))}
    </div>
  `;
}

function buildShipModal(s) {
  return `
    <div class="modal-title">${fmt(s.name)}</div>
    <div class="modal-subtitle">${cap(fmt(s.starship_class))} · ${fmt(s.manufacturer)}</div>
    <hr class="modal-divider">
    <div class="modal-grid">
      ${stat('Modelo', fmt(s.model))}
      ${stat('Classe', cap(fmt(s.starship_class)))}
      ${stat('Fabricante', fmt(s.manufacturer))}
      ${stat('Comprimento', fmt(s.length) + ' m')}
      ${stat('Tripulação', fmt(s.crew))}
      ${stat('Passageiros', fmt(s.passengers))}
      ${stat('Vel. máx.', fmt(s.max_atmosphering_speed) + ' km/h', true)}
      ${stat('Classificação Hyperdrive', fmt(s.hyperdrive_rating))}
      ${stat('MGLT', fmt(s.MGLT))}
      ${stat('Carga', num(s.cargo_capacity) + ' kg')}
      ${stat('Consumíveis', fmt(s.consumables))}
      ${stat('Custo (créditos)', num(s.cost_in_credits))}
    </div>
  `;
}

function renderPagination(tab) {
  const s   = state[tab];
  const pag = getPag(tab);
  const totalPages = Math.ceil(s.count / 10);
  if (totalPages <= 1) { pag.innerHTML = ''; return; }

  let html = '';
  html += `<button class="page-btn" data-page="${s.page - 1}" ${s.page <= 1 ? 'disabled' : ''}>← ANTERIOR</button>`;
  html += `<span class="page-info">${s.page} / ${totalPages}</span>`;
  html += `<button class="page-btn" data-page="${s.page + 1}" ${s.page >= totalPages ? 'disabled' : ''}>PRÓXIMA →</button>`;
  pag.innerHTML = html;

  pag.querySelectorAll('.page-btn:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = parseInt(btn.dataset.page);
      loadTab(tab, page, state.searchQuery);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

function switchTab(tab) {
  state.activeTab = tab;
  state.searchQuery = '';
  els.searchInput.value = '';

  els.tabBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));
  els.tabSections.forEach(sec => sec.classList.toggle('active', sec.id === tab));

  const s = state[tab];
  if (!s.data.length) {
    loadTab(tab, 1);
  } else {
    renderTab(tab);
  }
}

els.searchInput.addEventListener('input', (e) => {
  clearTimeout(state.searchTimeout);
  state.searchQuery = e.target.value.trim();
  state.searchTimeout = setTimeout(() => {
    loadTab(state.activeTab, 1, state.searchQuery);
  }, 450);
});

els.tabBtns.forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

els.modalClose.addEventListener('click', closeModal);
els.modalOverlay.addEventListener('click', (e) => {
  if (e.target === els.modalOverlay) closeModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

(function init() {
  loadTab('characters', 1);
})();