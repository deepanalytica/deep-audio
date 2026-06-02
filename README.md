# Deep Audio

Deep Audio is an Android audio player focused on improving local voice recordings with practical presets, a 10-band equalizer, preamp gain, and master volume.

## Features

- Open a local audio folder with Android Storage Access Framework.
- Play MP3, WAV, M4A, AAC, FLAC, and OGG files.
- Media3 / ExoPlayer playback.
- 10-band equalizer UI with voice-focused presets.
- Presets for clear voice, old phone recordings, white noise reduction, podcasts, interviews, conference audio, low-volume audio, and more.
- LoudnessEnhancer-based preamp gain.
- Master volume up to 150%.
- Distortion risk warning when gain or volume is high.
- Persistent folder, preset, band, gain, and volume settings.

## GitHub Actions APK

The workflow at `.github/workflows/android-build.yml` builds the debug APK on every push, pull request, and manual workflow dispatch.

The generated APK is uploaded as the artifact:

```text
deep-audio-debug-apk
```

Expected APK path inside the workflow:

```text
app/build/outputs/apk/debug/app-debug.apk
```

## Local Build

If Java 17, Android SDK 35, and Gradle are installed locally:

```bash
gradle clean assembleDebug
```

## Publish To GitHub

This repository is configured to build the APK automatically in GitHub Actions after each push.
