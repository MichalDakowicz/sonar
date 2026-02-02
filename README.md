# Sonar

**Curate your physical & digital collection.**

Sonar is a modern, cross-platform application designed for music enthusiasts to track, manage, and share their music collection. Whether it's Vinyl, CD, Cassette, or Digital, Sonar helps you keep a beautiful digital archive of your physical library.

## Features

- **Unified Collection:** Manage all your formats (Vinyl, CD, Cassette, Digital) in one place.
- **Spotify Integration:** Easily add albums by searching the Spotify database to auto-fill metadata and cover art.
- **Listening History:** Log your "spins" and keep a history of what you've been listening to.
- **Public Shelf:** Share a read-only link to your collection so friends can browse your library.
- **Rich Organization:** Filter and group by Artist, Genre, Year, Format, or Status (Collection, Wishlist, Pre-order).
- **Personal Notes:** Add private notes, ratings, and pressing details (catalog numbers, price paid, store) to your albums.
- **Cross-Platform:** Built to run as a responsive web app and a native Android application.

## Tech Stack

- **Frontend:** React, Vite
- **Styling:** Tailwind CSS, Lucide React
- **Backend & Auth:** Firebase (Firestore, Authentication)
- **State Management:** TanStack Query
- **Mobile Runtime:** Capacitor

## Getting Started

### Prerequisites

- Node.js (v18+)
- Firebase Project

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/MichalDakowicz/music-tracker.git
   cd music-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configuration**
   Ensure your Firebase configuration is set up in `src/lib/firebase.js`.

4. **Run the development server**
   ```bash
   npm run dev
   ```

## Building for Android

This project uses Capacitor to generate the native Android app.

1. Build the web assets:
   ```bash
   npm run build
   ```

2. Sync with Capacitor:
   ```bash
   npx cap sync
   ```

3. Open in Android Studio:
   ```bash
   npx cap open android
   ```

For detailed Android build instructions, please refer to [ANDROID_GUIDE.md](ANDROID_GUIDE.md).

## License

See [LICENSE](LICENSE) for more information.
