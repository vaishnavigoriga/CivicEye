import React, { useState } from 'react';
import { Mic, Square } from 'lucide-react';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { complaintsApi } from '../api/complaintsApi';
import { useLanguage } from '../contexts/LanguageContext';
import { fmt } from '../i18n';
import { errorMessage } from '../utils/errorMessage';
import { Button } from './ui/Button';
import { TextArea } from './ui/Field';

interface VoicePanelProps {
  /** Called when the user accepts the (possibly edited) transcription. `edited` is true if they changed it. */
  onAccept: (text: string, audio: Blob, edited: boolean) => void;
  onClose: () => void;
}

/**
 * Records audio, sends it to the backend for transcription, and lets the user edit the text before using it.
 * If transcription is unavailable it says so; nothing is faked.
 */
export const VoicePanel: React.FC<VoicePanelProps> = ({ onAccept, onClose }) => {
  const { t } = useLanguage();
  const rec = useVoiceRecorder();
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState('');
  const [original, setOriginal] = useState('');
  const [unavailable, setUnavailable] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const transcribe = async () => {
    if (!rec.audioBlob) return;
    setBusy(true);
    setUnavailable(null);
    try {
      const result = await complaintsApi.transcribe(rec.audioBlob);
      if (result.available && result.noSpeech) {
        setUnavailable(t.report.voiceNoSpeech);
      } else if (result.available && result.text) {
        setText(result.text);
        setOriginal(result.text);
      } else {
        setUnavailable(t.report.voiceUnavailable);
      }
    } catch (e) {
      setUnavailable(errorMessage(e, t));
    } finally {
      setBusy(false);
      setDone(true);
    }
  };

  return (
    <div className="rounded-lg border border-slate-300 bg-white p-4 space-y-3" role="group" aria-label={t.report.voiceTitle}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{t.report.voiceTitle}</h3>
        <button type="button" onClick={onClose} className="text-sm text-slate-600 hover:underline">
          {t.common.close}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {!rec.isRecording ? (
          <Button type="button" variant="outline" leftIcon={<Mic className="w-4 h-4" />} onClick={rec.startRecording}>
            {t.report.voiceStart}
          </Button>
        ) : (
          <Button type="button" variant="danger" leftIcon={<Square className="w-4 h-4" />} onClick={rec.stopRecording}>
            {t.report.voiceStop}
          </Button>
        )}
        {rec.isRecording && (
          <span className="text-sm text-rose-700 tabular-nums" aria-live="polite">
            {fmt(t.report.voiceRecording, { s: rec.recordingTime })}
          </span>
        )}
      </div>

      {rec.error && <p className="text-sm text-rose-700" role="alert">{t.report.voiceMicDenied}</p>}

      {rec.audioUrl && !rec.isRecording && (
        <div className="space-y-3">
          <audio controls src={rec.audioUrl} className="w-full" />
          {!done && (
            <Button type="button" onClick={transcribe} isLoading={busy}>
              {busy ? t.report.voiceTranscribing : t.report.voiceTranscribe}
            </Button>
          )}
        </div>
      )}

      {done && unavailable && (
        <p className="text-sm text-amber-900 bg-amber-50 border border-amber-300 rounded p-2" role="alert">
          {unavailable}
        </p>
      )}

      {done && !unavailable && <TextArea label={t.report.voiceEdit} rows={4} value={text} onChange={(e) => setText(e.target.value)} />}

      {rec.audioBlob && done && (
        <Button
          type="button"
          onClick={() => onAccept(unavailable ? '' : text.trim(), rec.audioBlob!, text.trim() !== original.trim())}
          disabled={!unavailable && text.trim().length === 0}
        >
          {unavailable ? t.report.voiceAttached : t.report.voiceUse}
        </Button>
      )}
    </div>
  );
};
