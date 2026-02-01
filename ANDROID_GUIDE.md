# How to Build the Android App

This project has been configured with **Capacitor** to run as a native Android application.

## Prerequisites

1.  **Android Studio**: Download and install it from [developer.android.com](https://developer.android.com/studio).
2.  **Java/JDK**: Android Studio usually comes with this, but ensure you have a valid JDK if prompted.

## Steps to Run on Android

1.  **Sync the Project**:
    Run the included script to build your React app and sync it to the Android project folder:
    ```bash
    npm run android
    ```
    *This command does three things:*
    *   `npm run build`: Compiles your React/Vite app.
    *   `npx cap sync`: Copies the `dist` folder to the Android native container.
    *   `npx cap open android`: Opens the project in Android Studio.

2.  **Build in Android Studio**:
    *   Once Android Studio opens, wait for Gradle to sync (bottom status bar).
    *   Connect your Android phone via USB (ensure **Developer Options > USB Debugging** is on).
    *   Or, create an **Android Virtual Device (AVD)** in the Device Manager.
    *   Click the green **Play** button (Run 'app') in the top toolbar.

## Customizing the App Icon & Splash Screen

To change the default Capacitor icon:
1.  Install the assets tool:
    ```bash
    npm install -g @capacitor/assets
    ```
2.  Place your logo in `assets/logo.png` and `assets/splash.png`.
3.  Run:
    ```bash
    npx capacitor-assets generate --android
    ```

## Troubleshooting
*   **"Top-level" await**: If you see errors about API levels, ensure your target SDK is high enough (Capacitor defaults are usually fine).
*   **Networking**: If you can't connect to APIs, ensure your phone has internet access.
