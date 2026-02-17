let datosPictogramas = [
    { id: 1, texto: "Yo", icono: "👤", img: "", audio: null },
    { id: 2, texto: "Tú", icono: "👥", img: "", audio: null },
    { id: 3, texto: "Quiero", icono: "✅", img: "", audio: null },
    { id: 4, texto: "Comer", icono: "🍎", img: "", audio: null }
];

let mediaRecorder;
let chunks = [];
let idSeleccionado = null;

// CARGAR AL INICIAR
window.onload = () => {
    const guardado = localStorage.getItem('tablero_personalizado');
    if (guardado) datosPictogramas = JSON.parse(guardado);
    renderizarTablero();
};

function renderizarTablero() {
    const grid = document.getElementById('grid-tablero');
    grid.innerHTML = "";
    datosPictogramas.forEach(picto => {
        const div = document.createElement('div');
        div.className = "card";
        div.onclick = () => seleccionarPictograma(picto);
        
        const visual = picto.img ? `<img src="${picto.img}">` : `<div style="font-size:40px">${picto.icono}</div>`;
        
        div.innerHTML = `
            ${visual}
            <div>${picto.texto}</div>
            <div class="controles-celda">
                <button style="background:#eee; color:black; padding:5px" onclick="gestionarGrabacion(event, ${picto.id})">🎤</button>
                <button style="background:#eee; color:black; padding:5px" onclick="abrirBuscador(event, ${picto.id})">✏️</button>
            </div>
        `;
        grid.appendChild(div);
    });
}

function seleccionarPictograma(picto) {
    if (picto.audio) {
        new Audio(picto.audio).play();
    } else {
        const msj = new SpeechSynthesisUtterance(picto.texto);
        msj.lang = 'es-ES';
        window.speechSynthesis.speak(msj);
    }

    const contenedor = document.getElementById('contenedor-frase');
    const item = document.createElement('div');
    item.className = "item-frase";
    item.innerHTML = `${picto.img ? `<img src="${picto.img}">` : picto.icono} <span>${picto.texto}</span>`;
    contenedor.appendChild(item);
}

// GESTIÓN DE CELDAS
function agregarCelda() {
    const nuevoId = Date.now();
    datosPictogramas.push({ id: nuevoId, texto: "Nuevo", icono: "❓", img: "", audio: null });
    guardarYRefrescar();
}

function quitarUltimaCelda() {
    if (confirm("¿Quitar última celda?")) {
        datosPictogramas.pop();
        guardarYRefrescar();
    }
}

// IMÁGENES Y ARASAAC
function abrirBuscador(event, id) {
    event.stopPropagation();
    idSeleccionado = id;
    document.getElementById('modal-buscador').style.display = 'block';
}

function cerrarBuscador() { document.getElementById('modal-buscador').style.display = 'none'; }

async function buscarEnArasaac() {
    const query = document.getElementById('input-busqueda').value;
    const res = await fetch(`https://api.arasaac.org/api/pictograms/es/search/${query}`);
    const datos = await res.json();
    const contenedor = document.getElementById('resultados-busqueda');
    contenedor.innerHTML = "";
    datos.forEach(p => {
        const url = `https://static.arasaac.org/pictograms/${p._id}/${p._id}_300.png`;
        const img = document.createElement('img');
        img.src = url;
        img.style.width = "80px";
        img.onclick = () => {
            const picto = datosPictogramas.find(item => item.id === idSeleccionado);
            picto.img = url;
            picto.texto = query;
            guardarYRefrescar();
            cerrarBuscador();
        };
        contenedor.appendChild(img);
    });
}

function cargarImagenLocal(event) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const picto = datosPictogramas.find(item => item.id === idSeleccionado);
        picto.img = e.target.result;
        picto.texto = prompt("Nombre del pictograma:") || "Imagen";
        guardarYRefrescar();
        cerrarBuscador();
    };
    reader.readAsDataURL(event.target.files[0]);
}

// AUDIO
async function gestionarGrabacion(event, id) {
    event.stopPropagation();
    idSeleccionado = id;
    if (!mediaRecorder || mediaRecorder.state === "inactive") {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        chunks = [];
        mediaRecorder.ondataavailable = e => chunks.push(e.data);
        mediaRecorder.onstop = () => {
            const reader = new FileReader();
            reader.readAsDataURL(new Blob(chunks));
            reader.onloadend = () => {
                datosPictogramas.find(p => p.id === idSeleccionado).audio = reader.result;
                guardarYRefrescar();
                alert("Audio guardado");
            };
        };
        mediaRecorder.start();
        event.target.innerText = "🛑";
    } else {
        mediaRecorder.stop();
        event.target.innerText = "🎤";
    }
}

// RESPALDOS Y UTILIDADES
// Función central para guardar y actualizar la vista
function guardarYRefrescar() {
    localStorage.setItem('tablero_personalizado', JSON.stringify(datosPictogramas));
    renderizarTablero(); // Esto es vital para que veas el cambio al instante
}

function agregarCelda() {
    const nuevoId = Date.now(); // Genera un ID único basado en el tiempo
    datosPictogramas.push({ 
        id: nuevoId, 
        texto: "Nuevo", 
        icono: "❓", 
        img: "", 
        audio: null 
    });
    guardarYRefrescar();
}

function quitarUltimaCelda() {
    if (datosPictogramas.length > 0) {
        if (confirm("¿Seguro que quieres eliminar la última celda?")) {
            datosPictogramas.pop();
            guardarYRefrescar();
        }
    }
}

function exportarTablero() {
    const blob = new Blob([JSON.stringify(datosPictogramas)], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = "tablero_respaldo.json"; a.click();
}

function importarTablero(event) {
    const reader = new FileReader();
    reader.onload = (e) => {
        datosPictogramas = JSON.parse(e.target.result);
        guardarYRefrescar();
    };
    reader.readAsText(event.target.files[0]);
}

function limpiarFrase() { document.getElementById('contenedor-frase').innerHTML = ""; }

