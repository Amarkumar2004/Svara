class PlaylistManager {
  constructor() {
    this.playlists = this._load();
  }

  _load() {
    try {
      const data = localStorage.getItem("playlists");
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  }

  _save() {
    localStorage.setItem("playlists", JSON.stringify(this.playlists));
  }

  getPlaylists() {
    return this.playlists;
  }

  getPlaylist(id) {
    return this.playlists.find((p) => p.id === id) || null;
  }

  createPlaylist(name) {
    const id = "pl_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
    const playlist = {
      id,
      name: name || `Playlist ${this.playlists.length + 1}`,
      songs: [],
      createdAt: Date.now(),
    };
    this.playlists.push(playlist);
    this._save();
    return playlist;
  }

  deletePlaylist(id) {
    this.playlists = this.playlists.filter((p) => p.id !== id);
    this._save();
  }

  addSong(playlistId, song) {
    const pl = this.getPlaylist(playlistId);
    if (!pl) return false;
    if (pl.songs.some((s) => s.id === song.id)) return false;
    pl.songs.push({ ...song });
    this._save();
    return true;
  }

  removeSong(playlistId, songId) {
    const pl = this.getPlaylist(playlistId);
    if (!pl) return false;
    pl.songs = pl.songs.filter((s) => s.id !== songId);
    this._save();
    return true;
  }

  getOrCreateDefault() {
    if (this.playlists.length === 0) {
      return this.createPlaylist("My Playlist");
    }
    return this.playlists[0];
  }
}
