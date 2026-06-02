package com.deepaudio.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DarkMode
import androidx.compose.material.icons.filled.FolderOpen
import androidx.compose.material.icons.filled.GraphicEq
import androidx.compose.material.icons.filled.LightMode
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Repeat
import androidx.compose.material.icons.filled.RepeatOne
import androidx.compose.material.icons.filled.RestartAlt
import androidx.compose.material.icons.filled.SettingsSuggest
import androidx.compose.material.icons.filled.Shuffle
import androidx.compose.material.icons.filled.SkipNext
import androidx.compose.material.icons.filled.SkipPrevious
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Button
import androidx.compose.material3.ElevatedCard
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Slider
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.deepaudio.audio.AudioPreset
import com.deepaudio.model.AudioTrack
import kotlin.math.roundToInt

@Composable
fun DeepAudioApp(
    state: DeepAudioState,
    onOpenFolder: () -> Unit,
    onPlayTrack: (Int) -> Unit,
    onTogglePlay: () -> Unit,
    onNext: () -> Unit,
    onPrevious: () -> Unit,
    onSeek: (Long) -> Unit,
    onBandChange: (Int, Int) -> Unit,
    onPreset: (AudioPreset) -> Unit,
    onReset: () -> Unit,
    onPreampChange: (Int) -> Unit,
    onMasterVolumeChange: (Float) -> Unit,
    onEffectsEnabled: (Boolean) -> Unit,
    onThemeModeChange: (String) -> Unit,
    onShuffle: (Boolean) -> Unit,
    onRepeat: () -> Unit,
    onDismissError: () -> Unit
) {
    if (state.error != null) {
        AlertDialog(
            onDismissRequest = onDismissError,
            confirmButton = {
                TextButton(onClick = onDismissError) {
                    Text("OK")
                }
            },
            title = { Text("Deep Audio") },
            text = { Text(state.error) }
        )
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item {
            Header(onOpenFolder = onOpenFolder, count = state.tracks.size)
        }

        item {
            ThemePanel(
                selectedMode = state.themeMode,
                onThemeModeChange = onThemeModeChange
            )
        }

        if (state.tracks.isEmpty()) {
            item {
                EmptyLibrary(onOpenFolder)
            }
        } else {
            itemsIndexed(state.tracks, key = { _, track -> track.uri.toString() }) { index, track ->
                TrackRow(
                    track = track,
                    selected = index == state.currentIndex,
                    onClick = { onPlayTrack(index) }
                )
            }
        }

        item {
            PlayerPanel(
                state = state,
                onTogglePlay = onTogglePlay,
                onNext = onNext,
                onPrevious = onPrevious,
                onSeek = onSeek,
                onShuffle = onShuffle,
                onRepeat = onRepeat
            )
        }

        item {
            PresetPanel(
                state = state,
                onPreset = onPreset,
                onEffectsEnabled = onEffectsEnabled,
                onReset = onReset
            )
        }

        item {
            GainPanel(
                state = state,
                onPreampChange = onPreampChange,
                onMasterVolumeChange = onMasterVolumeChange
            )
        }

        item {
            EqualizerPanel(
                state = state,
                onBandChange = onBandChange
            )
        }
    }
}

@Composable
private fun Header(onOpenFolder: () -> Unit, count: Int) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = "Deep Audio",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "$count audios",
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                style = MaterialTheme.typography.bodyMedium
            )
        }
        Button(onClick = onOpenFolder) {
            Icon(Icons.Default.FolderOpen, contentDescription = "Abrir carpeta")
            Spacer(Modifier.width(8.dp))
            Text("Abrir")
        }
    }
}

@Composable
private fun ThemePanel(selectedMode: String, onThemeModeChange: (String) -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        FilterChip(
            selected = selectedMode == "system",
            onClick = { onThemeModeChange("system") },
            label = { Text("Sistema") },
            leadingIcon = {
                Icon(Icons.Default.SettingsSuggest, contentDescription = null)
            }
        )
        FilterChip(
            selected = selectedMode == "dark",
            onClick = { onThemeModeChange("dark") },
            label = { Text("Oscuro") },
            leadingIcon = {
                Icon(Icons.Default.DarkMode, contentDescription = null)
            }
        )
        FilterChip(
            selected = selectedMode == "light",
            onClick = { onThemeModeChange("light") },
            label = { Text("Claro") },
            leadingIcon = {
                Icon(Icons.Default.LightMode, contentDescription = null)
            }
        )
    }
}

@Composable
private fun EmptyLibrary(onOpenFolder: () -> Unit) {
    ElevatedCard(shape = RoundedCornerShape(8.dp)) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text("Abre una carpeta con audios locales.")
            OutlinedButton(onClick = onOpenFolder) {
                Icon(Icons.Default.FolderOpen, contentDescription = null)
                Spacer(Modifier.width(8.dp))
                Text("Seleccionar carpeta")
            }
        }
    }
}

@Composable
private fun TrackRow(track: AudioTrack, selected: Boolean, onClick: () -> Unit) {
    ElevatedCard(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(8.dp)
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                Icons.Default.GraphicEq,
                contentDescription = null,
                tint = if (selected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = track.name,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal
                )
                Text(
                    text = formatDuration(track.durationMs),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    style = MaterialTheme.typography.bodySmall
                )
            }
            if (selected) {
                AssistChip(onClick = onClick, label = { Text("Activo") })
            }
        }
    }
}

@Composable
private fun PlayerPanel(
    state: DeepAudioState,
    onTogglePlay: () -> Unit,
    onNext: () -> Unit,
    onPrevious: () -> Unit,
    onSeek: (Long) -> Unit,
    onShuffle: (Boolean) -> Unit,
    onRepeat: () -> Unit
) {
    ElevatedCard(shape = RoundedCornerShape(8.dp)) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = state.tracks.getOrNull(state.currentIndex)?.name ?: "Sin audio seleccionado",
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                fontWeight = FontWeight.Bold
            )
            Slider(
                value = state.positionMs.toFloat(),
                onValueChange = { onSeek(it.toLong()) },
                valueRange = 0f..state.durationMs.coerceAtLeast(1L).toFloat(),
                enabled = state.durationMs > 0L
            )
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(formatDuration(state.positionMs), style = MaterialTheme.typography.bodySmall)
                Text(formatDuration(state.durationMs), style = MaterialTheme.typography.bodySmall)
            }
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = { onShuffle(!state.shuffle) }) {
                    Icon(
                        Icons.Default.Shuffle,
                        contentDescription = "Aleatorio",
                        tint = if (state.shuffle) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface
                    )
                }
                IconButton(onClick = onPrevious) {
                    Icon(Icons.Default.SkipPrevious, contentDescription = "Anterior")
                }
                IconButton(
                    onClick = onTogglePlay,
                    modifier = Modifier.size(56.dp)
                ) {
                    Icon(
                        imageVector = if (state.isPlaying) Icons.Default.Pause else Icons.Default.PlayArrow,
                        contentDescription = "Reproducir",
                        modifier = Modifier.size(40.dp)
                    )
                }
                IconButton(onClick = onNext) {
                    Icon(Icons.Default.SkipNext, contentDescription = "Siguiente")
                }
                IconButton(onClick = onRepeat) {
                    Icon(
                        imageVector = if (state.repeatMode == 1) Icons.Default.RepeatOne else Icons.Default.Repeat,
                        contentDescription = "Repetir",
                        tint = if (state.repeatMode > 0) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun PresetPanel(
    state: DeepAudioState,
    onPreset: (AudioPreset) -> Unit,
    onEffectsEnabled: (Boolean) -> Unit,
    onReset: () -> Unit
) {
    ElevatedCard(shape = RoundedCornerShape(8.dp)) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = "Presets",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.weight(1f)
                )
                Switch(checked = state.effectsEnabled, onCheckedChange = onEffectsEnabled)
                IconButton(onClick = onReset) {
                    Icon(Icons.Default.RestartAlt, contentDescription = "Reiniciar")
                }
            }
            FlowRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                AudioPreset.presets.forEach { preset ->
                    FilterChip(
                        selected = state.selectedPresetId == preset.id,
                        onClick = { onPreset(preset) },
                        label = { Text(preset.name) }
                    )
                }
                FilterChip(
                    selected = state.selectedPresetId == "custom",
                    onClick = { },
                    label = { Text("Personalizado") }
                )
            }
        }
    }
}

@Composable
private fun GainPanel(
    state: DeepAudioState,
    onPreampChange: (Int) -> Unit,
    onMasterVolumeChange: (Float) -> Unit
) {
    ElevatedCard(shape = RoundedCornerShape(8.dp)) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Text("Ganancia y volumen", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            ControlSlider(
                label = "Ganancia",
                valueLabel = "+${state.preamp} dB",
                value = state.preamp.toFloat(),
                range = 0f..10f,
                onChange = { onPreampChange(it.roundToInt()) }
            )
            ControlSlider(
                label = "Volumen master",
                valueLabel = "${(state.masterVolume * 100).roundToInt()}%",
                value = state.masterVolume,
                range = 0f..1.5f,
                onChange = onMasterVolumeChange
            )
            if (state.preamp >= 8 || state.masterVolume > 1.2f) {
                Text(
                    text = "Riesgo de distorsion: baja ganancia si escuchas saturacion.",
                    color = MaterialTheme.colorScheme.tertiary,
                    style = MaterialTheme.typography.bodySmall
                )
            }
        }
    }
}

@Composable
private fun EqualizerPanel(state: DeepAudioState, onBandChange: (Int, Int) -> Unit) {
    ElevatedCard(shape = RoundedCornerShape(8.dp)) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text("Ecualizador 10 bandas", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            HorizontalDivider()
            AudioPreset.bandLabels.forEachIndexed { index, label ->
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = label,
                        modifier = Modifier.width(42.dp),
                        style = MaterialTheme.typography.bodySmall
                    )
                    Slider(
                        value = state.bands.getOrElse(index) { 0 }.toFloat(),
                        onValueChange = { onBandChange(index, it.roundToInt()) },
                        valueRange = -10f..10f,
                        steps = 19,
                        modifier = Modifier.weight(1f)
                    )
                    Text(
                        text = "${state.bands.getOrElse(index) { 0 }} dB",
                        modifier = Modifier.width(52.dp),
                        style = MaterialTheme.typography.bodySmall
                    )
                }
            }
            Spacer(Modifier.height(2.dp))
        }
    }
}

@Composable
private fun ControlSlider(
    label: String,
    valueLabel: String,
    value: Float,
    range: ClosedFloatingPointRange<Float>,
    onChange: (Float) -> Unit
) {
    Column {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(label)
            Text(valueLabel, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        Slider(value = value, onValueChange = onChange, valueRange = range)
    }
}

private fun formatDuration(ms: Long): String {
    val totalSeconds = (ms / 1000).coerceAtLeast(0L)
    val minutes = totalSeconds / 60
    val seconds = totalSeconds % 60
    return "%d:%02d".format(minutes, seconds)
}
