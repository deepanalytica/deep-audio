package com.deepaudio.audio

import android.content.Context
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import com.deepaudio.model.AudioTrack

class AudioPlayerController(context: Context) {
    val player: ExoPlayer = ExoPlayer.Builder(context).build()

    var tracks: List<AudioTrack> = emptyList()
        private set

    fun setPlaylist(newTracks: List<AudioTrack>) {
        tracks = newTracks
        player.setMediaItems(newTracks.map { MediaItem.fromUri(it.uri) })
        player.prepare()
    }

    fun playAt(index: Int) {
        if (index !in tracks.indices) return
        player.seekToDefaultPosition(index)
        player.playWhenReady = true
        player.prepare()
    }

    fun togglePlay() {
        if (player.isPlaying) player.pause() else player.play()
    }

    fun next() {
        if (player.hasNextMediaItem()) player.seekToNextMediaItem()
    }

    fun previous() {
        if (player.hasPreviousMediaItem()) player.seekToPreviousMediaItem() else player.seekTo(0)
    }

    fun seekTo(positionMs: Long) {
        player.seekTo(positionMs)
    }

    fun setVolume(volume: Float) {
        player.volume = volume.coerceIn(0f, 1.5f)
    }

    fun setShuffle(enabled: Boolean) {
        player.shuffleModeEnabled = enabled
    }

    fun setRepeatMode(mode: Int) {
        player.repeatMode = when (mode) {
            1 -> Player.REPEAT_MODE_ONE
            2 -> Player.REPEAT_MODE_ALL
            else -> Player.REPEAT_MODE_OFF
        }
    }

    fun release() {
        player.release()
    }
}
