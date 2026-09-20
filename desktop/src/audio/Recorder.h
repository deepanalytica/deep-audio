#pragma once

#include <JuceHeader.h>

class Recorder
{
public:
    Recorder();
    ~Recorder();

    bool start (const juce::File& destination,
                double sampleRate,
                int numChannels = 1,
                int bitsPerSample = 24);

    void stop();

    void write (const float* const* inputChannelData,
                int numInputChannels,
                int numSamples);

    bool isRecording() const noexcept;

private:
    juce::TimeSliceThread backgroundThread { "Deep Audio Recorder" };
    std::unique_ptr<juce::AudioFormatWriter::ThreadedWriter> threadedWriter;
    juce::CriticalSection writerLock;
    std::atomic<juce::AudioFormatWriter::ThreadedWriter*> activeWriter { nullptr };
    int channelsToWrite = 1;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (Recorder)
};
