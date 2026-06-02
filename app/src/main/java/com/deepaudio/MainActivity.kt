package com.deepaudio

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.compose.runtime.getValue
import androidx.compose.runtime.collectAsState
import androidx.lifecycle.viewmodel.compose.viewModel
import com.deepaudio.ui.DeepAudioApp
import com.deepaudio.ui.DeepAudioViewModel
import com.deepaudio.ui.theme.DeepAudioTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            DeepAudioTheme {
                val viewModel: DeepAudioViewModel = viewModel()
                val state by viewModel.state.collectAsState()
                val folderLauncher = rememberLauncherForActivityResult(
                    contract = ActivityResultContracts.OpenDocumentTree(),
                    onResult = { uri -> uri?.let(viewModel::loadFolder) }
                )

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
                    onShuffle = viewModel::setShuffle,
                    onRepeat = viewModel::cycleRepeatMode,
                    onDismissError = viewModel::clearError
                )
            }
        }
    }
}
