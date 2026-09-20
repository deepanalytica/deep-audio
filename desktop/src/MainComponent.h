#pragma once

#include <JuceHeader.h>
#include "audio/AudioEngine.h"
#include "ui/StudioLookAndFeel.h"
#include "ui/WaveformComponent.h"

class MainComponent final : public juce::Component,
                            private juce::Timer
{
public:
    MainComponent();
    ~MainComponent() override;

    void paint (juce::Graphics&) override;
    void resized() override;

private:
    enum class Room
    {
        practice,
        record,
        mix,
        master
    };

    void timerCallback() override;
    void setRoom (Room);
    void refreshRoom();
    void chooseBackingFile();
    void toggleRecording();
    void stopAll();
    void refreshPreset();
    void setPrimaryButtonStyle (juce::TextButton&, bool active = false);

    AudioEngine audioEngine;
    StudioLookAndFeel lookAndFeel;

    juce::Label brandLabel;
    juce::Label headlineLabel;
    juce::Label roomDescription;
    juce::Label deviceStatus;
    juce::Label levelStatus;
    juce::Label takeStatus;
    juce::Label mixMasterStatus;

    juce::TextButton practiceButton { "ENSAYO" };
    juce::TextButton recordRoomButton { "GRABACIÓN" };
    juce::TextButton mixButton { "MEZCLA" };
    juce::TextButton masterButton { "MASTER" };

    juce::TextButton importButton { "Importar canción" };
    juce::TextButton playButton { "Play" };
    juce::TextButton recordButton { "● REC" };
    juce::TextButton stopButton { "Stop" };
    juce::TextButton audioSetupButton { "Audio" };

    juce::ToggleButton monitorToggle { "Retorno" };
    juce::ToggleButton metronomeToggle { "Metrónomo" };

    juce::Label bpmLabel { {}, "BPM" };
    juce::Slider bpmSlider;
    juce::Label toneLabel { {}, "SONIDO" };
    juce::ComboBox tonePreset;

    WaveformComponent backingWaveform;
    WaveformComponent takeWaveform;

    juce::AudioDeviceSelectorComponent audioSetup;
    bool audioSetupVisible = false;
    Room room = Room::practice;

    std::unique_ptr<juce::FileChooser> fileChooser;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (MainComponent)
};
