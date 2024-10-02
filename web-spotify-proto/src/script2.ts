const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

let userId: string | null = null;
let currentGenre: string | null = null;

document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  checkAuthStatus();
  populateGenreDropdown();
});

function setupEventListeners() {
  const playButton = document.getElementById("playButton") as HTMLButtonElement;
  const nextButton = document.getElementById("nextButton") as HTMLButtonElement;
  const genreSelect = document.getElementById("genreSelect") as HTMLSelectElement;

  playButton.addEventListener("click", handlePlay);
  nextButton.addEventListener("click", handleNext);
  genreSelect.addEventListener("change", handleGenreChange);
}

async function checkAuthStatus() {
  const urlParams = new URLSearchParams(window.location.search);
  const userIdParam = urlParams.get('user_id');
  
  if (userIdParam) {
    userId = userIdParam;
    localStorage.setItem('userId', userId);
  } else {
    userId = localStorage.getItem('userId');
  }

  if (userId) {
    const profile = await fetchProfile();
    if (profile) {
      populateUI(profile);
    } else {
      redirectToAuth();
    }
  } else {
    redirectToAuth();
  }
}

function redirectToAuth() {
  window.location.href = `${API_BASE_URL}/spotify/auth`;
}

async function fetchProfile(): Promise<any | null> {
  if (!userId) return null;
  const response = await fetch(`${API_BASE_URL}/spotify/profile`, {
    headers: { 'X-User-ID': userId },
  });
  if (!response.ok) return null;
  return await response.json();
}

function populateUI(profile: any) {
  document.getElementById("displayName")!.innerText = profile.display_name;
  document.getElementById("id")!.innerText = profile.id;
  document.getElementById("email")!.innerText = profile.email;
}

async function populateGenreDropdown() {
  const genreSelect = document.getElementById("genreSelect") as HTMLSelectElement;
  try {
    const response = await fetch(`${API_BASE_URL}/genres/categories`);
    if (!response.ok) throw new Error('Failed to fetch genres');
    const genres = await response.json();
    genres.forEach((genre: { id: string; name: string }) => {
      const option = document.createElement('option');
      option.value = genre.name;
      option.textContent = genre.name;
      genreSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error fetching genres:', error);
  }
}

async function handleGenreChange(event: Event) {
  const selectedGenre = (event.target as HTMLSelectElement).value;
  currentGenre = selectedGenre;
  const artistsContainer = document.getElementById("artistsContainer") as HTMLDivElement;
  
  try {
    const response = await fetch(`${API_BASE_URL}/genres/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': userId!,
      },
      body: JSON.stringify({ category: selectedGenre }),
    });
    
    if (!response.ok) throw new Error('Failed to fetch artists');
    const artists = await response.json();
    
    artistsContainer.innerHTML = '';
    artists.forEach((artist: { id: string; title: string; spotifyID: string }) => {
      const artistElement = document.createElement('div');
      artistElement.textContent = artist.title;
      artistsContainer.appendChild(artistElement);
    });
  } catch (error) {
    console.error('Error fetching artists:', error);
  }
}

async function handlePlay() {
  if (!currentGenre) {
    alert("Please select a genre first.");
    return;
  }
  await playNextTrack();
}

async function handleNext() {
  if (!currentGenre) {
    alert("Please select a genre first.");
    return;
  }
  await playNextTrack();
}

async function playNextTrack() {
  if (!userId || !currentGenre) return;

  try {
    // Get the next track ID from the /spotify/play-next endpoint
    const nextTrackResponse = await fetch(`${API_BASE_URL}/spotify/next-track`, {
      method: 'POST',
      headers: {
        'X-User-ID': userId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ category: currentGenre }),
    });

    if (!nextTrackResponse.ok) {
      throw new Error('Failed to get next track');
    }

    const { track } = await nextTrackResponse.json();

    // Play the track using the /play endpoint
    const playResponse = await fetch(`${API_BASE_URL}/spotify/play`, {
        method: 'POST',
        headers: {
          'X-User-ID': userId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uri: `${track.uri}` }),
      });
  
      if (!playResponse.ok) {
        const errorData = await playResponse.json();
        if (errorData.error === "Player command failed: No active device found") {
          throw new Error('No active Spotify device found. Please open Spotify and start playing on a device.');
        }
        throw new Error('Failed to play track');
      }

  } catch (error) {
    console.error('Error playing next track:', error);
    alert(error instanceof Error ? error.message : 'Failed to play next track. Make sure you have an active Spotify device and Spotify Premium.');
  }
}

