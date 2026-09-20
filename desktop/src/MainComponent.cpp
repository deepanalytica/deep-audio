#include "MainComponent.h"

MainComponent::MainComponent()
    : audioSetup (audioEngine.getDeviceManager(),
                  0, 2,
                  0, 2,
                  false, false,
                  false, false)
{
    juce::LookAndFeel::setDefaultLookAndFeel (&lookAndFeel);

    brandLabel.setText ("DEEP AUDIO / STUDIO", juce::dontSendNotification);
    brandLabel.setFont (juce::FontOptions (15.0f).withStyle ("Bold"));
    brandLabel.setColour (juce::Label::textColourId, juce::Colour (0xff8ee8d8));

    headlineLabel.setText ("Toca primero. Configura después.", juce::dontSendNotification);
    headlineLabel.setFont (juce::FontOptions (34.0f).withStyle ("Bold"));

    roomDescription.setFont (juce::FontOptions (16.0f));
    roomDescription.setColour (juce::Label::textColourId, juce::Colour (0xff9da9b7));

    deviceStatus.setFont (juce::FontOptions (13.0f));
    deviceStatus.setColour (juce::Label::textColourId, juce::Colour (0xff9da9b7));

    levelStatus.setFont (juce::FontOptions (13.0f));
    levelStatus.setColour (juce::Label::textColourId, juce::Colour (0xff8ee8d8));

    takeStatus.setFont (juce::FontOptions (13.0f));
    takeStatus.setColour (juce::Label::textColourId, juce::Colour (0xff9da9b7));

    mixMasterStatus.setFont (juce::FontOptions (18.0f));
    mixMasterStatus.setColour (juce::Label::textColourId, juce::Colour (0xffd8e1e8));
    mixMasterStatus.setJustificationType (juce::Justification::centred);
    mixMasterStatus.setMinimumHorizontalScale (0.7f);

    for (auto* c : { static_cast<juce::Component*> (&brandLabel),
                     &headlineLabel,
                     &roomDescription,
                     &deviceStatus,
                     &levelStatus,
                     &takeStatus,
                     &mixMasterStatus,
                     &practiceButton,
                     &recordRoomButton,
                     &mixButton,
                     &masterButton,
                     &importButton,
                     &playButton,
                     &recordButton,
                     &stopButton,
                     &audioSetupButton,
                     &monitorToggle,
                     &metronomeToggle,
                     &bpmLabel,
                     &bpmSlider,
                     &toneLabel,
                     &tonePreset,
                     &backingWaveform,
                     &takeWaveform,
                     &audioSetup })
        addAndMakeVisible (c);

    setPrimaryButtonStyle (practiceButton, true);
    setPrimaryButtonStyle (recordRoomButton);
    setPrimaryButtonStyle (mixButton);
    setPrimaryButtonStyle (masterButton);
    setPrimaryButtonStyle (importButton);
    setPrimaryButtonStyle (playButton);
    setPrimaryButtonStyle (stopButton);
    setPrimaryButtonStyle (audioSetupButton);

    recordButton.setColour (juce::TextButton::buttonColourId, juce::Colour (0xffd84f61));
    recordButton.setColour (juce::TextButton::textColourOffId, juce::Colours::white);

    practiceButton.onClick = [this] { setRoom (Room::practice); };
    recordRoomButton.onClick = [this] { setRoom (Room::record); };
    mixButton.onClick = [this] { setRoom (Room::mix); };
    masterButton.onClick = [this] { setRoom (Room::master); };

    importButton.onClick = [this] { chooseBackingFile(); };

    playButton.onClick = [this]
    {
        if (audioEngine.isBackingPlaying())
        {
            audioEngine.pauseBacking();
            playButton.setButtonText ("Play");
        }
        else
        {
            audioEngine.startBacking();
            playButton.setButtonText ("Pause");
        }
    };

    recordButton.onClick = [this] { toggleRecording(); };
    stopButton.onClick = [this] { stopAll(); };

    monitorToggle.setToggleState (true, juce::dontSendNotification);
    monitorToggle.onClick = [this]
    {
        audioEngine.setMonitorEnabled (monitorToggle.getToggleState());
    };

    metronomeToggle.onClick = [this]
    {
        audioEngine.setMetronomeEnabled (metronomeToggle.getToggleState());
    };

    bpmSlider.setSliderStyle (juce::Slider::LinearHorizontal);
    bpmSlider.setTextBoxStyle (juce::Slider::TextBoxRight, false, 64, 24);
    bpmSlider.setRange (40.0, 240.0, 1.0);
    bpmSlider.setValue (120.0);
    bpmSlider.onValueChange = [this]
    {
        audioEngine.setBpm (bpmSlider.getValue());
    };

    tonePreset.addItem ("Dry", 1);
    tonePreset.addItem ("Studio Bass", 2);
    tonePreset.addItem ("Tight Bass", 3);
    tonePreset.addItem ("Warm Guitar", 4);
    tonePreset.setSelectedId (2, juce::dontSendNotification);
    tonePreset.onChange = [this] { refreshPreset(); };

    audioSetupVisible = false;
    audioSetup.setVisible (false);
    audioSetupButton.onClick = [this]
    {
        audioSetupVisible = ! audioSetupVisible;
        audioSetup.setVisible (audioSetupVisible);
        resized();
    };

    const auto result = audioEngine.initialise();

    if (result.failed())
        deviceStatus.setText ("Audio no disponible: " + result.getErrorMessage(), juce::dontSendNotification);
    else
        deviceStatus.setText (audioEngine.getDeviceSummary(), juce::dontSendNotification);

    setRoom (Room::practice);
    setSize (1280, 820);
    startTimerHz (20);
}

MainComponent::~MainComponent()
{
    stopTimer();
    juce::LookAndFeel::setDefaultLookAndFeel (nullptr);
}

void MainComponent::paint (juce::Graphics& g)
{
    juce::ColourGradient background (juce::Colour (0xff0b0d10),
                                     0.0f, 0.0f,
                                     juce::Colour (0xff101820),
                                     (float) getWidth(), (float) getHeight(),
                                     false);
    g.setGradientFill (background);
    g.fillAll();

    const auto content = getLocalBounds().reduced (34).toFloat();
    auto studioPanel = content.withTrimmedTop (150.0f);

    g.setColour (juce::Colour (0xff10151b).withAlpha (0.95f));
    g.fillRoundedRectangle (studioPanel, 20.0f);

    g.setColour (juce::Colour (0xff27313b));
    g.drawRoundedRectangle (studioPanel, 20.0f, 1.0f);
}

void MainComponent::resized()
{
    auto area = getLocalBounds().reduced (34);

    brandLabel.setBounds (area.removeFromTop (24));

    auto titleRow = area.removeFromTop (58);
    headlineLabel.setBounds (titleRow.removeFromLeft (720));
    deviceStatus.setBounds (titleRow.removeFromRight (420).withTrimmedTop (10));

    roomDescription.setBounds (area.removeFromTop (40));

    auto roomTabs = area.removeFromTop (44);
    const auto tabWidth = 122;
    practiceButton.setBounds (roomTabs.removeFromLeft (tabWidth).reduced (0, 4));
    roomTabs.removeFromLeft (8);
    recordRoomButton.setBounds (roomTabs.removeFromLeft (tabWidth).reduced (0, 4));
    roomTabs.removeFromLeft (8);
    mixButton.setBounds (roomTabs.removeFromLeft (tabWidth).reduced (0, 4));
    roomTabs.removeFromLeft (8);
    masterButton.setBounds (roomTabs.removeFromLeft (tabWidth).reduced (0, 4));
    audioSetupButton.setBounds (roomTabs.removeFromRight (90).reduced (0, 4));

    area.removeFromTop (16);

    if (audioSetupVisible)
    {
        auto setupArea = area.removeFromRight (420).reduced (12);
        audioSetup.setBounds (setupArea);
        area.removeFromRight (12);
    }

    auto inner = area.reduced (22);

    auto transport = inner.removeFromTop (46);
    importButton.setBounds (transport.removeFromLeft (150).reduced (0, 4));
    transport.removeFromLeft (8);
    playButton.setBounds (transport.removeFromLeft (90).reduced (0, 4));
    transport.removeFromLeft (8);
    recordButton.setBounds (transport.removeFromLeft (90).reduced (0, 4));
    transport.removeFromLeft (8);
    stopButton.setBounds (transport.removeFromLeft (82).reduced (0, 4));
    transport.removeFromLeft (18);
    monitorToggle.setBounds (transport.removeFromLeft (100));
    metronomeToggle.setBounds (transport.removeFromLeft (120));
    bpmLabel.setBounds (transport.removeFromLeft (42));
    bpmSlider.setBounds (transport.removeFromLeft (180));
    levelStatus.setBounds (transport.removeFromRight (140));

    inner.removeFromTop (12);

    auto toneRow = inner.removeFromTop (42);
    toneLabel.setBounds (toneRow.removeFromLeft (70));
    tonePreset.setBounds (toneRow.removeFromLeft (200).reduced (0, 5));
    takeStatus.setBounds (toneRow.reduced (16, 0));

    inner.removeFromTop (12);

    auto topWave = inner.removeFromTop (juce::jmax (180, inner.getHeight() / 2));
    backingWaveform.setBounds (topWave);

    inner.removeFromTop (12);
    takeWaveform.setBounds (inner);

    mixMasterStatus.setBounds (area.reduced (60));
}

void MainComponent::timerCallback()
{
    if (! audioSetupVisible)
        deviceStatus.setText (audioEngine.getDeviceSummary(), juce::dontSendNotification);

    const auto level = audioEngine.getInputLevelDb();
    levelStatus.setText ("IN " + juce::String (level, 1) + " dB", juce::dontSendNotification);

    backingWaveform.setPlayhead (audioEngine.getBackingPositionSeconds(),
                                 audioEngine.getBackingLengthSeconds());

    if (! audioEngine.isBackingPlaying() && playButton.getButtonText() == "Pause")
        playButton.setButtonText ("Play");
}

void MainComponent::setRoom (Room newRoom)
{
    room = newRoom;

    setPrimaryButtonStyle (practiceButton, room == Room::practice);
    setPrimaryButtonStyle (recordRoomButton, room == Room::record);
    setPrimaryButtonStyle (mixButton, room == Room::mix);
    setPrimaryButtonStyle (masterButton, room == Room::master);

    refreshRoom();
}

void MainComponent::refreshRoom()
{
    const auto performanceVisible = room == Room::practice || room == Room::record;

    for (auto* c : { static_cast<juce::Component*> (&importButton),
                     &playButton,
                     &recordButton,
                     &stopButton,
                     &monitorToggle,
                     &metronomeToggle,
                     &bpmLabel,
                     &bpmSlider,
                     &toneLabel,
                     &tonePreset,
                     &backingWaveform,
                     &takeWaveform,
                     &levelStatus,
                     &takeStatus })
        c->setVisible (performanceVisible);

    mixMasterStatus.setVisible (! performanceVisible);

    if (room == Room::practice)
    {
        headlineLabel.setText ("Ensaya sin montar un estudio.", juce::dontSendNotification);
        roomDescription.setText ("Importa una canción, activa el retorno y toca. Menos menús; más instrumento.",
                                 juce::dontSendNotification);
    }
    else if (room == Room::record)
    {
        headlineLabel.setText ("Graba la idea antes de perderla.", juce::dontSendNotification);
        roomDescription.setText ("WAV 24-bit, monitor de baja latencia, metrónomo y backing track en el mismo flujo.",
                                 juce::dontSendNotification);
    }
    else if (room == Room::mix)
    {
        headlineLabel.setText ("Mezcla con intención, no con cien perillas.", juce::dontSendNotification);
        roomDescription.setText ("La arquitectura reserva esta sala para balance, buses, EQ, dinámica, A/B y guía explicable.",
                                 juce::dontSendNotification);
        mixMasterStatus.setText ("MIX ROOM\n\nSiguiente hito: multipista + edición no destructiva + buses + medidores.\nNada de IA tomando decisiones dentro del audio thread.",
                                     juce::dontSendNotification);
    }
    else
    {
        headlineLabel.setText ("Termina la canción con criterio.", juce::dontSendNotification);
        roomDescription.setText ("La sala final concentrará loudness, true peak, dinámica, referencia y exportación.",
                                 juce::dontSendNotification);
        mixMasterStatus.setText ("MASTER ROOM\n\nSiguiente hito: medición LUFS/true peak + cadena DSP + referencia A/B + export presets.",
                                     juce::dontSendNotification);
    }

    resized();
    repaint();
}

void MainComponent::chooseBackingFile()
{
    fileChooser = std::make_unique<juce::FileChooser> (
        "Importar canción",
        juce::File::getSpecialLocation (juce::File::userMusicDirectory),
        "*.wav;*.aif;*.aiff;*.flac;*.mp3");

    juce::Component::SafePointer<MainComponent> safeThis (this);

    fileChooser->launchAsync (juce::FileBrowserComponent::openMode
                                  | juce::FileBrowserComponent::canSelectFiles,
                              [safeThis] (const juce::FileChooser& chooser)
                              {
                                  if (safeThis == nullptr)
                                      return;

                                  const auto file = chooser.getResult();

                                  if (file.existsAsFile() && safeThis->audioEngine.loadBackingFile (file))
                                  {
                                      safeThis->backingWaveform.setFile (file);
                                      safeThis->takeStatus.setText ("Backing: " + file.getFileName(),
                                                                    juce::dontSendNotification);
                                  }

                                  safeThis->fileChooser.reset();
                              });
}

void MainComponent::toggleRecording()
{
    if (audioEngine.isRecording())
    {
        const auto file = audioEngine.stopRecording();
        recordButton.setButtonText ("● REC");

        if (file.existsAsFile())
        {
            takeWaveform.setFile (file);
            takeStatus.setText ("Toma guardada: " + file.getFileName(), juce::dontSendNotification);
        }

        return;
    }

    if (audioEngine.startRecording())
    {
        recordButton.setButtonText ("■ STOP REC");

        if (room == Room::record && audioEngine.getBackingLengthSeconds() > 0.0)
            audioEngine.startBacking();
    }
    else
    {
        takeStatus.setText ("No se pudo iniciar la grabación.", juce::dontSendNotification);
    }
}

void MainComponent::stopAll()
{
    audioEngine.stopBacking();

    if (audioEngine.isRecording())
    {
        const auto file = audioEngine.stopRecording();

        if (file.existsAsFile())
        {
            takeWaveform.setFile (file);
            takeStatus.setText ("Toma guardada: " + file.getFileName(), juce::dontSendNotification);
        }
    }

    playButton.setButtonText ("Play");
    recordButton.setButtonText ("● REC");
}

void MainComponent::refreshPreset()
{
    const auto selected = tonePreset.getSelectedId();

    switch (selected)
    {
        case 1: audioEngine.setTonePreset (AudioEngine::TonePreset::dry); break;
        case 2: audioEngine.setTonePreset (AudioEngine::TonePreset::studioBass); break;
        case 3: audioEngine.setTonePreset (AudioEngine::TonePreset::tightBass); break;
        case 4: audioEngine.setTonePreset (AudioEngine::TonePreset::warmGuitar); break;
        default: break;
    }
}

void MainComponent::setPrimaryButtonStyle (juce::TextButton& button, bool active)
{
    button.setColour (juce::TextButton::buttonColourId,
                      active ? juce::Colour (0xff22675f) : juce::Colour (0xff1a2129));
    button.setColour (juce::TextButton::textColourOffId,
                      active ? juce::Colours::white : juce::Colour (0xffc6d0da));
}
