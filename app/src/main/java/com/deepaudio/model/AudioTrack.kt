package com.deepaudio.model

import android.net.Uri

data class AudioTrack(
    val uri: Uri,
    val name: String,
    val durationMs: Long = 0L
)
