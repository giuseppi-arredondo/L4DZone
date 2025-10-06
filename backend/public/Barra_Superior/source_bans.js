    function toggleInfo(playerDiv) {
    const details = playerDiv.querySelector(".banned-details");
    details.style.display = details.style.display === "block" ? "none" : "block";
    }
    // Simple toggle for showing/hiding details. Only one open at a time.
    function toggleInfo(el) {
    const all = document.querySelectorAll('.banned-player .banned-details');
    all.forEach(d => {
        if (d !== el.querySelector('.banned-details')) {
        d.classList.remove('active');
        }
    });

    const details = el.querySelector('.banned-details');
    if (!details) return;
    details.classList.toggle('active');
    }

    // Optional: close detail if clicked outside
    document.addEventListener('click', (e) => {
    const player = e.target.closest('.banned-player');
    if (!player) {
        document.querySelectorAll('.banned-details.active').forEach(d => d.classList.remove('active'));
    }
    });
// source_bans.js
    document.addEventListener("DOMContentLoaded", () => {
    // Attach click listeners to all current and future banned-player elements
    document.body.addEventListener("click", (e) => {
        const card = e.target.closest(".banned-player");
        if (!card) return;
        toggleInfo(card);
    });
    });

    function toggleInfo(card) {
    const details = card.querySelector(".banned-details");
    if (!details) return;
    const isOpen = card.classList.toggle("open");
    if (isOpen) {
        details.classList.add("active");
    } else {
        details.classList.remove("active");
    }
    }
    // source_bans.js
    document.addEventListener("DOMContentLoaded", () => {
    // Toggle details on click
    document.body.addEventListener("click", (e) => {
        const card = e.target.closest(".banned-player");
        if (!card) return;
        toggleInfo(card);
    });

    // Search input
    const searchInput = document.getElementById("ban-search");
    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener("input", () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            filterPlayers(searchInput.value.trim().toLowerCase());
        }, 180);
        });
    }
    });

    function toggleInfo(card) {
    const details = card.querySelector(".banned-details");
    if (!details) return;
    const isOpen = card.classList.toggle("open");
    if (isOpen) {
        details.classList.add("active");
    } else {
        details.classList.remove("active");
    }
    }

    function filterPlayers(query) {
    const all = document.querySelectorAll(".banned-player");
    if (!query) {
        all.forEach(c => {
        c.style.display = "";
        });
        return;
    }
    all.forEach(card => {
        // collect searchable text: summary name + all detail values
        let text = "";
        const nameEl = card.querySelector(".banned-name");
        if (nameEl) text += nameEl.textContent + " ";
        const statusEl = card.querySelector(".banned-status");
        if (statusEl) text += statusEl.textContent + " ";
        const serverEl = card.querySelector(".banned-server");
        if (serverEl) text += serverEl.textContent + " ";

        // details fields
        const detailValues = card.querySelectorAll(".detail-value");
        detailValues.forEach(d => {
        text += d.textContent + " ";
        });
        const detailRows = card.querySelectorAll(".banned-details p");
        detailRows.forEach(p => {
        text += p.textContent + " ";
        });

        if (text.toLowerCase().includes(query)) {
        card.style.display = "";
        } else {
        card.style.display = "none";
        }
    });
    }
    // Utility: Levenshtein distance for fuzzy suggestion
    function levenshtein(a, b) {
    const dp = Array.from({ length: a.length + 1 }, () => []);
    for (let i = 0; i <= a.length; i++) dp[i][0] = i;
    for (let j = 0; j <= b.length; j++) dp[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
        if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1];
        else dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
    }
    return dp[a.length][b.length];
    }

    document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("ban-search");
    const clearBtn = document.getElementById("clear-search");
    const suggestionsEl = document.getElementById("suggestions");
    const panel = document.getElementById("banned-panel");
    const paginationEl = document.getElementById("pagination");
    let currentPage = 1;
    const perPage = 6;

    // Initial render/pagination
    renderPage(1);

    // Toggle expansion
    panel.addEventListener("click", (e) => {
        const card = e.target.closest(".banned-player");
        if (!card) return;
        card.classList.toggle("open");
    });

    // Search with debounce
    let debounce;
    searchInput.addEventListener("input", () => {
        clearTimeout(debounce);
        debounce = setTimeout(() => {
        const q = searchInput.value.trim().toLowerCase();
        filterAndRender(q);
        }, 150);
    });

    clearBtn.addEventListener("click", () => {
        searchInput.value = "";
        suggestionsEl.textContent = "";
        filterAndRender("");
    });

    function collectText(card) {
        let text = "";
        text += card.dataset.name + " ";
        text += card.dataset.steam + " ";
        text += card.dataset.reason + " ";
        text += card.dataset.server + " ";
        // also include detail values
        card.querySelectorAll(".detail-value").forEach(d => {
        text += d.textContent + " ";
        });
        return text.toLowerCase();
    }

    function filterAndRender(query) {
        const allCards = Array.from(panel.querySelectorAll(".banned-player"));
        // filtering
        let filtered = allCards.filter(card => {
        if (!query) return true;
        const haystack = collectText(card);
        return haystack.includes(query);
        });

        // build suggestion (closest name if nothing exact match)
        if (query) {
        const names = allCards.map(c => c.dataset.name);
        const distances = names.map(n => ({ name: n, dist: levenshtein(n.toLowerCase(), query.toLowerCase()) }));
        distances.sort((a, b) => a.dist - b.dist);
        const top = distances.slice(0, 3).filter(d => d.dist <= Math.max(1, query.length * 0.4));
        if (top.length && !filtered.length) {
            suggestionsEl.innerHTML = `Did you mean: ${top.map(t => `<strong>${t.name}</strong>`).join(", ")}`;
        } else {
            suggestionsEl.textContent = "";
        }
        } else {
        suggestionsEl.textContent = "";
        }

        // highlight matches
        filtered.forEach(card => {
        highlightCard(card, query);
        });
        // hide others
        allCards.forEach(card => {
        card.style.display = filtered.includes(card) ? "" : "none";
        });
        // pagination reset
        currentPage = 1;
        renderPage(currentPage);
    }

    function highlightCard(card, query) {
        if (!query) {
        // remove existing highlights
        card.querySelectorAll("mark.match").forEach(m => {
            const text = m.textContent;
            m.replaceWith(document.createTextNode(text));
        });
        return;
        }
        // simple highlight on summary and details
        const fields = card.querySelectorAll(".banned-summary, .banned-details");
        fields.forEach(el => {
        el.querySelectorAll("mark.match").forEach(m => {
            const text = m.textContent;
            m.replaceWith(document.createTextNode(text));
        });
        let html = el.innerHTML;
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`(${escaped})`, "gi");
        html = html.replace(regex, "<mark class='match'>$1</mark>");
        el.innerHTML = html;
        });
    }

    function renderPage(page) {
        const allVisible = Array.from(panel.querySelectorAll(".banned-player")).filter(c => c.style.display !== "none");
        const total = allVisible.length;
        const totalPages = Math.max(1, Math.ceil(total / perPage));
        currentPage = Math.min(page, totalPages);

        // hide all, show slice
        allVisible.forEach(c => (c.style.display = "none"));
        const start = (currentPage - 1) * perPage;
        const showing = allVisible.slice(start, start + perPage);
        showing.forEach(c => (c.style.display = ""));

        // build pagination UI
        paginationEl.innerHTML = "";
        if (totalPages <= 1) return;
        for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement("button");
        btn.textContent = i;
        btn.className = "page-btn" + (i === currentPage ? " active" : "");
        btn.addEventListener("click", () => renderPage(i));
        paginationEl.appendChild(btn);
        }
    }

    // initial highlight clean
    highlightCard(null, "");
    });
