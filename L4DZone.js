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