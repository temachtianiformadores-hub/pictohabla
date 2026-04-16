// 1. VARIABLES Y DATOS (Ajuste para compatibilidad total)
let datosPictogramas = JSON.parse(localStorage.getItem('tablero_datos'));

// Si no hay datos, cargamos los básicos con IDs simples (mejor para Safari)
if (!datosPictogramas || datosPictogramas.length === 0) {
    datosPictogramas = [
        { id: 101, texto: "Agrega Picto", img: "logo_nemi_e.jpg", audio: null },
        { id: 102, texto: "Agrega Picto", img: "logo_nemi_e.jpg", audio: null }
    ];
}

let idSeleccionado = null;
let mediaRecorder;
let chunks = [];

// 2. RENDERIZAR TABLERO
function renderizarTablero() {
    var contenedor = document.getElementById('grid-tablero');
    if (!contenedor) return;

    contenedor.innerHTML = '';

    datosPictogramas.forEach(function(picto) {
        var card = document.createElement('div');
        card.className = 'card';
        
        // Usamos una función tradicional para el click
        card.onclick = function() { seleccionarPictograma(picto); };

        // IMPORTANTE: Envolvemos el ID en comillas simples '${picto.id}' 
        // para que Safari no lo confunda con un número científico
        card.innerHTML = `
            <button class="btn-limpiar" onclick="limpiarContenidoCeldaDeVerdad(event, '${picto.id}')">🗑️</button>
            <img src="${picto.img || 'logo_nemi_e.jpg'}" alt="${picto.texto}">
            <p>${picto.texto}</p>
            <div class="controles-celda">
                <button onclick="abrirBuscador(event, '${picto.id}')">✏️</button>
            </div>
        `;
        contenedor.appendChild(card);
    });
    console.log("Tablero renderizado con éxito");
}

// 3. FUNCIONES DE BOTONES
function añadirCelda() {
    const nuevaCelda = {
        id: "id-" + Date.now(), // ID como texto para evitar errores de precisión
        texto: "Nuevo Picto",
        img: "logo_nemi_e.jpg",
        audio: null
    };
    datosPictogramas.push(nuevaCelda);
    guardarYRefrescar();
}

function quitarCelda() {
    if (datosPictogramas.length > 0) {
        datosPictogramas.pop();
        guardarYRefrescar();
    }
}

function reiniciarTableroCompleto() {
    if (confirm("¿Estás seguro? Esto borrará TODAS tus celdas personalizadas.")) {
        localStorage.removeItem('tablero_datos');
        location.reload(); 
    }
}

// 4. SELECCIÓN Y FRASE
function seleccionarPictograma(picto) {
    const contenedorFrase = document.getElementById('contenedor-frase');
    if(!contenedorFrase) return;

    const item = document.createElement('div');
    item.className = 'item-frase';
    item.setAttribute('data-texto', picto.texto);
    item.setAttribute('data-audio', picto.audio || "null");

    item.innerHTML = `<img src="${picto.img}"><span>${picto.texto}</span>`;
    contenedorFrase.appendChild(item);

    // Audio
    if (picto.audio) {
        new Audio(picto.audio).play();
    } else {
        const msg = new SpeechSynthesisUtterance(picto.texto);
        msg.lang = 'es-ES';
        window.speechSynthesis.speak(msg);
    }
}

// Función corregida para limpiar (añadí el parámetro id que faltaba en tu versión)
function limpiarContenidoCeldaDeVerdad(event, idRecibido) {
    event.stopPropagation();
    if (!confirm("¿Vaciar esta celda?")) return;

    const indice = datosPictogramas.findIndex(p => String(p.id) === String(idRecibido));
    if (indice !== -1) {
        datosPictogramas[indice].texto = "Agrega Picto";
        datosPictogramas[indice].img = "logo_nemi_e.jpg";
        datosPictogramas[indice].audio = null;
        guardarYRefrescar();
    }
}

function guardarYRefrescar() {
    localStorage.setItem('tablero_datos', JSON.stringify(datosPictogramas));
    renderizarTablero();
}

// 5. INICIALIZACIÓN (Asegura que el iPad arranque)
function inicializarApp() {
    console.log("App Iniciada");
    renderizarTablero();
}

if (document.readyState === "complete" || document.readyState === "interactive") {
    inicializarApp();
} else {
    document.addEventListener("DOMContentLoaded", inicializarApp);
}

// Vinculamos funciones al objeto window para que el HTML las encuentre siempre
window.añadirCelda = añadirCelda;
window.quitarCelda = quitarCelda;
window.reiniciarTableroCompleto = reiniciarTableroCompleto;
window.abrirBuscador = abrirBuscador;
