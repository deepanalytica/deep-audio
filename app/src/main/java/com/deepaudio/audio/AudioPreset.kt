package com.deepaudio.audio

data class AudioPreset(
    val id: String,
    val name: String,
    val bandGains: List<Int>,
    val preamp: Int,
    val voiceEnhance: Boolean = false
) {
    companion object {
        val flat = AudioPreset(
            id = "flat",
            name = "Plano",
            bandGains = List(10) { 0 },
            preamp = 0
        )

        val presets = listOf(
            AudioPreset("voice_clear", "Voz clara", listOf(-6, -5, -3, -2, 1, 2, 4, 3, -1, -3), 3, true),
            AudioPreset("old_phone", "Telefono antiguo", listOf(-5, -4, -2, 1, 2, 3, 3, 1, -2, -4), 2, true),
            AudioPreset("white_noise", "Reducir ruido blanco", listOf(-4, -4, -2, 0, 1, 2, 2, 0, -4, -6), 1, true),
            AudioPreset("very_low", "Audio muy bajo", listOf(-2, -2, 0, 1, 2, 2, 3, 2, 0, -2), 7, true),
            AudioPreset("podcast", "Podcast", listOf(-4, -3, -1, 1, 2, 2, 3, 2, -1, -3), 3, true),
            AudioPreset("interview", "Entrevista", listOf(-5, -4, -2, 0, 2, 3, 4, 2, -2, -4), 4, true),
            AudioPreset("conference", "Conferencia", listOf(-6, -5, -3, -1, 1, 3, 4, 2, -2, -5), 4, true),
            AudioPreset("female_voice", "Voz femenina", listOf(-5, -4, -2, 0, 1, 2, 3, 2, -2, -4), 2, true),
            AudioPreset("male_voice", "Voz masculina", listOf(-7, -5, -3, -1, 1, 3, 4, 2, -2, -4), 2, true),
            AudioPreset("music_balanced", "Musica balanceada", listOf(1, 1, 0, 0, 0, 1, 1, 1, 1, 0), 0),
            AudioPreset("soft_clean", "Limpieza suave", listOf(-4, -3, -2, 0, 1, 2, 2, 0, -2, -4), 1, true),
            flat
        )

        val bandLabels = listOf("31", "62", "125", "250", "500", "1k", "2k", "4k", "8k", "16k")
    }
}
