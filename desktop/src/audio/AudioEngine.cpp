#include "AudioEngine.h"

namespace
{
    constexpr int maxWorkingBlockSize = 8192;
}

AudioEngine::AudioEngine()
{
    formatManager.registerBasicFormats();
    readAheadThread.startThread();
}

AudioEngine::~AudioEngine()
{
    recorder.stop();
    backingTransport.stop();
    backingTransport.setSource (nullptr);
    deviceManager.removeAudioCallback (this);
    deviceManager.closeAudioDevice();
    readAheadThread.stopThread (2000);
}

juce::Result AudioEngine::initialise()
{
    const auto error = deviceManager.initialise (1, 2, nullptr, true);

    if (error.isNotEmpty())
        return juce::Result::fail (error);

    deviceManager.addAudioCallback (this);
    return juce::Result::ok();
}

bool AudioEngine::loadBackingFile (const juce::File& file)
{
    if (! file.existsAsFile())
        return false;

    backingTransport.stop();
    backingTransport.setSource (nullptr);
    backingReaderSource.reset();

    auto reader = std::unique_ptr<juce::AudioFormatReader> (formatManager.createReaderFor (file));

    if (reader == nullptr)
        return false;

    const auto fileSampleRate = reader->sampleRate;
    backingReaderSource = std::make_unique<juce::AudioFormatReaderSource> (reader.release(), true);

    backingTransport.setSource (backingReaderSource.get(),
                                32768,
                                &readAheadThread,
                                fileSampleRate);

    return true;
}

void AudioEngine::startBacking()
{
    if (backingReaderSource != nullptr)
        backingTransport.start();
}

void AudioEngine::pauseBacking()
{
    backingTransport.stop();
}

void AudioEngine::stopBacking()
{
    backingTransport.stop();
    backingTransport.setPosition (0.0);
}

bool AudioEngine::isBackingPlaying() const noexcept
{
    return backingTransport.isPlaying();
}

double AudioEngine::getBackingPositionSeconds() const noexcept
{
    return backingTransport.getCurrentPosition();
}

double AudioEngine::getBackingLengthSeconds() const noexcept
{
    return backingTransport.getLengthInSeconds();
}

void AudioEngine::setMonitorGain (float linearGain) noexcept
{
    monitorGain = juce::jlimit (0.0f, 1.5f, linearGain);
}

void AudioEngine::setBpm (double newBpm) noexcept
{
    bpm = juce::jlimit (40.0, 240.0, newBpm);
    samplesUntilNextClick = 0;
}

void AudioEngine::setTonePreset (TonePreset preset)
{
    currentPreset = preset;
    configureToneForCurrentSampleRate();
}

bool AudioEngine::startRecording()
{
    if (recorder.isRecording())
        return true;

    auto directory = juce::File::getSpecialLocation (juce::File::userMusicDirectory)
                         .getChildFile ("Deep Audio")
                         .getChildFile ("Recordings");

    directory.createDirectory();

    const auto timestamp = juce::Time::getCurrentTime().formatted ("%Y%m%d-%H%M%S");
    lastRecording = directory.getNonexistentChildFile ("take-" + timestamp, ".wav");

    return recorder.start (lastRecording, currentSampleRate.load(), 1, 24);
}

juce::File AudioEngine::stopRecording()
{
    recorder.stop();
    return lastRecording;
}

juce::String AudioEngine::getDeviceSummary() const
{
    if (auto* device = deviceManager.getCurrentAudioDevice())
    {
        return device->getName()
            + " · " + juce::String ((int) device->getCurrentSampleRate()) + " Hz"
            + " · " + juce::String (device->getCurrentBufferSizeSamples()) + " samples";
    }

    return "Sin dispositivo de audio";
}

void AudioEngine::audioDeviceAboutToStart (juce::AudioIODevice* device)
{
    const auto sampleRate = device->getCurrentSampleRate();
    const auto blockSize = device->getCurrentBufferSizeSamples();

    currentSampleRate = sampleRate;
    currentBufferSize = blockSize;

    liveBuffer.setSize (1, juce::jmax (maxWorkingBlockSize, blockSize), false, true, true);

    juce::dsp::ProcessSpec spec;
    spec.sampleRate = sampleRate;
    spec.maximumBlockSize = (juce::uint32) liveBuffer.getNumSamples();
    spec.numChannels = 1;

    highPass.prepare (spec);
    compressor.prepare (spec);
    outputGain.prepare (spec);

    configureToneForCurrentSampleRate();

    backingTransport.prepareToPlay (blockSize, sampleRate);

    samplesUntilNextClick = 0;
    clickSamplesRemaining = 0;
    clickPhase = 0.0;
}

void AudioEngine::audioDeviceStopped()
{
    backingTransport.releaseResources();
    inputLevelDb = -100.0f;
}

void AudioEngine::audioDeviceIOCallbackWithContext (const float* const* inputChannelData,
                                                    int numInputChannels,
                                                    float* const* outputChannelData,
                                                    int numOutputChannels,
                                                    int numSamples,
                                                    const juce::AudioIODeviceCallbackContext&)
{
    for (int ch = 0; ch < numOutputChannels; ++ch)
        if (outputChannelData[ch] != nullptr)
            juce::FloatVectorOperations::clear (outputChannelData[ch], numSamples);

    if (numOutputChannels > 0)
    {
        juce::AudioBuffer<float> outputBuffer (outputChannelData, numOutputChannels, numSamples);
        juce::AudioSourceChannelInfo info (&outputBuffer, 0, numSamples);
        backingTransport.getNextAudioBlock (info);
    }

    if (numInputChannels > 0 && inputChannelData != nullptr && inputChannelData[0] != nullptr
        && numSamples <= liveBuffer.getNumSamples())
    {
        recorder.write (inputChannelData, numInputChannels, numSamples);

        liveBuffer.copyFrom (0, 0, inputChannelData[0], numSamples);

        const auto rms = liveBuffer.getRMSLevel (0, 0, numSamples);
        inputLevelDb = juce::Decibels::gainToDecibels (rms, -100.0f);

        if (currentPreset.load() != TonePreset::dry)
        {
            auto block = juce::dsp::AudioBlock<float> (liveBuffer).getSubBlock (0, (size_t) numSamples);
            juce::dsp::ProcessContextReplacing<float> context (block);
            highPass.process (context);
            compressor.process (context);
            outputGain.process (context);
        }

        if (monitorEnabled.load())
        {
            const auto gain = monitorGain.load();

            for (int ch = 0; ch < numOutputChannels; ++ch)
                if (outputChannelData[ch] != nullptr)
                    juce::FloatVectorOperations::addWithMultiply (outputChannelData[ch],
                                                                  liveBuffer.getReadPointer (0),
                                                                  gain,
                                                                  numSamples);
        }
    }
    else
    {
        inputLevelDb = -100.0f;
    }

    if (metronomeEnabled.load())
        renderMetronome (outputChannelData, numOutputChannels, numSamples);
}

void AudioEngine::configureToneForCurrentSampleRate()
{
    const auto sr = currentSampleRate.load();

    if (sr <= 0.0)
        return;

    float cutoff = 35.0f;
    float threshold = -18.0f;
    float ratio = 3.0f;
    float attack = 20.0f;
    float release = 120.0f;
    float makeupDb = -1.0f;

    switch (currentPreset.load())
    {
        case TonePreset::dry:
            cutoff = 20.0f;
            threshold = 0.0f;
            ratio = 1.0f;
            makeupDb = 0.0f;
            break;

        case TonePreset::studioBass:
            break;

        case TonePreset::tightBass:
            cutoff = 40.0f;
            threshold = -20.0f;
            ratio = 4.0f;
            attack = 8.0f;
            release = 80.0f;
            makeupDb = -0.5f;
            break;

        case TonePreset::warmGuitar:
            cutoff = 70.0f;
            threshold = -15.0f;
            ratio = 2.5f;
            attack = 25.0f;
            release = 150.0f;
            makeupDb = -1.0f;
            break;
    }

    highPass.coefficients = juce::dsp::IIR::Coefficients<float>::makeHighPass (sr, cutoff);
    highPass.reset();

    compressor.setThreshold (threshold);
    compressor.setRatio (ratio);
    compressor.setAttack (attack);
    compressor.setRelease (release);
    compressor.reset();

    outputGain.setGainDecibels (makeupDb);
    outputGain.reset();
}

void AudioEngine::renderMetronome (float* const* outputChannelData,
                                   int numOutputChannels,
                                   int numSamples)
{
    if (numOutputChannels <= 0)
        return;

    const auto sr = currentSampleRate.load();
    if (sr <= 0.0)
        return;

    const auto samplesPerBeat = juce::jmax<int64_t> (1, (int64_t) std::llround (sr * 60.0 / bpm.load()));
    const auto clickLength = juce::jmax (1, (int) std::llround (sr * 0.035));

    for (int i = 0; i < numSamples; ++i)
    {
        if (samplesUntilNextClick <= 0)
        {
            samplesUntilNextClick = samplesPerBeat;
            clickSamplesRemaining = clickLength;
            clickPhase = 0.0;
        }

        float click = 0.0f;

        if (clickSamplesRemaining > 0)
        {
            const auto envelope = (float) clickSamplesRemaining / (float) clickLength;
            click = std::sin (clickPhase) * envelope * 0.16f;
            clickPhase += juce::MathConstants<double>::twoPi * 1700.0 / sr;
            --clickSamplesRemaining;
        }

        for (int ch = 0; ch < numOutputChannels; ++ch)
            if (outputChannelData[ch] != nullptr)
                outputChannelData[ch][i] += click;

        --samplesUntilNextClick;
    }
}
