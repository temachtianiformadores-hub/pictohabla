// 1. DATOS Y VARIABLES GLOBALES
var datosPictogramas = JSON.parse(localStorage.getItem('tablero_datos')) || [
    { id: "101", texto: "Agrega Picto", img: "logo_nemi_e.jpg", audio: null },
    { id: "102", texto: "Agrega Picto", img: "logo_nemi_e.jpg", audio: null }
];
var idSeleccionado = null;

// 2. FUNCIONES DE RENDERIZADO
window.renderizarTablero = function() {
    var contenedor = document.getElementById('grid-tablero');
    if (!contenedor) return;
    contenedor.innerHTML = '';

    datosPictogramas.forEach(function(picto) {
        var card = document.createElement('div');
        card.className = 'card';
        card.onclick = function() { window.seleccionarPictograma(picto); };

        card.innerHTML = `
            <button class="btn-limpiar" onclick="window.limpiarCelda(event, '${picto.id}')">🗑️</button>
            <img src="${picto.img || 'logo_nemi_e.jpg'}" alt="${picto.texto}">
            <p>${picto.texto}</p>
            <div class="controles-celda">
                <button onclick="window.abrirBuscador(event, '${picto.id}')">✏️</button>
            </div>
        `;
        contenedor.appendChild(card);
    });
};

// 3. FUNCIONES DEL MODAL Y BÚSQUEDA (Globalizadas)
window.abrirBuscador = function(event, id) {
    if(event) event.stopPropagation();
    idSeleccionado = id;
    document.getElementById('modal-buscador').style.display = 'block';
};

window.cerrarModal = function() {
    document.getElementById('modal-buscador').style.display = 'none';
};

window.ejecutarBusqueda = function() {
    var termino = document.getElementById('input-busqueda').value;
    if (!termino) return alert("Escribe algo");

    fetch('https://api.arasaac.org/api/pictograms/es/search/' + termino)
        .then(function(res) { return res.json(); })
        .then(function(data) { mostrarResultados(data); })
        .catch(function(err) { console.error(err); });
};

// ... Asegúrate de tener definidas mostrarResultados, seleccionarPictograma y limpiarCelda con "window." delante.

// 4. ARRANQUE
document.addEventListener("DOMContentLoaded", function() {
    window.renderizarTablero();
});
