// 1. VARIABLES GLOBALES Y CARGA DE MEMORIA
let datosPictogramas = [
    { id: 1, texto: "Yo", tipo: "sujeto", icono: "👤", img: "", audio: null },
    { id: 2, texto: "Tú", tipo: "sujeto", icono: "👥", img: "", audio: null },
    { id: 3, texto: "Quiero", tipo: "verbo", icono: "✅", img: "", audio: null },
    { id: 4, texto: "Comer", tipo: "verbo", icono: "🍎", img: "", audio: null },
    { id: 5, texto: "Jugar", tipo: "verbo", icono: "⚽", img: "", audio: null },
    { id: 6, texto: "Dormir", tipo: "verbo", icono: "😴", img: "", audio: null },
    { id: 7, texto: "Agua", tipo: "objeto", icono: "💧", img: "", audio: null },
    { id: 8, texto: "Pelota", tipo: "objeto", icono: "🎾", img: "", audio: null },
    { id: 9, texto: "Baño", tipo: "objeto", icono: "🚽", img: "", audio: null },
    { id: 10, texto: "Libro", tipo: "objeto", icono: "📖", img: "", audio: null },
    { id: 11, texto: "Feliz", tipo: "emocion", icono: "😊", img: "", audio: null },
    { id: 12, texto: "Ayuda", tipo: "emocion", icono: "🆘", img: "", audio: null }
];

// Cargar configuración guardada al iniciar
const guardado = localStorage.getItem('tablero_personalizado');
if (guardado) {
    datosPictogramas = JSON.parse(guardado);
}

let mediaRecorder;
let chunks = [];
let idSeleccionado = null;

// 2. DIBUJAR EL TABLERO
function renderizarTablero() {
    const grid = document.getElementById('grid-tablero');
    grid.innerHTML = ""; 
    datosPictogramas.forEach(picto => {
        const div = document.createElement('div');
        div.className = `card ${picto.tipo}`;
        
        const contenidoVisual = picto.img 
            ? `<img src="${picto.img}" style="width:80px; height:80px; object-fit:contain;">`
            : `<div style="font-size: 50px;">${picto.icono}</div>`;

        div.innerHTML = `
            ${contenidoVisual}
            <span style="font-weight:bold;">${picto.texto}</span>
            <div class="controles-celda">
                <button class="btn-grabar" id="btn-audio-${picto.id}" onclick="gestionarGrabacion(event, ${picto.id})">🎤</button>
                <button class="btn-editar" onclick="abrirBuscador(event, ${picto.id})">✏️</button>
            </div>
        `;
        div.onclick = () => seleccionarPictograma(picto);
        grid.appendChild(div);
    });
}

// 3. LÓGICA DE AUDIO (GRABAR Y GUARDAR)
async function gestionarGrabacion(event, id) {
    event.stopPropagation();
    idSeleccionado = id;
    const boton = event.target;

    if (!mediaRecorder || mediaRecorder.state === "inactive") {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        chunks = [];

        mediaRecorder.ondataavailable = e => chunks.push(e.data);
        
        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'audio/webm' });
            const reader = new FileReader();
            reader.readAsDataURL(blob); // Convierte audio a texto Base64
            reader.onloadend = () => {
                const picto = datosPictogramas.find(p => p.id === idSeleccionado);
                picto.audio = reader.result; // Guardamos el audio en el objeto
                localStorage.setItem('tablero_personalizado', JSON.stringify(datosPictogramas));
                alert("¡Voz guardada!");
            };
        };

        mediaRecorder.start();
        boton.innerText = "🛑";
        boton.style.background = "red";
    } else {
        mediaRecorder.stop();
        boton.innerText = "🎤";
        boton.style.background = "";
    }
}

// 4. SELECCIÓN Y REPRODUCCIÓN
function seleccionarPictograma(picto) {
    // Si tiene audio grabado, lo reproduce. Si no, usa voz sintética.
    if (picto.audio) {
        const sonido = new Audio(picto.audio);
        sonido.play();
    } else {
        const mensaje = new SpeechSynthesisUtterance(picto.texto);
        mensaje.lang = 'es-ES';
        window.speechSynthesis.speak(mensaje);
    }

    const contenedor = document.getElementById('contenedor-frase');
    const mini = document.createElement('div');
    mini.className = "item-frase";
    mini.innerHTML = `<span>${picto.img ? `<img src="${picto.img}" width="30">` : picto.icono}</span> ${picto.texto}`;
    contenedor.appendChild(mini);
}

// 5. FUNCIONES DE APOYO (ARASAAC)
function abrirBuscador(event, id) {
    event.stopPropagation();
    idSeleccionado = id;
    document.getElementById('modal-buscador').style.display = 'block';
}

function cerrarBuscador() {
    document.getElementById('modal-buscador').style.display = 'none';
}

async function buscarEnArasaac() {
    const busqueda = document.getElementById('input-busqueda').value;
    const resultados = document.getElementById('resultados-busqueda');
    if (!busqueda) return;
    
    resultados.innerHTML = "Buscando...";
    const res = await fetch(`https://api.arasaac.org/api/pictograms/es/search/${busqueda}`);
    const datos = await res.json();
    resultados.innerHTML = "";
    
    datos.forEach(p => {
        const url = `https://static.arasaac.org/pictograms/${p._id}/${p._id}_300.png`;
        const img = document.createElement('img');
        img.src = url;
        img.style.width = "90px";
        img.style.cursor = "pointer";
        img.onclick = () => {
            const picto = datosPictogramas.find(item => item.id === idSeleccionado);
            picto.img = url;
            picto.texto = busqueda.charAt(0).toUpperCase() + busqueda.slice(1);
            picto.icono = "";
            localStorage.setItem('tablero_personalizado', JSON.stringify(datosPictogramas));
            renderizarTablero();
            cerrarBuscador();
        };
        resultados.appendChild(img);
    });
}

function limpiarFrase() {
    document.getElementById('contenedor-frase').innerHTML = "";
}

// Iniciar
window.onload = renderizarTablero;
// --- FUNCIÓN PARA EXPORTAR ---
function exportarTablero() {
    const dataStr = JSON.stringify(datosPictogramas);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const nombreArchivo = 'mi_tablero_comunicacion.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', nombreArchivo);
    linkElement.click();
}

// --- FUNCIÓN PARA IMPORTAR ---
function importarTablero(event) {
    const archivo = event.target.files[0];
    if (!archivo) return;

    const lector = new FileReader();
    lector.onload = function(e) {
        try {
            const contenido = JSON.parse(e.target.result);
            
            // Validamos que el archivo sea correcto
            if (Array.isArray(contenido)) {
                datosPictogramas = contenido;
                localStorage.setItem('tablero_personalizado', JSON.stringify(datosPictogramas));
                renderizarTablero();
                alert("¡Tablero cargado con éxito!");
            }
        } catch (error) {
            alert("Error: El archivo no es válido.");
        }
    };
    lector.readAsText(archivo);
}
function cargarImagenLocal(event) {
    const archivo = event.target.files[0];
    if (!archivo) return;

    const lector = new FileReader();
    lector.onload = function(e) {
        const urlBase64 = e.target.result;
        // idSeleccionado es la celda que tocamos antes de abrir el buscador
        const picto = datosPictogramas.find(item => item.id === idSeleccionado);
        
        if (picto) {
            picto.img = urlBase64; // Guarda la imagen como texto en la memoria
            picto.icono = "";
            const nombre = prompt("¿Qué nombre le ponemos a este pictograma?");
            picto.texto = nombre || "Imagen";
            
            // Guardar cambios y refrescar
            localStorage.setItem('tablero_personalizado', JSON.stringify(datosPictogramas));
            renderizarTablero();
            cerrarBuscador();
        }
    };
    lector.readAsDataURL(archivo);
}

