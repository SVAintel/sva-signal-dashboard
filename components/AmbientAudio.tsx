"use client";

import { useEffect, useRef, useState } from "react";

// Opt-in ambient background audio toggle. Off by default (respects browser
// autoplay policies and user consent) — clicking the speaker icon starts a
// looping track. Expects an mp3 at /public/audio/theme.mp3; drop your own
// royalty-free track there (e.g. from Pixabay Music, YouTube Audio Library,
// or Free Music Archive) and it works immediately, no code changes needed.
const AUDIO_SRC = "/audio/theme.mp3";

// Playing/volume are controlled by the parent (Dashboard) so a second,
// mobile-only control (in the Map Controls sheet) can drive the exact same
// underlying <audio> element without mounting a duplicate one — that would
// otherwise double up playback. This component owns the single <audio> tag
// and reacts to the controlled props; the header UI (hover-to-reveal volume
// slider) is unchanged from before.
interface AmbientAudioProps {
  playing: boolean;
  onTogglePlaying: () => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
}

export default function AmbientAudio({ playing, onTogglePlaying, volume, onVolumeChange }: AmbientAudioProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [volumeOpen, setVolumeOpen] = useState(false);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.play().catch(() => setMissing(true));
    } else {
      audio.pause();
    }
  }, [playing]);

  return (
    <div
      className="relative flex items-center"
      onMouseEnter={() => setVolumeOpen(true)}
      onMouseLeave={() => setVolumeOpen(false)}
    >
      <audio
        ref={audioRef}
        src={AUDIO_SRC}
        loop
        onError={() => setMissing(true)}
      />
      <button
        onClick={onTogglePlaying}
        title={missing ? "No ambient track found (public/audio/theme.mp3)" : playing ? "Mute ambient audio" : "Play ambient audio"}
        className={`flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest transition ${
          playing
            ? "border-[#d4b36a] text-[#d4b36a] bg-[#1e1e1e]"
            : "border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300"
        }`}
      >
        <span>{playing ? "\u{1F50A}" : "\u{1F507}"}</span>
        <span className="hidden sm:inline">Ambient</span>
      </button>

      {volumeOpen && (
        <div className="absolute right-0 top-full z-[999] pt-1">
          <div className="rounded border border-[#3a3a3a] bg-[#0e0e0ecc] px-3 py-2 backdrop-blur">
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-24 accent-[#d4b36a]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
