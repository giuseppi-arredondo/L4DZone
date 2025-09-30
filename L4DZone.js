function openModal(section) {
    console.log("Abriendo sección:", section);
    console.log("Ruta del HTML:", `Barra_Superior/${section}.html`);
    console.log("Ruta del CSS:", `Barra_Superior/${section}.css`);
    console.log("Ruta del JS:", `Barra_Superior/${section}.js`);

    const modal = document.getElementById("modalOverlay");
    const modalBody = document.getElementById("modalBody");

    // Mostrar el modal
    modal.style.display = "flex";

    // Limpiar contenidos previos
    document.querySelectorAll('[data-dynamic-css]').forEach(el => el.remove());
    document.querySelectorAll('[data-dynamic-js]').forEach(el => el.remove());

    // Botón activo en la barra de navegación del modal
    const normalized = text => text.trim().toLowerCase().replace(/\s+/g, '_');
    document.querySelectorAll('.modal-nav-bar button').forEach(btn => {
        const btnKey = normalized(btn.textContent);
        btn.classList.toggle('active', btnKey === section);
    });
 
    // Cargar el HTML
    fetch(`Barra_Superior/${section}.html`)
        .then(response => {
            console.log("Respuesta status:", response.status);
            if (!response.ok) throw new Error("No se pudo cargar el archivo.");
            return response.text();
        })
        .then(html => {
            modalBody.innerHTML = html;

            // Cargar el CSS
            const css = document.createElement("link");
            css.rel = "stylesheet";
            css.href = `Barra_Superior/${section}.css`;
            css.setAttribute("data-dynamic-css", "true");
            document.head.appendChild(css);

            // Cargar el JS
            const js = document.createElement("script");
            js.src = `Barra_Superior/${section}.js`;
            js.defer = true;
            js.setAttribute("data-dynamic-js", "true");
            document.body.appendChild(js);
        })
        .catch(error => {
            modalBody.innerHTML = "<p>Error al cargar el contenido.</p>";
            console.error("Error cargando sección:", error);
        });
}

// Mostrar el contenido de la pestaña y activar el botón correspondiente
function showTab(tabId, event) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    const target = document.getElementById(tabId);
    if (target) target.style.display = 'block';
    if (event && event.target) event.target.classList.add('active');
}

// Activar el botón de la barra de navegación del modal según la sección
function setActiveButton(section) {
    document.querySelectorAll('.modal-nav-bar button').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase().replace(/\s+/g, '_') === section) {
            btn.classList.add('active');
        }
    });
}
window.addEventListener("scroll", function () {
    const header = document.querySelector("header");
    if (window.scrollY > 50) {
        header.style.height = "60px";
    } else {
        header.style.height = "90px";
    }
});
const navButtons = document.querySelectorAll('#menu button');

function setActiveButton(id) {
    navButtons.forEach(btn => btn.classList.remove('active'));
    const activeBtn = Array.from(navButtons).find(btn => btn.textContent.toLowerCase() === id);
    if (activeBtn) activeBtn.classList.add('active');
}

function openModal(section) {
    document.getElementById("modalOverlay").style.display = "flex";
    loadSection(section);
    setActiveButton(section);
}
function loadSection(section) {
            const modalBody = document.getElementById("modalBody");
            document.querySelectorAll('[data-dynamic-css]').forEach(el => el.remove());
            document.querySelectorAll('[data-dynamic-js]').forEach(el => el.remove());
            fetch(`Barra_Superior/${section}.html`)
                .then(response => {
                    if (!response.ok) throw new Error("No se pudo cargar el archivo.");
                    return response.text();
                })
                .then(html => {
                    modalBody.innerHTML = html;
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
                })
                .catch(error => {
                    modalBody.innerHTML = "<p>Error al cargar el contenido.</p>";
                    console.error("Error cargando sección:", error);
                });
        }
        function openModal(section) {
            document.getElementById("modalOverlay").style.display = "flex";
            loadSection(section);
        }
        function closeModal() {
            const modal = document.getElementById("modalOverlay");
            const modalBody = document.getElementById("modalBody");
            modal.style.display = "none";
            modalBody.innerHTML = "";
            document.querySelectorAll('[data-dynamic-css]').forEach(el => el.remove());
            document.querySelectorAll('[data-dynamic-js]').forEach(el => el.remove());
        }
    document.getElementById("sendButton").addEventListener("click", () => {
    const input = document.getElementById("chatInput");
    const text = input.value.trim();

    if (text !== "") {
    const chatMessages = document.getElementById("chatMessages");
    const message = document.createElement("div");
    message.textContent = text;
    chatMessages.appendChild(message);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    input.value = "";
    }
    });
    (() => {
    const normalizeKey = text => text.trim().toLowerCase().replace(/\s+/g, '_');
    const modalOverlay = () => document.getElementById("modalOverlay");
    const modalBody = () => document.getElementById("modalBody");

    function clearDynamicAssets() {
        document.querySelectorAll('[data-dynamic-css]').forEach(el => el.remove());
        document.querySelectorAll('[data-dynamic-js]').forEach(el => el.remove());
    }

    async function loadSection(section) {
        clearDynamicAssets();
        setActiveModalButton(section);
        setActiveNavButton(section);

        try {
        const resp = await fetch(`Barra_Superior/${section}.html`);
        if (!resp.ok) throw new Error(`Failed to load HTML for ${section}: ${resp.status}`);
        const html = await resp.text();
        modalBody().innerHTML = html;

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
        modalBody().innerHTML = "<p style='color:#f88;'>Error loading content.</p>";
        console.error(e);
        }
    }

    window.openModal = function(section) {
        modalOverlay().style.display = "flex";
        loadSection(section);
    };

    window.closeModal = function() {
        modalOverlay().style.display = "none";
        if (modalBody()) modalBody().innerHTML = "";
        clearDynamicAssets();
    };

    function setActiveModalButton(section) {
        document.querySelectorAll('.modal-nav-bar button').forEach(btn => {
        btn.classList.toggle('active', normalizeKey(btn.textContent) === normalizeKey(section));
        });
    }

    function setActiveNavButton(section) {
        document.querySelectorAll('#menu button').forEach(btn => {
        btn.classList.toggle('active', normalizeKey(btn.textContent) === normalizeKey(section));
        });
    }

    // Header shrink on scroll
    window.addEventListener("scroll", () => {
        const header = document.querySelector("header");
        if (!header) return;
        header.style.height = window.scrollY > 50 ? "60px" : "90px";
    });
    })();

    (() => {
    const JAMENDO_CLIENT_ID = "YOUR_REAL_CLIENT_ID"; // <-- reemplaza con tu client_id válido
    let currentSound = null;
    let hasInteracted = false;

    const qs = selector => document.querySelector(selector);
    const qsa = selector => Array.from(document.querySelectorAll(selector));

    function ensureInteraction() {
        if (!hasInteracted) hasInteracted = true;
    }

    function showNowPlaying(track) {
        ensureInteraction();
        const nowPlaying = qs("#now-playing");
        if (!nowPlaying) return;
        nowPlaying.classList.remove("hidden");
        qs("#np-title").textContent = track.name;
        qs("#np-artist").textContent = track.artist_name || track.artist;
        const duration = track.duration ?? 0;
        qs("#np-duration").textContent = `Length: ${Math.floor(duration/60)}:${String(duration%60).padStart(2,"0")}`;
    }

    function playTrack(track) {
        ensureInteraction();
        if (currentSound) currentSound.stop();

        currentSound = new Howl({
        src: [track.audio || track.audio_download], // depending on API field
        html5: true,
        volume: 0.5,
        onplayerror: () => {
            console.warn("Playback blocked; user interaction needed.");
        }
        });
        currentSound.play();

        showNowPlaying(track);

        qs("#pause-btn").onclick = () => {
        if (!currentSound) return;
        if (currentSound.playing()) currentSound.pause();
        else currentSound.play();
        };
        qs("#stop-btn").onclick = () => {
        if (currentSound) currentSound.stop();
        };
    }

    async function searchJamendo(query) {
        try {
        const resp = await fetch(`https://api.jamendo.com/v3.0/tracks/?client_id=${JAMENDO_CLIENT_ID}&format=json&limit=8&order=popularity_total&search=${encodeURIComponent(query)}&audioformat=mp32`);
        const data = await resp.json();
        if (!data.results || !data.results.length) return [];
        return data.results;
        } catch (e) {
        console.warn("Jamendo API error, using mock data", e);
        // fallback fake data
        return [
            {
            name: "Mock Track 1",
            artist_name: "Demo Artist",
            duration: 210,
            audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
            },
            {
            name: "Mock Track 2",
            artist_name: "Demo Artist 2",
            duration: 185,
            audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
            }
        ];
        }
    }

    function renderResults(tracks) {
        const container = qs("#results");
        container.innerHTML = "";
        if (!tracks.length) {
        container.textContent = "No results found.";
        return;
        }
        tracks.forEach(track => {
        const div = document.createElement("div");
        div.className = "track";
        const info = document.createElement("div");
        info.className = "track-info";
        info.innerHTML = `<div><strong>${track.name}</strong></div>
                            <div>by ${track.artist_name || track.artist}</div>
                            <div class="status">Duration: ${Math.floor((track.duration || 0)/60)}:${String((track.duration||0)%60).padStart(2,"0")}</div>`;
        const btn = document.createElement("button");
        btn.textContent = "Select";
        btn.addEventListener("click", () => {
            // broadcast would go here (via websocket) if implemented
            playTrack(track);
        });
        div.appendChild(info);
        div.appendChild(btn);
        container.appendChild(div);
        });
    }

    // Debounce helper
    function debounce(fn, delay) {
        let timer;
        return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
        };
    }

    // Setup listeners once DOM ready
    document.addEventListener("DOMContentLoaded", () => {
        const searchBtn = qs("#search-btn");
        const queryInput = qs("#track-query");
        const enableAudioBtn = qs("#enable-audio-btn");

        if (enableAudioBtn) {
        enableAudioBtn.addEventListener("click", () => {
            ensureInteraction();
        });
        }

        const doSearch = async () => {
        const q = queryInput.value.trim();
        if (!q) return;
        const resultsContainer = qs("#results");
        resultsContainer.innerHTML = "Searching...";
        const tracks = await searchJamendo(q);
        renderResults(tracks);
        };

        const debouncedSearch = debounce(doSearch, 400);

        if (searchBtn) searchBtn.addEventListener("click", doSearch);
        if (queryInput) queryInput.addEventListener("input", debouncedSearch);
    });
    })();

    // === Music search/play logic ===
    // Replace with actual Jamendo client ID to make it work.
    const JAMENDO_CLIENT_ID = "YOUR_JAMENDO_CLIENT_ID";

    let currentSound = null;
    let hasInteracted = false;

    // DOM
    const searchBtn = document.getElementById("search-btn");
    const queryInput = document.getElementById("track-query");
    const enableAudioBtn = document.getElementById("enable-audio-btn");
    const nowPlayingEl = document.getElementById("now-playing");
    const npTitle = document.getElementById("np-title");
    const npArtist = document.getElementById("np-artist");
    const npDuration = document.getElementById("np-duration");
    const pauseBtn = document.getElementById("pause-btn");
    const stopBtn = document.getElementById("stop-btn");

    function ensureInteraction() {
    if (!hasInteracted) hasInteracted = true;
    }

    function showNowPlaying(track) {
    nowPlayingEl.classList.remove("hidden");
    npTitle.textContent = track.name;
    npArtist.textContent = track.artist;
    npDuration.textContent = `${Math.floor(track.duration / 60)}:${String(track.duration % 60).padStart(2, "0")}`;
    }

    // Play track
    function playTrack(track) {
    ensureInteraction();
    if (currentSound) currentSound.stop();
    currentSound = new Howl({
        src: [track.audio],
        html5: true,
        volume: 0.5,
        onplayerror: () => {
        console.warn("Playback error: user interaction required.");
        },
    });
    currentSound.play();
    showNowPlaying(track);

    pauseBtn.onclick = () => {
        if (currentSound.playing()) currentSound.pause();
        else currentSound.play();
    };
    stopBtn.onclick = () => {
        if (currentSound) currentSound.stop();
    };
    }

    // Search handler (click + enter)
    async function performSearch() {
    const q = queryInput.value.trim();
    if (!q) return;
    ensureInteraction();

    if (!JAMENDO_CLIENT_ID || JAMENDO_CLIENT_ID === "YOUR_JAMENDO_CLIENT_ID") {
        alert("Client ID missing. Replace JAMENDO_CLIENT_ID with a real one to enable search.");
        return;
    }

    try {
        const url = `https://api.jamendo.com/v3.0/tracks/?client_id=${encodeURIComponent(JAMENDO_CLIENT_ID)}&format=json&limit=1&search=${encodeURIComponent(q)}&audioformat=mp32`;
        const resp = await fetch(url);
        const data = await resp.json();
        if (!data.results || data.results.length === 0) {
        alert("No results found.");
        return;
        }
        const track = data.results[0];
        playTrack({
        name: track.name,
        artist: track.artist_name,
        audio: track.audio,
        duration: track.duration,
        });
    } catch (err) {
        console.error("Search error:", err);
        alert("Error fetching track.");
    }
    }

    // Events
    searchBtn?.addEventListener("click", performSearch);
    queryInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") performSearch();
    });
    enableAudioBtn?.addEventListener("click", () => {
    ensureInteraction();
    });

        // Juego simple: cuadrado salta triángulos
    (() => {
    const canvas = document.getElementById("waiting-game");
    const ctx = canvas.getContext("2d");
    const startBtn = document.getElementById("start-game-btn");
    const panel = document.getElementById("game-panel");
    const scoreEl = document.getElementById("score");
    const gameOverEl = document.getElementById("game-over");
    const restartBtn = document.getElementById("restart-btn");

    let animationId;
    let score = 0;
    let speed = 2.2;
    let obstacleTimer = 0;
    let obstacles = [];
    let playing = false;

    const player = {
        x: 30,
        y: canvas.height - 20 - 10, // 10 height
        width: 16,
        height: 16,
        dy: 0,
        gravity: 0.6,
        jumpStrength: -12,
        onGround: true,
        update() {
        this.dy += this.gravity;
        this.y += this.dy;
        if (this.y + this.height >= canvas.height - 10) {
            this.y = canvas.height - 10 - this.height;
            this.dy = 0;
            this.onGround = true;
        } else {
            this.onGround = false;
        }
        },
        draw() {
        ctx.fillStyle = "#89bfff";
        ctx.fillRect(this.x, this.y, this.width, this.height);
        },
        jump() {
        if (this.onGround) {
            this.dy = this.jumpStrength;
        }
        }
    };

    class Obstacle {
        constructor() {
        this.size = 20 + Math.random() * 10;
        this.x = canvas.width + 10;
        this.y = canvas.height - 10 - this.size;
        this.speed = speed;
        }
        update() {
        this.x -= this.speed;
        }
        draw() {
        ctx.fillStyle = "#4f8cff";
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.size);
        ctx.lineTo(this.x + this.size / 2, this.y);
        ctx.lineTo(this.x + this.size, this.y + this.size);
        ctx.closePath();
        ctx.fill();
        }
        isOffscreen() {
        return this.x + this.size < 0;
        }
        collidesWith(p) {
        // Simple AABB vs triangle approximate by bounding box
        const obsBox = {
            x: this.x,
            y: this.y,
            w: this.size,
            h: this.size
        };
        return !(
            p.x + p.width < obsBox.x ||
            p.x > obsBox.x + obsBox.w ||
            p.y + p.height < obsBox.y ||
            p.y > obsBox.y + obsBox.h
        );
        }
    }

    function resetGame() {
        score = 0;
        speed = 2.2;
        obstacleTimer = 0;
        obstacles = [];
        player.y = canvas.height - 10 - player.height;
        player.dy = 0;
        gameOverEl.style.display = "none";
        scoreEl.textContent = "0";
        playing = true;
        loop();
    }

    function loop() {
        if (!playing) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // spawn obstacles
        obstacleTimer += 1;
        if (obstacleTimer > 80) {
        obstacles.push(new Obstacle());
        obstacleTimer = 0;
        }
        // update & draw player
        player.update();
        player.draw();
        // update obstacles
        obstacles.forEach(o => {
        o.update();
        o.draw();
        });
        // remove offscreen
        obstacles = obstacles.filter(o => !o.isOffscreen());
        // collision
        for (let o of obstacles) {
        if (o.collidesWith(player)) {
            endGame();
            return;
        }
        }
        // increment score gradually
        score += 0.1;
        scoreEl.textContent = Math.floor(score);
        // escalate difficulty slightly
        if (Math.floor(score) % 100 === 0) speed = 2.2 + Math.floor(score) / 200;
        animationId = requestAnimationFrame(loop);
    }

    function endGame() {
        playing = false;
        cancelAnimationFrame(animationId);
        gameOverEl.style.display = "inline";
    }

    // Input
    window.addEventListener("keydown", e => {
        if (e.code === "Space") {
        player.jump();
        e.preventDefault();
        }
    });
    canvas.addEventListener("mousedown", () => player.jump());

    startBtn.addEventListener("click", () => {
        panel.style.display = "block";
        panel.classList.add("show");
        resetGame();
    });
    restartBtn.addEventListener("click", () => {
        resetGame();
    });
    })();
