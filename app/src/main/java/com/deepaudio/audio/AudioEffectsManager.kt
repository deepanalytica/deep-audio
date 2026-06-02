package com.deepaudio.audio

import android.media.audiofx.Equalizer
import android.media.audiofx.LoudnessEnhancer
import kotlin.math.roundToInt

class AudioEffectsManager {
    private var equalizer: Equalizer? = null
    private var loudnessEnhancer: LoudnessEnhancer? = null
    private var sessionId: Int = 0

    var enabled: Boolean = true
        private set

    fun attach(audioSessionId: Int) {
        if (audioSessionId == sessionId || audioSessionId == 0) return
        release()
        sessionId = audioSessionId

        equalizer = runCatching {
            Equalizer(0, audioSessionId).apply { enabled = true }
        }.getOrNull()

        loudnessEnhancer = runCatching {
            LoudnessEnhancer(audioSessionId).apply { enabled = true }
        }.getOrNull()
    }

    fun setEnabled(value: Boolean, bands: List<Int>, preamp: Int) {
        enabled = value
        equalizer?.enabled = value
        loudnessEnhancer?.enabled = value
        if (value) apply(bands, preamp) else apply(List(10) { 0 }, 0)
    }

    fun apply(bands: List<Int>, preamp: Int) {
        applyEqualizer(bands)
        applyLoudness(preamp)
    }

    private fun applyEqualizer(bands: List<Int>) {
        val eq = equalizer ?: return
        val range = eq.bandLevelRange
        val min = range[0].toInt()
        val max = range[1].toInt()
        val eqBandCount = eq.numberOfBands.toInt().coerceAtLeast(1)

        for (eqBand in 0 until eqBandCount) {
            val virtualIndex = if (eqBandCount == 1) {
                0
            } else {
                (eqBand * (bands.lastIndex.toFloat() / (eqBandCount - 1))).roundToInt()
            }
            val millibels = (bands.getOrElse(virtualIndex) { 0 } * 100).coerceIn(min, max)
            runCatching { eq.setBandLevel(eqBand.toShort(), millibels.toShort()) }
        }
    }

    private fun applyLoudness(preamp: Int) {
        val targetGain = (preamp.coerceIn(0, 10) * 150)
        runCatching {
            loudnessEnhancer?.setTargetGain(targetGain)
        }
    }

    fun release() {
        runCatching { equalizer?.release() }
        runCatching { loudnessEnhancer?.release() }
        equalizer = null
        loudnessEnhancer = null
        sessionId = 0
    }
}
