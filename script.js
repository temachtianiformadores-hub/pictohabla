// 1. Datos iniciales con iconos (Emojis) por defecto
const datosPictogramas = [
    { id: 1, texto: "Yo", tipo: "sujeto", icono: "👤", img: "" },
    { id: 2, texto: "Tú", tipo: "sujeto", icono: "👥", img: "" },
    { id: 3, texto: "Quiero", tipo: "verbo", icono: "✅", img: "" },
    { id: 4, texto: "Comer", tipo: "verbo", icono: "🍎", img: "" },
    { id: 5, texto: "Jugar", tipo: "verbo", icono: "⚽", img: "" },
    { id: 6, texto: "Dormir", tipo: "verbo", icono: "😴", img: "" },
    { id: 7, texto: "Agua", tipo: "objeto", icono: "💧", img: "" },
    { id: 8, texto: "Pelota", tipo: "objeto", icono: "🎾", img: "" },
    { id: 9, texto: "Baño", tipo: "objeto", icono: "🚽", img: "" },
    { id: 10, texto: "Libro", tipo: "objeto", icono: "📖", img: "" },
    { id: 11, texto: "Feliz", tipo: "emocion", icono: "😊", img: "" },
    { id: 12, texto: "Ayuda", tipo: "emocion", icono: "🆘", img: "" }
];

const audiosGrabados = {};
let celdaSeleccionadaParaEditar = null;

// 2. Función para dibujar el tablero
function renderizarTablero() {
    const grid = document.getElementById('grid-tablero');
    if (!grid) return; // Seguridad si el ID no existe
    grid.innerHTML = ""; 

    datosPictogramas.forEach(picto => {
        const div = document.createElement('div');
        div.className = `card ${picto.tipo}`;
        
        // Prioridad: Imagen de ARASAAC > Icono Emoji
        const contenidoVisual = picto.img 
            ? `<img src="${picto.img}" style="width:70px; height:70px; object-fit:contain;">`
            : `<div style="font-size: 45px;">${picto.icono}</div>`;

        div.innerHTML = `
            ${contenidoVisual}
            <span style="font-weight:bold; margin-top:5px;">${picto.texto}</span>
            <div class="controles-celda">
                <button class="btn-grabar" onclick="prepararGrabacion(event, ${picto.id})">🎤</button>
                <button class="btn-editar" onclick="abrirBuscador(event, ${picto.id})">✏️</button>
            </div>
        `;
        div.onclick = () => seleccionarPictograma(picto);
        grid.appendChild(div);
    });
}

// 3. Lógica de ARASAAC
function abrirBuscador(event, id) {
    event.stopPropagation();
    celdaSeleccionadaParaEditar = id;
    document.getElementById('modal-buscador').style.display = 'block';
}

function cerrarBuscador() {
    document.getElementById('modal-buscador').style.display = 'none';
}

async function buscarEnArasaac() {
    const texto = document.getElementById('input-busqueda').value;
    const contenedor = document.getElementById('resultados-busqueda');
    if (!texto) return;

    contenedor.innerHTML = "Buscando...";
    try {
        const res = await fetch(`https://api.arasaac.org/api/pictograms/es/search/${texto}`);
        const datos = await res.json();
        contenedor.innerHTML = "";
        
        datos.forEach(p => {
            const url = `https://static.arasaac.org/pictograms/${p._id}/${p._id}_300.png`;
            const img = document.createElement('img');
            img.src = url;
            img.style.width = "80px";
            img.onclick = () => {
                const picto = datosPictogramas.find(item => item.id === celdaSeleccionadaParaEditar);
                picto.img = url;
                picto.texto = texto.charAt(0).toUpperCase() + texto.slice(1);
                renderizarTablero();
                cerrarBuscador();
            };
            contenedor.appendChild(img);
        });
    } catch (e) { contenedor.innerHTML = "Error al buscar."; }
}
// Esta función conecta el buscador con tu tablero
function seleccionarNuevoPictograma(url, nombre) {
    // 1. Buscamos la celda exacta que el usuario quiere editar
    const picto = datosPictogramas.find(item => item.id === celdaSeleccionadaParaEditar);
    
    if (picto) {
        // 2. Actualizamos los datos de esa celda
        picto.img = url;      // Ponemos la URL de la imagen de ARASAAC
        picto.texto = nombre.charAt(0).toUpperCase() + nombre.slice(1); // Ponemos el nombre en mayúscula
        picto.icono = "";     // Borramos el emoji para que no se encime
        
        // 3. GUARDADO AUTOMÁTICO: Guardamos el estado actual de las 12 celdas en la memoria local
        localStorage.setItem('tablero_personalizado', JSON.stringify(datosPictogramas));
        
        // 4. Refrescamos visualmente el tablero y cerramos el buscador
        renderizarTablero();
        cerrarBuscador();
    }
}
// 4. Lógica de Voz y Frase
function seleccionarPictograma(picto) {
    if (audiosGrabados[picto.id]) {
        new Audio(audiosGrabados[picto.id]).play();
    } else {
        const msj = new SpeechSynthesisUtterance(picto.texto);
        msj.lang = 'es-ES';
        window.speechSynthesis.speak(msj);
    }
    const span = document.createElement('span');
    span.innerHTML = ` ${picto.img ? `<img src="${picto.img}" width="30">` : picto.icono} ${picto.texto} `;
    document.getElementById('contenedor-frase').appendChild(span);
}

// 5. Lógica de Grabación (Simplificada)
let mediaRecorder;
let chunks = [];
async function prepararGrabacion(event, id) {
    event.stopPropagation();
    if (!mediaRecorder || mediaRecorder.state === "inactive") {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = e => chunks.push(e.data);
        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'audio/ogg; codecs=opus' });
            audiosGrabados[id] = URL.createObjectURL(blob);
            chunks = [];
            alert("Grabado!");
        };
        mediaRecorder.start();
        event.target.innerText = "🛑";
    } else {
        mediaRecorder.stop();
        event.target.innerText = "🎤";
    }
}

function limpiarFrase() { document.getElementById('contenedor-frase').innerHTML = ""; }

// Inicializar al cargar
window.onload = renderizarTablero;
// ==========================================
// CONTROL DE MEMORIA (CARGA AL INICIAR)
// ==========================================

function cargarConfiguracion() {
    // Intentamos obtener los datos guardados bajo el nombre 'tablero_personalizado'
    const datosGuardados = localStorage.getItem('tablero_personalizado');
    
    if (datosGuardados) {
        // Convertimos el texto de la memoria de nuevo a un objeto de JavaScript
        const parsedDatos = JSON.parse(datosGuardados);
        
        // Actualizamos nuestro array de 12 celdas con la información guardada
        parsedDatos.forEach((dato, index) => {
            if (datosPictogramas[index]) {
                datosPictogramas[index] = dato;
            }
        });
        console.log("Configuración cargada con éxito");
    }
}

// Esta línea le dice al navegador: "En cuanto termines de cargar la ventana, ejecuta esto"
window.onload = () => {
    cargarConfiguracion(); // Lee lo que hay en el disco duro
    renderizarTablero();   // Dibuja el tablero con esos datos
};