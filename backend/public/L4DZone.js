    /* =========================
    L4DZone – JS unificado
    - Modal dinámico (FAQ/Rules/etc.)
    - Header shrink on scroll
    - Jamendo + Howler (Search / Enable Audio / Now Playing)
    - Mini-juego “Jugar” (runner + ship mode)
    - Tarjeta Party (código, join, elegibilidad)
    ========================= */
    (() => {
    "use strict";

    /* ========== Helpers ========== */
    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
    const normalizeKey = (text) => (text || "").trim().toLowerCase().replace(/\s+/g, "_");
    const on = (el, ev, cb, opt) => el && el.addEventListener(ev, cb, opt);

    /* ========== 1) MODAL DINÁMICO ========== */
    (function modalSystem() {
        function clearDynamicAssets() {
        $$("[data-dynamic-css]").forEach((el) => el.remove());
        $$("[data-dynamic-js]").forEach((el) => el.remove());
        }

        async function loadSection(section) {
        clearDynamicAssets();

        // Resaltar botón correspondiente (nav y barra del modal)
        $$(".modal-nav-bar button").forEach((btn) =>
            btn.classList.toggle("active", normalizeKey(btn.textContent) === normalizeKey(section))
        );
        $$("#menu button").forEach((btn) =>
            btn.classList.toggle("active", normalizeKey(btn.textContent) === normalizeKey(section))
        );

        try {
            const resp = await fetch(`Barra_Superior/${section}.html`);
            if (!resp.ok) throw new Error(`Load ${section}.html -> ${resp.status}`);
            const html = await resp.text();
            $("#modalBody").innerHTML = html;

            // Cargar CSS/JS de esa sección si existen (opcionales)
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
            console.error(e);
            $("#modalBody").innerHTML = "<p style='color:#f88'>Error loading content.</p>";
        }
        }

        window.openModal = function (section) {
        const overlay = $("#modalOverlay");
        if (!overlay) return;
        overlay.style.display = "flex";
        loadSection(section);
        };

        window.closeModal = function () {
        const overlay = $("#modalOverlay");
        const body = $("#modalBody");
        if (!overlay) return;
        overlay.style.display = "none";
        if (body) body.innerHTML = "";
        clearDynamicAssets();
        };

        // Header shrink on scroll
        on(window, "scroll", () => {
        const header = $("header");
        if (!header) return;
        header.style.height = window.scrollY > 50 ? "60px" : "90px";
        });
    })();

    /* ========== 2) MÚSICA (Jamendo + Howler) ========== */
    (function musicSystem() {
        // ⚠️ Coloca tu real client_id de Jamendo:
        const JAMENDO_CLIENT_ID = "YOUR_JAMENDO_CLIENT_ID";

        let currentSound = null;

        const fmt = (sec = 0) => {
        const m = Math.floor(sec / 60),
            s = Math.floor(sec % 60);
        return `${m}:${String(s).padStart(2, "0")}`;
        };

        const ensureGesture = () => {
        userInteracted = true;
        };

        function showNowPlaying(track) {
        $("#now-playing")?.classList.remove("hidden");
        $("#np-title") && ($("#np-title").textContent = track.name || "—");
        $("#np-artist") && ($("#np-artist").textContent = track.artist_name || track.artist || "—");
        $("#np-duration") && ($("#np-duration").textContent = fmt(track.duration || 0));
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

        const pauseBtn = $("#pause-btn");
        const stopBtn = $("#stop-btn");
        on(pauseBtn, "click", () => {
            if (!currentSound) return;
            currentSound.playing() ? currentSound.pause() : currentSound.play();
        });
        on(stopBtn, "click", () => currentSound && currentSound.stop());
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
        if (!wrap) return;
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

        on(enableBtn, "click", ensureGesture);

        async function doSearch() {
            const q = (query?.value || "").trim();
            if (!q) return;
            if (!JAMENDO_CLIENT_ID || JAMENDO_CLIENT_ID === "YOUR_JAMENDO_CLIENT_ID") {
            alert("Add your Jamendo client_id to enable search.");
            return;
            }
            const results = $("#results");
            if (results) results.textContent = "Searching…";
            const res = await jamendoSearch(q);
            renderResults(res);
        }

        on(searchBtn, "click", doSearch);
        on(query, "keydown", (e) => {
            if (e.key === "Enter") doSearch();
        });
        }

        on(document, "DOMContentLoaded", wireMusicUI);
    })();

    /* ========== 3) MINI-JUEGO (Runner + Ship Mode) ========== */
    (function miniGame() {
        function injectGameStyles() {
        if ($("#l4dzone-game-styles")) return;
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
        // Lee una variable CSS (ej. '--game-h') y devuelve el número en px
        function cssVarPx(name){
        const v = getComputedStyle(document.body).getPropertyValue(name).trim();
        return parseInt(v || "0", 10);
        }

        injectGameStyles();

        const ctx = canvas.getContext("2d", { alpha: false });

        let raf, playing = false, holdJump = false;
        let lastTs = 0;

        // Estado/dificultad
        let score = 0;
        let speed = 2.0; // más lento que antes
        let spawnTimer = 0;
        let obstacles = [];
        let starsFar = [], starsNear = [];
        const GROUND_H = 18;

        // Ship mode (flappy-like) cuando sube el score
        let shipMode = false;
        const SHIP_START_SCORE = 60;
        const SHIP_THRUST = -0.5;
        const SHIP_GRAVITY = 0.35;

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
                        if (shipMode) {
                            if (holdJump) this.dy += SHIP_THRUST;
                            this.dy += SHIP_GRAVITY;
                            this.y += this.dy;
                            const top = 4, bottom = canvas.height - 4 - this.h;
                            if (this.y < top) { this.y = top; this.dy = 0; }
                            if (this.y > bottom) { this.y = bottom; this.dy = 0; }
                            this.grounded = false;
                        } else {
                            if (holdJump && this.grounded) this.dy = this.jumpForce;
                            this.dy += this.g;
                            this.y += this.dy;
                            const floorY = canvas.height - GROUND_H - this.h;
                            if (this.y > floorY) { this.y = floorY; this.dy = 0; this.grounded = true; }
                            else this.grounded = false;
                        }
                        },    draw() {
            ctx.globalAlpha = 0.25; ctx.fillStyle = "#1de3ff";
            ctx.fillRect(this.x - 8, this.y + 4, this.w, this.h - 8);
            ctx.globalAlpha = 1;
            ctx.fillStyle = "#6fe3ff";
            ctx.fillRect(this.x, this.y, this.w, this.h);
            ctx.strokeStyle = "rgba(0,255,255,.7)";
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x + .5, this.y + .5, this.w - 1, this.h - 1);
            },
            jump() { if (!shipMode && this.grounded) this.dy = this.jumpForce; }
        };

        class Obstacle {
            constructor(type, baseSpeed) {
            this.type = type;
            if (type === "gate") {
                this.gap = 92 + Math.random() * 30; // hueco generoso
                this.w = 28;
                const center = 60 + Math.random() * (canvas.height - 120);
                this.topH = Math.max(10, center - this.gap / 2);
                this.botY = Math.min(canvas.height - GROUND_H, center + this.gap / 2);
                this.botH = Math.max(10, canvas.height - this.botY - GROUND_H);
            } else {
                this.size = type === "spike" ? (20 + Math.random() * 8) : (22 + Math.random() * 6);
                this.w = this.size; this.h = this.size;
                this.y = canvas.height - GROUND_H - this.h;
            }
            this.x = canvas.width + 10;
            this.v = baseSpeed;
            this.color = type === "spike" ? "#54b9ff" : "#9bf0ff";
            }
            update(v) { this.x -= v; }
            off() { return this.x + (this.w || 0) < -40; }
            hit(p) {
            if (this.type === "gate") {
                const hitTop = !(p.x + p.w < this.x || p.x > this.x + this.w || p.y > this.topH);
                const hitBot = !(p.x + p.w < this.x || p.x > this.x + this.w || (p.y + p.h) < this.botY);
                return hitTop || hitBot;
            }
            return !(p.x + p.w < this.x || p.x > this.x + this.w || p.y + p.h < this.y || p.y > this.y + this.h);
            }
            draw() {
            ctx.fillStyle = this.color;
            if (this.type === "spike") {
                ctx.beginPath();
                ctx.moveTo(this.x, this.y + this.h);
                ctx.lineTo(this.x + this.w / 2, this.y);
                ctx.lineTo(this.x + this.w, this.y + this.h);
                ctx.closePath(); ctx.fill();
            } else if (this.type === "gate") {
                ctx.fillRect(this.x, 0, this.w, this.topH);
                ctx.fillRect(this.x, this.botY, this.w, this.botH);
            } else {
                ctx.fillRect(this.x, this.y, this.w, this.h);
            }
            ctx.strokeStyle = "rgba(0,255,255,.6)";
            ctx.lineWidth = 1.5;
            if (this.type === "gate") {
                ctx.strokeRect(this.x + .5, 0.5, this.w - 1, this.topH - 1);
                ctx.strokeRect(this.x + .5, this.botY + .5, this.w - 1, this.botH - 1);
            } else {
                ctx.strokeRect(this.x + .5, (this.y || 0) + .5, (this.w || 0) - 1, (this.h || 0) - 1);
            }
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
            if (!shipMode) {
            ctx.fillStyle = "rgba(0,200,255,.12)";
            ctx.fillRect(0, gy - 6, canvas.width, 6);
            }
        }

        function reset() {
            score = 0;
            speed = 2.0;
            spawnTimer = 0;
            obstacles = [];
            go?.classList.add("hidden");
            scoreEl && (scoreEl.textContent = "0");
            player.reset();
            playing = true;
            lastTs = performance.now();
            seedStars();
            loop(lastTs);
        }

        function fitCanvas() {
            const r = canvas.getBoundingClientRect();
            canvas.width  = Math.max(720, Math.floor(r.width));  // ancho responsivo con mínimo
            canvas.height = cssVarPx('--game-h');                // altura desde CSS (estable)
            seedStars();
        }


        // Input
        on(window, "keydown", (e) => {
            if (e.code === "Space") { holdJump = true; player.jump(); e.preventDefault(); }
        });
        on(window, "keyup", (e) => { if (e.code === "Space") holdJump = false; });
        on(canvas, "mousedown", () => { holdJump = true; player.jump(); });
        on(window, "mouseup", () => { holdJump = false; });

        start.addEventListener("click", () => {
        document.body.classList.add("playing");   // aumenta el alto de los cuadros y oculta cabecera
        panel.classList.remove("hidden");
        fitCanvas();
        reset();
        });

        restart.addEventListener("click", () => {
        fitCanvas();
        reset();
        });
        on(window, "resize", () => { if (playing) fitCanvas(); });

        function loop(ts) {
            if (!playing) return;
            const dt = Math.min(1.5, (ts - lastTs) / 16.6667) || 1; // 60fps baseline
            lastTs = ts;

            // Dificultad suave
            speed += 0.001 * dt;

            // Alternar ship mode a partir de cierto score con probabilidad
            const useGate = (score >= SHIP_START_SCORE) && (Math.random() < 0.35);
            shipMode = useGate ? true : false;

            // Spawns
            spawnTimer -= dt;
            if (spawnTimer <= 0) {
            if (useGate) {
                obstacles.push(new Obstacle("gate", speed));
                // Gates más separados
                const baseGap = 120;
                spawnTimer = Math.max(30, baseGap - speed * 4);
            } else {
                const type = Math.random() < 0.6 ? "spike" : "block";
                obstacles.push(new Obstacle(type, speed));
                // Runner más separado que antes
                const baseGap = (type === "spike" ? 85 : 105);
                spawnTimer = Math.max(34, baseGap - speed * 5);
            }
            }

            // Update
            player.update();
            obstacles.forEach((o) => o.update(speed * dt));
            obstacles = obstacles.filter((o) => !o.off());

            // Collisions
            for (const o of obstacles) {
            if (o.hit(player)) return end();
            }

            // Score
            score += 0.25 * dt;
            scoreEl && (scoreEl.textContent = String(Math.floor(score)));

            // Draw
            drawSpace(dt);
            obstacles.forEach((o) => o.draw());
            player.draw();

            raf = requestAnimationFrame(loop);
        }

        function end() {
            playing = false;
            cancelAnimationFrame(raf);
            go?.classList.remove("hidden");
        }
        }

        on(document, "DOMContentLoaded", wireGame);
    })();

    /* ========== 4) TARJETA PARTY (frontend simulado) ========== */
    (function partyCard() {
        // Puedes cambiar a "1" desde tu backend para mostrar el botón "Create"
        const IS_PREMIUM = document.body?.dataset?.premium === "1";
        const ALLOWED_SIZES = new Set([1, 2, 3, 8]);
        const LS_KEY = "lz_party_state_v1";

        function injectLayoutStyles() {
        if ($("#l4dzone-layout-styles")) return;
        const style = document.createElement("style");
        style.id = "l4dzone-layout-styles";
        style.textContent = `
            .top-row{display:grid;grid-template-columns:1fr 1fr 2fr;gap:16px}
            #music-panel{grid-column:1/2 !important}
            #party-card{grid-column:2/3}
            #play-card{grid-column:3/4 !important}
            .neon-card{
            background:#06080f;border:1px solid rgba(0,255,255,.15);border-radius:18px;
            box-shadow:0 0 24px rgba(0,255,255,.12), inset 0 0 60px rgba(0,0,0,.7);overflow:hidden
            }
            #music-panel.neon-card{padding:12px}
            #party-card .party-wrap{padding:14px 16px}
            #party-card h3{margin:4px 0 12px;font-family:'Space Grotesk',system-ui,Segoe UI,Roboto,sans-serif;color:#bdf1ff;letter-spacing:.3px; display:flex; gap:8px; align-items:center}
            .party-row{display:flex;gap:10px;align-items:center;margin-bottom:10px}
            .party-create{display:${IS_PREMIUM ? "inline-flex" : "none"};background:linear-gradient(90deg,#10f1ff,#007bff);color:#061018;border:none;border-radius:10px;padding:8px 12px;font-weight:800;cursor:pointer;box-shadow:0 0 14px rgba(0,200,255,.35)}
            .party-field{display:flex;flex-direction:column;gap:10px}
            .party-input{width:100%;padding:12px 14px;border-radius:12px;border:1px solid rgba(0,255,255,.15);background:#0a0f1a;color:#d6f7ff;font-weight:700;letter-spacing:.8px;outline:none;box-shadow:inset 0 0 10px rgba(0,0,0,.6);text-transform:uppercase}
            .party-btn{width:100%;padding:12px 16px;border:none;border-radius:12px;font-weight:900;letter-spacing:.4px;cursor:pointer;color:#061018;background:linear-gradient(90deg,#00eaff,#008cff);box-shadow:0 0 18px rgba(0,200,255,.45)}
            .code-badge{display:flex;align-items:center;justify-content:space-between;gap:10px;background:#08111d;border:1px solid rgba(0,255,255,.18);color:#bdf1ff;border-radius:12px;padding:10px 12px;font-weight:800;letter-spacing:.8px}
            .code-badge .code{font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;}
            .copy-btn{background:linear-gradient(90deg,#00eaff,#008cff); color:#061018; border:none;border-radius:10px; padding:8px 12px; font-weight:800; cursor:pointer; box-shadow:0 0 14px rgba(0,200,255,.35)}
            .players{margin-top:10px; display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:8px}
            .player-slot{background:#0b121d;border:1px dashed rgba(0,255,255,.12);border-radius:10px; padding:8px; min-height:38px; color:#cfefff;display:flex; align-items:center; justify-content:center; font-weight:700}
            .player-slot.leader{border-style:solid; border-color:rgba(0,255,255,.35)}
            .eligibility{margin-top:10px; font-weight:800;color:#9bdcff; display:flex; align-items:center; gap:8px}
            .eligibility .ok{color:#53f5b7}.eligibility .bad{color:#ff6b6b}
            @media (max-width: 980px){.top-row{grid-template-columns:1fr}#music-panel,#party-card,#play-card{grid-column:auto !important}}
        `;
        document.head.appendChild(style);
        }

        function generateLZCode() {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin I, O, 0, 1
        let s = "LZ";
        for (let i = 0; i < 7; i++) s += chars[Math.floor(Math.random() * chars.length)];
        return s;
        }

        const loadState = () => {
        try { return JSON.parse(localStorage.getItem(LS_KEY)) || null; } catch { return null; }
        };
        const saveState = (st) => localStorage.setItem(LS_KEY, JSON.stringify(st));

        function eligibilityText(n) {
        if (ALLOWED_SIZES.has(n)) return { ok: true, msg: `Eligible: ${n} jugador${n > 1 ? "es" : ""}` };
        return { ok: false, msg: `No elegible: ${n} jugador${n > 1 ? "es" : ""} (permitidos 1, 2, 3 u 8)` };
        }

        function renderParty(party, root) {
        const field = $(".party-field", root);
        field.innerHTML = "";

        if (party.isOwner) {
            const badge = document.createElement("div");
            badge.className = "code-badge";
            badge.innerHTML = `<span class="code">${party.code}</span><button class="copy-btn" type="button">Copiar</button>`;
            field.appendChild(badge);

            const main = document.createElement("button");
            main.id = "party-queue";
            main.className = "party-btn";
            main.textContent = "Iniciar cola";
            field.appendChild(main);

            const grid = document.createElement("div");
            grid.className = "players";
            for (let i = 0; i < 8; i++) {
            const slot = document.createElement("div");
            const p = party.players[i];
            slot.className = "player-slot" + (p?.leader ? " leader" : "");
            slot.textContent = p ? (p.name + (p.leader ? " (Leader)" : "")) : "—";
            grid.appendChild(slot);
            }
            field.appendChild(grid);

            const elg = document.createElement("div");
            elg.className = "eligibility";
            const e = eligibilityText(party.players.length);
            elg.innerHTML = e.ok ? `<span class="ok">●</span>${e.msg}` : `<span class="bad">●</span>${e.msg}`;
            field.appendChild(elg);

            // acciones
            on(badge.querySelector(".copy-btn"), "click", async () => {
            try {
                await navigator.clipboard.writeText(party.code);
                badge.querySelector(".copy-btn").textContent = "¡Copiado!";
                setTimeout(() => (badge.querySelector(".copy-btn").textContent = "Copiar"), 800);
            } catch {}
            });

            main.disabled = !e.ok;
            on(main, "click", () => {
            if (!eligibilityText(party.players.length).ok) return;
            alert(`Entrando a cola con ${party.players.length} jugador(es).`);
            });

            const createBtn = $("#party-create", root);
            if (createBtn) createBtn.style.display = "none";
        } else {
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

            on(btn, "click", () => {
            const val = (input.value || "").trim().toUpperCase();
            if (!/^LZ[A-Z0-9]{7}$/.test(val)) {
                alert("Formato inválido. Debe ser LZ + 7 caracteres (ej. LZ4F0BEA).");
                return;
            }
            party.code = val;
            party.players = party.players || [];
            if (!party.players.some((p) => p.you)) party.players.push({ name: "You", you: true });
            saveState(party);
            renderParty(party, root);
            });

            if (party.code) input.value = party.code;
        }
        }

        function ensurePartyCard() {
        const top = $(".top-row");
        const play = $("#play-card");
        if (!top || !play) return;

        $("#music-panel")?.classList.add("neon-card");

        let partyCard = $("#party-card");
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

        let st = loadState() || { isOwner: false, code: "", players: [] };

        const createBtn = $("#party-create", partyCard);
        if (createBtn) {
            if (!IS_PREMIUM) {
            on(createBtn, "click", () => alert("Necesitas Premium para crear una Party."));
            } else {
            on(createBtn, "click", () => {
                st.isOwner = true;
                st.code = generateLZCode();
                if (!st.players.some((p) => p.leader)) st.players.unshift({ name: "Leader", leader: true });
                saveState(st);
                renderParty(st, partyCard);
            });
            }
        }

        renderParty(st, partyCard);
        }

        on(document, "DOMContentLoaded", () => {
        injectLayoutStyles();
        ensurePartyCard();
        });
    })();

    })();

    window.addEventListener("resize", () => { if (playing) fitCanvas(); });


    // =========================
    // Music Quick Panel (IDs)
    // =========================
    (() => {
    // 1) Tu “base de datos” de IDs (edítala a gusto)
    //    Puedes cambiar "id" por lo que uses (YouTube, Jamendo, tu backend, etc.)
    const MUSIC_IDS = [
        { title: "Lo-fi Chill Night", artist: "Koto", id: "LZ84B918W" },
        { title: "Cyber Drift",      artist: "Neonix", id: "CYB3RDFT1" },
        { title: "Blue Ocean",       artist: "Misaki", id: "BLU3OC3AN" },
    ];

    // 2) Elementos
    const fab     = document.getElementById("music-fab");
    const drawer  = document.getElementById("music-drawer");
    const close   = document.getElementById("music-close");
    const input   = document.getElementById("music-id-input");
    const confirm = document.getElementById("music-confirm");
    const openList= document.getElementById("music-open-list");

    const modal   = document.getElementById("music-list-modal");
    const modalClose = document.getElementById("music-list-close");
    const tableBody  = document.querySelector("#music-list-table tbody");

    const openDrawer  = () => drawer.setAttribute("aria-hidden", "false");
    const closeDrawer = () => drawer.setAttribute("aria-hidden", "true");
    const toggleDrawer= () => drawer.getAttribute("aria-hidden") === "true" ? openDrawer() : closeDrawer();

    const openModal   = () => { modal.setAttribute("aria-hidden","false"); buildList(); };
    const closeModal  = () => modal.setAttribute("aria-hidden","true");

    // 3) Rellenar la tabla de IDs
    function buildList(){
        tableBody.innerHTML = "";
        MUSIC_IDS.forEach(row => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${row.title}</td>
            <td>${row.artist}</td>
            <td><code>${row.id}</code></td>
            <td><button class="pick-btn" type="button">Use</button></td>
        `;
        tr.querySelector(".pick-btn").onclick = () => {
            input.value = row.id;
            closeModal();
            openDrawer();
        };
        tableBody.appendChild(tr);
        });
    }

    // 4) Eventos
    fab?.addEventListener("click", toggleDrawer);
    close?.addEventListener("click", closeDrawer);
    openList?.addEventListener("click", openModal);
    modalClose?.addEventListener("click", closeModal);
    modal?.querySelector(".music-modal__backdrop")?.addEventListener("click", closeModal);

    // 5) Confirmar: emite un CustomEvent para que lo capture tu reproductor
    confirm?.addEventListener("click", () => {
        const id = (input.value || "").trim();
        if (!id){ alert("Please enter a track ID."); return; }

        // -> Aquí no forzamos un tipo de audio. Tú decides qué hacer con la ID.
        // Lanzamos un evento global:
        window.dispatchEvent(new CustomEvent("music:idSelected", { detail: { id } }));

        // feedback
        confirm.disabled = true;
        const old = confirm.textContent;
        confirm.textContent = "Loaded ✓";
        setTimeout(() => { confirm.textContent = old; confirm.disabled = false; }, 900);
    });

    // 6) Ejemplo de escucha (lo puedes borrar y usar tu integración real)
    //    Aquí podrías: fetch al backend, pedir URL a partir de la ID, y reproducir con Howler, etc.
    window.addEventListener("music:idSelected", async (ev) => {
        const { id } = ev.detail;
        console.log("[music:idSelected] ->", id);

        // Ejemplo mínimo: integrar con tu sistema actual
        // - Si tus IDs son de Jamendo o una URL directa, puedes llamar a tu reproductor aquí.
        // - O hacer fetch a tu backend para traducir la ID a una URL de audio.
        // alert(`Selected ID: ${id}`);
    });
    })();

    document.addEventListener('DOMContentLoaded', () => {
        const wb = document.querySelector('.welcome-box');
        if (!wb) return;
        // Envuelve "Lalo HLZ" en un <strong class="hlz">…</strong>
        // (case-sensitive; duplica la línea si necesitas variantes)
        wb.innerHTML = wb.innerHTML.replace(/Lalo HLZ/g, '<strong class="hlz">$&</strong>');
    });