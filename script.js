// 1. INICIALIZACIÓN
var datosPictogramas = [];
var idSeleccionado = null;
var fraseActual = [];

try {
    var guardados = localStorage.getItem('tablero_datos');
    if (guardados) {
        datosPictogramas = JSON.parse(guardados);
    } else {
        datosPictogramas = [
            { id: "101", texto: "Agregar Picto", img: "logo_nemi_e.jpg" },
            { id: "102", texto: "Agregar Picto", img: "logo_nemi_e.jpg" },
            { id: "103", texto: "Agregar Picto", img: "logo_nemi_e.jpg" }
        ];
    }
} catch (e) {
    console.log("Error en LocalStorage");
}

// ARRANQUE
window.onload = function() {
    console.log("Iniciando tablero...");
    window.renderizarTablero();
};

// 2. RENDERIZADO
window.renderizarTablero = function() {
    var contenedor = document.getElementById('grid-tablero');
    if (!contenedor) return;
    contenedor.innerHTML = '';

    for (var i = 0; i < datosPictogramas.length; i++) {
        var picto = datosPictogramas[i];
        var card = document.createElement('div');
        card.className = 'card';
        
        (function(p) {
            card.onclick = function() { window.seleccionarPictograma(p); };
        })(picto);

        card.innerHTML = 
            '<button class="btn-limpiar" onclick="window.limpiarCelda(event, \'' + picto.id + '\')">🗑️</button>' +
            '<img src="' + (picto.img || 'logo_nemi_e.jpg') + '" onerror="this.src=\'logo_nemi_e.jpg\'">' +
            '<p>' + picto.texto + '</p>' +
            '<div class="controles-celda">' +
                '<button onclick="window.abrirBuscador(event, \'' + picto.id + '\')">✏️</button>' +
            '</div>';
        
        contenedor.appendChild(card);
    }
};

// 3. COMUNICACIÓN
window.seleccionarPictograma = function(picto) {
    if (picto.texto === "Agregar Picto") return;
    
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        var mensaje = new SpeechSynthesisUtterance(picto.texto);
        mensaje.lang = 'es-MX';
        window.speechSynthesis.speak(mensaje);
    }

    fraseActual.push(picto);
    window.actualizarBarraFrase();
};

window.actualizarBarraFrase = function() {
    var contenedor = document.getElementById('contenedor-frase');
    if (!contenedor) return;
    contenedor.innerHTML = '';
    for (var i = 0; i < fraseActual.length; i++) {
        var p = fraseActual[i];
        var item = document.createElement('div');
        item.className = 'frase-item';
        item.innerHTML = '<img src="' + p.img + '"><p>' + p.texto + '</p>';
        contenedor.appendChild(item);
    }
};

// 4. MODAL Y BUSCADORES
window.abrirBuscador = function(e, id) {
    if (e) e.stopPropagation();
    idSeleccionado = id;
    document.getElementById('modal-buscador').style.display = 'block';
};

window.cerrarModal = function() {
    document.getElementById('modal-buscador').style.display = 'none';
};

window.ejecutarBusqueda = function() {
    var fuenteElem = document.getElementById('selector-fuente');
    var fuente = fuenteElem ? fuenteElem.value : "arasaac";
    if (fuente === "arasaac") {
        window.ejecutarBusquedaArasaac();
    } else {
        window.ejecutarBusquedaGoogle();
    }
};

window.ejecutarBusquedaArasaac = function() {
    var input = document.getElementById('input-busqueda');
    var termino = input ? input.value.trim().toLowerCase() : "";
    if (!termino) return;

    var resultadosContenedor = document.getElementById('resultados-busqueda');
    resultadosContenedor.innerHTML = '<p>🔍 Buscando en ARASAAC...</p>';

    var urlArasaac = 'https://api.arasaac.org/api/pictograms/es/search/' + termino;

    fetch(urlArasaac)
    .then(function(res) { return res.json(); })
    .then(function(data) { window.mostrarResultados(data); })
    .catch(function(err) {
        console.log("Error Arasaac:", err);
        resultadosContenedor.innerHTML = '<p>Error. <button onclick="window.reintentoBusquedaSimple(\''+termino+'\')">Reintentar</button></p>';
    });
};

// Función para Google (Debes poner tus llaves aquí)
window.ejecutarBusquedaGoogle = function() {
    var termino = document.getElementById('input-busqueda').value;
    var resultadosContenedor = document.getElementById('resultados-busqueda');
    resultadosContenedor.innerHTML = '<p>🌐 Buscando fotos en Google...</p>';
    
    // Aquí pon tus credenciales de Google cuando las tengas
    alert("Configura tu API Key de Google para usar esta función.");
};

window.mostrarResultados = function(data) {
    var cont = document.getElementById('resultados-busqueda');
    if(!cont) return;
    cont.innerHTML = '';
    
    if(!data || data.length === 0) {
        cont.innerHTML = '<p>No se encontraron resultados.</p>';
        return;
    }

    for (var i = 0; i < data.length; i++) {
        (function(item) {
            var url = 'https://static.arasaac.org/pictograms/' + item._id + '/' + item._id + '_300.png';
            var img = document.createElement('img');
            img.src = url;
            img.style.width = "100px";
            img.style.margin = "5px";
            img.style.cursor = "pointer";
            img.onclick = function() { window.seleccionarImagenArasaac(url, item.keywords[0].keyword); };
            cont.appendChild(img);
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

// 5. FUNCIONES DE APOYO
window.reiniciarTableroCompleto = function() {
    if (confirm("¿Borrar todo el tablero?")) {
        localStorage.clear();
        window.location.reload(true);
    }
};

window.borrarFrase = function() { fraseActual = []; window.actualizarBarraFrase(); };

window.reproducirFraseCompleta = function() {
    var texto = "";
    for(var i=0; i<fraseActual.length; i++) { texto += fraseActual[i].texto + " "; }
    if (!texto) return;
    var m = new SpeechSynthesisUtterance(texto);
    m.lang = 'es-MX';
    window.speechSynthesis.speak(m);
};

window.limpiarCelda = function(e, id) {
    if (e) e.stopPropagation();
    for (var i = 0; i < datosPictogramas.length; i++) {
        if (String(datosPictogramas[i].id) === String(id)) {
            datosPictogramas[i].texto = "Agregar Picto";
            datosPictogramas[i].img = "logo_nemi_e.jpg";
        }
    }
    localStorage.setItem('tablero_datos', JSON.stringify(datosPictogramas));
    window.renderizarTablero();
};

window.añadirCelda = function() {
    datosPictogramas.push({ id: "id-" + Date.now(), texto: "Agregar Picto", img: "logo_nemi_e.jpg" });
    window.renderizarTablero();
};

window.quitarCelda = function() { 
    datosPictogramas.pop(); 
    window.renderizarTablero(); 
};
