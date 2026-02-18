// 1. VARIABLES Y DATOS (Con imágenes de ejemplo funcionales)
let datosPictogramas = JSON.parse(localStorage.getItem('tablero_datos')) || [
    { id: Date.now(), texto: "Yo", img: "https://otroscolores.com/img/pictos/persona.png", audio: null },
    { id: Date.now() + 1, texto: "Quiero", img: "https://otroscolores.com/img/pictos/querer.png", audio: null }
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
        img: "https://via.placeholder.com/100?text=Sube+Imagen",
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

// Cierra el modal al hacer clic en la (X) o fuera de él
function cerrarModal() {
    const modal = document.getElementById('modal-buscador');
    if (modal) {
        modal.style.display = "none";
    }
}

// Esta función se activa al darle clic al botón "Buscar" del modal
function ejecutarBusqueda() {
    const termino = document.getElementById('input-busqueda').value.toLowerCase();
    const contenedorResultados = document.getElementById('resultados-busqueda');
    
    if (!termino) {
        alert("Escribe algo para buscar");
        return;
    }

    // Limpiamos resultados anteriores
    contenedorResultados.innerHTML = "<p>Buscando...</p>";

    // Simulación de búsqueda (Aquí es donde conectarías con ARASAAC o Google)
    // Por ahora, usaremos una lógica de ejemplo para que veas cómo funciona:
    setTimeout(() => {
        contenedorResultados.innerHTML = ""; // Limpiar mensaje de carga
        
        // Ejemplo de resultado encontrado
        const imgSimulada = `https://via.placeholder.com/100?text=${termino}`;
        
        const divImg = document.createElement('div');
        divImg.innerHTML = `
            <img src="${imgSimulada}" 
                 onclick="seleccionarImagenBusqueda('${imgSimulada}', '${termino}')" 
                 style="cursor:pointer; border:1px solid #ddd; border-radius:8px;">
            <p>${termino}</p>
        `;
        contenedorResultados.appendChild(divImg);
    }, 500);
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







