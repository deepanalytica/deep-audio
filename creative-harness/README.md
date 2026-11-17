# Creative Harness · We Are Logic (v0.1)

Motor audiovisual **reutilizable** para documentales, explicativos, anuncios y Shorts.
El contenido se rige por `.agents/skills/we-are-logic-creative-harness/SKILL.md`.

## Estado y alcance
- El flujo se invoca con un trabajo JSON y usa **Remotion** para el documental y **HyperFrames** para una apertura independiente.
- Los efectos son **flash cut**, detail shot, slow shutter, distortion, inverted, object reveal, object pop, transitional blur y POV; no se aplican todos en cada corte.
- Cada símbolo comentado aparece en la imagen exacta de origen y con recuadro o círculo localizado; nunca usar imágenes conceptuales en lugar de una prueba.
- Los videos, la portada y la música tienen su propio registro de derechos. La portada de *The Economist* se usa para comentario crítico, sin prometer inmunidad a reclamaciones.
- Se crea un corte como máximo cada 3 s. El promedio objetivo es 2,6 s. Las pausas de comprensión están justificadas por el guion.
- El gancho no puede inventar hechos; cada especulación se etiqueta "HIPÓTESIS".

## Cómo usarlo desde este chat
Cuando GitHub esté conectado, se puede editar el trabajo `creative-harness/episodes/*.json`, revisar pruebas y ejecutar el workflow.
Para un episodio nuevo se requiere: fuente visual autorizada, guion, citas, estilo de marca y una ficha de las localizaciones visuales. 
No se instala globalmente en todas las conversaciones hasta que el plugin de ChatGPT esté conectado; la skill ya está versionada y reutilizable desde el repositorio.

## Construcción
- `.github/workflows/we-are-logic-film.yml`: CI en GitHub Actions
- `creative-harness/compile.py`: imagen oficial, segmentación editorial, voz y audio
- `creative-harness/remotion/`: React / Remotion
- `creative-harness/hyperframes/`: opener HTML para HyperFrames
- `creative-harness/brand.json`: marca configurable
- `creative-harness/evidence-map.json`: posiciones manualmente verificadas de la portada

## Requisitos de publicación
Audio inteligible (mezcla -16 LUFS aproximados), imagen 16:9 y zona segura 8%, 
fuentes visible en descripción, y revisión humana completa antes de YouTube.

## Fuente de portada
The Economist Group, comunicado oficial del 17/11/2026:
https://www.economistgroup.com/press-centre/the-economist/the-economist-launches-the-world-ahead-2027-heralding-the-post-trump-era-amid-upheaval-from-bond-markets-and-ai
La imagen exacta se descarga desde su CDN oficial durante el build.
