import React, { useState } from 'react';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { complaintsApi } from '../api/complaintsApi';
import { Mic, Square, RotateCcw, Check, Sparkles, AlertCircle, Loader2, Globe, Edit3 } from 'lucide-react';

interface VoiceRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTranscribed: (text: string, audioBlob: Blob) => void;
}

export const VoiceRecorderModal: React.FC<VoiceRecorderModalProps> = ({
  isOpen,
  onClose,
  onTranscribed,
}) => {
  const {
    isRecording,
    audioBlob,
    audioUrl,
    recordingTime,
    startRecording,
    stopRecording,
    resetRecording,
    error: recorderError,
  } = useVoiceRecorder();

  const [selectedLanguage, setSelectedLanguage] = useState<'auto' | 'en' | 'te' | 'hi'>('auto');
  const [transcribing, setTranscribing] = useState(false);
  const [transcriptionMessage, setTranscriptionMessage] = useState<string | null>(null);
  const [transcribedText, setTranscribedText] = useState<string>('');
  const [transcriptionSource, setTranscriptionSource] = useState<'gemini' | 'unavailable' | null>(null);

  if (!isOpen) return null;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProcessAudio = async () => {
    if (!audioBlob) return;
    setTranscribing(true);
    setTranscriptionMessage(null);

    try {
      const result = await complaintsApi.transcribeAudio(audioBlob);

      if (result.source === 'gemini' && result.text) {
        setTranscribedText(result.text);
        setTranscriptionSource('gemini');
        setTranscriptionMessage(null);
      } else {
        setTranscriptionSource('unavailable');
        setTranscriptionMessage(
          result.message ||
            'Voice transcription service is currently in offline mode. Your audio recording has been attached. You may enter additional notes below.'
        );
        setTranscribedText('');
      }
    } catch (err: any) {
      setTranscriptionSource('unavailable');
      setTranscriptionMessage(
        'Voice transcription encountered a network timeout. Your audio file is safely attached. Please enter written details.'
      );
      setTranscribedText('');
    } finally {
      setTranscribing(false);
    }
  };

  const handleConfirmTranscript = () => {
    if (audioBlob) {
      onTranscribed(transcribedText.trim(), audioBlob);
      handleClose();
    }
  };

  const handleClose = () => {
    resetRecording();
    setTranscribedText('');
    setTranscriptionSource(null);
    setTranscriptionMessage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center text-teal-800">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Multilingual Voice Grievance Intake</h3>
              <p className="text-[11px] text-slate-500">Gemini 1.5 Flash Audio Engine • Telugu, Hindi & English</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1"
          >
            ✕
          </button>
        </div>

        <div className="py-5 space-y-4">
          {/* Language Selector */}
          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
              <Globe className="w-3.5 h-3.5 text-civic-700" />
              <span>Spoken Language:</span>
            </div>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value as any)}
              disabled={isRecording || transcribing}
              className="text-xs font-semibold bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-civic-700"
            >
              <option value="auto">🌐 Auto-detect (EN / TE / HI)</option>
              <option value="en">English (భారతీయ ఇంగ్లీష్)</option>
              <option value="te">తెలుగు (Telugu)</option>
              <option value="hi">हिन्दी (Hindi)</option>
            </select>
          </div>

          {/* Recording UI */}
          {!transcribedText && (
            <div className="flex flex-col items-center justify-center py-4">
              <div className="relative mb-4">
                {isRecording && (
                  <div className="absolute inset-0 rounded-full bg-rose-500/20 animate-ping"></div>
                )}
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                    isRecording
                      ? 'bg-rose-500 text-white shadow-lg shadow-rose-200 scale-105'
                      : audioUrl
                      ? 'bg-emerald-50 text-emerald-700 border-2 border-emerald-300'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  <Mic className={`w-8 h-8 ${isRecording ? 'animate-bounce' : ''}`} />
                </div>
              </div>

              <div className="text-xl font-mono font-bold text-slate-800 mb-1">
                {formatTimer(recordingTime)}
              </div>
              <p className="text-xs text-slate-500 mb-4 text-center">
                {isRecording
                  ? 'Listening in English, Telugu, or Hindi... Speak clearly.'
                  : audioUrl
                  ? 'Audio captured. Review preview or submit for AI transcription.'
                  : 'Press the record button below to speak.'}
              </p>

              {recorderError && (
                <div className="mb-4 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-1.5 w-full">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{recorderError}</span>
                </div>
              )}

              {transcriptionMessage && (
                <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2 w-full">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>{transcriptionMessage}</span>
                </div>
              )}

              {audioUrl && (
                <div className="w-full mb-4">
                  <audio src={audioUrl} controls className="w-full h-9 rounded-lg" />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                {!isRecording && !audioUrl && (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-civic-800 hover:bg-civic-900 text-white font-semibold text-xs shadow-md shadow-civic-900/20 transition-all"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    Start Dictation
                  </button>
                )}

                {isRecording && (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-md shadow-rose-200 transition-all"
                  >
                    <Square className="w-3.5 h-3.5" />
                    Stop Recording
                  </button>
                )}

                {audioUrl && !isRecording && (
                  <>
                    <button
                      type="button"
                      onClick={resetRecording}
                      disabled={transcribing}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Re-record
                    </button>

                    <button
                      type="button"
                      onClick={handleProcessAudio}
                      disabled={transcribing}
                      className="flex items-center gap-2 px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs shadow-md shadow-teal-700/20 transition-all disabled:opacity-50"
                    >
                      {transcribing ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Transcribing with Gemini...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          Transcribe with AI
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Transcription Preview & Editing Panel */}
          {transcribedText && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                  <Edit3 className="w-3.5 h-3.5 text-teal-700" />
                  <span>Review & Edit AI Transcription</span>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                  {transcriptionSource === 'gemini' ? 'Gemini 1.5 Flash' : 'Simulated Voice'}
                </span>
              </div>

              <textarea
                rows={4}
                value={transcribedText}
                onChange={(e) => setTranscribedText(e.target.value)}
                className="w-full text-xs text-slate-800 rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-1 focus:ring-civic-700 leading-relaxed font-sans"
                placeholder="Edit transcript if necessary..."
              />

              <p className="text-[11px] text-slate-500">
                Please verify technical names, street numbers or local landmarks before appending to grievance narrative.
              </p>

              {audioUrl && (
                <div className="w-full pt-1">
                  <audio src={audioUrl} controls className="w-full h-8 rounded" />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setTranscribedText('');
                    resetRecording();
                  }}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium"
                >
                  Discard & Re-record
                </button>
                <button
                  type="button"
                  onClick={handleConfirmTranscript}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-civic-800 hover:bg-civic-900 text-white text-xs font-semibold shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  Confirm & Append to Grievance
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Telugu, Hindi, and English voice synthesis supported</span>
          <button onClick={handleClose} className="hover:text-slate-600">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
