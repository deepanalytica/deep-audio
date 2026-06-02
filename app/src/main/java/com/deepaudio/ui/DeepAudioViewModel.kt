package com.deepaudio.ui

import android.app.Application
import android.content.Intent
import android.net.Uri
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import androidx.media3.common.C
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import com.deepaudio.audio.AudioEffectsManager
import com.deepaudio.audio.AudioPlayerController
import com.deepaudio.audio.AudioPreset
import com.deepaudio.data.AudioRepository
import com.deepaudio.data.SettingsStore
import com.deepaudio.model.AudioTrack
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

class DeepAudioViewModel(application: Application) : AndroidViewModel(application) {
    private val repository = AudioRepository(application)
    private val settings = SettingsStore(application)
    private val effects = AudioEffectsManager()
    private val controller = AudioPlayerController(application)

    private val _state = MutableStateFlow(
        DeepAudioState(
            bands = settings.loadBands(),
            preamp = settings.preamp,
            masterVolume = settings.masterVolume,
            selectedPresetId = settings.selectedPresetId,
            themeMode = settings.themeMode
        )
    )
    val state: StateFlow<DeepAudioState> = _state.asStateFlow()

    private var ticker: Job? = null

    init {
        controller.setVolume(settings.masterVolume)
        controller.player.addListener(object : Player.Listener {
            override fun onIsPlayingChanged(isPlaying: Boolean) {
                _state.update { it.copy(isPlaying = isPlaying) }
            }

            override fun onMediaItemTransition(mediaItem: androidx.media3.common.MediaItem?, reason: Int) {
                _state.update { it.copy(currentIndex = controller.player.currentMediaItemIndex) }
            }

            override fun onPlayerError(error: PlaybackException) {
                _state.update { it.copy(error = error.message ?: "No se pudo reproducir este audio.") }
            }
        })

        settings.folderUri?.let { uri -> loadFolder(uri, persistPermission = false) }
        startTicker()
    }

    fun loadSharedAudio(uri: Uri) {
        val track = AudioTrack(uri = uri, name = uri.lastPathSegment ?: "Audio")
        controller.setPlaylist(listOf(track))
        _state.update {
            it.copy(
                tracks = listOf(track),
                currentIndex = 0,
                positionMs = 0,
                durationMs = 0L,
                error = null
            )
        }
        playTrack(0)
    }

    fun loadFolder(uri: Uri, persistPermission: Boolean = true) {
        val app = getApplication<Application>()
        if (persistPermission) {
            runCatching {
                app.contentResolver.takePersistableUriPermission(
                    uri,
                    Intent.FLAG_GRANT_READ_URI_PERMISSION
                )
            }
        }

        val tracks = repository.listAudioFiles(uri)
        settings.folderUri = uri
        controller.setPlaylist(tracks)
        _state.update {
            it.copy(
                tracks = tracks,
                currentIndex = if (tracks.isNotEmpty()) 0 else -1,
                positionMs = 0,
                durationMs = tracks.firstOrNull()?.durationMs ?: 0L,
                error = if (tracks.isEmpty()) "No encontre audios compatibles en esa carpeta." else null
            )
        }
        applyCurrentEffects()
    }

    fun playTrack(index: Int) {
        controller.playAt(index)
        _state.update {
            it.copy(
                currentIndex = index,
                durationMs = it.tracks.getOrNull(index)?.durationMs ?: 0L,
                error = null
            )
        }
        applyCurrentEffects()
    }

    fun togglePlay() {
        controller.togglePlay()
        applyCurrentEffects()
    }

    fun next() {
        controller.next()
        syncPlaybackState()
    }

    fun previous() {
        controller.previous()
        syncPlaybackState()
    }

    fun seekTo(position: Long) {
        controller.seekTo(position)
        _state.update { it.copy(positionMs = position) }
    }

    fun setBand(index: Int, value: Int) {
        _state.update { current ->
            val bands = current.bands.toMutableList()
            bands[index] = value
            settings.saveBands(bands)
            settings.selectedPresetId = "custom"
            current.copy(bands = bands, selectedPresetId = "custom")
        }
        applyCurrentEffects()
    }

    fun applyPreset(preset: AudioPreset) {
        settings.saveBands(preset.bandGains)
        settings.preamp = preset.preamp
        settings.selectedPresetId = preset.id
        _state.update {
            it.copy(
                bands = preset.bandGains,
                preamp = preset.preamp,
                selectedPresetId = preset.id
            )
        }
        applyCurrentEffects()
    }

    fun resetBands() {
        applyPreset(AudioPreset.flat)
    }

    fun setPreamp(value: Int) {
        settings.preamp = value
        _state.update { it.copy(preamp = value) }
        applyCurrentEffects()
    }

    fun setMasterVolume(value: Float) {
        val volume = value.coerceIn(0f, 1.5f)
        settings.masterVolume = volume
        controller.setVolume(volume)
        _state.update { it.copy(masterVolume = volume) }
    }

    fun setEffectsEnabled(enabled: Boolean) {
        _state.update { it.copy(effectsEnabled = enabled) }
        val current = _state.value
        effects.setEnabled(enabled, current.bands, current.preamp)
    }

    fun setThemeMode(mode: String) {
        val nextMode = mode.takeIf { it in setOf("system", "dark", "light") } ?: "system"
        settings.themeMode = nextMode
        _state.update { it.copy(themeMode = nextMode) }
    }

    fun setShuffle(enabled: Boolean) {
        controller.setShuffle(enabled)
        _state.update { it.copy(shuffle = enabled) }
    }

    fun cycleRepeatMode() {
        val nextMode = (_state.value.repeatMode + 1) % 3
        controller.setRepeatMode(nextMode)
        _state.update { it.copy(repeatMode = nextMode) }
    }

    fun clearError() {
        _state.update { it.copy(error = null) }
    }

    private fun startTicker() {
        ticker?.cancel()
        ticker = viewModelScope.launch {
            while (true) {
                syncPlaybackState()
                delay(500)
            }
        }
    }

    private fun syncPlaybackState() {
        val player = controller.player
        val duration = player.duration.takeIf { it != C.TIME_UNSET } ?: 0L
        _state.update {
            it.copy(
                isPlaying = player.isPlaying,
                currentIndex = player.currentMediaItemIndex.takeIf { index -> index >= 0 } ?: it.currentIndex,
                positionMs = player.currentPosition.coerceAtLeast(0L),
                durationMs = duration.takeIf { value -> value > 0L } ?: it.tracks.getOrNull(it.currentIndex)?.durationMs ?: 0L
            )
        }
        applyCurrentEffects()
    }

    private fun applyCurrentEffects() {
        val player = controller.player
        if (player.audioSessionId != C.AUDIO_SESSION_ID_UNSET) {
            effects.attach(player.audioSessionId)
        }
        val current = _state.value
        effects.setEnabled(current.effectsEnabled, current.bands, current.preamp)
    }

    override fun onCleared() {
        ticker?.cancel()
        effects.release()
        controller.release()
        super.onCleared()
    }
}
