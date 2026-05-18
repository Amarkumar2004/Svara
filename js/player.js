class Player {
  constructor() {
    this.audio = new Audio();
    this.queue = [];
    this.currentIndex = -1;
    this.isPlaying = false;
    this.isShuffled = false;
    this.repeatMode = "none";
    this.shuffleOrder = [];
    this.volume = parseFloat(localStorage.getItem("player-volume") || "0.7");
    this.likedSongs = new Set(JSON.parse(localStorage.getItem("liked-songs") || "[]"));

    this.audio.volume = this.volume;
    this.audio.preload = "auto";

    this.audio.addEventListener("timeupdate", () => this._onTimeUpdate());
    this.audio.addEventListener("ended", () => this._onEnded());
    this.audio.addEventListener("loadedmetadata", () => this._onLoadedMeta());
    this.audio.addEventListener("error", () => this._onError());
  }

  load(queue, startIndex = 0) {
    this.queue = queue;
    this.currentIndex = startIndex;
    if (this.isShuffled) this._generateShuffle();
    if (queue.length > 0) this._loadTrack(startIndex);
  }

  play(trackOrIndex) {
    if (typeof trackOrIndex === "object" && trackOrIndex !== null) {
      const idx = this.queue.findIndex((t) => t.id === trackOrIndex.id);
      if (idx >= 0) {
        this.currentIndex = idx;
        this._loadTrack(idx);
      } else {
        this.queue.push(trackOrIndex);
        this.currentIndex = this.queue.length - 1;
        this._loadTrack(this.currentIndex);
      }
    } else if (typeof trackOrIndex === "number") {
      this.currentIndex = trackOrIndex;
      this._loadTrack(trackOrIndex);
    } else {
      this._togglePlay();
    }
  }

  playPause() {
    this._togglePlay();
  }

  next() {
    if (this.queue.length === 0) return;
    if (this.repeatMode === "one") {
      this.audio.currentTime = 0;
      this.audio.play().catch(() => {});
      return;
    }
    let nextIdx;
    if (this.isShuffled) {
      const currentShuffleIdx = this.shuffleOrder.indexOf(this.currentIndex);
      nextIdx = this.shuffleOrder[(currentShuffleIdx + 1) % this.queue.length];
    } else {
      nextIdx = (this.currentIndex + 1) % this.queue.length;
    }
    this.currentIndex = nextIdx;
    this._loadTrack(nextIdx);
  }

  prev() {
    if (this.queue.length === 0) return;
    if (this.audio.currentTime > 3) {
      this.audio.currentTime = 0;
      return;
    }
    let prevIdx;
    if (this.isShuffled) {
      const currentShuffleIdx = this.shuffleOrder.indexOf(this.currentIndex);
      prevIdx = this.shuffleOrder[(currentShuffleIdx - 1 + this.queue.length) % this.queue.length];
    } else {
      prevIdx = (this.currentIndex - 1 + this.queue.length) % this.queue.length;
    }
    this.currentIndex = prevIdx;
    this._loadTrack(prevIdx);
  }

  seek(time) {
    if (isFinite(time)) {
      this.audio.currentTime = time;
    }
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    this.audio.volume = this.volume;
    localStorage.setItem("player-volume", this.volume);
    if (this._onVolumeChange) this._onVolumeChange(this.volume);
  }

  toggleShuffle() {
    this.isShuffled = !this.isShuffled;
    if (this.isShuffled) this._generateShuffle();
    if (this._onShuffleChange) this._onShuffleChange(this.isShuffled);
  }

  toggleRepeat() {
    const modes = ["none", "one", "all"];
    const idx = modes.indexOf(this.repeatMode);
    this.repeatMode = modes[(idx + 1) % modes.length];
    this.audio.loop = this.repeatMode === "one";
    if (this._onRepeatChange) this._onRepeatChange(this.repeatMode);
  }

  toggleLike(songId) {
    if (this.likedSongs.has(songId)) {
      this.likedSongs.delete(songId);
    } else {
      this.likedSongs.add(songId);
    }
    localStorage.setItem("liked-songs", JSON.stringify([...this.likedSongs]));
    if (this._onLikeChange) this._onLikeChange(songId, this.likedSongs.has(songId));
    return this.likedSongs.has(songId);
  }

  isLiked(songId) {
    return this.likedSongs.has(songId);
  }

  getCurrentTrack() {
    return this.queue[this.currentIndex] || null;
  }

  _loadTrack(index) {
    if (index < 0 || index >= this.queue.length) return;
    const track = this.queue[index];
    this.audio.src = track.src;
    this.audio.load();
    this.audio.play().then(() => {
      this.isPlaying = true;
      if (this._onTrackChange) this._onTrackChange(track, index);
      if (this._onPlayStateChange) this._onPlayStateChange(true);
    }).catch(() => {
      this.isPlaying = false;
      if (this._onPlayStateChange) this._onPlayStateChange(false);
    });
  }

  _togglePlay() {
    if (this.queue.length === 0) return;
    if (this.audio.paused) {
      this.audio.play().then(() => {
        this.isPlaying = true;
        if (this._onPlayStateChange) this._onPlayStateChange(true);
      }).catch(() => {});
    } else {
      this.audio.pause();
      this.isPlaying = false;
      if (this._onPlayStateChange) this._onPlayStateChange(false);
    }
  }

  _onTimeUpdate() {
    if (this._onProgress) {
      this._onProgress(this.audio.currentTime, this.audio.duration || 0);
    }
  }

  _onEnded() {
    if (this.repeatMode === "one") {
      this.audio.currentTime = 0;
      this.audio.play().catch(() => {});
      return;
    }
    if (this.queue.length === 0) return;
    let nextIdx;
    if (this.isShuffled) {
      const currentShuffleIdx = this.shuffleOrder.indexOf(this.currentIndex);
      nextIdx = this.shuffleOrder[(currentShuffleIdx + 1) % this.queue.length];
    } else {
      nextIdx = (this.currentIndex + 1) % this.queue.length;
    }
    if (this.repeatMode === "none" && nextIdx === 0 && this.currentIndex === this.queue.length - 1) {
      this.isPlaying = false;
      if (this._onPlayStateChange) this._onPlayStateChange(false);
      if (this._onQueueEnd) this._onQueueEnd();
      return;
    }
    this.currentIndex = nextIdx;
    this._loadTrack(nextIdx);
  }

  _onLoadedMeta() {
    if (this._onDuration) {
      this._onDuration(this.audio.duration);
    }
  }

  _onError() {
    console.warn("Audio error:", this.audio.error ? this.audio.error.message : "unknown");
    if (this._onPlayStateChange) this._onPlayStateChange(false);
  }

  _generateShuffle() {
    this.shuffleOrder = this.queue.map((_, i) => i);
    for (let i = this.shuffleOrder.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.shuffleOrder[i], this.shuffleOrder[j]] = [this.shuffleOrder[j], this.shuffleOrder[i]];
    }
    const currentIdx = this.shuffleOrder.indexOf(this.currentIndex);
    if (currentIdx > 0) {
      [this.shuffleOrder[0], this.shuffleOrder[currentIdx]] = [this.shuffleOrder[currentIdx], this.shuffleOrder[0]];
    }
  }

  destroy() {
    this.audio.pause();
    this.audio.src = "";
    this.audio.removeEventListener("timeupdate", () => this._onTimeUpdate());
    this.audio.removeEventListener("ended", () => this._onEnded());
    this.audio.removeEventListener("loadedmetadata", () => this._onLoadedMeta());
    this.audio.removeEventListener("error", () => this._onError());
  }
}
