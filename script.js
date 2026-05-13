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

    var urlArasaac = 'https://api.arasaac.org/api/pictograms/es/search/' + encodeURIComponent(termino);

    fetch(urlArasaac)
    .then(function(res) { return res.json(); })
    .then(function(data) {
        window.mostrarResultados(data); // Usa la función unificada
    })
    .catch(function(err) {
        console.error("Error Arasaac:", err);
        resultadosContenedor.innerHTML = '<p>Sin conexión con Arasaac.</p>';
    });
};

window.ejecutarBusquedaGoogle = function() {
    var input = document.getElementById('input-busqueda');
    var termino = input ? input.value.trim() : "";
    if (!termino) return;

    var resultadosContenedor = document.getElementById('resultados-busqueda');
    resultadosContenedor.innerHTML = '<p>🌐 Buscando fotos reales...</p>';

    // --- TUS LLAVES ---
    var API_KEY = "AIzaSyDR2hs4adO-9nCV8HmjciJ3ujgEzrGwVDM"; 
    var CX = "e269f0314e540432a";
    // ------------------

    var url = "https://www.googleapis.com/customsearch/v1?q=" + encodeURIComponent(termino) + 
              "&searchType=image&key=" + API_KEY + "&cx=" + CX;

    fetch(url)
    .then(function(res) { return res.json(); })
    .then(function(data) {
        // Google devuelve los resultados en data.items
        window.mostrarResultados(data.items || []); 
    })
    .catch(function(err) {
        console.error("Error Google:", err);
        resultadosContenedor.innerHTML = '<p>Error en Google. Revisa tu API Key.</p>';
    });
};

// FUNCIÓN UNIFICADA PARA MOSTRAR IMÁGENES
window.mostrarResultados = function(data) {
    var cont = document.getElementById('resultados-busqueda');
    if (!cont) return;
    cont.innerHTML = '';

    if (!data || data.length === 0) {
        cont.innerHTML = '<p>No se encontraron imágenes.</p>';
        return;
    }

    for (var i = 0; i < data.length; i++) {
        var item = data[i];
        // Detectar si es de Arasaac (tiene _id) o de Google (tiene link)
        var urlImagen = item._id ? 'https://static.arasaac.org/pictograms/' + item._id + '/' + item._id + '_300.png' : item.link;
        var textoImg = item.keywords ? item.keywords[0].keyword : "Imagen";

        var img = document.createElement('img');
        img.src = urlImagen;
        img.style.width = "100px";
        img.style.margin = "5px";
        img.style.cursor = "pointer";
        img.style.borderRadius = "8px";
        
        (function(u, t) {
            img.onclick = function() { window.seleccionarImagenArasaac(u, t); };
        })(urlImagen, textoImg);
        
        cont.appendChild(img);
    }
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
// --- UNIFICACIÓN TOTAL DE BÚSQUEDA ---

window.ejecutarBusqueda = function() {
    var selector = document.getElementById('selector-fuente');
    var fuente = selector ? selector.value : "arasaac";
    
    console.log("Comando recibido. Fuente actual: " + fuente);

    if (fuente === "google") {
        console.log("Llamando a Google Images...");
        if (typeof window.ejecutarBusquedaGoogle === "function") {
            window.ejecutarBusquedaGoogle();
        } else {
            console.error("Error: La función de Google no existe.");
        }
    } else {
        console.log("Llamando a Arasaac...");
        if (typeof window.ejecutarBusquedaArasaac === "function") {
            window.ejecutarBusquedaArasaac();
        } else {
            console.error("Error: La función de Arasaac no existe.");
        }
    }
};

// Forzamos que cualquier botón apunte a esta nueva lógica
window.gestionarBusqueda = window.ejecutarBusqueda;
