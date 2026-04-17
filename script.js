// 1. DATOS Y VARIABLES GLOBALES
var datosPictogramas = JSON.parse(localStorage.getItem('tablero_datos')) || [
    { id: "101", texto: "Agrega Picto", img: "logo_nemi_e.jpg" },
    { id: "102", texto: "Agrega Picto", img: "logo_nemi_e.jpg" }
];
var idSeleccionado = null;
var fraseActual = [];

// 2. RENDERIZADO DEL TABLERO
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

// 3. COMUNICACIÓN Y VOZ
window.seleccionarPictograma = function(picto) {
    if (picto.texto === "Agrega Picto") return;

    // Reproducir voz
    if ('speechSynthesis' in window) {
        var mensaje = new SpeechSynthesisUtterance(picto.texto);
        mensaje.lang = 'es-MX';
        window.speechSynthesis.speak(mensaje);
    }

    // Añadir a la frase
    fraseActual.push(picto);
    window.actualizarBarraFrase();
};

window.actualizarBarraFrase = function() {
    var contenedor = document.getElementById('contenedor-frase');
    if (!contenedor) return;
    contenedor.innerHTML = '';

    fraseActual.forEach(function(p, index) {
        var item = document.createElement('div');
        item.className = 'frase-item';
        item.innerHTML = `
            <img src="${p.img}" style="width:60px; height:60px; border-radius: 8px;">
            <p style="font-size:12px; margin:0;">${p.texto}</p>
        `;
        item.onclick = function() {
            fraseActual.splice(index, 1);
            window.actualizarBarraFrase();
        };
        contenedor.appendChild(item);
    });
};

window.reproducirFraseCompleta = function() {
    if (fraseActual.length === 0) return;
    var textoCompleto = fraseActual.map(function(p) { return p.texto; }).join(" ");
    var mensaje = new SpeechSynthesisUtterance(textoCompleto);
    mensaje.lang = 'es-MX';
    window.speechSynthesis.speak(mensaje);
};

window.borrarFrase = function() {
    fraseActual = [];
    window.actualizarBarraFrase();
};

// 4. BÚSQUEDA Y ARASAAC
window.abrirBuscador = function(event, id) {
    if(event) event.stopPropagation();
    idSeleccionado = id;
    document.getElementById('modal-buscador').style.display = 'block';
};

window.cerrarModal = function() {
    document.getElementById('modal-buscador').style.display = 'none';
};

window.ejecutarBusqueda = function() {
    var input = document.getElementById('input-busqueda');
    var termino = input ? input.value : "";
    if (!termino) return alert("Escribe algo");

    fetch('https://api.arasaac.org/api/pictograms/es/search/' + termino)
        .then(function(res) { return res.json(); })
        .then(function(data) { window.mostrarResultados(data); })
        .catch(function(err) { console.error(err); });
};

window.mostrarResultados = function(data) {
    var contenedor = document.getElementById('resultados-busqueda');
    if (!contenedor) return;
    contenedor.innerHTML = '';

    if (!data || data.length === 0) {
        contenedor.innerHTML = '<p>No se encontraron resultados.</p>';
        return;
    }

    data.forEach(function(item) {
        var imgUrl = 'https://static.arasaac.org/pictograms/' + item._id + '/' + item._id + '_300.png';
        var img = document.createElement('img');
        img.src = imgUrl;
        img.onclick = function() {
            window.seleccionarImagenArasaac(imgUrl, item.keywords[0].keyword);
        };
        contenedor.appendChild(img);
    });
};

window.seleccionarImagenArasaac = function(url, texto) {
    var indice = datosPictogramas.findIndex(function(p) { return String(p.id) === String(idSeleccionado); });
    if (indice !== -1) {
        datosPictogramas[indice].img = url;
        datosPictogramas[indice].texto = texto;
        localStorage.setItem('tablero_datos', JSON.stringify(datosPictogramas));
        window.renderizarTablero();
        window.cerrarModal();
    }
};

// 5. GESTIÓN DE CELDAS
window.añadirCelda = function() {
    datosPictogramas.push({ id: "id-" + Date.now(), texto: "Agrega Picto", img: "logo_nemi_e.jpg" });
    localStorage.setItem('tablero_datos', JSON.stringify(datosPictogramas));
    window.renderizarTablero();
};

window.quitarCelda = function() {
    if (datosPictogramas.length > 1) {
        datosPictogramas.pop();
        localStorage.setItem('tablero_datos', JSON.stringify(datosPictogramas));
        window.renderizarTablero();
    }
};

window.limpiarCelda = function(event, id) {
    if(event) event.stopPropagation();
    var i = datosPictogramas.findIndex(function(p) { return String(p.id) === String(id); });
    if (i !== -1) {
        datosPictogramas[i].texto = "Agrega Picto";
        datosPictogramas[i].img = "logo_nemi_e.jpg";
        localStorage.setItem('tablero_datos', JSON.stringify(datosPictogramas));
        window.renderizarTablero();
    }
};

window.reiniciarTableroCompleto = function() {
    if (confirm("¿Reiniciar todo?")) {
        localStorage.removeItem('tablero_datos');
        location.reload();
    }
};

document.addEventListener("DOMContentLoaded", window.renderizarTablero);
