// js/geminiService.js
import { CONFIG } from './config.js';

// Instrucción del sistema para forzar a la IA a actuar como agrónomo y devolver solo JSON
const SYSTEM_INSTRUCTION = `
Eres un experto en agronomía y sanidad vegetal. Tu tarea es identificar la plaga descrita o mostrada en la imagen.
Debes responder ÚNICAMENTE con un objeto JSON válido, sin textos introductorios, sin saludos y sin bloques de código markdown.

La estructura del JSON debe ser exactamente la siguiente:
{
  "nombreComun": "Nombre común de la plaga",
  "nombreCientifico": "Género y especie en latín",
  "confianza": "Porcentaje estimado de certeza (ej. 90%)",
  "cultivosAfectados": ["Cultivo 1", "Cultivo 2"],
  "daños": "Descripción breve de los síntomas y daños en la planta.",
  "controlCultural": "Prácticas agrícolas de prevención o eliminación manual.",
  "controlBiologico": "Enemigos naturales, insectos benéficos o extractos orgánicos.",
  "controlQuimico": "Ingredientes activos o pesticidas recomendados como último recurso.",
  "prevencion": "Cómo evitar que la plaga vuelva a aparecer en el futuro."
}

Si el usuario sube algo que no sea una planta, un cultivo o una plaga agrícola, devuelve:
{ "error": "El contenido analizado no parece estar relacionado con la agricultura o plagas vegetales." }
`;

export async function consultarPlaga(textoUsuario, imagenBase64 = null) {
    // Endpoint oficial para el modelo seleccionado de la API de Gemini
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.GEMINI_MODEL}:generateContent?key=${CONFIG.GEMINI_API_KEY}`; 
    
    const contentsParts = [];
    
    // Si el usuario cargó una foto, la añadimos al arreglo de partes en formato binario inline
    if (imagenBase64) {
        contentsParts.push({
            inline_data: {
                mime_type: "image/jpeg",
                data: imagenBase64 
            }
        });
    }
    
    // Añadimos el texto del usuario (o un prompt genérico si solo envió foto)
    contentsParts.push({
        text: textoUsuario || "Identifica la plaga o enfermedad visible en esta imagen."
    });

    // Construcción del payload respetando la estructura que requiere Google
    const payload = {
        contents: [{ parts: contentsParts }],
        systemInstruction: {
            parts: [{ text: SYSTEM_INSTRUCTION }]
        },
        generationConfig: {
            responseMimeType: "application/json" // Forzamos el modo JSON nativo del modelo
        }
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Error en la API: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        // Extraemos el texto crudo generado por Gemini
        const textoRespuesta = data.candidates[0].content.parts[0].text;
        
        // Convertimos ese texto directamente en un objeto ejecutable por JavaScript
        return JSON.parse(textoRespuesta);
        
    } catch (error) {
        console.error("Error crítico en servicio Gemini:", error);
        return { error: "No se pudo conectar con el motor de IA. Verifica tu conexión o tu API Key." };
    }
}