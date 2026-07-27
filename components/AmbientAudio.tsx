"use client";

import { useEffect, useRef, useState } from "react";

// Opt-in ambient background audio toggle. Off by default (respects browser
// autoplay policies and user consent) — clicking the speaker icon starts a
// looping track. Expects an mp3 at /public/audio/theme.mp3; drop your own
// royalty-free track there (e.g. from Pixabay Music, YouTube Audio Library,
// or Free Music Archive) and it works immediately, no code changes needed.
const AUDIO_SRC = "/audio/theme.mp3";

export default function AmbientAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.4);
  const [volumeOpen, setVolumeOpen] = useState(false);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    try {
      await audio.play();
      setPlaying(true);
    } catch {
      // Blocked by browser autoplay policy, or file missing/unplayable
      setMissing(true);
    }
  };

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
        onClick={toggle}
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
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-24 accent-[#d4b36a]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
