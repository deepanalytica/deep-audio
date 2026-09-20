#pragma once

#include <JuceHeader.h>
#include "Recorder.h"

class AudioEngine final : private juce::AudioIODeviceCallback
{
public:
    enum class TonePreset
    {
        dry = 0,
        studioBass,
        tightBass,
        warmGuitar
    };

    AudioEngine();
    ~AudioEngine() override;

    juce::Result initialise();

    juce::AudioDeviceManager& getDeviceManager() noexcept { return deviceManager; }

    bool loadBackingFile (const juce::File&);
    void startBacking();
    void pauseBacking();
    void stopBacking();
    bool isBackingPlaying() const noexcept;
    double getBackingPositionSeconds() const noexcept;
    double getBackingLengthSeconds() const noexcept;

    void setMonitorEnabled (bool enabled) noexcept { monitorEnabled = enabled; }
    bool isMonitorEnabled() const noexcept { return monitorEnabled.load(); }

    void setMonitorGain (float linearGain) noexcept;
    void setMetronomeEnabled (bool enabled) noexcept { metronomeEnabled = enabled; }
    void setBpm (double newBpm) noexcept;
    double getBpm() const noexcept { return bpm.load(); }

    void setTonePreset (TonePreset);
    TonePreset getTonePreset() const noexcept { return currentPreset.load(); }

    bool startRecording();
    juce::File stopRecording();
    bool isRecording() const noexcept { return recorder.isRecording(); }
    juce::File getLastRecording() const { return lastRecording; }

    float getInputLevelDb() const noexcept { return inputLevelDb.load(); }
    juce::String getDeviceSummary() const;
    double getCurrentSampleRate() const noexcept { return currentSampleRate.load(); }
    int getCurrentBufferSize() const noexcept { return currentBufferSize.load(); }

private:
    void audioDeviceAboutToStart (juce::AudioIODevice*) override;
    void audioDeviceStopped() override;
    void audioDeviceIOCallbackWithContext (const float* const* inputChannelData,
                                           int numInputChannels,
                                           float* const* outputChannelData,
                                           int numOutputChannels,
                                           int numSamples,
                                           const juce::AudioIODeviceCallbackContext&) override;

    void configureToneForCurrentSampleRate();
    void renderMetronome (float* const* outputChannelData,
                          int numOutputChannels,
                          int numSamples);

    juce::AudioDeviceManager deviceManager;
    juce::AudioFormatManager formatManager;
    juce::TimeSliceThread readAheadThread { "Deep Audio Read Ahead" };
    juce::AudioTransportSource backingTransport;
    std::unique_ptr<juce::AudioFormatReaderSource> backingReaderSource;

    Recorder recorder;
    juce::File lastRecording;

    juce::AudioBuffer<float> liveBuffer;
    juce::dsp::IIR::Filter<float> highPass;
    juce::dsp::Compressor<float> compressor;
    juce::dsp::Gain<float> outputGain;

    std::atomic<TonePreset> currentPreset { TonePreset::studioBass };
    std::atomic<bool> monitorEnabled { true };
    std::atomic<float> monitorGain { 0.9f };
    std::atomic<bool> metronomeEnabled { false };
    std::atomic<double> bpm { 120.0 };
    std::atomic<float> inputLevelDb { -100.0f };
    std::atomic<double> currentSampleRate { 48000.0 };
    std::atomic<int> currentBufferSize { 512 };

    int64_t samplesUntilNextClick = 0;
    int clickSamplesRemaining = 0;
    double clickPhase = 0.0;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (AudioEngine)
};
