// Proteger la ruta: Si no está autenticado, enviarlo de vuelta al login
if (sessionStorage.getItem('usuario_autenticado') !== 'true') {
    window.location.href = 'login.html';
}
// js/main.js
import { consultarPlaga } from './gemiservi.js';

// ==========================================================================
// 1. SELECCIÓN DE ELEMENTOS DEL DOM
// ==========================================================================
const formConsulta = document.getElementById('form-consulta');
const inputDescripcion = document.getElementById('descripcion');
const inputImagen = document.getElementById('imagen-plaga');
const previewContainer = document.getElementById('preview-container');
const imgPreview = document.getElementById('img-preview');
const btnEnviar = document.getElementById('btn-enviar');
const panelResultados = document.getElementById('panel-resultados');
const resultadoActivo = document.getElementById('resultado-activo');

// Elementos para renderizar la ficha técnica de resultados
const resNombreComun = document.getElementById('res-nombre-comun');
const resNombreCientifico = document.getElementById('res-nombre-cientifico');
const resConfianza = document.getElementById('res-confianza');
const resCultivos = document.getElementById('res-cultivos');
const resDanos = document.getElementById('res-danos');
const resCultural = document.getElementById('res-cultural');
const resBiologico = document.getElementById('res-biologico');
const resQuimico = document.getElementById('res-quimico');

// Variable global para almacenar de forma temporal la imagen en Base64
let imagenBase64 = null;

// ==========================================================================
// 2. MANEJO DE VISTA PREVIA DE IMAGEN
// ==========================================================================
inputImagen.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        try {
            // Transformar la imagen elegida a la cadena de texto Base64 limpia
            imagenBase64 = await convertirImagenABase64(file);
            
            // Asignar al atributo src para que el usuario vea su foto cargada
            imgPreview.src = `data:${file.type};base64,${imagenBase64}`;
            previewContainer.classList.remove('hidden');
        } catch (error) {
            alert('Error al procesar el archivo de imagen.');
            console.error(error);
        }
    }
});

// Función auxiliar con Promesas para la lectura asíncrona de archivos
function convertirImagenABase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            // El formato nativo incluye un prefijo metadata, lo dividimos para extraer solo el valor base64
            const base64Limpio = reader.result.split(',')[1];
            resolve(base64Limpio);
        };
        reader.onerror = error => reject(error);
    });
}

// ==========================================================================
// 3. ENVÍO DEL FORMULARIO Y LLAMADA A LA IA
// ==========================================================================
formConsulta.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const texto = inputDescripcion.value.trim();
    
    // Validación: Al menos se debe proveer una de las dos opciones de entrada
    if (!texto && !imagenBase64) {
        alert('Por favor, describe los síntomas o selecciona una imagen para analizar.');
        return;
    }
    
    // Estado de carga (Feedback visual para el usuario)
    btnEnviar.disabled = true;
    btnEnviar.innerText = 'Analizando muestras con IA...';
    
    const placeholder = panelResultados.querySelector('.placeholder-results');
    if (placeholder) placeholder.classList.add('hidden');
    resultadoActivo.classList.add('hidden');

    try {
        // Ejecución del fetch hacia el archivo de servicios de Gemini
        const resultado = await consultarPlaga(texto, imagenBase64);
        
        if (resultado.error) {
            alert(`Consulta denegada: ${resultado.error}`);
            if (placeholder) placeholder.classList.remove('hidden');
        } else {
            // Mostrar los datos estructurados en la interfaz
            mostrarResultados(resultado);
            // Guardar la consulta exitosa dentro de localStorage
            guardarEnHistorial(resultado);
        }
    } catch (error) {
        console.error(error);
        alert('Hubo un fallo de comunicación con el servicio de diagnóstico.');
        if (placeholder) placeholder.classList.remove('hidden');
    } finally {
        // Restablecer el estado del botón al finalizar la operación
        btnEnviar.disabled = false;
        btnEnviar.innerText = 'Analizando con Gemini';
    }
});

// ==========================================================================
// 4. RENDERIZADO DINÁMICO DE RESULTADOS
// ==========================================================================
function mostrarResultados(data) {
    resNombreComun.innerText = data.nombreComun || 'No identificado';
    resNombreCientifico.innerText = data.nombreCientifico || 'Desconocido';
    resConfianza.innerText = `${data.confianza || '0%'} Confianza`;
    
    // Formatear array de cultivos afectados a una lista separada por comas
    resCultivos.innerText = Array.isArray(data.cultivosAfectados) 
        ? data.cultivosAfectados.join(', ') 
        : data.cultivosAfectados || 'No especificados';
        
    resDanos.innerText = data.daños || 'Sin descripción de daños.';
    resCultural.innerText = data.controlCultural || 'No disponible.';
    resBiologico.innerText = data.controlBiologico || 'No disponible.';
    resQuimico.innerText = data.controlQuimico || 'No disponible.';
    
    // Desocultar el contenedor principal de la ficha
    resultadoActivo.classList.remove('hidden');
}

// ==========================================================================
// 5. GESTIÓN DEL HISTORIAL LOCAL (LOCALSTORAGE)
// ==========================================================================
function guardarEnHistorial(data) {
    let historial = JSON.parse(localStorage.getItem('historial_plagas')) || [];
    
    // Validar duplicados para evitar llenar la barra lateral con la misma consulta
    if (!historial.some(item => item.nombreComun.toLowerCase() === data.nombreComun.toLowerCase())) {
        historial.unshift(data); // Insertar al inicio de la lista
        
        // Mantener un tamaño controlado (Máximo 5 elementos recientes)
        if (historial.length > 5) historial.pop();
        
        localStorage.setItem('historial_plagas', JSON.stringify(historial));
        renderizarHistorial();
    }
}

function renderizarHistorial() {
    const listaHistorial = document.getElementById('lista-historial');
    if (!listaHistorial) return;
    
    listaHistorial.innerHTML = '';
    const historial = JSON.parse(localStorage.getItem('historial_plagas')) || [];
    
    historial.forEach(item => {
        const li = document.createElement('li');
        li.innerText = `🐞 ${item.nombreComun}`;
        
        // Al hacer clic sobre un elemento del historial, recarga sus datos en pantalla
        li.addEventListener('click', () => {
            const placeholder = panelResultados.querySelector('.placeholder-results');
            if (placeholder) placeholder.classList.add('hidden');
            mostrarResultados(item);
        });
        
        listaHistorial.appendChild(li);
    });
}

// Cargar el historial almacenado en el navegador de manera automática en el arranque
document.addEventListener('DOMContentLoaded', renderizarHistorial);

document.getElementById('btn-cerrar-sesion')?.addEventListener('click', (e) => {
    e.preventDefault();
    sessionStorage.clear(); // Limpia los datos de sesión
    window.location.href = 'login.html';
}); 