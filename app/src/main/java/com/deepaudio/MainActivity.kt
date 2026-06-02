package com.deepaudio

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.lifecycle.viewmodel.compose.viewModel
import com.deepaudio.ui.DeepAudioApp
import com.deepaudio.ui.DeepAudioViewModel
import com.deepaudio.ui.theme.DeepAudioTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            val viewModel: DeepAudioViewModel = viewModel()
            val state by viewModel.state.collectAsState()

            DeepAudioTheme(themeMode = state.themeMode) {
                val folderLauncher = rememberLauncherForActivityResult(
                    contract = ActivityResultContracts.OpenDocumentTree(),
                    onResult = { uri -> uri?.let(viewModel::loadFolder) }
                )

                LaunchedEffect(Unit) {
                    if (intent?.action == Intent.ACTION_VIEW) {
                        intent?.data?.let(viewModel::loadSharedAudio)
                    }
                }

                DeepAudioApp(
                    state = state,
                    onOpenFolder = { folderLauncher.launch(null) },
                    onPlayTrack = viewModel::playTrack,
                    onTogglePlay = viewModel::togglePlay,
                    onNext = viewModel::next,
                    onPrevious = viewModel::previous,
                    onSeek = viewModel::seekTo,
                    onBandChange = viewModel::setBand,
                    onPreset = viewModel::applyPreset,
                    onReset = viewModel::resetBands,
                    onPreampChange = viewModel::setPreamp,
                    onMasterVolumeChange = viewModel::setMasterVolume,
                    onEffectsEnabled = viewModel::setEffectsEnabled,
                    onThemeModeChange = viewModel::setThemeMode,
                    onShuffle = viewModel::setShuffle,
                    onRepeat = viewModel::cycleRepeatMode,
                    onDismissError = viewModel::clearError
                )
            }
        }
    }
}
