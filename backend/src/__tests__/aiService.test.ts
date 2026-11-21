import { AIService } from '../services/aiService';

describe('AIService (Deterministic Mock Classifier Fallback)', () => {
  it('should classify pothole grievance as Roads with simulated badge', () => {
    const result = AIService.mockAnalyze(
      'Deep pothole on jubilee hills road 36',
      'The crater is breaking vehicle suspensions'
    );

    expect(result.category).toBe('Roads');
    expect(result.aiSeverityRating).toBe(7);
    expect(result.isSimulated).toBe(true);
    expect(result.source).toBe('mock');
  });

  it('should classify water logging and sewer as Drainage', () => {
    const result = AIService.mockAnalyze(
      'Sewage manhole overflowing',
      'Stagnant dirty drain water on the pedestrian walk'
    );

    expect(result.category).toBe('Drainage');
    expect(result.aiSeverityRating).toBe(8);
  });

  it('should classify live hanging wire as Electricity', () => {
    const result = AIService.mockAnalyze(
      'Dangerous wire hanging near school',
      'Sparks from transformer and power cut'
    );

    expect(result.category).toBe('Electricity');
    expect(result.aiSeverityRating).toBe(8);
  });

  it('should detect Telugu unicode script language hint', () => {
    const result = AIService.mockAnalyze(
      'రోడ్డుపై పెద్ద గుంత ఉంది',
      'ప్రమాదం జరిగే అవకాశం ఉంది'
    );

    expect(result.detectedLanguage).toBe('te');
  });
});
