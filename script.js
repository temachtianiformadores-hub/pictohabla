// 1. VARIABLES GLOBALES Y DATOS INICIALES
let datosPictogramas = JSON.parse(localStorage.getItem('tablero_datos')) || [
    { id: 1, texto: "Yo", img: "https://via.placeholder.com/100", audio: null },
    { id: 2, texto: "Tú", img: "https://via.placeholder.com/100", audio: null },
    { id: 3, texto: "Quiero", img: "https://via.placeholder.com/100", audio: null },
    { id: 4, texto: "Comer", img: "https://via.placeholder.com/100", audio: null }
];

let idSeleccionado = null;
let mediaRecorder;
let chunks = [];

// 2. RENDERIZAR EL TABLERO (Dibuja las celdas)
function renderizarTablero() {
    const contenedor = document.getElementById('grid-tablero');
    if (!contenedor) return;
    contenedor.innerHTML = '';

    datosPictogramas.forEach(picto => {
        const card = document.createElement('div');
        card.className = 'card';
        card.onclick = () => seleccionarPictograma(picto);

        card.innerHTML = `
            <button class="btn-limpiar" onclick="limpiarContenidoCelda(event, ${picto.id})">🗑️</button>
            
            <img src="${picto.img}" alt="${picto.texto}">
            <p>${picto.texto}</p>
            
            <div class="controles-celda">
                <button onclick="gestionarGrabacion(event, ${picto.id})">🎤</button>
                <button onclick="abrirBuscador(event, ${picto.id})">✏️</button>
            </div>
        `;
        contenedor.appendChild(card);
    });
}

// 3. FUNCIONES DE INTERACCIÓN
function seleccionarPictograma(picto) {
    const contenedorFrase = document.getElementById('contenedor-frase');
    
    // Crear el elemento en la barra superior
    const item = document.createElement('div');
    item.className = 'item-frase';
    item.innerHTML = `
        <img src="${picto.img}">
        <span>${picto.texto}</span>
    `;
    contenedorFrase.appendChild(item);

    // Reproducir audio si existe
    if (picto.audio) {
        const audio = new Audio(picto.audio);
        audio.play();
    } else {
        // Voz sintética si no hay grabación
        const enunciado = new SpeechSynthesisUtterance(picto.texto);
        enunciado.lang = 'es-ES';
        window.speechSynthesis.speak(enunciado);
    }
}

function borrarFrase() {
    document.getElementById('contenedor-frase').innerHTML = '';
    window.speechSynthesis.cancel();
}

// 4. GESTIÓN DE AUDIO (Grabación)
async function gestionarGrabacion(event, id) {
    event.stopPropagation();
    const boton = event.target;

    if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
        boton.innerText = "🎤";
        boton.style.backgroundColor = "";
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        chunks = [];

        mediaRecorder.ondataavailable = e => chunks.push(e.data);
        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'audio/mp3' });
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
                const indice = datosPictogramas.findIndex(p => p.id === id);
                if (indice !== -1) {
                    datosPictogramas[indice].audio = reader.result;
                    guardarYRefrescar();
                }
            };
            stream.getTracks().forEach(t => t.stop());
        };

        mediaRecorder.start();
        boton.innerText = "🛑";
        boton.style.backgroundColor = "red";
    } catch (err) {
        alert("Permite el acceso al micrófono para grabar.");
    }
}

// 5. LIMPIEZA Y EDICIÓN
function limpiarContenidoCelda(event, id) {
    event.stopPropagation();
    if (confirm("¿Borrar imagen, texto y audio de esta celda?")) {
        const indice = datosPictogramas.findIndex(p => p.id === id);
        if (indice !== -1) {
            datosPictogramas[indice].texto = "Vacío";
            datosPictogramas[indice].img = "https://via.placeholder.com/100";
            datosPictogramas[indice].audio = null;
            guardarYRefrescar();
        }
    }
}

function guardarYRefrescar() {
    localStorage.setItem('tablero_datos', JSON.stringify(datosPictogramas));
    renderizarTablero();
}

// 6. RESPALDOS (Guardar y Cargar Archivo)
function exportarTablero() {
    const dataStr = JSON.stringify(datosPictogramas);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const link = document.createElement('a');
    link.setAttribute("href", dataUri);
    link.setAttribute("download", "respaldo_tablero.json");
    link.click();
}

function importarTablero(event) {
    const archivo = event.target.files[0];
    if (!archivo) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        datosPictogramas = JSON.parse(e.target.result);
        guardarYRefrescar();
        alert("Respaldo cargado con éxito");
    };
    reader.readAsText(archivo);
}

// 7. INICIO AL CARGAR PÁGINA
window.onload = () => {
    renderizarTablero();
    
    // Registrar Service Worker para la App (PWA)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(err => console.log(err));
    }
};




