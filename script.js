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

// 1. FUNCIÓN DE BÚSQUEDA
window.ejecutarBusqueda = function() {
    var input = document.getElementById('input-busqueda');
    var termino = input ? input.value : "";
    
    if (!termino) {
        alert("Escribe algo para buscar");
        return;
    }

    console.log("Buscando en ARASAAC: " + termino);

    fetch('https://api.arasaac.org/api/pictograms/es/search/' + termino)
        .then(function(res) { 
            if (!res.ok) throw new Error("Error en red");
            return res.json(); 
        })
        .then(function(data) { 
            // IMPORTANTE: Llamamos a la función global
            window.mostrarResultados(data); 
        })
        .catch(function(err) { 
            console.error("Error en la API:", err);
            alert("No se encontraron resultados");
        });
};

// 2. FUNCIÓN PARA DIBUJAR LOS RESULTADOS (La pieza que te faltaba)
window.mostrarResultados = function(data) {
    var contenedor = document.getElementById('resultados-busqueda');
    if (!contenedor) return;
    
    contenedor.innerHTML = ''; // Limpiamos resultados anteriores

    // Si no hay datos o no es un array, avisamos
    if (!data || data.length === 0) {
        contenedor.innerHTML = '<p>No se encontraron imágenes.</p>';
        return;
    }

    // Dibujamos cada pictograma encontrado
    data.forEach(function(item) {
        var imgUrl = 'https://static.arasaac.org/pictograms/' + item._id + '/' + item._id + '_300.png';
        var img = document.createElement('img');
        img.src = imgUrl;
        img.alt = item.keywords[0].keyword;
        img.title = item.keywords[0].keyword;
        
        // Al hacer clic, guardamos la imagen en la celda
        img.onclick = function() {
            window.seleccionarImagenArasaac(imgUrl, item.keywords[0].keyword);
        };
        
        contenedor.appendChild(img);
    });
};

// 3. FUNCIÓN PARA ASIGNAR LA IMAGEN A LA CELDA
window.seleccionarImagenArasaac = function(url, texto) {
    // idSeleccionado debe ser una variable global definida al inicio de tu script
    if (!idSeleccionado) return;

    var indice = datosPictogramas.findIndex(function(p) { 
        return String(p.id) === String(idSeleccionado); 
    });

    if (indice !== -1) {
        datosPictogramas[indice].img = url;
        datosPictogramas[indice].texto = texto;
        
        // Guardamos en LocalStorage y redibujamos el tablero
        localStorage.setItem('tablero_datos', JSON.stringify(datosPictogramas));
        window.renderizarTablero();
        window.cerrarModal();
    }
};

// 4. ARRANQUE
document.addEventListener("DOMContentLoaded", function() {
    window.renderizarTablero();
});
let fraseActual = []; // Array para guardar la frase

window.seleccionarPictograma = function(picto) {
    // 1. Reproducir la voz inmediatamente
    if ('speechSynthesis' in window) {
        const mensaje = new SpeechSynthesisUtterance(picto.texto);
        mensaje.lang = 'es-MX';
        window.speechSynthesis.speak(mensaje);
    }

    // 2. Añadir a la barra de comunicación
    fraseActual.push(picto);
    actualizarBarraFrase();
};

window.actualizarBarraFrase = function() {
    const contenedor = document.getElementById('contenedor-frase');
    if (!contenedor) return;
    
    contenedor.innerHTML = '';
    fraseActual.forEach(function(p, index) {
        const item = document.createElement('div');
        item.className = 'frase-item';
        item.innerHTML = `
            <img src="${p.img}" style="width:50px; height:50px;">
            <p style="font-size:12px;">${p.texto}</p>
        `;
        // Opción: clic para eliminar de la frase
        item.onclick = function() {
            fraseActual.splice(index, 1);
            actualizarBarraFrase();
        };
        contenedor.appendChild(item);
    });
};

window.borrarFrase = function() {
    fraseActual = [];
    actualizarBarraFrase();
};
