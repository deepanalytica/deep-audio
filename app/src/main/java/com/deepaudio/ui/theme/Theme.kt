package com.deepaudio.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DeepAudioColors = darkColorScheme(
    primary = Color(0xFF9CD67A),
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

@Composable
fun DeepAudioTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = DeepAudioColors,
        typography = MaterialTheme.typography,
        content = content
    )
}
