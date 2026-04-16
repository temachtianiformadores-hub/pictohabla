// 1. VARIABLES Y DATOS (Estructura Blindada)
var iniciales = [
    { id: "101", texto: "Agrega Picto", img: "logo_nemi_e.jpg", audio: null },
    { id: "102", texto: "Agrega Picto", img: "logo_nemi_e.jpg", audio: null }
];

var datosPictogramas = JSON.parse(localStorage.getItem('tablero_datos')) || iniciales;
var idSeleccionado = null;

// 2. RENDERIZAR TABLERO
function renderizarTablero() {
    var contenedor = document.getElementById('grid-tablero');
    if (!contenedor) return;
    contenedor.innerHTML = '';

    datosPictogramas.forEach(function(picto) {
        var card = document.createElement('div');
        card.className = 'card';
        card.onclick = function() { seleccionarPictograma(picto); };

        card.innerHTML = `
            <button class="btn-limpiar" onclick="limpiarCelda(event, '${picto.id}')">🗑️</button>
            <img src="${picto.img || 'logo_nemi_e.jpg'}" alt="">
            <p>${picto.texto}</p>
            <div class="controles-celda">
                <button onclick="abrirBuscador(event, '${picto.id}')">✏️</button>
            </div>
        `;
        contenedor.appendChild(card);
    });
    console.log("Tablero renderizado con éxito");
}

// 3. FUNCIONES GLOBALES (Blindadas para que el HTML siempre las vea)
window.añadirCelda = function() {
    datosPictogramas.push({ id: "id-" + Date.now(), texto: "Nuevo Picto", img: "logo_nemi_e.jpg", audio: null });
    guardarYRefrescar();
};

window.quitarCelda = function() {
    datosPictogramas.pop();
    guardarYRefrescar();
};

window.reiniciarTableroCompleto = function() {
    if (confirm("¿Borrar todo el progreso?")) {
        localStorage.removeItem('tablero_datos');
        location.reload();
    }
};

window.limpiarCelda = function(event, id) {
    event.stopPropagation();
    var i = datosPictogramas.findIndex(function(p) { return String(p.id) === String(id); });
    if (i !== -1) {
        datosPictogramas[i].texto = "Agrega Picto";
        datosPictogramas[i].img = "logo_nemi_e.jpg";
        datosPictogramas[i].audio = null;
        guardarYRefrescar();
    }
};

window.abrirBuscador = function(event, id) {
    event.stopPropagation();
    idSeleccionado = id;
    var modal = document.getElementById('modal-buscador');
    if (modal) modal.style.display = 'block';
};

function guardarYRefrescar() {
    localStorage.setItem('tablero_datos', JSON.stringify(datosPictogramas));
    renderizarTablero();
}

// 4. ARRANQUE ÚNICO
document.addEventListener("DOMContentLoaded", function() {
    console.log("App Iniciada correctamente");
    renderizarTablero();
});
// Función para cerrar el buscador de Arasaac
window.cerrarModal = function() {
    const modal = document.getElementById('modal-buscador');
    if (modal) {
        modal.style.display = 'none';
        console.log("Modal cerrado correctamente");
    }
};
