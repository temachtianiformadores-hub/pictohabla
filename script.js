// 1. INICIALIZACIÓN COMPATIBLE
var datosPictogramas = [];
var idSeleccionado = null;
var fraseActual = [];

// Intentar cargar datos, si falla, usar predeterminados
try {
    var guardados = localStorage.getItem('tablero_datos');
    if (guardados) {
        datosPictogramas = JSON.parse(guardados);
    } else {
        datosPictogramas = [
            { id: "101", texto: "yo", img: "https://static.arasaac.org/pictograms/2340/2340_300.png" },
            { id: "102", texto: "querer", img: "https://static.arasaac.org/pictograms/2344/2344_300.png" },
            { id: "103", texto: "Agrega Picto", img: "logo_nemi_e.jpg" }
        ];
    }
} catch (e) {
    console.log("Error en LocalStorage");
}

// 2. RENDERIZADO (ESTILO TRADICIONAL)
window.renderizarTablero = function() {
    var contenedor = document.getElementById('grid-tablero');
    if (!contenedor) return;
    contenedor.innerHTML = '';

    for (var i = 0; i < datosPictogramas.length; i++) {
        var picto = datosPictogramas[i];
        var card = document.createElement('div');
        card.className = 'card';
        
        // Creamos una función de cierre para capturar el picto actual
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
    if (picto.texto === "Agrega Picto") return;
    
    if (picto.audioPersonalizado) {
        var audio = new Audio(picto.audioPersonalizado);
        audio.play();
    } else if (window.speechSynthesis) {
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

// 4. MODAL Y BUSCADOR
window.abrirBuscador = function(e, id) {
    if (e) e.stopPropagation();
    idSeleccionado = id;
    document.getElementById('modal-buscador').style.display = 'block';
};

window.cerrarModal = function() {
    document.getElementById('modal-buscador').style.display = 'none';
};
«`
/
window.ejecutarBusqueda = function() {
    var input = document.getElementById('input-busqueda');
    var termino = input.value;
    if (!termino) return;

    fetch('https://api.arasaac.org/api/pictograms/es/search/' + termino)
        .then(function(res) { return res.json(); })
        .then(function(data) { window.mostrarResultados(data); });
};
/
«`
window.mostrarResultados = function(data) {
    var cont = document.getElementById('resultados-busqueda');
    cont.innerHTML = '';
    for (var i = 0; i < data.length; i++) {
        (function(item) {
            var url = 'https://static.arasaac.org/pictograms/' + item._id + '/' + item._id + '_300.png';
            var img = document.createElement('img');
            img.src = url;
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

// --- FUNCIÓN DE REINICIO CORREGIDA ---
window.reiniciarTableroCompleto = function() {
    // En móviles, a veces el confirm() se bloquea, así que lo hacemos directo
    // o con una validación simple.
    var confirmacion = confirm("¿Estás seguro de que deseas borrar todo el tablero?");
    
    if (confirmacion) {
        try {
            localStorage.removeItem('tablero_datos');
            localStorage.clear();
            // Forzamos la recarga completa para limpiar la memoria del iPad
            window.location.reload(true); 
        } catch (e) {
            // Si falla el storage, al menos refrescamos
            window.location.href = window.location.pathname + '?refresh=' + Date.now();
        }
    }
};

// --- FUNCIÓN DE BÚSQUEDA REFORZADA ---
window.ejecutarBusqueda = function() {
    var input = document.getElementById('input-busqueda');
    var termino = input ? input.value.trim() : "";
    
    if (termino === "") {
        alert("Por favor, escribe una palabra.");
        return;
    }

    var resultadosContenedor = document.getElementById('resultados-busqueda');
    if (resultadosContenedor) {
        resultadosContenedor.innerHTML = '<p style="color: blue;">Buscando...</p>';
    }

    // Usamos XMLHttpRequest para asegurar compatibilidad con iPads viejos
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://api.arasaac.org/api/pictograms/es/search/' + encodeURIComponent(termino), true);
    
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                try {
                    var data = JSON.parse(xhr.responseText);
                    window.mostrarResultados(data);
                } catch (e) {
                    resultadosContenedor.innerHTML = '<p>Error en los datos.</p>';
                }
            } else {
                resultadosContenedor.innerHTML = '<p>No se encontró nada o hay error de red.</p>';
            }
        }
    };
    xhr.send();
};

// 5. FUNCIONES DE APOYO
window.borrarFrase = function() { fraseActual = []; window.actualizarBarraFrase(); };
window.reproducirFraseCompleta = function() {
    var texto = "";
    for(var i=0; i<fraseActual.length; i++) { texto += fraseActual[i].texto + " "; }
    var m = new SpeechSynthesisUtterance(texto);
    m.lang = 'es-MX';
    window.speechSynthesis.speak(m);
};

window.limpiarCelda = function(e, id) {
    if (e) e.stopPropagation();
    for (var i = 0; i < datosPictogramas.length; i++) {
        if (String(datosPictogramas[i].id) === String(id)) {
            datosPictogramas[i].texto = "Agrega Picto";
            datosPictogramas[i].img = "logo_nemi_e.jpg";
        }
    }
    localStorage.setItem('tablero_datos', JSON.stringify(datosPictogramas));
    window.renderizarTablero();
};

window.añadirCelda = function() {
    datosPictogramas.push({ id: "id-" + Date.now(), texto: "Agrega Picto", img: "logo_nemi_e.jpg" });
    window.renderizarTablero();
};

window.quitarCelda = function() { datosPictogramas.pop(); window.renderizarTablero(); };

// ARRANQUE SEGURO
window.onload = function() {
    window.renderizarTablero();
};
