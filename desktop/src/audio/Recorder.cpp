#include "Recorder.h"

Recorder::Recorder()
{
    backgroundThread.startThread();
}

Recorder::~Recorder()
{
    stop();
    backgroundThread.stopThread (2000);
}

bool Recorder::start (const juce::File& destination,
                      double sampleRate,
                      int numChannels,
                      int bitsPerSample)
{
    stop();

    if (sampleRate <= 0.0 || numChannels <= 0)
        return false;

    destination.getParentDirectory().createDirectory();
    destination.deleteFile();

    if (std::unique_ptr<juce::OutputStream> stream { destination.createOutputStream() })
    {
        juce::WavAudioFormat wav;
        using Options = juce::AudioFormatWriterOptions;

        if (auto writer = wav.createWriterFor (stream,
                                               Options{}
                                                   .withSampleRate (sampleRate)
                                                   .withNumChannels (numChannels)
                                                   .withBitsPerSample (bitsPerSample)))
        {
            channelsToWrite = numChannels;
            threadedWriter = std::make_unique<juce::AudioFormatWriter::ThreadedWriter>(
                writer.release(), backgroundThread, 32768);

            const juce::ScopedLock lock (writerLock);
            activeWriter = threadedWriter.get();
            return true;
        }
    }

    return false;
}

void Recorder::stop()
{
    {
        const juce::ScopedLock lock (writerLock);
        activeWriter = nullptr;
    }

    threadedWriter.reset();
}

void Recorder::write (const float* const* inputChannelData,
                      int numInputChannels,
                      int numSamples)
{
    if (numInputChannels < channelsToWrite || inputChannelData == nullptr)
        return;

    const juce::ScopedLock lock (writerLock);

    if (auto* writer = activeWriter.load())
        writer->write (inputChannelData, numSamples);
}

bool Recorder::isRecording() const noexcept
{
    return activeWriter.load() != nullptr;
}
