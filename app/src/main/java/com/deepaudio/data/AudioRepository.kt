package com.deepaudio.data

import android.content.Context
import android.media.MediaMetadataRetriever
import android.net.Uri
import androidx.documentfile.provider.DocumentFile
import com.deepaudio.model.AudioTrack

class AudioRepository(private val context: Context) {
    private val supportedExtensions = setOf("mp3", "wav", "m4a", "aac", "flac", "ogg")

    fun listAudioFiles(folderUri: Uri): List<AudioTrack> {
        val tree = DocumentFile.fromTreeUri(context, folderUri) ?: return emptyList()
        return tree.listFiles()
            .filter { file ->
                val extension = file.name
                    ?.substringAfterLast('.', missingDelimiterValue = "")
                    ?.lowercase()
                file.isFile && extension != null && extension in supportedExtensions
            }
            .sortedBy { it.name?.lowercase() ?: "" }
            .map { file ->
                AudioTrack(
                    uri = file.uri,
                    name = file.name ?: "Audio",
                    durationMs = readDuration(file.uri)
                )
            }
    }

    private fun readDuration(uri: Uri): Long {
        return runCatching {
            val retriever = MediaMetadataRetriever()
            try {
                retriever.setDataSource(context, uri)
                retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)?.toLongOrNull() ?: 0L
            } finally {
                retriever.release()
            }
        }.getOrDefault(0L)
    }
}
