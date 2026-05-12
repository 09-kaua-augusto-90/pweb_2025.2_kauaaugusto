/**
 * config.js — Configurações globais da aplicação
 * Altere apenas este arquivo para ajustar a API ou comportamentos.
 */

const CONFIG = Object.freeze({
    API_KEY:     '19377c18ecf4f909f4d477964954b08f',
    BASE_URL:    'https://api.themoviedb.org/3',
    IMG_URL:     'https://image.tmdb.org/t/p/w500',
    BACK_URL:    'https://image.tmdb.org/t/p/w1280',
    PLACEHOLDER: 'https://placehold.co/300x450/181818/555?text=Sem+Poster',
    LANGUAGE:    'pt-BR',
    DEBOUNCE_MS: 420,

    TABS: {
        popular:     'EM ALTA AGORA',
        top_rated:   'MELHORES AVALIADOS',
        now_playing: 'EM CARTAZ',
        upcoming:    'EM BREVE',
    },
});
/**
 * api.js — Camada de comunicação com a TMDB API
 * Todas as chamadas fetch ficam centralizadas aqui.
 */

const API = (() => {
    const { API_KEY, BASE_URL, LANGUAGE } = CONFIG;

    /**
     * Fetch genérico com tratamento de erro.
     * @param {string} endpoint - endpoint relativo (ex: '/movie/popular')
     * @param {Object} params   - query params extras
     */
    async function _get(endpoint, params = {}) {
        const url = new URL(`${BASE_URL}${endpoint}`);
        url.searchParams.set('api_key', API_KEY);
        url.searchParams.set('language', LANGUAGE);
        Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.statusText}`);
        return res.json();
    }

    return {
        /**
         * Lista filmes por categoria ou busca.
         * @param {string} query - texto de busca (vazio = lista por categoria)
         * @param {string} tab   - popular | top_rated | now_playing | upcoming
         */
        async getMovies(query = '', tab = 'popular') {
            if (query.trim()) {
                return _get('/search/movie', { query: query.trim() });
            }
            return _get(`/movie/${tab}`);
        },

        /**
         * Detalhes completos de um filme.
         */
        async getMovieDetails(id) {
            return _get(`/movie/${id}`);
        },

        /**
         * Vídeos (trailers) de um filme.
         */
        async getMovieVideos(id) {
            return _get(`/movie/${id}/videos`);
        },

        /**
         * Créditos (elenco e direção) de um filme.
         */
        async getMovieCredits(id) {
            return _get(`/movie/${id}/credits`);
        },

        /**
         * Busca tudo de uma vez (detalhes + vídeos + créditos).
         */
        async getMovieFull(id) {
            const [movie, videos, credits] = await Promise.all([
                API.getMovieDetails(id),
                API.getMovieVideos(id),
                API.getMovieCredits(id),
            ]);
            return { movie, videos, credits };
        },
    };
})();
/**
 * render.js — Funções de renderização de cards e estados
 */

const Render = (() => {
    const { IMG_URL, PLACEHOLDER } = CONFIG;

    /**
     * Renderiza a grade de filmes no container.
     * @param {Array}  movies    - array de objetos de filme da TMDB
     * @param {string} container - seletor ou elemento do grid
     */
    function movieGrid(movies, container) {
        container.innerHTML = '';
        container.setAttribute('aria-busy', 'false');

        movies.forEach((movie, index) => {
            const card = _buildCard(movie, index);
            container.appendChild(card);
        });
    }

    /**
     * Constrói um card de filme.
     */
    function _buildCard(movie, index) {
        const card = document.createElement('article');
        card.className = 'movie-card';
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', `Ver detalhes de ${movie.title}`);
        card.style.animationDelay = `${Math.min(index * 0.04, 0.5)}s`;

        const poster = movie.poster_path
            ? `${IMG_URL}${movie.poster_path}`
            : PLACEHOLDER;

        const year = movie.release_date
            ? movie.release_date.slice(0, 4)
            : '—';

        const score = typeof movie.vote_average === 'number'
            ? movie.vote_average.toFixed(1)
            : '—';

        const synopsis = movie.overview || 'Sem sinopse disponível.';

        card.innerHTML = `
            <div class="card-poster">
                <img
                    src="${_esc(poster)}"
                    alt="Pôster de ${_esc(movie.title)}"
                    loading="lazy"
                    decoding="async"
                >
                <div class="rating-badge" aria-label="Nota ${score}">★ ${score}</div>
                <div class="card-hover-overlay" aria-hidden="true">
                    <p class="overlay-synopsis">${_esc(synopsis)}</p>
                    <button class="overlay-btn">Ver detalhes + trailer</button>
                </div>
            </div>
            <div class="card-info">
                <div class="card-title" title="${_esc(movie.title)}">${_esc(movie.title)}</div>
                <div class="card-year">${year}</div>
            </div>
        `;

        return card;
    }

    /**
     * Mostra estado de erro inline no grid.
     */
    function error(container, message = 'Erro ao carregar filmes.', onRetry) {
        container.setAttribute('aria-busy', 'false');
        container.innerHTML = `
            <div class="inline-error">
                <p>⚠️ ${_esc(message)}</p>
                ${onRetry ? `<button class="btn-retry">Tentar novamente</button>` : ''}
            </div>
        `;
        if (onRetry) {
            container.querySelector('.btn-retry')?.addEventListener('click', onRetry);
        }
    }

    /**
     * Escapa HTML para evitar XSS.
     */
    function _esc(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    return { movieGrid, error };
})();
/**
 * modal.js — Controle completo do modal de detalhes
 * Gerencia abertura, fechamento, renderização de sinopse e trailer.
 */

const Modal = (() => {
    const { BACK_URL, IMG_URL } = CONFIG;

    const backdrop = document.getElementById('modalBackdrop');
    const modalBox = document.getElementById('modalBox');
    const content  = document.getElementById('modalContent');

    let _currentMovieId = null;
    let _movieData      = null; // cache do filme aberto

    // ── Abrir ──────────────────────────────────────────────────
    async function open(movieId) {
        _currentMovieId = movieId;
        _showLoading();
        _revealBackdrop();

        try {
            const { movie, videos, credits } = await API.getMovieFull(movieId);
            _movieData = { movie, videos, credits };
            _renderDetails(movie, videos, credits);
        } catch (err) {
            _renderError();
        }
    }

    // ── Fechar ─────────────────────────────────────────────────
    function close() {
        backdrop.classList.remove('open');
        setTimeout(() => {
            backdrop.classList.add('hidden');
            content.innerHTML = '';
            _currentMovieId = null;
            _movieData = null;
            document.body.style.overflow = '';
        }, 300);
    }

    // ── Exibir trailer ─────────────────────────────────────────
    function showTrailer(key) {
        if (!key) return;

        content.innerHTML = `
            <div class="trailer-wrap">
                <button class="trailer-back-btn" id="trailerBackBtn">
                    ← Voltar
                </button>
                <iframe
                    src="https://www.youtube.com/embed/${_escKey(key)}?autoplay=1&rel=0&modestbranding=1"
                    title="Trailer"
                    allow="autoplay; fullscreen"
                    allowfullscreen
                ></iframe>
            </div>
        `;

        document.getElementById('trailerBackBtn').addEventListener('click', () => {
            if (_movieData) {
                const { movie, videos, credits } = _movieData;
                _renderDetails(movie, videos, credits);
            }
        });
    }

    // ── Render: estado de carregamento ─────────────────────────
    function _showLoading() {
        content.innerHTML = `
            <div class="modal-loading">
                <div class="spinner" role="status">
                    <span class="sr-only">Carregando...</span>
                </div>
                <span aria-hidden="true">Carregando...</span>
            </div>
        `;
    }

    // ── Render: detalhes do filme ───────────────────────────────
    function _renderDetails(movie, videos, credits) {
        const trailer    = _findTrailer(videos);
        const backdropImg = movie.backdrop_path
            ? `${BACK_URL}${movie.backdrop_path}`
            : (movie.poster_path ? `${IMG_URL}${movie.poster_path}` : '');

        const year     = movie.release_date ? movie.release_date.slice(0, 4) : '—';
        const runtime  = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : '';
        const pct      = movie.vote_average ? `${(movie.vote_average * 10).toFixed(0)}%` : '—';
        const genres   = (movie.genres || []).map(g => `<span class="genre-tag">${_esc(g.name)}</span>`).join('');
        const cast     = (credits.cast || []).slice(0, 8).map(a => _esc(a.name)).join(', ');
        const director = (credits.crew || []).find(c => c.job === 'Director');
        const score    = typeof movie.vote_average === 'number' ? movie.vote_average.toFixed(1) : '—';

        content.innerHTML = `
            <!-- Hero Banner -->
            <div class="modal-hero" style="background-image: url('${_escUrl(backdropImg)}')">
                <button class="modal-close-btn" id="modalCloseBtn" aria-label="Fechar modal">✕</button>

                ${score !== '—' ? `
                <div class="hero-rating" aria-label="Nota ${score}">★ ${score}/10</div>
                ` : ''}

                <div class="hero-actions">
                    ${trailer ? `
                        <button class="btn-play" id="playTrailerBtn" aria-label="Assistir trailer de ${_esc(movie.title)}">
                            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                                <polygon points="5,3 19,12 5,21"/>
                            </svg>
                            Assistir Trailer
                        </button>
                    ` : `
                        <div class="btn-notrailer" aria-label="Trailer indisponível">
                            <span>🎬</span> Trailer indisponível
                        </div>
                    `}
                </div>
            </div>

            <!-- Corpo do Modal -->
            <div class="modal-body">
                <h2 class="modal-movie-title" id="modalMovieTitle">${_esc(movie.title)}</h2>

                <div class="modal-meta" aria-label="Informações do filme">
                    <span class="meta-score-green">★ ${pct} aprovação</span>
                    ${year     ? `<span class="meta-chip">${year}</span>` : ''}
                    ${runtime  ? `<span class="meta-chip">${runtime}</span>` : ''}
                    ${movie.original_language ? `<span class="meta-chip">${movie.original_language.toUpperCase()}</span>` : ''}
                </div>

                ${movie.tagline ? `<p class="modal-tagline">"${_esc(movie.tagline)}"</p>` : ''}

                <!-- Sinopse -->
                <div class="info-section">
                    <h4>SINOPSE</h4>
                    <p>${_esc(movie.overview || 'Sem sinopse disponível para este filme.')}</p>
                </div>

                ${genres ? `
                <!-- Gêneros -->
                <div class="info-section">
                    <h4>GÊNEROS</h4>
                    <div class="genre-list">${genres}</div>
                </div>` : ''}

                ${director ? `
                <!-- Direção -->
                <div class="info-section">
                    <h4>DIREÇÃO</h4>
                    <p>${_esc(director.name)}</p>
                </div>` : ''}

                ${cast ? `
                <!-- Elenco -->
                <div class="info-section">
                    <h4>ELENCO PRINCIPAL</h4>
                    <p>${cast}</p>
                </div>` : ''}

                <!-- Stats -->
                <div class="stats-row" role="list" aria-label="Estatísticas do filme">
                    <div class="stat-item" role="listitem">
                        <strong>${pct}</strong> aprovação
                    </div>
                    ${movie.vote_count ? `
                    <div class="stat-item" role="listitem">
                        <strong>${movie.vote_count.toLocaleString('pt-BR')}</strong> votos
                    </div>` : ''}
                    ${movie.budget ? `
                    <div class="stat-item" role="listitem">
                        <strong>${_formatCurrency(movie.budget)}</strong> orçamento
                    </div>` : ''}
                    ${movie.revenue ? `
                    <div class="stat-item" role="listitem">
                        <strong>${_formatCurrency(movie.revenue)}</strong> bilheteria
                    </div>` : ''}
                </div>
            </div>
        `;

        // Events
        document.getElementById('modalCloseBtn').addEventListener('click', close);
        if (trailer) {
            document.getElementById('playTrailerBtn').addEventListener('click', () => {
                showTrailer(trailer.key);
            });
        }
    }

    // ── Render: erro ───────────────────────────────────────────
    function _renderError() {
        content.innerHTML = `
            <button class="modal-close-btn" id="modalCloseBtn" style="top:1rem;right:1rem;position:absolute">✕</button>
            <div class="modal-error">⚠️ Erro ao carregar detalhes do filme.</div>
        `;
        document.getElementById('modalCloseBtn').addEventListener('click', close);
    }

    // ── Internos ───────────────────────────────────────────────
    function _revealBackdrop() {
        document.body.style.overflow = 'hidden';
        backdrop.classList.remove('hidden');
        requestAnimationFrame(() => backdrop.classList.add('open'));
    }

    function _findTrailer(videos) {
        const results = videos?.results || [];
        return (
            results.find(v => v.type === 'Trailer' && v.site === 'YouTube' && v.iso_639_1 === 'pt') ||
            results.find(v => v.type === 'Trailer' && v.site === 'YouTube') ||
            results.find(v => v.site === 'YouTube')
        );
    }

    function _esc(str) {
        return String(str)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function _escUrl(url) {
        return encodeURI(url).replace(/'/g, '%27');
    }

    function _escKey(key) {
        return encodeURIComponent(key);
    }

    function _formatCurrency(val) {
        if (!val) return '—';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency', currency: 'USD', maximumFractionDigits: 0,
        }).format(val);
    }

    // ── Init eventos ───────────────────────────────────────────
    backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) close();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !backdrop.classList.contains('hidden')) {
            close();
        }
    });

    return { open, close, showTrailer };
})();
/**
 * app.js — Controlador principal da aplicação
 * Inicializa eventos, gerencia estado da UI e orquestra os módulos.
 */

const App = (() => {
    // ── DOM refs ────────────────────────────────────────────────
    const grid        = document.getElementById('movieContainer');
    const loader      = document.getElementById('loader');
    const emptyState  = document.getElementById('emptyState');
    const searchInput = document.getElementById('searchInput');
    const clearBtn    = document.getElementById('clearBtn');
    const sectionTitle= document.getElementById('sectionTitle');
    const tabBtns     = document.querySelectorAll('.tab-btn');

    // ── Estado ──────────────────────────────────────────────────
    let state = {
        currentTab:   'popular',
        currentQuery: '',
        debounceTimer: null,
    };

    // ── Carregar filmes ─────────────────────────────────────────
    async function loadMovies(query = '', tab = state.currentTab) {
        _setLoading(true);
        emptyState.classList.add('hidden');
        grid.innerHTML = '';

        try {
            const data = await API.getMovies(query, tab);

            if (!data.results?.length) {
                emptyState.classList.remove('hidden');
                return;
            }

            Render.movieGrid(data.results, grid);
            _bindCardEvents();

        } catch (err) {
            Render.error(grid, 'Falha ao conectar com o servidor.', () => loadMovies(query, tab));
        } finally {
            _setLoading(false);
        }
    }

    // ── Bind eventos nos cards ──────────────────────────────────
    function _bindCardEvents() {
        grid.querySelectorAll('.movie-card').forEach(card => {
            const open = () => {
                const index = Array.from(grid.children).indexOf(card);
                const movieId = card.dataset.movieId;
                if (movieId) Modal.open(Number(movieId));
            };

            card.addEventListener('click', open);
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
            });
        });
    }

    // ── Recriar com IDs nos cards (necessário para bind) ────────
    // Override do Render.movieGrid para injetar data-movie-id
    const _originalGrid = Render.movieGrid.bind(Render);

    Render.movieGrid = function(movies, container) {
        _originalGrid(movies, container);
        // Injeta data-movie-id em cada card
        container.querySelectorAll('.movie-card').forEach((card, i) => {
            card.dataset.movieId = movies[i].id;
        });
    };

    // ── Loading state ───────────────────────────────────────────
    function _setLoading(show) {
        loader.classList.toggle('hidden', !show);
        grid.setAttribute('aria-busy', String(show));
    }

    // ── Título da seção ─────────────────────────────────────────
    function _updateTitle(query) {
        const { TABS } = CONFIG;
        sectionTitle.textContent = query
            ? `RESULTADOS PARA "${query.toUpperCase()}"`
            : (TABS[state.currentTab] || 'FILMES');
    }

    // ── Eventos: tabs ───────────────────────────────────────────
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.dataset.tab === state.currentTab && !state.currentQuery) return;

            tabBtns.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-selected', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');

            state.currentTab   = btn.dataset.tab;
            state.currentQuery = '';
            searchInput.value  = '';
            clearBtn.hidden    = true;

            _updateTitle('');
            loadMovies('', state.currentTab);
        });
    });

    // ── Eventos: busca ──────────────────────────────────────────
    searchInput.addEventListener('input', (e) => {
        const q = e.target.value;
        clearBtn.hidden = !q;

        clearTimeout(state.debounceTimer);
        state.debounceTimer = setTimeout(() => {
            state.currentQuery = q.trim();
            _updateTitle(state.currentQuery);
            loadMovies(state.currentQuery);
        }, CONFIG.DEBOUNCE_MS);
    });

    clearBtn.addEventListener('click', () => {
        searchInput.value  = '';
        clearBtn.hidden    = true;
        state.currentQuery = '';
        _updateTitle('');
        loadMovies('', state.currentTab);
        searchInput.focus();
    });

    // ── Init ────────────────────────────────────────────────────
    function init() {
        loadMovies();
    }

    return { init };
})();

// Iniciar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => App.init());