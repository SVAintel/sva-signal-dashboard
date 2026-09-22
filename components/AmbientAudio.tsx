"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import WorkspacePopover from "./WorkspacePopover";

interface AmbientAudioProps {
  playing: boolean;
  onTogglePlaying: () => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
}

export default function AmbientAudio({ playing, onTogglePlaying, volume, onVolumeChange }: AmbientAudioProps) {
  const audio = useRef<HTMLAudioElement>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { if (audio.current) audio.current.volume = volume; }, [volume]);
  useEffect(() => {
    if (!audio.current) return;
    if (!playing) { audio.current.pause(); return; }
    setError("");
    audio.current.play().catch(() => setError("Playback is unavailable. Check your browser's audio permission or try again."));
  }, [playing]);
  return (
    <>
      <audio ref={audio} src="/audio/theme.mp3" preload="none" loop onError={() => setError("The ambient track could not be loaded.")} />
      <WorkspacePopover label="Audio" title="Ambient audio" icon={playing ? <Volume2 size={16} /> : <VolumeX size={16} />} open={open} onOpenChange={setOpen}>
        <div className="ambient-controls">
          <button className="surface-button" onClick={onTogglePlaying} aria-pressed={playing}>{playing ? "Pause ambient audio" : "Play ambient audio"}</button>
          <label>Volume<input aria-label="Ambient volume" type="range" min={0} max={1} step={0.05} value={volume} onChange={(event) => onVolumeChange(Number(event.target.value))} /></label>
          {error && <p role="alert">{error}</p>}
        </div>
      </WorkspacePopover>
    </>
  );
}
