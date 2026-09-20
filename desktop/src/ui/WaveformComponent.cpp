#include "WaveformComponent.h"

WaveformComponent::WaveformComponent()
{
    formatManager.registerBasicFormats();
    thumbnail.addChangeListener (this);
}

WaveformComponent::~WaveformComponent()
{
    thumbnail.removeChangeListener (this);
}

void WaveformComponent::setFile (const juce::File& newFile)
{
    file = newFile;
    playheadFraction = 0.0;

    if (file.existsAsFile())
        thumbnail.setSource (new juce::FileInputSource (file));
    else
        thumbnail.clear();

    repaint();
}

void WaveformComponent::clear()
{
    file = {};
    playheadFraction = 0.0;
    thumbnail.clear();
    repaint();
}

void WaveformComponent::setPlayhead (double positionSeconds, double totalSeconds)
{
    playheadFraction = totalSeconds > 0.0
        ? juce::jlimit (0.0, 1.0, positionSeconds / totalSeconds)
        : 0.0;

    repaint();
}

void WaveformComponent::paint (juce::Graphics& g)
{
    auto bounds = getLocalBounds().toFloat();

    g.setColour (juce::Colour (0xff11161d));
    g.fillRoundedRectangle (bounds, 14.0f);

    auto inner = getLocalBounds().reduced (18);

    if (thumbnail.getTotalLength() > 0.0)
    {
        g.setColour (juce::Colour (0xff8ee8d8));
        thumbnail.drawChannels (g, inner, 0.0, thumbnail.getTotalLength(), 0.85f);

        const auto x = (float) inner.getX() + (float) inner.getWidth() * (float) playheadFraction;
        g.setColour (juce::Colours::white.withAlpha (0.92f));
        g.drawLine (x, (float) inner.getY(), x, (float) inner.getBottom(), 1.5f);
    }
    else
    {
        g.setColour (juce::Colour (0xff7f8a99));
        g.setFont (15.0f);
        g.drawFittedText ("Importa una canción o inicia una toma",
                          inner,
                          juce::Justification::centred,
                          1);
    }
}

void WaveformComponent::changeListenerCallback (juce::ChangeBroadcaster*)
{
    repaint();
}
