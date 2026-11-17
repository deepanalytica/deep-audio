# PATRÓN CERO · Narrador TTS gratuito operable desde ChatGPT

Motor Kokoro-82M (Apache 2.0) ejecutado en GitHub Actions Linux estándar, rama aislada `feature/patron-cero-tts`.

## Desde el chat

Pide: «Genera una narración con este texto…». ChatGPT puede escribir un archivo en `patron-cero-tts/jobs/<id>.txt` a través de GitHub conectado y generar MP3/WAV automáticamente con el workflow. Los resultados se guardan como artifact durante siete días.

## Detalles

- Voces: `em_alex`, `em_santa`, `ef_dora` en español, velocidad 0.94.
- Las voces disponibles tienen pronunciación española: comprobar si encajan con el español latinoamericano que buscas antes de producir un video completo.
- Este repositorio es público: cualquier texto de los jobs queda público. No enviar datos privados.
- No hay pagos por minuto usando GitHub Actions en runners Linux estándar de repositorios públicos (sujeto a límites de plataforma).
- Para reemplazar la voz de un video también se debe resincronizar la edición.
- El producto musical en `main` permanece intacto.
