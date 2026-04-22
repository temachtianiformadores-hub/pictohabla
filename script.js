// 1. INICIALIZACIÓN COMPATIBLE
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
            { id: "103", texto: "Agrega Picto", img: "logo_nemi_e.jpg" }
        ];
    }
} catch (e) {
    console.log("Error en LocalStorage");
}

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
    if (picto.texto === "Agrega Picto") return;
    
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

// 4. MODAL Y BUSCADOR (XMLHttpRequest para iPad)
window.abrirBuscador = function(e, id) {
    if (e) e.stopPropagation();
    idSeleccionado = id;
    document.getElementById('modal-buscador').style.display = 'block';
};

window.cerrarModal = function() {
    document.getElementById('modal-buscador').style.display = 'none';
};

window.ejecutarBusqueda = function() {
    var input = document.getElementById('input-busqueda');
    var termino = input ? input.value.trim().toLowerCase() : ""; // Forzamos minúsculas
    if (!termino) return;

    var resultadosContenedor = document.getElementById('resultados-busqueda');
    if (resultadosContenedor) {
        resultadosContenedor.innerHTML = '<p style="color: blue;">🔍 Conectando con ARASAAC...</p>';
    }

    // Cambiamos a la ruta de búsqueda de palabras clave (keywords) que es más estable
    var urlBusqueda = 'https://api.arasaac.org/api/pictograms/es/search/' + termino;
    
    var xhr = new XMLHttpRequest();
    
    // El tercer parámetro 'true' es para que sea asíncrono (obligatorio en iPad)
    xhr.open('GET', urlBusqueda, true);
    
    // ESTO ES LO QUE FALTA: Le decimos al servidor que esperamos un JSON
    xhr.setRequestHeader('Accept', 'application/json');

    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                try {
                    var data = JSON.parse(xhr.responseText);
                    if (data && data.length > 0) {
                        window.mostrarResultados(data);
                    } else {
                        resultadosContenedor.innerHTML = '<p>❌ No hay resultados para "' + termino + '".</p>';
                    }
                } catch (e) {
                    resultadosContenedor.innerHTML = '<p>⚠️ Error al procesar datos.</p>';
                }
            } else if (xhr.status === 400) {
                // Si da 400, intentamos una ruta alternativa automáticamente
                resultadosContenedor.innerHTML = '<p>Reintentando búsqueda simple...</p>';
                window.reintentoBusquedaSimple(termino);
            } else {
                resultadosContenedor.innerHTML = 
                    '<p style="color: red;">❌ Error ' + xhr.status + '</p>' +
                    '<p style="font-size: 11px;">Asegúrate de estar en HTTPS y sin bloqueadores de anuncios.</p>';
            }
        }
    };

    xhr.onerror = function() {
        resultadosContenedor.innerHTML = '<p style="color: red;">🚨 Bloqueo de seguridad (Status 0). Safari impidió la conexión.</p>';
    };

    xhr.send();
};

// Función de respaldo por si la primera falla con 400
window.reintentoBusquedaSimple = function(termino) {
    var urlAlt = 'https://api.arasaac.org/api/pictograms/es/bestsearch/' + termino;
    var xhrAlt = new XMLHttpRequest();
    xhrAlt.open('GET', urlAlt, true);
    xhrAlt.setRequestHeader('Accept', 'application/json');
    xhrAlt.onload = function() {
        if (xhrAlt.status === 200) {
            window.mostrarResultados(JSON.parse(xhrAlt.responseText));
        } else {
            document.getElementById('resultados-busqueda').innerHTML = '<p>❌ No fue posible conectar con el servidor.</p>';
        }
    };
    xhrAlt.send();
};

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

// ARRANQUE
window.onload = function() { window.renderizarTablero(); };
// ARRANQUE SEGURO
window.onload = function() {
    window.renderizarTablero();
};
