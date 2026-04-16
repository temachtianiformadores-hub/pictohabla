
// 1. VARIABLES Y DATOS (Con imágenes de ejemplo funcionales)
let datosPictogramas = JSON.parse(localStorage.getItem('tablero_datos')) || [
    { id: Date.now(), texto: "Agrega Picto", img: "logo_nemi_e.jpg", audio: null },
    { id: Date.now() + 1, texto: "Agrega Picto", img: "logo_nemi_e.jpg", audio: null }
];

let idSeleccionado = null;
let mediaRecorder;
let chunks = [];

// 2. RENDERIZAR TABLERO
function renderizarTablero() {
    // Asegúrate que en el HTML el div sea id="grid-tablero"
    var contenedor = document.getElementById('grid-tablero');
    if (!contenedor) return;

    contenedor.innerHTML = '';

    // Usamos function(picto) en lugar de (picto) => para máxima compatibilidad
    datosPictogramas.forEach(function(picto) {
        var card = document.createElement('div');
        card.className = 'card';
        
        card.onclick = function() { seleccionarPictograma(picto); };

        card.innerHTML = `
            <button class="btn-limpiar" onclick="limpiarContenidoCelda(event, '${picto.id}')">🗑️</button>
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

// 3. FUNCIONES DE BOTONES SUPERIORES (Añadir/Quitar/Reiniciar)
function añadirCelda() {
    const nuevaCelda = {
        id: Date.now(),
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
    const item = document.createElement('div');
    item.className = 'item-frase';
    
    // --- ESTO ES LO NUEVO: Guardamos los datos para la reproducción completa ---
    item.setAttribute('data-texto', picto.texto);
    // Si no hay audio grabado, guardamos "null" como texto para identificarlo
    item.setAttribute('data-audio', picto.audio || "null");

    item.innerHTML = `<img src="${picto.img}"><span>${picto.texto}</span>`;
    contenedorFrase.appendChild(item);

    // Reproducción individual inmediata (lo que ya tenías)
    if (picto.audio) {
        new Audio(picto.audio).play();
    } else {
        const msg = new SpeechSynthesisUtterance(picto.texto);
        msg.lang = 'es-ES';
        window.speechSynthesis.speak(msg);
    }
}
async function reproducirFraseCompleta() {
    const contenedor = document.getElementById('contenedor-frase');
    const items = contenedor.querySelectorAll('.item-frase');
    
    if (items.length === 0) {
        console.warn("No hay elementos en la frase para reproducir.");
        return;
    }

    // IMPORTANTE: Cancelar cualquier voz previa y resetear el motor de audio
    window.speechSynthesis.cancel();
    console.log("Iniciando reproducción de frase...");

    for (let item of items) {
        const texto = item.getAttribute('data-texto');
        const audioUrl = item.getAttribute('data-audio');

        console.log("Reproduciendo:", texto);

        try {
            if (audioUrl && audioUrl !== "null" && audioUrl !== "") {
                // Reproducir grabación de voz
                await new Promise((resolve, reject) => {
                    const audio = new Audio(audioUrl);
                    audio.onended = resolve;
                    audio.onerror = resolve; // Si falla un audio, pasar al siguiente
                    audio.play().catch(e => {
                        console.error("Error al reproducir audio:", e);
                        resolve(); 
                    });
                });
            } else if (texto) {
                // Reproducir voz sintética
                await new Promise((resolve) => {
                    const msg = new SpeechSynthesisUtterance(texto);
                    msg.lang = 'es-ES';
                    msg.onend = resolve;
                    msg.onerror = resolve;
                    window.speechSynthesis.speak(msg);
                });
            }
        } catch (error) {
            console.error("Error en la secuencia de frase:", error);
        }
    }
}
function borrarFrase() {
    document.getElementById('contenedor-frase').innerHTML = '';
}
// 5. BUSCADOR (El Lápiz ahora abre el Modal)
function abrirBuscador(event, id) {
    event.stopPropagation(); // Evita que la celda se seleccione
    idSeleccionado = id; // Guardamos qué celda vamos a editar
    
    // Mostramos el modal que ya tienes en tu HTML
    const modal = document.getElementById('modal-buscador');
    if (modal) {
        modal.style.display = 'block';
    } else {
        // Por si el ID en tu HTML es diferente, intenta con 'modal'
        document.querySelector('.modal').style.display = 'block';
    }
}

// --- FUNCIONES DEL MODAL ---

function cerrarModal() {
    const modal = document.getElementById('modal-buscador');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Escuchar si el usuario presiona "Enter" en el buscador
document.getElementById('input-busqueda')?.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        ejecutarBusqueda();
    }
});

function ejecutarBusqueda() {
    const input = document.getElementById('input-busqueda');
    const contenedorResultados = document.getElementById('resultados-busqueda');
    const termino = input.value.trim();

    if (termino === "") {
        alert("Por favor, escribe algo para buscar.");
        return;
    }

    contenedorResultados.innerHTML = "<p>Buscando pictograma...</p>";

    // CONEXIÓN CON ARASAAC (Base de datos de pictogramas reales)
    fetch(`https://api.arasaac.org/api/pictograms/es/search/${termino}`)
        .then(response => response.json())
        .then(data => {
            contenedorResultados.innerHTML = ""; // Limpiar mensaje de carga
            
            if (data.length === 0 || data.error) {
                contenedorResultados.innerHTML = "<p>No se encontraron resultados.</p>";
                return;
            }

            // Mostrar los primeros 8 resultados encontrados
            data.slice(0, 8).forEach(picto => {
                const imgUrl = `https://static.arasaac.org/pictograms/${picto._id}/${picto._id}_300.png`;
                
                const div = document.createElement('div');
                div.className = 'resultado-item';
                div.style.display = 'inline-block';
                div.style.margin = '10px';
                div.style.textAlign = 'center';
                div.style.cursor = 'pointer';

              // HTML corregido para el buscador: solo la imagen y el nombre que viene de ARASAAC
    div.innerHTML = `
        <img src="${imgUrl}" style="width: 80px; height: 80px; border-radius: 5px;">
        <p style="font-size: 12px; margin: 5px 0;">${picto.keywords[0].keyword}</p>
    `;
                
                // Al hacer clic en una imagen de la búsqueda, se actualiza la celda
                div.onclick = () => seleccionarImagenBusqueda(imgUrl, termino);
                contenedorResultados.appendChild(div);
            });
        })
        .catch(err => {
            console.error(err);
            contenedorResultados.innerHTML = "<p>Error de conexión. Intenta subir una foto local.</p>";
        });
}

// ÚNICA VERSIÓN de la función para aplicar la imagen seleccionada
function seleccionarImagenBusqueda(urlImagen, textoImagen) {
    // 1. Buscamos la celda que estamos editando actualmente
    const indice = datosPictogramas.findIndex(p => p.id === idSeleccionado);
    
    if (indice !== -1) {
        // 2. Actualizamos los datos con lo que elegimos en el buscador
        datosPictogramas[indice].img = urlImagen;
        datosPictogramas[indice].texto = textoImagen; 
        
        // 3. Guardamos en el cerebro de la app (localStorage) y redibujamos
        guardarYRefrescar();
        
        // 4. Cerramos el cuadro de búsqueda
        cerrarModal();
        
        // 5. Limpiamos el texto que escribimos para que esté vacío la próxima vez
        const inputBusqueda = document.getElementById('input-busqueda');
        if (inputBusqueda) {
            inputBusqueda.value = "";
        }
        
        console.log("Celda actualizada con éxito:", textoImagen);
    } else {
        console.error("No se encontró el ID de la celda seleccionada.");
    }
}
function subirImagenLocal(event) {
    const archivo = event.target.files[0];
    if (!archivo || !idSeleccionado) return;

    const reader = new FileReader();

    reader.onload = function(e) {
        const urlImagenBase64 = e.target.result;
        
        // 1. Mostramos una previsualización inmediata en el modal para que la veas
        const imgPrevia = document.querySelector('#modal-edicion img'); // Ajusta al ID de tu imagen en el modal
        if (imgPrevia) imgPrevia.src = urlImagenBase64;

        // 2. Guardamos la imagen en la variable de datos pero NO cerramos el modal
        const indice = datosPictogramas.findIndex(p => p.id === idSeleccionado);
        if (indice !== -1) {
            datosPictogramas[indice].img = urlImagenBase64;
            // No llamamos a cerrarModal() aquí para que puedas escribir el nombre
            console.log("Imagen cargada temporalmente. Ahora puedes cambiar el nombre.");
        }
    };

    reader.readAsDataURL(archivo);
}
function guardarCambiosModal() {
    if (!idSeleccionado) return;

    const nuevoTexto = document.getElementById('input-texto-modal').value; // El ID de tu input de nombre
    const indice = datosPictogramas.findIndex(p => p.id === idSeleccionado);

    if (indice !== -1) {
        // Guardamos el nombre que escribiste
        datosPictogramas[indice].texto = nuevoTexto;
        
        // Guardamos todo de forma definitiva
        guardarYRefrescar();
        cerrarModal();
        alert("✅ Celda actualizada correctamente");
    }
}
// 6. AUDIO Y GRABACIÓN (Versión Optimizada)
async function gestionarGrabacion(event) {
    // Usamos el idSeleccionado que definimos al abrir el modal
    if (!idSeleccionado) return alert("Primero selecciona una celda");

    const boton = event.target;

    // Si ya está grabando, lo detenemos
    if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
        boton.innerText = "🎤 Grabar Voz";
        boton.style.backgroundColor = ""; // Vuelve al color original
        return;
    }

    // Si no está grabando, iniciamos el proceso
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        chunks = [];

        mediaRecorder.ondataavailable = e => {
            if (e.data.size > 0) chunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'audio/webm' }); // Formato compatible
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
                const indice = datosPictogramas.findIndex(p => p.id === idSeleccionado);
                if (indice !== -1) {
                    datosPictogramas[indice].audio = reader.result;
                    guardarYRefrescar();
                    alert("✅ Grabación guardada");
                }
            };
            // Apagar el micrófono físicamente
            stream.getTracks().forEach(t => t.stop());
        };

        mediaRecorder.start();
        boton.innerText = "🛑 Detener Grabación";
        boton.style.backgroundColor = "#ff4444";
    } catch (err) {
        console.error(err);
        alert("Error: Activa los permisos del micrófono en tu navegador.");
    }
}
function limpiarContenidoCelda() {
    // 1. Verificamos que haya una celda seleccionada (la que abrimos en el modal)
    if (!idSeleccionado) return;

    // 2. Pedimos confirmación para no borrar por error
    if (!confirm("¿Seguro que quieres vaciar esta celda?")) return;

    // 3. Buscamos la celda en nuestra base de datos
    const indice = datosPictogramas.findIndex(p => p.id === idSeleccionado);
    
    if (indice !== -1) {
        // 4. Devolvemos la celda a su estado original (vacío)
        datosPictogramas[indice].texto = "Vacío";
        datosPictogramas[indice].img = "logo_nemi_e.jpg"; // O una imagen blanca
        datosPictogramas[indice].audio = null; // Borramos también la grabación si existía
        
        // 5. Guardamos en el cerebro de la app y refrescamos la vista
        guardarYRefrescar();
        
        // 6. Cerramos el modal para ver el cambio
        cerrarModal();
        
        console.log("Celda limpiada correctamente.");
    }
}
function guardarYRefrescar() {
    localStorage.setItem('tablero_datos', JSON.stringify(datosPictogramas));
    renderizarTablero();
}

// 1. Al terminar de cargar, ejecutar la renderización
window.onload = renderizarTablero;

// 2. Función de seguridad para iPad/iOS
function inicializarApp() {
    console.log("Inicializando tablero...");
    // Cambiamos 'refrescarTablero' por 'renderizarTablero' para que coincidan
    if (typeof renderizarTablero === 'function') {
        renderizarTablero();
    } else {
        setTimeout(inicializarApp, 500);
    }
}

// 3. Intentar cargar por varios métodos (asegura que funcione en Safari)
if (document.readyState === "complete" || document.readyState === "interactive") {
    inicializarApp();
} else {
    document.addEventListener("DOMContentLoaded", inicializarApp);
}
























