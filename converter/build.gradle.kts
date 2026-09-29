plugins {
    id("com.android.application")
}

android {
    namespace = "cl.deepanalytica.audioconverter"
    compileSdk = 35

    defaultConfig {
        applicationId = "cl.deepanalytica.audioconverter"
        minSdk = 29
        targetSdk = 35
        versionCode = 2
        versionName = "1.0.1"
    }

    buildTypes {
        debug { isMinifyEnabled = false }
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    packaging {
        jniLibs { useLegacyPackaging = true }
        resources {
            excludes += setOf("META-INF/DEPENDENCIES", "META-INF/LICENSE*", "META-INF/NOTICE*")
        }
    }
}

dependencies {
    implementation("dev.ffmpegkit-maintained:ffmpeg-kit-full:8.1.9")
}
