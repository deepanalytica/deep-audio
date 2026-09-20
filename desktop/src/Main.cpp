#include <JuceHeader.h>
#include "MainComponent.h"

class DeepAudioApplication final : public juce::JUCEApplication
{
public:
    const juce::String getApplicationName() override       { return "Deep Audio Studio"; }
    const juce::String getApplicationVersion() override    { return "0.1.0"; }
    bool moreThanOneInstanceAllowed() override              { return false; }

    void initialise (const juce::String&) override
    {
        mainWindow = std::make_unique<MainWindow> (getApplicationName());
    }

    void shutdown() override
    {
        mainWindow.reset();
    }

    void systemRequestedQuit() override
    {
        quit();
    }

private:
    class MainWindow final : public juce::DocumentWindow
    {
    public:
        explicit MainWindow (juce::String name)
            : DocumentWindow (std::move (name),
                              juce::Colour (0xff0b0d10),
                              DocumentWindow::allButtons)
        {
            setUsingNativeTitleBar (true);
            setResizable (true, true);
            setResizeLimits (1040, 680, 2200, 1400);
            setContentOwned (new MainComponent(), true);
            centreWithSize (1280, 820);
            setVisible (true);
        }

        void closeButtonPressed() override
        {
            juce::JUCEApplication::getInstance()->systemRequestedQuit();
        }
    };

    std::unique_ptr<MainWindow> mainWindow;
};

START_JUCE_APPLICATION (DeepAudioApplication)
