# Demo music

Music: **“Summer Adventures” by SergePavkinMusic**, from Pixabay.

- Track page: https://pixabay.com/music/corporate-summer-adventures-115949/
- Licence: **Pixabay Content License** — https://pixabay.com/service/license-summary/
- Source and licence checked on 2026-11-08 against the track page and the licence summary.
- Downloaded MP3 SHA-256: `0abfb7007442c8f10335af1f0262b0b0c9b5ddfa637c5aacafe69c00a14ed31c`.

The licence permits commercial use and editing without attribution, so the website shows no music credit. It does not allow distributing the track on its own: keep it mixed into the video and keep the source MP3 out of this repository.

The track is registered in YouTube Content ID. This does not affect the website. If the video is uploaded to YouTube, a copyright claim can appear there.

## Adaptation in this demo

`assets/infrayard-demo-with-music.mp4` uses the opening 179.267 seconds of the track, with a lower playback level (approximately −25 LUFS), a two-second fade in and a six-second fade out. Audio is encoded as stereo AAC at 48 kHz / 160 kb/s. There is no narration. Original H.264 video packets, timing and dimensions are preserved without re-encoding; `assets/final_hq_infrayard.mp4` remains the original. The MP4 records the source and licence in its comment metadata.

## Rebuilding the audio mix

Download the MP3 from the track page outside published assets, then run:

```sh
python scripts/mix-demo.py --music "/path/to/sergepavkinmusic-summer-adventures-115949.mp3" --ffmpeg "/path/to/ffmpeg"
```

The optional script verifies the source music hash, measures volume, replaces the silent audio stream, preserves video packets, embeds the source note and validates the result. It is not part of the website build and does not publish anything.
