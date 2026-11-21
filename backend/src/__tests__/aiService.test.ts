import { AIService } from '../services/aiService';
import { detectFileType } from '../utils/fileType';

describe('simulated AI analyser (Phase 4)', () => {
  it('is always flagged simulated and never claims to be live', () => {
    const r = AIService.simulate('There is a large pothole on the road', false);
    expect(r.isSimulated).toBe(true);
    expect(r.category).toBe('Roads');
    expect(r.explanation).toMatch(/simulated/i);
  });
  it('recognises exposed wires and waterlogging', () => {
    expect(AIService.simulate('live wire hanging near the footpath', false).category).toBe('Electricity');
    expect(AIService.simulate('road is flooded and waterlogged after rain', false).category).toBe('Waterlogging');
  });
  it('falls back to Other with low confidence', () => {
    const r = AIService.simulate('something odd', false);
    expect(r.category).toBe('Other');
    expect(r.confidence).toBeLessThan(0.5);
  });
});

describe('file type detection by content', () => {
  const pad = Buffer.alloc(32);
  it('accepts real signatures', () => {
    expect(detectFileType(Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), pad]))?.kind).toBe('image');
    expect(detectFileType(Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), pad]))?.mime).toBe('image/png');
    expect(detectFileType(Buffer.concat([Buffer.from([0x1a, 0x45, 0xdf, 0xa3]), pad]))?.kind).toBe('audio');
  });
  it('rejects scripts and executables regardless of file name', () => {
    expect(detectFileType(Buffer.from('<?php echo 1; ?> padding padding'))).toBeNull();
    expect(detectFileType(Buffer.from('MZ padding padding padding padding'))).toBeNull();
  });
});
