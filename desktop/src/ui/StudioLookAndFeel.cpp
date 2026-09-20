#include "StudioLookAndFeel.h"

StudioLookAndFeel::StudioLookAndFeel()
{
    setColour (juce::ResizableWindow::backgroundColourId, juce::Colour (0xff0b0d10));
    setColour (juce::Label::textColourId, juce::Colour (0xffedf3f7));
    setColour (juce::ComboBox::backgroundColourId, juce::Colour (0xff151b22));
    setColour (juce::ComboBox::textColourId, juce::Colour (0xffedf3f7));
    setColour (juce::ComboBox::outlineColourId, juce::Colour (0xff29313b));
    setColour (juce::PopupMenu::backgroundColourId, juce::Colour (0xff151b22));
    setColour (juce::PopupMenu::textColourId, juce::Colour (0xffedf3f7));
    setColour (juce::Slider::textBoxTextColourId, juce::Colour (0xffedf3f7));
    setColour (juce::Slider::textBoxBackgroundColourId, juce::Colour (0xff11161d));
    setColour (juce::Slider::textBoxOutlineColourId, juce::Colours::transparentBlack);
}

void StudioLookAndFeel::drawButtonBackground (juce::Graphics& g,
                                              juce::Button& button,
                                              const juce::Colour& backgroundColour,
                                              bool isMouseOverButton,
                                              bool isButtonDown)
{
    auto colour = backgroundColour;

    if (isButtonDown)
        colour = colour.brighter (0.12f);
    else if (isMouseOverButton)
        colour = colour.brighter (0.06f);

    g.setColour (colour);
    g.fillRoundedRectangle (button.getLocalBounds().toFloat(), 10.0f);
}

void StudioLookAndFeel::drawButtonText (juce::Graphics& g,
                                        juce::TextButton& button,
                                        bool,
                                        bool)
{
    g.setColour (button.findColour (juce::TextButton::textColourOffId));
    g.setFont (juce::FontOptions (14.0f).withStyle ("Bold"));
    g.drawFittedText (button.getButtonText(),
                      button.getLocalBounds().reduced (10, 4),
                      juce::Justification::centred,
                      1);
}

void StudioLookAndFeel::drawLinearSlider (juce::Graphics& g,
                                          int x, int y, int width, int height,
                                          float sliderPos,
                                          float minSliderPos,
                                          float maxSliderPos,
                                          juce::Slider::SliderStyle style,
                                          juce::Slider& slider)
{
    if (style != juce::Slider::LinearHorizontal)
    {
        LookAndFeel_V4::drawLinearSlider (g, x, y, width, height,
                                          sliderPos, minSliderPos, maxSliderPos,
                                          style, slider);
        return;
    }

    const auto centreY = (float) y + (float) height * 0.5f;

    g.setColour (juce::Colour (0xff26303b));
    g.fillRoundedRectangle ((float) x, centreY - 3.0f, (float) width, 6.0f, 3.0f);

    g.setColour (juce::Colour (0xff8ee8d8));
    g.fillRoundedRectangle ((float) x,
                            centreY - 3.0f,
                            juce::jmax (0.0f, sliderPos - (float) x),
                            6.0f,
                            3.0f);

    g.setColour (juce::Colours::white);
    g.fillEllipse (sliderPos - 6.0f, centreY - 6.0f, 12.0f, 12.0f);
}
