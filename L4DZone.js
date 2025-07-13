function openModal(section) {
    console.log("Abriendo sección:", section);
    console.log("Ruta del HTML:", `Barra_Superior/${section}.html`);
    console.log("Ruta del CSS:", `Barra_Superior/${section}.css`);
    console.log("Ruta del JS:", `Barra_Superior/${section}.js`);

    const modal = document.getElementById("modalOverlay");
    const modalBody = document.getElementById("modalBody");

    // Elimina CSS y JS anteriores
    document.querySelectorAll('[data-dynamic-css]').forEach(el => el.remove());
    document.querySelectorAll('[data-dynamic-js]').forEach(el => el.remove());

    // Carga HTML
    fetch(`Barra_Superior/${section}.html`)
        .then(response => {
            console.log("Respuesta status:", response.status);
            if (!response.ok) throw new Error("No se pudo cargar el archivo.");
            return response.text();
        })
        .then(html => {
            modalBody.innerHTML = html;
            modal.style.display = "flex";
            console.log("Contenido HTML cargado:", html.length > 0 ? "Sí" : "No");
            console.log("Contenido cargado:", html); // Para verificar si llega el HTML

            // Carga CSS
            const css = document.createElement("link");
            css.rel = "stylesheet";
            css.href = `Barra_Superior/${section}.css`;
            css.setAttribute("data-dynamic-css", "true");
            document.head.appendChild(css);

            // Carga JS
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
function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    document.getElementById(tabId).style.display = 'block';
    event.target.classList.add('active');
}
