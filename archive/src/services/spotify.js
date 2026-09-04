const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;

let accessToken = null;
let tokenExpiration = 0;

async function getAccessToken() {
  if (accessToken && Date.now() < tokenExpiration) {
    return accessToken;
  }

  // Use local proxy to avoid CORS issues during development
  // In production, this call must be handled by a backend/serverless function
  const tokenUrl = import.meta.env.DEV 
    ? "/api/spotify-token" 
    : "https://accounts.spotify.com/api/token";

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + btoa(CLIENT_ID + ":" + CLIENT_SECRET),
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("Token fetch error:", err);
    throw new Error("Failed to obtain access token");
  }

  const data = await response.json();
  accessToken = data.access_token;
  tokenExpiration = Date.now() + data.expires_in * 1000;
  return accessToken;
}

export async function searchAlbums(query) {
  if (!query) return [];
  
  try {
    const token = await getAccessToken();
    const res = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=album&limit=5`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error("Failed to search albums");
    const data = await res.json();
    
    return data.albums.items.map(item => ({
      spotifyId: item.id,
      title: item.name,
      artist: item.artists.map((a) => a.name),
      releaseDate: item.release_date,
      releaseDatePrecision: item.release_date_precision,
      coverUrl: item.images[0]?.url, 
      totalTracks: item.total_tracks,
      url: item.external_urls.spotify,
      genres: [], // genres not available in search list usually
    }));
  } catch (error) {
    console.error("Spotify Search Error:", error);
    throw error;
  }
}

export async function fetchAlbumMetadata(input) {
  if (!input) return null;

  let albumId = input;
  // Handle full URLs
  if (input.includes("spotify.com/album/")) {
    const parts = input.split("/album/");
    if (parts.length > 1) {
      albumId = parts[1].split("?")[0];
    }
  } else if (input.includes("spotify:album:")) {
     albumId = input.split(":")[2];
  }

  try {
    const token = await getAccessToken();
    const res = await fetch(`https://api.spotify.com/v1/albums/${albumId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error("Failed to fetch album");
    const data = await res.json();

    return {
      spotifyId: data.id,
      title: data.name,
      artist: data.artists.map((a) => a.name),
      releaseDate: data.release_date,
      releaseDatePrecision: data.release_date_precision,
      coverUrl: data.images[0]?.url, 
      totalTracks: data.total_tracks,
      url: data.external_urls.spotify,
      genres: data.genres, 
    };
  } catch (error) {
    console.error("Spotify API Error:", error);
    throw error;
  }
}
