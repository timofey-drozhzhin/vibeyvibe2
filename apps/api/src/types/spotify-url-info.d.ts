declare module "spotify-url-info" {
  interface SpotifyUrlInfoOptions {
    headers?: Record<string, string>;
  }

  interface SpotifyPreview {
    date: string;
    title: string;
    type: string;
    track: string;
    description: string;
    artist: string;
    image: string;
    audio: string;
    link: string;
    embed: string;
  }

  interface SpotifyRawTrack {
    artist: string;
    duration: number;
    name: string;
    previewUrl?: string;
    uri: string;
  }

  interface SpotifyDetails {
    preview: SpotifyPreview;
    tracks: SpotifyRawTrack[];
  }

  interface SpotifyUrlInfo {
    getData(url: string, opts?: SpotifyUrlInfoOptions): Promise<any>;
    getPreview(url: string, opts?: SpotifyUrlInfoOptions): Promise<SpotifyPreview>;
    getTracks(url: string, opts?: SpotifyUrlInfoOptions): Promise<SpotifyRawTrack[]>;
    getDetails(url: string, opts?: SpotifyUrlInfoOptions): Promise<SpotifyDetails>;
    getLink(data: any): string;
  }

  function spotifyUrlInfo(fetchImpl: typeof fetch): SpotifyUrlInfo;
  export default spotifyUrlInfo;
}
