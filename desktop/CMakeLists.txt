cmake_minimum_required(VERSION 3.22)

project(DeepAudioStudio VERSION 0.1.0 LANGUAGES C CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_POSITION_INDEPENDENT_CODE ON)

include(FetchContent)

FetchContent_Declare(
    JUCE
    GIT_REPOSITORY https://github.com/juce-framework/JUCE.git
    GIT_TAG 9.0.2
    GIT_SHALLOW TRUE
)
FetchContent_MakeAvailable(JUCE)

juce_add_gui_app(DeepAudioStudio
    PRODUCT_NAME "Deep Audio Studio"
    COMPANY_NAME "Deep Analytica"
    BUNDLE_ID "cl.deepanalytica.deepaudio"
)

juce_generate_juce_header(DeepAudioStudio)

target_sources(DeepAudioStudio PRIVATE
    src/Main.cpp
    src/MainComponent.cpp
    src/MainComponent.h
    src/audio/AudioEngine.cpp
    src/audio/AudioEngine.h
    src/audio/Recorder.cpp
    src/audio/Recorder.h
    src/ui/StudioLookAndFeel.cpp
    src/ui/StudioLookAndFeel.h
    src/ui/WaveformComponent.cpp
    src/ui/WaveformComponent.h
)

target_compile_definitions(DeepAudioStudio PRIVATE
    JUCE_WEB_BROWSER=0
    JUCE_USE_CURL=0
    JUCE_VST3_CAN_REPLACE_VST2=0
)

if(WIN32)
    target_compile_definitions(DeepAudioStudio PRIVATE
        JUCE_ASIO=1
        JUCE_DIRECTSOUND=0
    )
endif()

target_link_libraries(DeepAudioStudio PRIVATE
    juce::juce_audio_utils
    juce::juce_dsp
    juce::juce_gui_extra
    juce::juce_recommended_config_flags
    juce::juce_recommended_warning_flags
)
