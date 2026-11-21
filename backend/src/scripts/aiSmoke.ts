/**
 * Live check of every Gemini-backed feature using the real service code and your real GEMINI_API_KEY.
 *   npm run ai:smoke
 * The key is never printed. Each step prints OK / FAIL with timing.
 */
import { ENV } from '../config/env';
import { AIService } from '../services/aiService';
import { TranscriptionService } from '../services/transcriptionService';
import { speak, translate } from '../services/speechService';

const PIXEL_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

const step = async (name: string, fn: () => Promise<string>) => {
  const t = Date.now();
  try {
    const out = await fn();
    console.log(`OK   ${name} (${Date.now() - t} ms): ${out}`);
    return true;
  } catch (e: any) {
    console.log(`FAIL ${name} (${Date.now() - t} ms): ${String(e?.message ?? e).slice(0, 200)}`);
    return false;
  }
};

(async () => {
  if (!AIService.isConfigured()) {
    console.log('GEMINI_API_KEY is not set: the app runs in simulated demo mode. Nothing to check.');
    return;
  }
  console.log(`Models: analysis=${ENV.GEMINI_MODEL}  transcription=${ENV.GEMINI_TRANSCRIBE_MODEL}  speech=${ENV.GEMINI_TTS_MODEL}`);
  const results: boolean[] = [];

  results.push(
    await step('analysis (text)', async () => {
      const r = await AIService.analyze({ description: 'A live electrical wire is hanging low across the footpath near the school.' });
      if (r.status !== 'ok') throw new Error(`status ${r.status}: ${r.explanation}`);
      return `${r.category} / ${r.suggestedPriority} / ${r.suggestedDepartment} (live, not simulated)`;
    }),
  );
  results.push(
    await step('analysis (text + image)', async () => {
      const r = await AIService.analyze({ description: 'Please look at the photo: large pothole on our road.', image: { buffer: PIXEL_PNG, mime: 'image/png' } });
      if (r.status !== 'ok') throw new Error(`status ${r.status}`);
      return `${r.category} / ${r.suggestedPriority}`;
    }),
  );

  const phrases: Record<string, string> = {
    en: 'There is a big pothole on the main road near the bus stop.',
    te: 'బస్ స్టాప్ దగ్గర ప్రధాన రోడ్డుపై పెద్ద గుంత ఉంది.',
    hi: 'बस स्टॉप के पास मुख्य सड़क पर बड़ा गड्ढा है।',
  };
  for (const [lang, phrase] of Object.entries(phrases)) {
    let wav: Buffer | null = null;
    results.push(await step(`text-to-speech (${lang})`, async () => { wav = await speak(phrase); return `${wav.length} bytes WAV`; }));
    if (wav) {
      const audio: Buffer = wav;
      results.push(await step(`transcription (${lang}, round trip)`, async () => {
        const r = await TranscriptionService.transcribe(audio, 'audio/wav');
        if (r.source !== 'gemini' || !r.text) throw new Error('no transcript');
        return `"${r.text}" -> language ${r.language}`;
      }));
    }
  }
  results.push(await step('translation (te -> en)', async () => `"${await translate(phrases.te, 'en')}"`));

  const failed = results.filter((r) => !r).length;
  console.log(failed ? `\n${failed} check(s) failed.` : '\nAll Gemini checks passed.');
  process.exit(failed ? 1 : 0);
})();
