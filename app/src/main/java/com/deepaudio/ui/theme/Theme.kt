package com.deepaudio.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DeepAudioDarkColors = darkColorScheme(
    primary = Color(0xFFB9FF38),
    secondary = Color(0xFF8FC7FF),
    tertiary = Color(0xFFFFC857),
    background = Color(0xFF111318),
    surface = Color(0xFF181B21),
    surfaceVariant = Color(0xFF23272F),
    onPrimary = Color(0xFF14210D),
    onSecondary = Color(0xFF071A2D),
    onBackground = Color(0xFFE7E9EE),
    onSurface = Color(0xFFE7E9EE),
    onSurfaceVariant = Color(0xFFC2C7D0)
)

private val DeepAudioLightColors = lightColorScheme(
    primary = Color(0xFF557C00),
    secondary = Color(0xFF24577D),
    tertiary = Color(0xFF855400),
    background = Color(0xFFF8FAF2),
    surface = Color(0xFFFFFFFF),
    surfaceVariant = Color(0xFFE7EEDB),
    onPrimary = Color(0xFFFFFFFF),
    onSecondary = Color(0xFFFFFFFF),
    onBackground = Color(0xFF171C12),
    onSurface = Color(0xFF171C12),
    onSurfaceVariant = Color(0xFF43483C)
)

@Composable
fun DeepAudioTheme(themeMode: String = "system", content: @Composable () -> Unit) {
    val useDarkTheme = when (themeMode) {
        "dark" -> true
        "light" -> false
        else -> isSystemInDarkTheme()
    }

    MaterialTheme(
        colorScheme = if (useDarkTheme) DeepAudioDarkColors else DeepAudioLightColors,
        typography = MaterialTheme.typography,
        content = content
    )
}
