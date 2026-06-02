package com.deepaudio.data

import android.content.Context
import android.net.Uri
import com.deepaudio.audio.AudioPreset

class SettingsStore(context: Context) {
    private val prefs = context.getSharedPreferences("deep_audio_settings", Context.MODE_PRIVATE)

    var folderUri: Uri?
        get() = prefs.getString("folder_uri", null)?.let(Uri::parse)
        set(value) = prefs.edit().putString("folder_uri", value?.toString()).apply()

    var selectedPresetId: String
        get() = prefs.getString("preset_id", AudioPreset.flat.id) ?: AudioPreset.flat.id
        set(value) = prefs.edit().putString("preset_id", value).apply()

    var preamp: Int
        get() = prefs.getInt("preamp", 0)
        set(value) = prefs.edit().putInt("preamp", value).apply()

    var masterVolume: Float
        get() = prefs.getFloat("master_volume", 1f)
        set(value) = prefs.edit().putFloat("master_volume", value).apply()

    fun loadBands(): List<Int> {
        return List(10) { index -> prefs.getInt("band_$index", 0) }
    }

    fun saveBands(values: List<Int>) {
        prefs.edit().apply {
            values.take(10).forEachIndexed { index, value -> putInt("band_$index", value) }
        }.apply()
    }
}
