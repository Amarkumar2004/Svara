function formatTime(sec) {
  if (!isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const player = new Player();
const playlistManager = new PlaylistManager();

let recentlyPlayed = [];
try {
  const rp = localStorage.getItem("recently-played");
  if (rp) recentlyPlayed = JSON.parse(rp);
} catch {}
function saveRecentlyPlayed() {
  localStorage.setItem("recently-played", JSON.stringify(recentlyPlayed));
}

function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  const icons = { success: "✓", error: "✕", info: "●" };
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || "●"}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("fade-out");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  html.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
  document.querySelectorAll(".theme-toggle-icon").forEach((el) => {
    el.textContent = next === "dark" ? "☀️" : "🌙";
  });
}

function initTheme() {
  const saved = localStorage.getItem("theme");
  if (saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
    document.documentElement.setAttribute("data-theme", "dark");
    document.querySelectorAll(".theme-toggle-icon").forEach((el) => {
      el.textContent = "☀️";
    });
  }
}

function renderSongCard(song, section = "") {
  const card = document.createElement("div");
  card.className = "song-card";
  card.style.animationDelay = `${Math.random() * 0.2}s`;

  const isLiked = player.isLiked(song.id);

  card.innerHTML = `
    <div class="card-img-wrap">
      <img src="${song.cover}" alt="${song.title}" loading="lazy" />
      <div class="card-play-overlay">
        <button class="play-card-btn" data-id="${song.id}">▶</button>
      </div>
    </div>
    <div class="card-title" title="${song.title}">${song.title}</div>
    <div class="card-artist" title="${song.artist}">${song.artist}</div>
    <div class="card-actions">
      <button class="like-btn ${isLiked ? "liked" : ""}" data-id="${song.id}">${isLiked ? "♥" : "♡"}</button>
      <button class="add-playlist-btn" data-id="${song.id}" title="Add to playlist">+</button>
    </div>
  `;

  card.querySelector(".play-card-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    handlePlaySong(song);
  });

  card.querySelector(".like-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    const liked = player.toggleLike(song.id);
    e.currentTarget.textContent = liked ? "♥" : "♡";
    e.currentTarget.classList.toggle("liked", liked);
    showToast(liked ? "Added to Favorites" : "Removed from Favorites", "success");
  });

  card.querySelector(".add-playlist-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    showAddToPlaylistModal(song);
  });

  card.addEventListener("click", () => handlePlaySong(song));

  return card;
}

function renderArtistCard(artist) {
  const card = document.createElement("div");
  card.className = "artist-card";
  card.style.animationDelay = `${Math.random() * 0.2}s`;
  card.innerHTML = `
    <img src="${artist.image}" alt="${artist.name}" loading="lazy" />
    <div class="artist-name">${artist.name}</div>
    <div class="artist-genre">${artist.genre}</div>
  `;
  card.addEventListener("click", () => {
    const songs = SONGS.filter((s) => s.artist === artist.name);
    if (songs.length > 0) {
      player.load(songs, 0);
      showToast(`Playing ${artist.name}`, "success");
    }
  });
  return card;
}

function renderAlbumCard(album) {
  const card = document.createElement("div");
  card.className = "album-card";
  card.style.animationDelay = `${Math.random() * 0.2}s`;
  card.innerHTML = `
    <img src="${album.cover}" alt="${album.title}" loading="lazy" />
    <div class="album-title">${album.title}</div>
    <div class="album-artist">${album.artist} · ${album.year}</div>
  `;
  card.addEventListener("click", () => {
    const songs = SONGS.filter((s) => s.album === album.title);
    if (songs.length > 0) {
      player.load(songs, 0);
      showToast(`Playing ${album.title}`, "success");
    }
  });
  return card;
}

function handlePlaySong(song) {
  const track = SONGS.find((s) => s.id === song.id) || song;
  player.load([track], 0);
  recentlyPlayed = recentlyPlayed.filter((s) => s.id !== track.id);
  recentlyPlayed.unshift(track);
  if (recentlyPlayed.length > 20) recentlyPlayed = recentlyPlayed.slice(0, 20);
  saveRecentlyPlayed();
  renderRecentlyPlayed();
}

function renderTrending() {
  const section = document.getElementById("trending-section");
  section.innerHTML = "";
  const trending = SONGS[0];
  if (!trending) return;
  const hero = document.createElement("div");
  hero.className = "trending-hero";
  hero.style.animation = "fadeInUp 0.6s ease";
  hero.innerHTML = `
    <img class="hero-img" src="${trending.cover}" alt="${trending.title}" />
    <div class="hero-info">
      <div class="hero-label">Trending Now</div>
      <div class="hero-title">${trending.title}</div>
      <div class="hero-artist">${trending.artist} · ${trending.album}</div>
      <div class="hero-actions">
        <button class="btn-primary" id="hero-play-btn">▶ Play</button>
        <button class="btn-secondary" id="hero-shuffle-btn">🔀 Shuffle</button>
      </div>
    </div>
  `;
  hero.querySelector("#hero-play-btn").addEventListener("click", () => {
    const tracks = shuffleArray(SONGS.filter((s) => s.genre === trending.genre));
    if (tracks.length > 0) {
      player.load(tracks, 0);
      showToast(`Playing ${tracks[0].title}`, "success");
    }
  });
  hero.querySelector("#hero-shuffle-btn").addEventListener("click", () => {
    const shuffled = shuffleArray(SONGS);
    player.load(shuffled, 0);
    showToast("Shuffle play", "success");
  });
  section.appendChild(hero);
}

function renderSongGrid(containerId, songs, section = "") {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";
  if (!songs || songs.length === 0) {
    container.innerHTML = `<div class="no-results"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg><p>No songs found</p></div>`;
    return;
  }
  songs.forEach((song) => {
    container.appendChild(renderSongCard(song, section));
  });
}

function renderArtists() {
  const container = document.getElementById("artist-grid");
  if (!container) return;
  container.innerHTML = "";
  ARTISTS.forEach((artist) => {
    container.appendChild(renderArtistCard(artist));
  });
}

function renderAlbums() {
  const container = document.getElementById("album-grid");
  if (!container) return;
  container.innerHTML = "";
  ALBUMS.forEach((album) => {
    container.appendChild(renderAlbumCard(album));
  });
}

function renderRecentlyPlayed() {
  const container = document.getElementById("recently-grid");
  if (!container) return;
  container.innerHTML = "";
  if (recentlyPlayed.length === 0) {
    container.innerHTML = `<div class="no-results" style="padding:20px"><p>No recently played songs</p></div>`;
    return;
  }
  recentlyPlayed.slice(0, 6).forEach((song) => {
    container.appendChild(renderSongCard(song, "recent"));
  });
}

function renderRecommended() {
  const container = document.getElementById("recommended-grid");
  if (!container) return;
  container.innerHTML = "";
  const shuffled = shuffleArray(SONGS);
  shuffled.slice(0, 6).forEach((song) => {
    container.appendChild(renderSongCard(song, "recommended"));
  });
}

function renderAllSongs() {
  renderSongGrid("trending-grid", SONGS.slice(0, 6), "trending");
  renderSongGrid("all-songs-grid", SONGS, "all");
}

function updatePlayerUI() {
  const track = player.getCurrentTrack();
  const playerThumb = document.getElementById("player-thumb");
  const playerTitle = document.getElementById("player-song-title");
  const playerArtist = document.getElementById("player-song-artist");
  const playBtn = document.getElementById("play-btn");
  const playIcon = document.getElementById("play-icon");
  const shuffleBtn = document.getElementById("shuffle-btn");
  const repeatBtn = document.getElementById("repeat-btn");
  const progressFill = document.getElementById("progress-fill");
  const currentTimeEl = document.getElementById("current-time");
  const totalTimeEl = document.getElementById("total-time");
  const volumeSlider = document.getElementById("volume-slider");
  const likeBtn = document.getElementById("player-like-btn");

  if (track) {
    playerThumb.src = track.cover;
    playerThumb.alt = track.title;
    playerTitle.textContent = track.title;
    playerArtist.textContent = track.artist;
    playerThumb.classList.add("rotating");
    if (!player.isPlaying) playerThumb.classList.add("paused");
    else playerThumb.classList.remove("paused");

    const liked = player.isLiked(track.id);
    likeBtn.textContent = liked ? "♥" : "♡";
    likeBtn.classList.toggle("liked", liked);
  }

  playIcon.textContent = player.isPlaying ? "⏸" : "▶";
  shuffleBtn.classList.toggle("active", player.isShuffled);
  repeatBtn.classList.toggle("active", player.repeatMode !== "none");
  repeatBtn.textContent = player.repeatMode === "one" ? "🔂" : "🔁";

  volumeSlider.value = player.volume;
}

function showAddToPlaylistModal(song) {
  const playlists = playlistManager.getPlaylists();
  if (playlists.length === 0) {
    const pl = playlistManager.createPlaylist("My Playlist");
    playlistManager.addSong(pl.id, song);
    renderSidebarPlaylist();
    showToast(`Added to "${pl.name}"`, "success");
    return;
  }

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.style.cssText = `
    position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 500;
    display: flex; align-items: center; justify-content: center;
    animation: fadeIn 0.2s ease;
  `;

  const modal = document.createElement("div");
  modal.className = "modal";
  modal.style.cssText = `
    background: var(--card-bg, #fff); backdrop-filter: blur(24px);
    border: 1px solid var(--glass-border, rgba(255,255,255,0.7));
    border-radius: 16px; padding: 24px; min-width: 300px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.2);
    animation: scaleIn 0.2s ease;
  `;

  modal.innerHTML = `
    <h3 style="margin-bottom:16px;font-size:18px;font-weight:600">Add to Playlist</h3>
    <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px">
      ${playlists.map((p) => `
        <button class="modal-pl-btn" data-id="${p.id}" style="
          display:flex;align-items:center;gap:10px;padding:10px 14px;
          border:1px solid var(--glass-border, rgba(255,255,255,0.7));
          border-radius:10px;background:var(--input-bg, rgba(255,255,255,0.5));
          color:var(--text, #1a1a2e);cursor:pointer;font-size:14px;
          transition:all 0.2s;font-family:inherit;text-align:left;width:100%;
        ">🎵 ${p.name} (${p.songs.length})</button>
      `).join("")}
    </div>
    <button id="modal-new-pl" style="
      width:100%;padding:10px;border:1px dashed var(--accent, #6c5ce7);
      border-radius:10px;background:transparent;color:var(--accent, #6c5ce7);
      cursor:pointer;font-size:14px;font-family:inherit;
      transition:all 0.2s;margin-bottom:12px;
    ">+ New Playlist</button>
    <button id="modal-close" style="
      width:100%;padding:8px;border:none;border-radius:10px;
      background:transparent;color:var(--text-muted, #888);
      cursor:pointer;font-size:13px;font-family:inherit;
    ">Cancel</button>
  `;

  modal.querySelectorAll(".modal-pl-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const plId = btn.dataset.id;
      const added = playlistManager.addSong(plId, song);
      if (added) {
        showToast("Added to playlist", "success");
        renderSidebarPlaylist();
      } else {
        showToast("Already in playlist", "info");
      }
      overlay.remove();
    });
  });

  modal.querySelector("#modal-new-pl").addEventListener("click", () => {
    const pl = playlistManager.createPlaylist(`Playlist ${playlistManager.getPlaylists().length}`);
    playlistManager.addSong(pl.id, song);
    renderSidebarPlaylist();
    showToast(`Created and added to "${pl.name}"`, "success");
    overlay.remove();
  });

  modal.querySelector("#modal-close").addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });

  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

function renderSidebarPlaylist() {
  const container = document.getElementById("sidebar-playlist");
  if (!container) return;
  const playlists = playlistManager.getPlaylists();
  container.innerHTML = "";

  if (playlists.length === 0) {
    container.innerHTML = `
      <div class="empty-playlist">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
        </svg>
        <p>No playlists yet</p>
      </div>
    `;
    return;
  }

  playlists.forEach((pl) => {
    const item = document.createElement("div");
    item.className = "playlist-item";
    item.innerHTML = `
      <span style="font-size:20px">🎵</span>
      <div class="pl-info">
        <div class="pl-title">${pl.name}</div>
        <div class="pl-artist">${pl.songs.length} song${pl.songs.length !== 1 ? "s" : ""}</div>
      </div>
      <button class="pl-remove" data-id="${pl.id}" title="Delete playlist">✕</button>
    `;

    item.querySelector(".pl-remove").addEventListener("click", (e) => {
      e.stopPropagation();
      playlistManager.deletePlaylist(pl.id);
      renderSidebarPlaylist();
      showToast("Playlist deleted", "info");
    });

    item.addEventListener("click", () => {
      const songs = pl.songs;
      if (songs.length > 0) {
        player.load(songs, 0);
        showToast(`Playing ${pl.name}`, "success");
      } else {
        showToast("Playlist is empty", "info");
      }
    });

    container.appendChild(item);
  });
}

function setupPlayerListeners() {
  const playBtn = document.getElementById("play-btn");
  const nextBtn = document.getElementById("next-btn");
  const prevBtn = document.getElementById("prev-btn");
  const shuffleBtn = document.getElementById("shuffle-btn");
  const repeatBtn = document.getElementById("repeat-btn");
  const progressBar = document.getElementById("progress-bar");
  const progressFill = document.getElementById("progress-fill");
  const currentTimeEl = document.getElementById("current-time");
  const totalTimeEl = document.getElementById("total-time");
  const volumeSlider = document.getElementById("volume-slider");
  const volumeBtn = document.getElementById("volume-btn");
  const likeBtn = document.getElementById("player-like-btn");

  playBtn.addEventListener("click", () => player.playPause());
  nextBtn.addEventListener("click", () => player.next());
  prevBtn.addEventListener("click", () => player.prev());
  shuffleBtn.addEventListener("click", () => {
    player.toggleShuffle();
    updatePlayerUI();
    showToast(player.isShuffled ? "Shuffle On" : "Shuffle Off", "info");
  });
  repeatBtn.addEventListener("click", () => {
    player.toggleRepeat();
    updatePlayerUI();
    const msgs = { none: "Repeat Off", one: "Repeat One", all: "Repeat All" };
    showToast(msgs[player.repeatMode], "info");
  });

  volumeSlider.addEventListener("input", (e) => {
    player.setVolume(parseFloat(e.target.value));
    updateVolumeIcon();
  });

  volumeBtn.addEventListener("click", () => {
    if (player.volume > 0) {
      player._prevVolume = player.volume;
      player.setVolume(0);
    } else {
      player.setVolume(player._prevVolume || 0.7);
    }
    updateVolumeIcon();
    volumeSlider.value = player.volume;
  });

  let isDragging = false;
  progressBar.addEventListener("mousedown", (e) => {
    isDragging = true;
    seekFromEvent(e);
  });
  document.addEventListener("mousemove", (e) => {
    if (isDragging) seekFromEvent(e);
  });
  document.addEventListener("mouseup", () => {
    isDragging = false;
  });
  progressBar.addEventListener("click", (e) => seekFromEvent(e));

  function seekFromEvent(e) {
    const rect = progressBar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const duration = player.audio.duration || 0;
    player.seek(pct * duration);
  }

  likeBtn.addEventListener("click", () => {
    const track = player.getCurrentTrack();
    if (!track) return;
    const liked = player.toggleLike(track.id);
    likeBtn.textContent = liked ? "♥" : "♡";
    likeBtn.classList.toggle("liked", liked);
    showToast(liked ? "Added to Favorites" : "Removed from Favorites", "success");
  });

  player._onTrackChange = (track, index) => {
    updatePlayerUI();
    document.querySelectorAll(".song-card").forEach((card) => {
      const btn = card.querySelector(".play-card-btn");
      if (btn) {
        const id = parseInt(btn.dataset.id);
        card.style.borderColor = id === track.id ? "var(--accent)" : "";
      }
    });
  };

  player._onPlayStateChange = (playing) => {
    updatePlayerUI();
    const thumb = document.getElementById("player-thumb");
    if (playing) {
      thumb.classList.remove("paused");
    } else {
      thumb.classList.add("paused");
    }
  };

  player._onProgress = (current, duration) => {
    const pct = duration > 0 ? (current / duration) * 100 : 0;
    progressFill.style.width = `${pct}%`;
    currentTimeEl.textContent = formatTime(current);
    totalTimeEl.textContent = formatTime(duration);
  };

  player._onDuration = (duration) => {
    totalTimeEl.textContent = formatTime(duration);
  };

  player._onVolumeChange = (vol) => {
    volumeSlider.value = vol;
    updateVolumeIcon();
  };

  player._onQueueEnd = () => {
    showToast("End of queue", "info");
  };
}

function updateVolumeIcon() {
  const btn = document.getElementById("volume-btn");
  if (!btn) return;
  if (player.volume === 0) btn.textContent = "🔇";
  else if (player.volume < 0.3) btn.textContent = "🔈";
  else if (player.volume < 0.7) btn.textContent = "🔉";
  else btn.textContent = "🔊";
}

function setupSearch() {
  const input = document.getElementById("search-input");
  const resultsContainer = document.getElementById("search-results");
  const mainSections = document.getElementById("main-sections");

  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    if (!q) {
      if (resultsContainer) resultsContainer.innerHTML = "";
      if (mainSections) mainSections.style.display = "";
      return;
    }
    if (mainSections) mainSections.style.display = "none";
    const filtered = SONGS.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q) ||
        s.album.toLowerCase().includes(q)
    );
    resultsContainer.innerHTML = `<h3 class="search-results-section" style="margin-top:0">Results for "${input.value.trim()}"</h3>`;
    const grid = document.createElement("div");
    grid.className = "song-grid";
    if (filtered.length === 0) {
      grid.innerHTML = `<div class="no-results" style="grid-column:1/-1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><p>No results found</p></div>`;
    } else {
      filtered.forEach((song) => grid.appendChild(renderSongCard(song, "search")));
    }
    resultsContainer.appendChild(grid);
  });
}

function setupHamburger() {
  const hamburger = document.getElementById("hamburger");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebar-overlay");

  hamburger.addEventListener("click", () => {
    sidebar.classList.toggle("open");
    overlay.classList.toggle("show");
  });

  overlay.addEventListener("click", () => {
    sidebar.classList.remove("open");
    overlay.classList.remove("show");
  });
}

function setupSidebarNav() {
  document.querySelectorAll(".nav-item[data-section]").forEach((item) => {
    item.addEventListener("click", () => {
      const section = item.dataset.section;
      document.querySelectorAll(".nav-item").forEach((n) => n.classList.remove("active"));
      item.classList.add("active");
      const sidebar = document.getElementById("sidebar");
      const overlay = document.getElementById("sidebar-overlay");
      sidebar.classList.remove("open");
      overlay.classList.remove("show");
      const el = document.getElementById(section);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    });
  });
}

function initLoader() {
  const loader = document.getElementById("loader");
  if (loader) {
    setTimeout(() => loader.classList.add("hidden"), 600);
    setTimeout(() => loader.remove(), 1100);
  }
}

function setupCreatePlaylist() {
  const btn = document.getElementById("create-playlist-btn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const name = prompt("Playlist name:", `My Playlist ${playlistManager.getPlaylists().length + 1}`);
    if (name && name.trim()) {
      playlistManager.createPlaylist(name.trim());
      renderSidebarPlaylist();
      showToast(`Created "${name.trim()}"`, "success");
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initLoader();

  const defaultPl = playlistManager.getOrCreateDefault();
  if (defaultPl.songs.length === 0) {
    SONGS.slice(0, 3).forEach((song) => {
      if (!defaultPl.songs.some((s) => s.id === song.id)) {
        defaultPl.songs.push({ ...song });
      }
    });
    playlistManager._save();
  }

  renderTrending();
  renderSongGrid("trending-grid", SONGS.slice(0, 6));
  renderRecentlyPlayed();
  renderRecommended();
  renderArtists();
  renderAlbums();
  renderSongGrid("all-songs-grid", SONGS);
  renderSidebarPlaylist();
  setupPlayerListeners();
  setupSearch();
  setupCreatePlaylist();
  setupHamburger();
  setupSidebarNav();

  updatePlayerUI();
});
