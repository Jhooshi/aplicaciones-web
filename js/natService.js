// js/natService.js

/**
 * Consulta la API pública de iNaturalist para obtener fotos reales de una especie.
 * @param {string} nombreCientifico - El nombre taxonómico de la plaga (ej. "Spodoptera frugiperda")
 * @returns {Promise<string[]>} - Un arreglo con hasta 3 URLs de imágenes reales
 */
export async function obtenerFotosEspecie(nombreCientifico) {
    if (!nombreCientifico || nombreCientifico.toLowerCase() === 'desconocido') return [];
    
    // URL oficial de búsqueda de taxones en iNaturalist (No requiere API Key)
    const url = `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(nombreCientifico)}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Error al conectar con iNaturalist');
        
        const data = await response.json();
        
        // Verificamos si la comunidad científica tiene registros de esa especie
        if (data.results && data.results.length > 0) {
            const especieEncontrada = data.results[0];
            
            // Si la especie tiene fotos registradas, extraemos un máximo de 3
            if (especieEncontrada.taxon_photos) {
                return especieEncontrada.taxon_photos
                    .slice(0, 3)
                    .map(item => item.photo.medium_url); // Guardamos la URL de tamaño mediano
            }
        }
        return []; // Si no hay fotos disponibles
    } catch (error) {
        console.error("Error sutil en iNaturalist API:", error);
        return []; // Retornamos un arreglo vacío para que la app no se caiga
    }
}