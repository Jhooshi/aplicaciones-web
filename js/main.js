// js/main.js
import { consultarPlaga } from './gemiservi.js';
import { obtenerFotosEspecie } from './natService.js';

// ==========================================================================
// 1. GUARDIÁN DE SEGURIDAD (Rutas locales)
// ==========================================================================
if (sessionStorage.getItem('usuario_autenticado') !== 'true') {
    window.location.href = 'login.html';
}

// ==========================================================================
// 2. SELECCIÓN DE ELEMENTOS DEL DOM
// ==========================================================================
const formConsulta = document.getElementById('form-consulta');
const inputDescripcion = document.getElementById('descripcion');
const inputImagen = document.getElementById('imagen-plaga');
const previewContainer = document.getElementById('preview-container');
const imgPreview = document.getElementById('img-preview');
const btnEnviar = document.getElementById('btn-enviar');
const panelResultados = document.getElementById('panel-resultados');
const resultadoActivo = document.getElementById('resultado-activo');

const resNombreComun = document.getElementById('res-nombre-comun');
const resNombreCientifico = document.getElementById('res-nombre-cientifico');
const resConfianza = document.getElementById('res-confianza');
const resCultivos = document.getElementById('res-cultivos');
const resDanos = document.getElementById('res-danos');
const resCultural = document.getElementById('res-cultural');
const resBiologico = document.getElementById('res-biologico');
const resQuimico = document.getElementById('res-quimico');

const menuAnalizar = document.getElementById('menu-analizar');
const menuCalculadora = document.getElementById('menu-calculadora');
const vistaDiagnostico = document.getElementById('vista-diagnostico');
const vistaCalculadora = document.getElementById('vista-calculadora');
const formCalculadora = document.getElementById('form-calculadora');

let imagenBase64 = null;

// ==========================================================================
// 3. NAVEGACIÓN DE PESTAÑAS
// ==========================================================================
menuAnalizar?.addEventListener('click', (e) => {
    e.preventDefault();
    menuAnalizar.classList.add('active');
    menuCalculadora.classList.remove('active');
    vistaDiagnostico.classList.remove('hidden');
    vistaCalculadora.classList.add('hidden');
});

menuCalculadora?.addEventListener('click', (e) => {
    e.preventDefault();
    menuCalculadora.classList.add('active');
    menuAnalizar.classList.remove('active');
    vistaCalculadora.classList.remove('hidden');
    vistaDiagnostico.classList.add('hidden');
});

// ==========================================================================
// 4. MANEJO DE IMÁGENES Y ENVÍO DE DIAGNÓSTICO IA
// ==========================================================================
inputImagen?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        try {
            imagenBase64 = await convertirImagenABase64(file);
            imgPreview.src = `data:${file.type};base64,${imagenBase64}`;
            previewContainer.classList.remove('hidden');
        } catch (error) {
            alert('Error al procesar la imagen.');
        }
    }
});

function convertirImagenABase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
    });
}

formConsulta?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const texto = inputDescripcion.value.trim();
    
    if (!texto && !imagenBase64) {
        alert('Por favor, ingresa una descripción o una imagen.');
        return;
    }
    
    btnEnviar.disabled = true;
    btnEnviar.innerText = 'Analizando muestras con IA...';
    
    const placeholder = panelResultados.querySelector('.placeholder-results');
    if (placeholder) placeholder.classList.add('hidden');
    resultadoActivo.classList.add('hidden');

    try {
        const resultado = await consultarPlaga(texto, imagenBase64);
        if (resultado.error) {
            alert(`Consulta denegada: ${resultado.error}`);
            if (placeholder) placeholder.classList.remove('hidden');
        } else {
            mostrarResultados(resultado);
            guardarEnHistorial(resultado);
        }
    } catch (error) {
        alert('Fallo de comunicación con la IA.');
        if (placeholder) placeholder.classList.remove('hidden');
    } finally {
        btnEnviar.disabled = false;
        btnEnviar.innerText = 'Analizando con Gemini';
    }
});

function mostrarResultados(data) {
    resNombreComun.innerText = data.nombreComun || 'No identificado';
    resNombreCientifico.innerText = data.nombreCientifico || 'Desconocido';
    resConfianza.innerText = `${data.confianza || '0%'} Confianza`;
    resCultivos.innerText = Array.isArray(data.cultivosAfectados) ? data.cultivosAfectados.join(', ') : data.cultivosAfectados || 'No especificados';
    resDanos.innerText = data.daños || 'Sin descripción.';
    resCultural.innerText = data.controlCultural || 'No disponible.';
    resBiologico.innerText = data.controlBiologico || 'No disponible.';
    resQuimico.innerText = data.controlQuimico || 'No disponible.';
    
    resultadoActivo.classList.remove('hidden');
    cargarFotosSoporte(data.nombreCientifico);
}

// ==========================================================================
// 5. INTEGRACIÓN iNATURALIST
// ==========================================================================
async function cargarFotosSoporte(nombreCientifico) {
    const galeria = document.getElementById('inaturalist-galeria');
    if (!galeria) return;
    
    galeria.innerHTML = '<p class="loading-text">Buscando imágenes científicas...</p>';
    const fotos = await obtenerFotosEspecie(nombreCientifico);
    galeria.innerHTML = '';
    
    if (fotos.length === 0) {
        galeria.innerHTML = '<p class="no-photos">No se encontraron fotografías reales.</p>';
        return;
    }
    
    fotos.forEach(url => {
        const img = document.createElement('img');
        img.src = url;
        img.className = 'inaturalist-img';
        galeria.appendChild(img);
    });
}

// ==========================================================================
// 6. CALCULADORA MATEMÁTICA
// ==========================================================================
const TABLA_DOSIFICACION = {
    cogollero: { insumo: "Aceite de Neem", dosisInsumoM2: 2.0, dosisAguaM2: 200.0, nota: "Aplicar foliarmente al caer la tarde cada 5 días." },
    pulgon: { insumo: "Jabón Potásico", dosisInsumoM2: 1.5, dosisAguaM2: 150.0, nota: "Pulverizar cubriendo perfectamente el envés de las hojas cada 3 días." },
    blanca: { insumo: "Extracto de Ajo", dosisInsumoM2: 3.0, dosisAguaM2: 250.0, nota: "Aplicar a primera hora de la mañana cada 7 días continuos." },
    arana: { insumo: "Caldo Sulfocálcico", dosisInsumoM2: 2.5, dosisAguaM2: 180.0, nota: "No aplicar durante la floración ni en temperaturas mayores a 30°C." }
};

formCalculadora?.addEventListener('submit', (e) => {
    e.preventDefault();
    const plaga = document.getElementById('calc-plaga').value;
    const tamano = parseFloat(document.getElementById('calc-tamano').value);
    const unidad = document.getElementById('calc-unidad').value;
    
    let areaM2 = unidad === 'ha' ? tamano * 10000 : tamano;
    const config = TABLA_DOSIFICACION[plaga];
    
    let totalInsumo = areaM2 * config.dosisInsumoM2;
    let totalAgua = areaM2 * config.dosisAguaM2;
    
    document.getElementById('calc-res-plaga').innerText = `Manejo Técnico`;
    document.getElementById('calc-lbl-insumo').innerText = `Insumo: ${config.insumo}`;
    document.getElementById('calc-res-insumo').innerText = totalInsumo >= 1000 ? `${(totalInsumo / 1000).toFixed(2)} L` : `${totalInsumo.toFixed(0)} ml`;
    document.getElementById('calc-res-agua').innerText = totalAgua >= 1000 ? `${(totalAgua / 1000).toFixed(2)} L` : `${totalAgua.toFixed(0)} ml`;
    document.getElementById('calc-res-nota').innerText = config.nota;
    
    document.getElementById('calc-placeholder').classList.add('hidden');
    document.getElementById('calc-resultado-activo').classList.remove('hidden');
});

// ==========================================================================
// 7. HISTORIAL Y CIERRE DE SESIÓN
// ==========================================================================
function guardarEnHistorial(data) {
    let historial = JSON.parse(localStorage.getItem('historial_plagas')) || [];
    if (!historial.some(item => item.nombreComun.toLowerCase() === data.nombreComun.toLowerCase())) {
        historial.unshift(data);
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
        li.addEventListener('click', () => {
            const placeholder = panelResultados.querySelector('.placeholder-results');
            if (placeholder) placeholder.classList.add('hidden');
            mostrarResultados(item);
        });
        listaHistorial.appendChild(li);
    });
}

document.getElementById('btn-cerrar-sesion')?.addEventListener('click', (e) => {
    e.preventDefault();
    sessionStorage.clear();
    window.location.href = 'login.html';
});

document.addEventListener('DOMContentLoaded', renderizarHistorial);
