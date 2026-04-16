// 1. DATOS INICIALES (IDs fijos para evitar errores de Date.now en iPad)
let datosPictogramas = JSON.parse(localStorage.getItem('tablero_datos')) || [
    { id: "101", texto: "Agrega Picto", img: "logo_nemi_e.jpg", audio: null },
    { id: "102", texto: "Agrega Picto", img: "logo_nemi_e.jpg", audio: null }
];

let idSeleccionado = null;

// 2. RENDERIZAR (Versión ultra-compatible)
function renderizarTablero() {
    var contenedor = document.getElementById('grid-tablero');
    if (!contenedor) return;
    contenedor.innerHTML = '';

    datosPictogramas.forEach(function(picto) {
        var card = document.createElement('div');
        card.className = 'card';
        card.onclick = function() { seleccionarPictograma(picto); };

        // IMPORTANTE: id entre comillas simples '${picto.id}' para Safari
        card.innerHTML = `
            <button class="btn-limpiar" onclick="botonLimpiar(event, '${picto.id}')">🗑️</button>
            <img src="${picto.img || 'logo_nemi_e.jpg'}" alt="">
            <p>${picto.texto}</p>
            <div class="controles-celda">
                <button onclick="abrirBuscador(event, '${picto.id}')">✏️</button>
            </div>
        `;
        contenedor.appendChild(card);
    });
}

// 3. FUNCIONES GLOBALES (Aseguramos que el HTML las vea)
window.botonLimpiar = function(event, id) {
    event.stopPropagation();
    if (confirm("¿Vaciar celda?")) {
        const i = datosPictogramas.findIndex(p => String(p.id) === String(id));
        if (i !== -1) {
            datosPictogramas[i].texto = "Agrega Picto";
            datosPictogramas[i].img = "logo_nemi_e.jpg";
            datosPictogramas[i].audio = null;
            guardarYRefrescar();
        }
    }
};

window.abrirBuscador = function(event, id) {
    event.stopPropagation();
    idSeleccionado = id;
    const modal = document.getElementById('modal-buscador');
    if (modal) modal.style.display = 'block';
};

window.añadirCelda = function() {
    datosPictogramas.push({ id: "id-" + Date.now(), texto: "Nuevo Picto", img: "logo_nemi_e.jpg", audio: null });
    guardarYRefrescar();
};

window.quitarCelda = function() {
    datosPictogramas.pop();
    guardarYRefrescar();
};

window.reiniciarTableroCompleto = function() {
    if (confirm("¿Borrar todo?")) {
        localStorage.removeItem('tablero_datos');
        location.reload();
    }
};

function guardarYRefrescar() {
    localStorage.setItem('tablero_datos', JSON.stringify(datosPictogramas));
    renderizarTablero();
}

// 4. EL ARRANQUE (Solo un método, el más seguro para iPad)
document.addEventListener("DOMContentLoaded", function() {
    console.log("App lista");
    renderizarTablero();
});
