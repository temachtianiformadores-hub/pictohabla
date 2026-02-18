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
    const contenedor = document.getElementById('grid-tablero');
    if (!contenedor) return;
    contenedor.innerHTML = '';

    datosPictogramas.forEach(picto => {
        const card = document.createElement('div');
        card.className = 'card';
        // Al hacer clic en la celda se añade a la frase
        card.onclick = () => seleccionarPictograma(picto);

        card.innerHTML = `
            <button class="btn-limpiar" onclick="limpiarContenidoCelda(event, ${picto.id})">🗑️</button>
            <img src="${picto.img || 'https://via.placeholder.com/100?text=Sube+Imagen'}" alt="${picto.texto}">
            <p>${picto.texto}</p>
            <div class="controles-celda">
                <button onclick="gestionarGrabacion(event, ${picto.id})">🎤</button>
                <button onclick="abrirBuscador(event, ${picto.id})">✏️</button>
            </div>
        `;
        contenedor.appendChild(card);
    });
}

// 3. FUNCIONES DE BOTONES SUPERIORES (Añadir/Quitar/Reiniciar)
function añadirCelda() {
    const nuevaCelda = {
        id: Date.now(),
        texto: "Nuevo",
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
    item.innerHTML = `<img src="${picto.img}"><span>${picto.texto}</span>`;
    contenedorFrase.appendChild(item);

    if (picto.audio) {
        new Audio(picto.audio).play();
    } else {
        const msg = new SpeechSynthesisUtterance(picto.texto);
        msg.lang = 'es-ES';
        window.speechSynthesis.speak(msg);
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

                div.innerHTML = `
                    <img src="${imgUrl}" style="width:80px; height:80px; border-radius:10px; border:1px solid #eee;">
                    <p style="font-size:12px; margin:0;">${termino}</p>
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

function seleccionarImagenBusqueda(url, texto) {
    const indice = datosPictogramas.findIndex(p => p.id === idSeleccionado);
    if (indice !== -1) {
        datosPictogramas[indice].img = url;
        datosPictogramas[indice].texto = texto;
        
        guardarYRefrescar();
        cerrarModal();
        // Limpiamos el input para la próxima búsqueda
        document.getElementById('input-busqueda').value = "";
    }
}

// Esta función es la que finalmente cambia la celda
function seleccionarImagenBusqueda(url, texto) {
    const indice = datosPictogramas.findIndex(p => p.id === idSeleccionado);
    if (indice !== -1) {
        datosPictogramas[indice].img = url;
        datosPictogramas[indice].texto = texto;
        
        guardarYRefrescar();
        cerrarModal();
    }
}

// Función que se ejecuta cuando el usuario elige una imagen en el buscador
function seleccionarImagenBusqueda(urlImagen, textoImagen) {
    const indice = datosPictogramas.findIndex(p => p.id === idSeleccionado);
    
    if (indice !== -1) {
        datosPictogramas[indice].img = urlImagen;
        datosPictogramas[indice].texto = textoImagen; // Cambia el nombre automáticamente
        guardarYRefrescar();
        cerrarModal();
    }
}

// 6. AUDIO Y LIMPIEZA
async function gestionarGrabacion(event, id) {
    event.stopPropagation();
    const boton = event.target;
    if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
        boton.innerText = "🎤";
        return;
    }
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        chunks = [];
        mediaRecorder.ondataavailable = e => chunks.push(e.data);
        mediaRecorder.onstop = () => {
            const reader = new FileReader();
            reader.readAsDataURL(new Blob(chunks));
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
    } catch (err) { alert("Activa el micro"); }
}

function limpiarContenidoCelda(event, id) {
    event.stopPropagation();
    const indice = datosPictogramas.findIndex(p => p.id === id);
    if (indice !== -1) {
        datosPictogramas[indice].texto = "Vacío";
        datosPictogramas[indice].img = "https://via.placeholder.com/100?text=Vacío";
        datosPictogramas[indice].audio = null;
        guardarYRefrescar();
    }
}

function guardarYRefrescar() {
    localStorage.setItem('tablero_datos', JSON.stringify(datosPictogramas));
    renderizarTablero();
}

window.onload = renderizarTablero;











