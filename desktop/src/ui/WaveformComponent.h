#pragma once

#include <JuceHeader.h>

class WaveformComponent final : public juce::Component,
                                private juce::ChangeListener
{
public:
    WaveformComponent();
    ~WaveformComponent() override;

    void setFile (const juce::File&);
    void clear();
    void setPlayhead (double positionSeconds, double totalSeconds);

    void paint (juce::Graphics&) override;

private:
    void changeListenerCallback (juce::ChangeBroadcaster*) override;

    juce::AudioFormatManager formatManager;
    juce::AudioThumbnailCache cache { 8 };
    juce::AudioThumbnail thumbnail { 512, formatManager, cache };

    juce::File file;
    double playheadFraction = 0.0;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (WaveformComponent)
};
