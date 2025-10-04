    /* =========================
    L4DZone – JS unificado
    - Modal dinámico (FAQ/Rules/etc.)
    - Header shrink on scroll
    - Jamendo + Howler (Search / Enable Audio / Now Playing)
    - Mini-juego “Jugar” en el panel derecho
    ========================= */

    /* ========== Utilidades Modal ========== */
    (() => {
    const normalizeKey = (text) => text.trim().toLowerCase().replace(/\s+/g, "_");
    const $ = (s) => document.querySelector(s);

    function clearDynamicAssets() {
        document.querySelectorAll("[data-dynamic-css]").forEach((el) => el.remove());
        document.querySelectorAll("[data-dynamic-js]").forEach((el) => el.remove());
    }

    async function loadSection(section) {
        clearDynamicAssets();

        // activa botón en barra del modal y en nav
        document.querySelectorAll(".modal-nav-bar button").forEach((btn) => {
        btn.classList.toggle(
            "active",
            normalizeKey(btn.textContent) === normalizeKey(section)
        );
        });
        document.querySelectorAll("#menu button").forEach((btn) => {
        btn.classList.toggle(
            "active",
            normalizeKey(btn.textContent) === normalizeKey(section)
        );
        });

        try {
        const resp = await fetch(`Barra_Superior/${section}.html`);
        if (!resp.ok) throw new Error(`Failed to load HTML for ${section}: ${resp.status}`);
        const html = await resp.text();
        $("#modalBody").innerHTML = html;

        const css = document.createElement("link");
        css.rel = "stylesheet";
        css.href = `Barra_Superior/${section}.css`;
        css.setAttribute("data-dynamic-css", "true");
        document.head.appendChild(css);

        const js = document.createElement("script");
        js.src = `Barra_Superior/${section}.js`;
        js.defer = true;
        js.setAttribute("data-dynamic-js", "true");
        document.body.appendChild(js);
        } catch (e) {
        $("#modalBody").innerHTML = "<p style='color:#f88;'>Error loading content.</p>";
        console.error(e);
        }
    }

    window.openModal = function (section) {
        const overlay = $("#modalOverlay");
        overlay.style.display = "flex";
        loadSection(section);
    };

    window.closeModal = function () {
        const overlay = $("#modalOverlay");
        const body = $("#modalBody");
        overlay.style.display = "none";
        if (body) body.innerHTML = "";
        clearDynamicAssets();
    };

    // Header shrink on scroll
    window.addEventListener("scroll", () => {
        const header = document.querySelector("header");
        if (!header) return;
        header.style.height = window.scrollY > 50 ? "60px" : "90px";
    });
    })();

    /* ========== Música: Jamendo + Howler ========== */
    (() => {
    // ⚠️ Reemplaza con tu Client ID real
    const JAMENDO_CLIENT_ID = "YOUR_JAMENDO_CLIENT_ID";

    let currentSound = null;
    let userInteracted = false;

    const $ = (s) => document.querySelector(s);
    const fmt = (sec = 0) => {
        const m = Math.floor(sec / 60),
        s = Math.floor(sec % 60);
        return `${m}:${String(s).padStart(2, "0")}`;
    };
    const ensureGesture = () => (userInteracted = true);

    function showNowPlaying(track) {
        $("#now-playing").classList.remove("hidden");
        $("#np-title").textContent = track.name || "—";
        $("#np-artist").textContent = track.artist_name || track.artist || "—";
        $("#np-duration").textContent = fmt(track.duration || 0);
    }

    function playTrack(track) {
        ensureGesture();
        if (currentSound) currentSound.stop();

        const src = track.audio || track.audio_download;
        if (!src) {
        alert("This track has no audio source.");
        return;
        }

        currentSound = new Howl({
        src: [src],
        html5: true,
        volume: 0.5,
        onplayerror() {
            console.warn("Playback blocked; needs user gesture.");
        },
        });
        currentSound.play();
        showNowPlaying(track);

        $("#pause-btn").onclick = () => {
        if (!currentSound) return;
        currentSound.playing() ? currentSound.pause() : currentSound.play();
        };
        $("#stop-btn").onclick = () => currentSound && currentSound.stop();
    }

    async function jamendoSearch(q) {
        const url = `https://api.jamendo.com/v3.0/tracks/?client_id=${encodeURIComponent(
        JAMENDO_CLIENT_ID
        )}&format=json&limit=10&order=popularity_total&search=${encodeURIComponent(
        q
        )}&audioformat=mp32`;
        try {
        const r = await fetch(url);
        const j = await r.json();
        return j.results || [];
        } catch (e) {
        console.error("Jamendo API error:", e);
        return [];
        }
    }

    function renderResults(list) {
        const wrap = $("#results");
        wrap.innerHTML = "";
        if (!list.length) {
        wrap.textContent = "No results found.";
        return;
        }
        list.forEach((t) => {
        const row = document.createElement("div");
        row.className = "track";
        row.innerHTML = `
            <div class="track-info">
            <div><strong>${t.name}</strong></div>
            <div>by ${t.artist_name || t.artist || "Unknown"}</div>
            <div class="status">Duration: ${fmt(t.duration || 0)}</div>
            </div>
        `;
        const btn = document.createElement("button");
        btn.textContent = "Select";
        btn.onclick = () => playTrack(t);
        row.appendChild(btn);
        wrap.appendChild(row);
        });
    }

    function wireMusicUI() {
        const searchBtn = $("#search-btn");
        const enableBtn = $("#enable-audio-btn");
        const query = $("#track-query");

        enableBtn?.addEventListener("click", ensureGesture);

        async function doSearch() {
        const q = (query.value || "").trim();
        if (!q) return;
        if (!JAMENDO_CLIENT_ID || JAMENDO_CLIENT_ID === "YOUR_JAMENDO_CLIENT_ID") {
            alert("Add your Jamendo client_id to enable search.");
            return;
        }
        $("#results").textContent = "Searching…";
        const res = await jamendoSearch(q);
        renderResults(res);
        }

        searchBtn?.addEventListener("click", doSearch);
        query?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") doSearch();
        });
    }

    document.addEventListener("DOMContentLoaded", wireMusicUI);
    })();

    /* ========== Mini-juego (canvas) – Geometry Dash vibe ========== */
    (() => {
    const $ = (s) => document.querySelector(s);

    // Inyecta estilos para hacer el panel largo + look neón/espacial sin tocar tus CSS
    function injectGameStyles() {
        if (document.getElementById("l4dzone-game-styles")) return;
        const css = `
        .top-row{display:grid;grid-template-columns:3fr 1fr;gap:16px}
        #music-panel{grid-column:1/2}
        #play-card{grid-column:1/-1}
        .play-card{background:#06080f;border:1px solid rgba(0,255,255,.15);
            box-shadow:0 0 24px rgba(0,255,255,.12),inset 0 0 60px rgba(0,0,0,.7);border-radius:18px}
        .play-card-header{display:flex;justify-content:space-between;align-items:center;
            padding:12px 16px;border-bottom:1px solid rgba(0,255,255,.08)}
        #start-game-btn,#restart-btn{background:linear-gradient(90deg,#00eaff,#008cff);color:#061018;border:none;
            border-radius:10px;padding:8px 14px;font-weight:700;cursor:pointer;
            box-shadow:0 0 14px rgba(0,200,255,.35);transition:transform .15s ease,box-shadow .2s ease}
        #start-game-btn:hover,#restart-btn:hover{transform:translateY(-1px);box-shadow:0 0 18px rgba(0,200,255,.55)}
        .game-panel{padding:10px 12px}
        .game-wrap{position:relative;border-radius:14px;overflow:hidden;
            background:radial-gradient(1200px 400px at 10% -10%,rgba(0,150,255,.15),transparent 45%),
                    radial-gradient(1000px 500px at 90% 120%,rgba(0,255,200,.12),transparent 50%),#05070f;
            border:1px solid rgba(0,255,255,.08);box-shadow:inset 0 0 40px rgba(0,0,0,.65),0 0 20px rgba(0,140,255,.12)}
        .game-wrap canvas{width:100%;height:auto;display:block}
        .hud{position:absolute;top:6px;left:10px;font-family:'Space Grotesk',system-ui,Segoe UI,Roboto,sans-serif;
            font-weight:700;font-size:14px;color:#aee8ff;display:flex;gap:10px}
        .hud .go{color:#ff6b6b;margin-left:8px}
        `;
        const style = document.createElement("style");
        style.id = "l4dzone-game-styles";
        style.textContent = css;
        document.head.appendChild(style);
    }

    function wireGame() {
        const panel = $("#game-panel");
        const start = $("#start-game-btn");
        const scoreEl = $("#score");
        const go = $("#game-over");
        const restart = $("#restart-btn");
        const canvas = $("#waiting-game");
        if (!canvas) return;

        injectGameStyles();

        const ctx = canvas.getContext("2d", { alpha: false });
        let raf, playing = false, holdJump = false;

        // Estado
        let score = 0;
        let speed = 2.6;       // velocidad inicial
        let spawnTimer = 0;
        let obstacles = [];
        let starsFar = [], starsNear = [];

        const GROUND_H = 18;

        const player = {
        x: 36, y: 0, w: 22, h: 22,
        dy: 0, g: 0.78, jumpForce: -13.2,
        grounded: true,
        reset() {
            this.y = canvas.height - GROUND_H - this.h;
            this.dy = 0;
            this.grounded = true;
        },
        update() {
            if (holdJump && this.grounded) this.dy = this.jumpForce;
            this.dy += this.g;
            this.y += this.dy;
            const floorY = canvas.height - GROUND_H - this.h;
            if (this.y > floorY) { this.y = floorY; this.dy = 0; this.grounded = true; }
            else this.grounded = false;
        },
        draw() {
            ctx.globalAlpha = 0.25;
            ctx.fillStyle = "#1de3ff";
            ctx.fillRect(this.x - 8, this.y + 4, this.w, this.h - 8);
            ctx.globalAlpha = 1;
            ctx.fillStyle = "#6fe3ff";
            ctx.fillRect(this.x, this.y, this.w, this.h);
            ctx.strokeStyle = "rgba(0,255,255,.7)";
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x + .5, this.y + .5, this.w - 1, this.h - 1);
        },
        jump() { if (this.grounded) this.dy = this.jumpForce; }
        };

        class Obstacle {
        constructor(type, baseSpeed) {
            this.type = type; // 'spike' | 'block'
            this.size = type === "spike" ? (22 + Math.random() * 10) : (24 + Math.random() * 8);
            this.w = this.size; this.h = this.size;
            this.x = canvas.width + 10;
            this.y = canvas.height - GROUND_H - this.h;
            this.v = baseSpeed;
            this.color = type === "spike" ? "#54b9ff" : "#9bf0ff";
        }
        update(v) { this.x -= v; }
        off() { return this.x + this.w < -40; }
        hit(p) {
            return !(p.x + p.w < this.x || p.x > this.x + this.w || p.y + p.h < this.y || p.y > this.y + this.h);
        }
        draw() {
            ctx.fillStyle = this.color;
            if (this.type === "spike") {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y + this.h);
            ctx.lineTo(this.x + this.w / 2, this.y);
            ctx.lineTo(this.x + this.w, this.y + this.h);
            ctx.closePath();
            ctx.fill();
            } else {
            ctx.fillRect(this.x, this.y, this.w, this.h);
            }
            ctx.strokeStyle = "rgba(0,255,255,.6)";
            ctx.lineWidth = 1.5;
            ctx.strokeRect(this.x + .5, this.y + .5, this.w - 1, this.h - 1);
        }
        }

        function seedStars() {
        starsFar = Array.from({ length: Math.max(40, Math.floor(canvas.width / 18)) }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: Math.random() * 1.2 + 0.3
        }));
        starsNear = Array.from({ length: Math.max(20, Math.floor(canvas.width / 36)) }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: Math.random() * 1.8 + 0.6
        }));
        }

        function drawSpace(dt) {
        ctx.fillStyle = "#05070f";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#96dfff";
        starsFar.forEach(s => {
            s.x -= speed * 0.25 * dt;
            if (s.x < -2) s.x = canvas.width + 2;
            ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
        });

        ctx.fillStyle = "#c7f7ff";
        starsNear.forEach(s => {
            s.x -= speed * 0.55 * dt;
            if (s.x < -2) s.x = canvas.width + 2;
            ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
        });

        const gy = canvas.height - 18;
        ctx.fillStyle = "#0a101d";
        ctx.fillRect(0, gy, canvas.width, 18);
        ctx.fillStyle = "rgba(0,200,255,.12)";
        ctx.fillRect(0, gy - 6, canvas.width, 6);
        }

        function reset() {
        score = 0;
        speed = 2.6;
        spawnTimer = 0;
        obstacles = [];
        go.classList.add("hidden");
        scoreEl.textContent = "0";
        player.reset();
        playing = true;
        lastTs = performance.now();
        seedStars();
        loop(lastTs);
        }

        function fitCanvas() {
        const r = canvas.getBoundingClientRect();
        canvas.width  = Math.max(720, Math.floor(r.width)); // mapa largo
        canvas.height = 220;                                 // un poco más alto
        seedStars();
        }

        // Input
        window.addEventListener("keydown", (e) => {
        if (e.code === "Space") { holdJump = true; player.jump(); e.preventDefault(); }
        });
        window.addEventListener("keyup", (e) => { if (e.code === "Space") holdJump = false; });
        canvas.addEventListener("mousedown", () => { holdJump = true; player.jump(); });
        window.addEventListener("mouseup",   () => { holdJump = false; });

        start.addEventListener("click", () => {
        panel.classList.remove("hidden");
        fitCanvas();
        reset();
        });
        restart.addEventListener("click", () => { fitCanvas(); reset(); });
        window.addEventListener("resize", () => { if (playing) fitCanvas(); });

        // Game loop con delta-time
        let lastTs = 0;
        function loop(ts) {
        if (!playing) return;
        const dt = Math.min(1.5, (ts - lastTs) / 16.6667) || 1; // ~60fps
        lastTs = ts;

        // acelera suavemente (ajusta el factor si quieres más velocidad)
        speed += 0.0015 * dt;

        // spawn
        spawnTimer -= dt;
        if (spawnTimer <= 0) {
            const type = Math.random() < 0.65 ? "spike" : "block";
            obstacles.push(new Obstacle(type, speed));
            const baseGap = type === "spike" ? 60 : 80;
            spawnTimer = Math.max(26, baseGap - speed * 6);
        }

        // update
        player.update();
        obstacles.forEach(o => o.update(speed * dt));
        obstacles = obstacles.filter(o => !o.off());

        // collisions
        for (const o of obstacles) if (o.hit(player)) return end();

        // score
        score += 0.25 * dt;
        scoreEl.textContent = Math.floor(score);

        // draw
        drawSpace(dt);
        obstacles.forEach(o => o.draw());
        player.draw();

        raf = requestAnimationFrame(loop);
        }

        function end() {
        playing = false;
        cancelAnimationFrame(raf);
        go.classList.remove("hidden");
        }
    }

    document.addEventListener("DOMContentLoaded", wireGame);
    })();
    /* =========================
    L4DZone – JS unificado
    - Modal dinámico (FAQ/Rules/etc.)
    - Header shrink on scroll
    - Jamendo + Howler (Search / Enable Audio / Now Playing)
    - Mini-juego “Jugar” (Geometry Dash vibe)
    - Layout 3 columnas: Música (1/4) + Party (1/4) + Juego (1/2)
    ========================= */

    /* ========== Utilidades Modal ========== */
    (() => {
    const normalizeKey = (text) => text.trim().toLowerCase().replace(/\s+/g, "_");
    const $ = (s) => document.querySelector(s);

    function clearDynamicAssets() {
        document.querySelectorAll("[data-dynamic-css]").forEach((el) => el.remove());
        document.querySelectorAll("[data-dynamic-js]").forEach((el) => el.remove());
    }

    async function loadSection(section) {
        clearDynamicAssets();

        document.querySelectorAll(".modal-nav-bar button").forEach((btn) => {
        btn.classList.toggle("active", normalizeKey(btn.textContent) === normalizeKey(section));
        });
        document.querySelectorAll("#menu button").forEach((btn) => {
        btn.classList.toggle("active", normalizeKey(btn.textContent) === normalizeKey(section));
        });

        try {
        const resp = await fetch(`Barra_Superior/${section}.html`);
        if (!resp.ok) throw new Error(`Failed to load HTML for ${section}: ${resp.status}`);
        const html = await resp.text();
        $("#modalBody").innerHTML = html;

        const css = document.createElement("link");
        css.rel = "stylesheet";
        css.href = `Barra_Superior/${section}.css`;
        css.setAttribute("data-dynamic-css", "true");
        document.head.appendChild(css);

        const js = document.createElement("script");
        js.src = `Barra_Superior/${section}.js`;
        js.defer = true;
        js.setAttribute("data-dynamic-js", "true");
        document.body.appendChild(js);
        } catch (e) {
        $("#modalBody").innerHTML = "<p style='color:#f88;'>Error loading content.</p>";
        console.error(e);
        }
    }

    window.openModal = function (section) {
        $("#modalOverlay").style.display = "flex";
        loadSection(section);
    };

    window.closeModal = function () {
        const overlay = $("#modalOverlay");
        const body = $("#modalBody");
        overlay.style.display = "none";
        if (body) body.innerHTML = "";
        clearDynamicAssets();
    };

    window.addEventListener("scroll", () => {
        const header = document.querySelector("header");
        if (!header) return;
        header.style.height = window.scrollY > 50 ? "60px" : "90px";
    });
    })();

    /* ========== Música: Jamendo + Howler ========== */
    (() => {
    const JAMENDO_CLIENT_ID = "YOUR_JAMENDO_CLIENT_ID";

    let currentSound = null;
    let userInteracted = false;

    const $ = (s) => document.querySelector(s);
    const fmt = (sec = 0) => {
        const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
        return `${m}:${String(s).padStart(2, "0")}`;
    };
    const ensureGesture = () => (userInteracted = true);

    function showNowPlaying(track) {
        $("#now-playing").classList.remove("hidden");
        $("#np-title").textContent = track.name || "—";
        $("#np-artist").textContent = track.artist_name || track.artist || "—";
        $("#np-duration").textContent = fmt(track.duration || 0);
    }

    function playTrack(track) {
        ensureGesture();
        if (currentSound) currentSound.stop();

        const src = track.audio || track.audio_download;
        if (!src) {
        alert("This track has no audio source.");
        return;
        }

        currentSound = new Howl({
        src: [src],
        html5: true,
        volume: 0.5,
        onplayerror() {
            console.warn("Playback blocked; needs user gesture.");
        },
        });
        currentSound.play();
        showNowPlaying(track);

        $("#pause-btn").onclick = () => {
        if (!currentSound) return;
        currentSound.playing() ? currentSound.pause() : currentSound.play();
        };
        $("#stop-btn").onclick = () => currentSound && currentSound.stop();
    }

    async function jamendoSearch(q) {
        const url = `https://api.jamendo.com/v3.0/tracks/?client_id=${encodeURIComponent(
        JAMENDO_CLIENT_ID
        )}&format=json&limit=10&order=popularity_total&search=${encodeURIComponent(q)}&audioformat=mp32`;
        try {
        const r = await fetch(url);
        const j = await r.json();
        return j.results || [];
        } catch (e) {
        console.error("Jamendo API error:", e);
        return [];
        }
    }

    function renderResults(list) {
        const wrap = $("#results");
        wrap.innerHTML = "";
        if (!list.length) {
        wrap.textContent = "No results found.";
        return;
        }
        list.forEach((t) => {
        const row = document.createElement("div");
        row.className = "track";
        row.innerHTML = `
            <div class="track-info">
            <div><strong>${t.name}</strong></div>
            <div>by ${t.artist_name || t.artist || "Unknown"}</div>
            <div class="status">Duration: ${fmt(t.duration || 0)}</div>
            </div>
        `;
        const btn = document.createElement("button");
        btn.textContent = "Select";
        btn.onclick = () => playTrack(t);
        row.appendChild(btn);
        wrap.appendChild(row);
        });
    }

    function wireMusicUI() {
        const searchBtn = $("#search-btn");
        const enableBtn = $("#enable-audio-btn");
        const query = $("#track-query");

        enableBtn?.addEventListener("click", ensureGesture);

        async function doSearch() {
        const q = (query.value || "").trim();
        if (!q) return;
        if (!JAMENDO_CLIENT_ID || JAMENDO_CLIENT_ID === "YOUR_JAMENDO_CLIENT_ID") {
            alert("Add your Jamendo client_id to enable search.");
            return;
        }
        $("#results").textContent = "Searching…";
        const res = await jamendoSearch(q);
        renderResults(res);
        }

        searchBtn?.addEventListener("click", doSearch);
        query?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") doSearch();
        });
    }

    document.addEventListener("DOMContentLoaded", wireMusicUI);
    })();

    /* ========== Layout 3 columnas + tarjetas (Now Playing / Party / Juego) ========== */
    (() => {
    const $ = (s) => document.querySelector(s);

    // Premium por atributo en <body data-premium="1"> (cámbialo desde el backend)
    const IS_PREMIUM = document.body?.dataset?.premium === "1";

    // Tamaños permitidos para entrar a cola
    const ALLOWED_SIZES = new Set([1, 2, 3, 8]);

    // Clave de almacenamiento local
    const LS_KEY = "lz_party_state_v1";

    function injectLayoutStyles() {
        if (document.getElementById("l4dzone-layout-styles")) return;
        const style = document.createElement("style");
        style.id = "l4dzone-layout-styles";
        style.textContent = `
        /* --- 3 columnas: 1fr + 1fr + 2fr --- */
        .top-row{display:grid;grid-template-columns:1fr 1fr 2fr;gap:16px}
        #music-panel{grid-column:1/2 !important}
        #party-card{grid-column:2/3}
        #play-card{grid-column:3/4 !important}

        /* --- Tarjetas neón/negro --- */
        .neon-card{
            background:#06080f;
            border:1px solid rgba(0,255,255,.15);
            border-radius:18px;
            box-shadow:0 0 24px rgba(0,255,255,.12), inset 0 0 60px rgba(0,0,0,.7);
            position:relative; overflow:hidden;
        }

        /* Now Playing – look espacial elegante */
        #music-panel.neon-card{
            padding:12px;
            background:
            radial-gradient(1100px 360px at 8% -8%,rgba(0,160,255,.16),transparent 42%),
            radial-gradient(900px 520px at 92% 120%,rgba(0,255,210,.10),transparent 55%),
            linear-gradient(180deg,#080c15 0%,#06080f 100%);
            border:1px solid rgba(0,200,255,.14);
        }
        #music-panel .input-wrapper input{
            background:#0a0f1a !important; color:#d6f7ff !important;
            border:1px solid rgba(0,255,255,.18) !important;
            border-radius:12px; padding:10px 12px;
            box-shadow:inset 0 0 10px rgba(0,0,0,.6);
        }
        #music-panel .buttons button{
            background:linear-gradient(90deg,#00eaff,#008cff);
            color:#061018;border:none;border-radius:10px;padding:8px 12px;font-weight:700;
            box-shadow:0 0 14px rgba(0,200,255,.35);
        }

        /* Party card */
        #party-card .party-wrap{padding:14px 16px}
        #party-card h3{
            margin:4px 0 12px;
            font-family:'Space Grotesk',system-ui,Segoe UI,Roboto,sans-serif;
            color:#bdf1ff;letter-spacing:.3px; display:flex; gap:8px; align-items:center;
        }
        .party-row{display:flex;gap:10px;align-items:center;margin-bottom:10px}
        .party-create{
            display:${IS_PREMIUM ? "inline-flex" : "none"};
            background:linear-gradient(90deg,#10f1ff,#007bff); color:#061018; border:none;
            border-radius:10px; padding:8px 12px; font-weight:800; cursor:pointer;
            box-shadow:0 0 14px rgba(0,200,255,.35);
        }
        .party-field{display:flex;flex-direction:column;gap:10px}
        .party-input{
            width:100%;padding:12px 14px;border-radius:12px;
            border:1px solid rgba(0,255,255,.15);
            background:#0a0f1a;color:#d6f7ff;font-weight:700; letter-spacing:.8px;
            outline:none;box-shadow:inset 0 0 10px rgba(0,0,0,.6);
            text-transform:uppercase;
        }
        .party-input::placeholder{color:#8db9c9}

        .party-btn{
            width:100%;padding:12px 16px;border:none;border-radius:12px;
            font-weight:900;letter-spacing:.4px;cursor:pointer;
            color:#061018;background:linear-gradient(90deg,#00eaff,#008cff);
            box-shadow:0 0 18px rgba(0,200,255,.45);
            transition:transform .15s ease, box-shadow .2s ease;
        }
        .party-btn:hover{transform:translateY(-1px);box-shadow:0 0 24px rgba(0,200,255,.65)}

        /* Código generado (badge) */
        .code-badge{
            display:flex;align-items:center;justify-content:space-between;gap:10px;
            background:#08111d;border:1px solid rgba(0,255,255,.18);
            color:#bdf1ff;border-radius:12px;padding:10px 12px;font-weight:800;letter-spacing:.8px;
        }
        .code-badge .code{font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;}

        .copy-btn{
            background:linear-gradient(90deg,#00eaff,#008cff); color:#061018; border:none;
            border-radius:10px; padding:8px 12px; font-weight:800; cursor:pointer;
            box-shadow:0 0 14px rgba(0,200,255,.35);
        }

        /* Lista de jugadores (8 max) */
        .players{
            margin-top:10px; display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:8px;
        }
        .player-slot{
            background:#0b121d;border:1px dashed rgba(0,255,255,.12);
            border-radius:10px; padding:8px; min-height:38px; color:#cfefff;
            display:flex; align-items:center; justify-content:center; font-weight:700;
        }
        .player-slot.leader{border-style:solid; border-color:rgba(0,255,255,.35)}
        .eligibility{
            margin-top:10px; font-weight:800;
            color:#9bdcff; display:flex; align-items:center; gap:8px;
        }
        .eligibility .ok{color:#53f5b7}
        .eligibility .bad{color:#ff6b6b}

        /* Responsive: apilar en móviles */
        @media (max-width: 980px){
            .top-row{grid-template-columns:1fr}
            #music-panel,#party-card,#play-card{grid-column:auto !important}
        }
        `;
        document.head.appendChild(style);
    }

    // Genera códigos: prefijo fijo LZ + 7 chars alfanuméricos (sin confusos)
    function generateLZCode() {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin I, O, 0, 1
        let s = "LZ";
        for (let i = 0; i < 7; i++) s += chars[Math.floor(Math.random() * chars.length)];
        return s;
    }

    // Estado de party (simple, simulado en front)
    function loadState(){
        try { return JSON.parse(localStorage.getItem(LS_KEY)) || null; } catch { return null; }
    }
    function saveState(st){ localStorage.setItem(LS_KEY, JSON.stringify(st)); }

    function eligibilityText(n){
        if (ALLOWED_SIZES.has(n)) return {ok:true,msg:`Eligible: ${n} jugador${n>1?'es':''}`};
        return {ok:false,msg:`No elegible: ${n} jugador${n>1?'es':''} (permitidos 1, 2, 3 u 8)`};
        // Si prefieres "mínimo 2": cambia conjunto a {2,3,8} y el texto.
    }

    // Renderiza la tarjeta Party
    function renderParty(party, root){
        const wrap = root.querySelector(".party-wrap");
        const headRow = root.querySelector(".party-row");
        const field = root.querySelector(".party-field");

        // Limpiar field
        field.innerHTML = "";

        if (party.isOwner) {
        // Mostrar badge con código + copiar
        const badge = document.createElement("div");
        badge.className = "code-badge";
        badge.innerHTML = `<span class="code">${party.code}</span>
                            <button class="copy-btn" type="button">Copiar</button>`;
        field.appendChild(badge);
        // Botón principal -> "Iniciar cola" (deshabilitado hasta que sea elegible)
        const main = document.createElement("button");
        main.id = "party-queue";
        main.className = "party-btn";
        main.textContent = "Iniciar cola";
        field.appendChild(main);

        // Players grid
        const grid = document.createElement("div");
        grid.className = "players";
        for (let i=0;i<8;i++){
            const slot = document.createElement("div");
            const p = party.players[i];
            slot.className = "player-slot" + (p?.leader ? " leader" : "");
            slot.textContent = p ? (p.name + (p.leader?" (Leader)":"")) : "—";
            grid.appendChild(slot);
        }
        field.appendChild(grid);

        // Elegibilidad
        const elg = document.createElement("div");
        elg.className = "eligibility";
        const e = eligibilityText(party.players.length);
        elg.innerHTML = e.ok ? `<span class="ok">●</span>${e.msg}` : `<span class="bad">●</span>${e.msg}`;
        field.appendChild(elg);

        // Wire: copiar
        badge.querySelector(".copy-btn").onclick = async ()=>{
            try{ await navigator.clipboard.writeText(party.code); badge.querySelector(".copy-btn").textContent="¡Copiado!"; setTimeout(()=>badge.querySelector(".copy-btn").textContent="Copiar",800);}catch{}
        };
        // Wire: iniciar cola (simulado)
        main.disabled = !eligibilityText(party.players.length).ok;
        main.onclick = ()=>{
            if (!eligibilityText(party.players.length).ok) return;
            alert(`Entrando a cola con ${party.players.length} jugador(es).`); // aquí harías fetch a tu backend
        };

        // Botón Create se oculta si ya hay código
        const createBtn = root.querySelector("#party-create");
        if (createBtn) createBtn.style.display = "none";

        } else {
        // No owner: mostrar input + botón "Ingresar ID"
        const input = document.createElement("input");
        input.id = "party-code";
        input.className = "party-input";
        input.maxLength = 16;
        input.placeholder = "Ingresa tu código (ej. LZ4F0BEA)";

        const btn = document.createElement("button");
        btn.id = "party-join";
        btn.className = "party-btn";
        btn.textContent = "Ingresar ID";

        field.appendChild(input);
        field.appendChild(btn);

        btn.onclick = async ()=>{
            const val = (input.value||"").trim().toUpperCase();
            if (!/^LZ[A-Z0-9]{7}$/.test(val)){ alert("Formato inválido. Debe ser LZ + 7 caracteres (ej. LZ4F0BEA)."); return; }
            // Simular unión
            party.code = val;
            party.players = party.players || [];
            if (!party.players.some(p=>p.you)) party.players.push({name:"You", you:true});
            saveState(party);
            renderParty(party, root);
        };

        // Si ya se unió antes, rellenar
        if (party.code) input.value = party.code;
        }
    }

    function ensurePartyCard() {
        const top = document.querySelector(".top-row");
        const play = document.getElementById("play-card");
        if (!top || !play) return;

        // Aplicar look neón a Now Playing
        const music = document.getElementById("music-panel");
        music?.classList.add("neon-card");

        // Crear Party card si no existe
        let partyCard = document.getElementById("party-card");
        if (!partyCard) {
        partyCard = document.createElement("section");
        partyCard.id = "party-card";
        partyCard.className = "neon-card";
        partyCard.innerHTML = `
            <div class="party-wrap">
            <h3>👥 <span>Party</span> <small style="opacity:.7;font-weight:600">Premium</small></h3>
            <div class="party-row">
                <button id="party-create" class="party-create">Create / Generate</button>
            </div>
            <div class="party-field"></div>
            </div>
        `;
        top.insertBefore(partyCard, play);
        }

        // Cargar/crear estado
        let st = loadState() || { isOwner:false, code:"", players:[] };

        // Si premium y pulsa Create → genera código, se hace owner y aparece badge, lista jugadores
        const createBtn = partyCard.querySelector("#party-create");
        if (createBtn){
        if (!IS_PREMIUM) createBtn.onclick = ()=> alert("Necesitas Premium para crear una Party.");
        else createBtn.onclick = ()=>{
            st.isOwner = true;
            st.code = generateLZCode();
            // agregamos al owner como Leader
            if (!st.players.some(p=>p.leader)) st.players.unshift({name:"Leader", leader:true});
            saveState(st);
            renderParty(st, partyCard);
        };
        }

        // Si ya existía un estado previo, renderízalo
        renderParty(st, partyCard);
    }

    document.addEventListener("DOMContentLoaded", () => {
        injectLayoutStyles();
        ensurePartyCard();
    });
    })();
