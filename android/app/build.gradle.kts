plugins {
    id("com.android.application")
}

val releaseKeystorePath = System.getenv("L26_ANDROID_KEYSTORE_PATH")
val releaseKeystorePassword = System.getenv("L26_ANDROID_KEYSTORE_PASSWORD")
val releaseKeyAlias = System.getenv("L26_ANDROID_KEY_ALIAS")
val releaseKeyPassword = System.getenv("L26_ANDROID_KEY_PASSWORD")
val hasReleaseSigning = !releaseKeystorePath.isNullOrBlank() &&
    !releaseKeystorePassword.isNullOrBlank() &&
    !releaseKeyAlias.isNullOrBlank() &&
    !releaseKeyPassword.isNullOrBlank()

android {
    namespace = "cr.go.sarapiqui.fiscalizacion.l26"
    compileSdk = 36

    defaultConfig {
        applicationId = "cr.go.sarapiqui.fiscalizacion.l26"
        minSdk = 29
        targetSdk = 36
        versionCode = 260000
        versionName = "26.0.0"
    }

    signingConfigs {
        if (hasReleaseSigning) {
            create("release") {
                storeFile = file(releaseKeystorePath!!)
                storePassword = releaseKeystorePassword
                keyAlias = releaseKeyAlias
                keyPassword = releaseKeyPassword
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            if (hasReleaseSigning) {
                signingConfig = signingConfigs.getByName("release")
            }
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}


dependencies {
    // Modelo latino incluido físicamente en el APK: no se descarga al primer uso.
    implementation("com.google.mlkit:text-recognition:16.0.1")
}
