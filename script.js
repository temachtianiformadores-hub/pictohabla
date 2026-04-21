// 1. ESTADO GLOBAL (USANDO VAR PARA COMPATIBILIDAD TOTAL)
var datosPictogramas = [];
var idSeleccionado = null;
var fraseActual = [];

// Carga inicial segura
try {
    var backup = localStorage.getItem('tablero_datos');
    if (backup) {
        datosPictogramas = JSON.parse(backup);
    } else {
        datosPictogramas = [
            { id: "101", texto: "yo", img: "https://static.arasaac.org/pictograms/2340/2340_300.png" },
            { id: "102", texto: "querer", img: "https://static.arasaac.org/pictograms/2344/2344_300.png" },
            { id: "103", texto: "Agrega Picto", img: "logo_nemi_e.jpg" }
        ];
    }
} catch (err) {
    console.log("Error de almacenamiento");
}

// 2. RENDERIZADO CON "CLICK" REFORZADO
window.renderizarTablero = function() {
    var grid = document.getElementById('grid-tablero');
    if (!grid) return;
    grid.innerHTML = '';

    for (var i = 0; i < datosPictogramas.length; i++) {
        var p = datosPictogramas[i];
        var card = document.createElement('div');
        card.className = 'card';
        
        // Atributos de datos para identificar la celda
        card.setAttribute('data-id', p.id);
        
        // Usamos una función tradicional para el evento
        card.onclick = function(e) {
            var targetId = this.getAttribute('data-id');
            var encontrado = null;
            for(var j=0; j<datosPictogramas.length; j++) {
                if(datosPictogramas[j].id == targetId) { encontrado = datosPictogramas[j]; break; }
            }
            if(encontrado) window.seleccionarPictograma(encontrado);
        };

        card.innerHTML = 
            '<button class="btn-limpiar" onclick="window.limpiarCelda(event, \'' + p.id + '\')">🗑️</button>' +
            '<img src="' + (p.img || 'logo_nemi_e.jpg') + '" pointer-events="none">' +
            '<p>' + p.texto + '</p>' +
            '<div class="controles-celda">' +
                '<button onclick="window.abrirBuscador(event, \'' + p.id + '\')">✏️</button>' +
            '</div>';
        
        grid.appendChild(card);
    }
};

// 3. FUNCIONES DE VENTANA (GLOBALES)
window.seleccionarPictograma = function(picto) {
    if (!picto || picto.texto === "Agrega Picto") return;
    
    // Voz
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel(); // Detiene voces anteriores
        var mensaje = new SpeechSynthesisUtterance(picto.texto);
        mensaje.lang = 'es-MX';
        window.speechSynthesis.speak(mensaje);
    }

    fraseActual.push(picto);
    window.actualizarBarraFrase();
};

window.actualizarBarraFrase = function() {
    var cont = document.getElementById('contenedor-frase');
    if (!cont) return;
    cont.innerHTML = '';
    for (var i = 0; i < fraseActual.length; i++) {
        var item = document.createElement('div');
        item.className = 'frase-item';
        item.innerHTML = '<img src="' + fraseActual[i].img + '"><p>' + fraseActual[i].texto + '</p>';
        cont.appendChild(item);
    }
};

window.abrirBuscador = function(e, id) {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    idSeleccionado = id;
    var modal = document.getElementById('modal-buscador');
    if(modal) modal.style.display = 'block';
};

window.cerrarModal = function() {
    var modal = document.getElementById('modal-buscador');
    if(modal) modal.style.display = 'none';
};

window.ejecutarBusqueda = function() {
    var input = document.getElementById('input-busqueda');
    if (!input || !input.value) return;

    // Usamos XMLHttpRequest en lugar de Fetch si el iPad es muy viejo
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://api.arasaac.org/api/pictograms/es/search/' + input.value, true);
    xhr.onload = function() {
        if (xhr.status === 200) {
            window.mostrarResultados(JSON.parse(xhr.responseText));
        }
    };
    xhr.send();
};

window.mostrarResultados = function(data) {
    var res = document.getElementById('resultados-busqueda');
    res.innerHTML = '';
    for (var i = 0; i < data.length; i++) {
        (function(item) {
            var url = 'https://static.arasaac.org/pictograms/' + item._id + '/' + item._id + '_300.png';
            var img = document.createElement('img');
            img.src = url;
            img.onclick = function() { window.seleccionarImagenArasaac(url, item.keywords[0].keyword); };
            res.appendChild(img);
        })(data[i]);
    }
};

window.seleccionarImagenArasaac = function(url, texto) {
    for (var i = 0; i < datosPictogramas.length; i++) {
        if (String(datosPictogramas[i].id) === String(idSeleccionado)) {
            datosPictogramas[i].img = url;
            datosPictogramas[i].texto = texto;
            break;
        }
    }
    localStorage.setItem('tablero_datos', JSON.stringify(datosPictogramas));
    window.renderizarTablero();
    window.cerrarModal();
};

// 4. ACCIONES DE BARRA
window.borrarFrase = function() {
    fraseActual = [];
    window.actualizarBarraFrase();
};

window.reproducirFraseCompleta = function() {
    var t = "";
    for(var i=0; i<fraseActual.length; i++) { t += fraseActual[i].texto + " "; }
    if(!t) return;
    var m = new SpeechSynthesisUtterance(t);
    m.lang = 'es-MX';
    window.speechSynthesis.speak(m);
};

// 5. INICIO FORZADO
if (document.readyState === "complete" || document.readyState === "interactive") {
    window.renderizarTablero();
} else {
    document.addEventListener("DOMContentLoaded", window.renderizarTablero);
}
