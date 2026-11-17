import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, Music, Trash2, ExternalLink, AlertCircle } from 'lucide-react';
import { Modal, SegmentedTabs, TextField, PillButton, Slider } from '@/components/ui';
import { parseEmbedUrl, type EmbedInfo } from '@/features/audio/embeds';
import { ambientEngine } from '@/features/audio/ambient/engine';
import { FileLayerSource } from '@/features/audio/ambient/sources/fileLayer';
import { useAmbientStore } from '@/features/audio/ambient/store';
import { primeAudioContext } from '@/features/audio/chime';

export interface OwnMusicSheetProps {
  open: boolean;
  onClose: () => void;
}

const EMBED_STORAGE_KEY = 'purrfocus:ambient:embed:v1';
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

export const OwnMusicSheet: React.FC<OwnMusicSheetProps> = ({ open, onClose }) => {
  const [activeTab, setActiveTab] = useState<'file' | 'embed'>('file');

  // Ambient store
  const levels = useAmbientStore(state => state.levels);
  const setLevel = useAmbientStore(state => state.setLevel);

  // File upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileMeta, setFileMeta] = useState<{ name: string; size: number } | null>(() => {
    const existing = ambientEngine.getSource('custom-file');
    if (existing && existing instanceof FileLayerSource) {
      return { name: existing.displayName, size: 0 };
    }
    return null;
  });
  const [fileError, setFileError] = useState<string | null>(null);

  // Web embed state
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [embedInfo, setEmbedInfo] = useState<EmbedInfo | null>(() => {
    try {
      const stored = localStorage.getItem(EMBED_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as EmbedInfo;
      }
    } catch {
      // Ignore storage errors
    }
    return null;
  });

  // Check on open if source is still registered in ambientEngine
  useEffect(() => {
    if (open) {
      const existing = ambientEngine.getSource('custom-file');
      if (existing && existing instanceof FileLayerSource) {
        setFileMeta(prev => prev ?? { name: existing.displayName, size: 0 });
      } else {
        setFileMeta(null);
      }
    }
  }, [open]);

  // Handle local file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileError('File exceeds 50MB limit. Please choose a smaller track.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      // Unregister and revoke any previous custom file
      ambientEngine.unregisterSource('custom-file');

      const objectUrl = URL.createObjectURL(file);
      const source = new FileLayerSource('custom-file', objectUrl, file.name);
      ambientEngine.registerSource(source);

      primeAudioContext();
      ambientEngine.startEngine();
      setLevel('custom-file', 0.8, true);

      setFileMeta({ name: file.name, size: file.size });
    } catch {
      setFileError('Could not load audio file. Please try another format.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle removing local file
  const handleRemoveFile = () => {
    ambientEngine.unregisterSource('custom-file');
    setLevel('custom-file', 0);
    setFileMeta(null);
    setFileError(null);
  };

  // Handle embed link submit
  const handleLoadEmbed = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setUrlError(null);

    const res = parseEmbedUrl(urlInput);
    if (!res.valid || !res.info) {
      setUrlError(res.error || 'Invalid link.');
      return;
    }

    setEmbedInfo(res.info);
    setUrlInput('');
    try {
      localStorage.setItem(EMBED_STORAGE_KEY, JSON.stringify(res.info));
    } catch {
      // Ignore localStorage write error
    }
  };

  // Handle removing embed player
  const handleRemoveEmbed = () => {
    setEmbedInfo(null);
    setUrlError(null);
    try {
      localStorage.removeItem(EMBED_STORAGE_KEY);
    } catch {
      // Ignore
    }
  };

  const customLevel = levels['custom-file'] ?? 0.8;
  const customPercent = Math.round(customLevel * 100);

  return (
    <Modal
      open={open}
      onClose={onClose}
      variant="bottom"
      title="Your Own Music"
      className="max-w-md mx-auto"
    >
      <div className="space-y-5">
        {/* Navigation Tabs */}
        <SegmentedTabs
          value={activeTab}
          onChange={setActiveTab}
          options={[
            { value: 'file', label: 'Audio file' },
            { value: 'embed', label: 'Web player' },
          ]}
        />

        {/* Tab 1: Local Audio File */}
        {activeTab === 'file' && (
          <div className="space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              accept="audio/*"
              onChange={handleFileChange}
              className="hidden"
              data-testid="audio-file-input"
              aria-label="Upload audio file"
            />

            {fileError && (
              <div
                role="alert"
                className="flex items-center gap-2 p-2.5 rounded-tile glass text-danger text-small"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{fileError}</span>
              </div>
            )}

            {fileMeta ? (
              <div className="glass rounded-tile p-4 space-y-4 border border-glass-border">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="p-2 rounded-pill glass text-accent shrink-0">
                      <Music className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-sans text-small font-medium text-ink-900 truncate">
                        {fileMeta.name}
                      </p>
                      {fileMeta.size > 0 && (
                        <p className="text-micro text-ink-500">
                          {(fileMeta.size / (1024 * 1024)).toFixed(1)} MB · In ambient mix
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    aria-label="Remove audio file"
                    className="p-1.5 text-ink-500 hover:text-danger rounded-pill transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Volume slider for custom file */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-micro text-ink-700">
                    <span>File volume</span>
                    <span className="font-mono">{customPercent}%</span>
                  </div>
                  <Slider
                    value={customLevel}
                    min={0}
                    max={1}
                    step={0.01}
                    aria-label="Custom audio volume"
                    aria-valuetext={`${customPercent}%`}
                    onChange={val => setLevel('custom-file', val, true)}
                  />
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-glass-border/40 text-micro text-ink-500">
                  <span>Kept for this session only</span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-accent hover:underline font-medium"
                  >
                    Replace track
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label="Upload an audio file from your computer"
                className="group border border-dashed border-glass-border/80 hover:border-accent/60 glass rounded-tile p-6 text-center cursor-pointer transition-all flex flex-col items-center gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              >
                <div className="p-3 rounded-pill glass text-accent group-hover:scale-105 transition-transform">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-serif text-title text-ink-900 mb-0.5">
                    Choose an audio file
                  </p>
                  <p className="text-micro text-ink-500">
                    MP3, WAV, OGG, or FLAC up to 50MB
                  </p>
                </div>
                <PillButton
                  variant="glass"
                  size="sm"
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  Browse files
                </PillButton>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Embedded Music Player */}
        {activeTab === 'embed' && (
          <div className="space-y-4">
            <form onSubmit={handleLoadEmbed} className="space-y-3">
              <TextField
                label="Music link"
                placeholder="https://youtube.com/..., spotify.com/..."
                value={urlInput}
                onChange={setUrlInput}
                error={urlError ?? undefined}
                helperText="YouTube, Spotify, or SoundCloud link"
                trailingAction={
                  <PillButton
                    variant="primary"
                    size="sm"
                    type="submit"
                    className="h-8 px-3 text-micro"
                  >
                    Load
                  </PillButton>
                }
              />
            </form>

            {embedInfo ? (
              <div className="space-y-2.5">
                <div className="relative overflow-hidden rounded-tile border border-glass-border glass">
                  <iframe
                    src={embedInfo.embedUrl}
                    title={embedInfo.title}
                    loading="lazy"
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
                    sandbox="allow-scripts allow-presentation allow-popups"
                    className="w-full h-44 rounded-tile bg-ink-900/5"
                  />
                </div>

                <div className="flex items-center justify-between text-micro text-ink-500">
                  <span className="flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" />
                    Plays in its own player · volume is set there
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveEmbed}
                    className="text-danger hover:underline font-medium"
                  >
                    Remove player
                  </button>
                </div>
              </div>
            ) : (
              <div className="glass rounded-tile p-4 text-center text-micro text-ink-500 border border-glass-border">
                Paste any YouTube lo-fi stream, Spotify playlist, or SoundCloud track above to embed it right in your study space.
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
