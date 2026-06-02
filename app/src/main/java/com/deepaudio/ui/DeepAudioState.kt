package com.deepaudio.ui

import com.deepaudio.audio.AudioPreset
import com.deepaudio.model.AudioTrack

data class DeepAudioState(
    val tracks: List<AudioTrack> = emptyList(),
    val currentIndex: Int = -1,
    val isPlaying: Boolean = false,
    val durationMs: Long = 0L,
    val positionMs: Long = 0L,
    val bands: List<Int> = AudioPreset.flat.bandGains,
    val preamp: Int = 0,
    val masterVolume: Float = 1f,
    val selectedPresetId: String = AudioPreset.flat.id,
    val themeMode: String = "system",
    val effectsEnabled: Boolean = true,
    val shuffle: Boolean = false,
    val repeatMode: Int = 0,
    val error: String? = null
)
