import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { ENV } from '../config/env';
import { ComplaintCategory } from '../models/Complaint';
import { logger } from '../utils/logger';

export interface AIAnalysisResult {
  category: ComplaintCategory;
  aiSeverityRating: number;
  tags: string[];
  summary: string;
  detectedLanguage: 'en' | 'te' | 'hi';
  isSimulated: boolean;
  source: 'gemini' | 'mock';
  department: string;
  severityFactors: {
    safetyRisk: 'low' | 'medium' | 'high' | 'critical';
    affectedPopulation: 'individual' | 'street' | 'neighbourhood' | 'ward';
    infrastructureDamage: 'cosmetic' | 'moderate' | 'severe' | 'collapsed';
    publicHealthRisk: boolean;
  };
  suggestedActions: string[];
  confidence: number;
}

export interface ImageAnalysisResult {
  category: ComplaintCategory;
  description: string;
  evidenceStrength: 'low' | 'medium' | 'high' | 'strong';
  severity: number;
  confidence: number;
  suggestedDepartment: string;
  isSimulated: boolean;
  source: 'gemini' | 'mock';
}

const aiResponseSchema = z.object({
  category: z.enum([
    'Roads',
    'Drainage',
    'Electricity',
    'Water Supply',
    'Sanitation',
    'Street Lights',
    'Parks',
    'Other',
  ]),
  aiSeverityRating: z.number().int().min(1).max(10),
  tags: z.array(z.string()).min(1).max(5),
  summary: z.string().min(3),
  detectedLanguage: z.enum(['en', 'te', 'hi']).default('en'),
  department: z.string().optional(),
  severityFactors: z
    .object({
      safetyRisk: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
      affectedPopulation: z.enum(['individual', 'street', 'neighbourhood', 'ward']).default('street'),
      infrastructureDamage: z.enum(['cosmetic', 'moderate', 'severe', 'collapsed']).default('moderate'),
      publicHealthRisk: z.boolean().default(false),
    })
    .optional(),
  suggestedActions: z.array(z.string()).max(3).optional(),
  confidence: z.number().min(0).max(1).optional(),
});

const imageAnalysisSchema = z.object({
  category: z.enum([
    'Roads',
    'Drainage',
    'Electricity',
    'Water Supply',
    'Sanitation',
    'Street Lights',
    'Parks',
    'Other',
  ]),
  description: z.string().min(5),
  evidenceStrength: z.enum(['low', 'medium', 'high', 'strong']).default('medium'),
  severity: z.number().int().min(1).max(10).default(6),
  confidence: z.number().min(0).max(1).default(0.85),
  suggestedDepartment: z.string().default('GHMC-ROADS'),
});

const DEPT_MAP: Record<ComplaintCategory, string> = {
  Roads: 'GHMC-ROADS',
  Drainage: 'GHMC-DRAIN',
  Electricity: 'TSSPDCL-ELEC',
  'Water Supply': 'HMWSSB-WATER',
  Sanitation: 'GHMC-SANITATION',
  'Street Lights': 'GHMC-LIGHT',
  Parks: 'GHMC-PARKS',
  Other: 'GHMC-GENERAL',
};

export class AIService {
  /**
   * Deterministic mock classifier fallback for realistic offline demo
   */
  static mockAnalyze(title: string, description: string): AIAnalysisResult {
    const combined = `${title} ${description}`.toLowerCase();

    let category: ComplaintCategory = 'Other';
    let aiSeverityRating = 5;
    let tags = ['civic-issue'];
    let detectedLanguage: 'en' | 'te' | 'hi' = 'en';

    // Simple language hint detection
    if (/[\u0C00-\u0C7F]/.test(combined)) detectedLanguage = 'te'; // Telugu unicode block
    else if (/[\u0900-\u097F]/.test(combined)) detectedLanguage = 'hi'; // Hindi unicode block

    let safetyRisk: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    let affectedPopulation: 'individual' | 'street' | 'neighbourhood' | 'ward' = 'street';
    let infrastructureDamage: 'cosmetic' | 'moderate' | 'severe' | 'collapsed' = 'moderate';
    let publicHealthRisk = false;
    let suggestedActions = ['Dispatch initial inspection team', 'Cordon area if necessary'];

    if (/pothole|road|asphalt|tarmac|crater|flyover|divider|traffic light/i.test(combined)) {
      category = 'Roads';
      aiSeverityRating = 7;
      tags = ['road-hazard', 'pothole', 'traffic-safety'];
      safetyRisk = 'high';
      affectedPopulation = 'neighbourhood';
      infrastructureDamage = 'moderate';
      suggestedActions = ['Deploy cold-mix asphalt patch team', 'Inspect sub-base erosion'];
    } else if (/drain|drainage|sewer|sewage|manhole|overflow|stagnant water|flood/i.test(combined)) {
      category = 'Drainage';
      aiSeverityRating = 8;
      tags = ['sanitation-hazard', 'open-drainage', 'monsoon-risk'];
      safetyRisk = 'critical';
      affectedPopulation = 'neighbourhood';
      infrastructureDamage = 'severe';
      publicHealthRisk = true;
      suggestedActions = ['Desilt stormwater feeder line', 'Secure missing manhole cover'];
    } else if (/water supply|pipeline|no water|contaminated|drinking water|leakage|water tanker/i.test(combined)) {
      category = 'Water Supply';
      aiSeverityRating = 9;
      tags = ['water-crisis', 'essential-service', 'hmwssb'];
      safetyRisk = 'critical';
      affectedPopulation = 'ward';
      infrastructureDamage = 'severe';
      publicHealthRisk = true;
      suggestedActions = ['Isolate damaged distribution valve', 'Arrange interim tanker supply'];
    } else if (/electricity|power cut|wire|transformer|spark|shock|blackout|meter/i.test(combined)) {
      category = 'Electricity';
      aiSeverityRating = 8;
      tags = ['electrical-hazard', 'power-outage', 'tsspdcl'];
      safetyRisk = 'critical';
      affectedPopulation = 'neighbourhood';
      infrastructureDamage = 'moderate';
      suggestedActions = ['De-energize hanging cable segment', 'Replace faulty line insulator'];
    } else if (/garbage|dump|trash|waste|smell|stench|cleaning|litter/i.test(combined)) {
      category = 'Sanitation';
      aiSeverityRating = 7;
      tags = ['solid-waste', 'hygiene', 'ghmc-sanitation'];
      safetyRisk = 'medium';
      affectedPopulation = 'street';
      infrastructureDamage = 'cosmetic';
      publicHealthRisk = true;
      suggestedActions = ['Route secondary compacting vehicle', 'Sanitize bin perimeter'];
    } else if (/street light|dark|lamp post|no light|bulb/i.test(combined)) {
      category = 'Street Lights';
      aiSeverityRating = 5;
      tags = ['night-safety', 'street-lighting'];
      safetyRisk = 'medium';
      affectedPopulation = 'street';
      infrastructureDamage = 'moderate';
      suggestedActions = ['Test feeder pillar breaker', 'Replace blown LED fixture'];
    } else if (/park|tree|garden|bench|playground|encroachment/i.test(combined)) {
      category = 'Parks';
      aiSeverityRating = 4;
      tags = ['public-park', 'horticulture'];
      safetyRisk = 'low';
      affectedPopulation = 'neighbourhood';
      infrastructureDamage = 'cosmetic';
      suggestedActions = ['Schedule horticulture trim crew', 'Restore playground hardware'];
    }

    const summary = `${category} issue reported: ${title.trim().slice(0, 100)}`;

    return {
      category,
      aiSeverityRating,
      tags,
      summary,
      detectedLanguage,
      isSimulated: true,
      source: 'mock',
      department: DEPT_MAP[category],
      severityFactors: {
        safetyRisk,
        affectedPopulation,
        infrastructureDamage,
        publicHealthRisk,
      },
      suggestedActions,
      confidence: 0.88,
    };
  }

  /**
   * Deterministic mock image analyzer fallback
   */
  static mockAnalyzeImage(filename?: string): ImageAnalysisResult {
    const fn = (filename || '').toLowerCase();
    let category: ComplaintCategory = 'Roads';
    let description = 'Visual inspection shows physical damage to municipal surface infrastructure.';
    let evidenceStrength: 'low' | 'medium' | 'high' | 'strong' = 'high';
    let severity = 7;

    if (/drain|sewer|water/i.test(fn)) {
      category = 'Drainage';
      description = 'Image captures overflowing urban drain with visible stagnant water accumulation.';
      evidenceStrength = 'strong';
      severity = 8;
    } else if (/wire|light|elec/i.test(fn)) {
      category = 'Electricity';
      description = 'Image shows loose overhead electrical lines near pedestrian pathway.';
      evidenceStrength = 'strong';
      severity = 8;
    } else if (/garbage|waste|dump/i.test(fn)) {
      category = 'Sanitation';
      description = 'Image depicts uncollected solid municipal waste overflowing onto pavement.';
      evidenceStrength = 'high';
      severity = 7;
    }

    return {
      category,
      description,
      evidenceStrength,
      severity,
      confidence: 0.82,
      suggestedDepartment: DEPT_MAP[category],
      isSimulated: true,
      source: 'mock',
    };
  }

  /**
   * Gemini 1.5 Flash analysis with 10s timeout, Zod validation, and automatic mock fallback
   */
  static async analyzeComplaint(
    title: string,
    description: string,
    imageBuffer?: Buffer,
    imageMimeType?: string
  ): Promise<AIAnalysisResult> {
    // If no GEMINI_API_KEY is configured, gracefully use the deterministic mock engine
    if (!ENV.GEMINI_API_KEY || ENV.GEMINI_API_KEY.trim() === '' || ENV.GEMINI_API_KEY.includes('your_gemini_api_key')) {
      logger.info('No valid GEMINI_API_KEY provided. Running in deterministic Simulated AI demo mode.');
      return this.mockAnalyze(title, description);
    }

    try {
      const genAI = new GoogleGenerativeAI(ENV.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `You are an expert civic infrastructure grievance analyst for the Greater Hyderabad Municipal Corporation (GHMC) and Telangana utility authorities (TSSPDCL, HMWSSB).
Analyze the following citizen complaint and provide comprehensive structured classification.
Return ONLY raw, valid JSON with NO markdown code fences or conversational text, strictly adhering to this schema:
{
  "category": "Roads" | "Drainage" | "Electricity" | "Water Supply" | "Sanitation" | "Street Lights" | "Parks" | "Other",
  "aiSeverityRating": integer between 1 and 10 representing physical urgency and hazard level,
  "tags": array of 2 to 4 concise lowercase tags,
  "summary": concise 1-sentence English overview of the issue,
  "detectedLanguage": "en" | "te" | "hi",
  "department": "GHMC-ROADS" | "GHMC-DRAIN" | "TSSPDCL-ELEC" | "HMWSSB-WATER" | "GHMC-SANITATION" | "GHMC-LIGHT" | "GHMC-PARKS" | "GHMC-GENERAL",
  "severityFactors": {
    "safetyRisk": "low" | "medium" | "high" | "critical",
    "affectedPopulation": "individual" | "street" | "neighbourhood" | "ward",
    "infrastructureDamage": "cosmetic" | "moderate" | "severe" | "collapsed",
    "publicHealthRisk": boolean
  },
  "suggestedActions": array of 1 to 3 practical dispatch actions for the department,
  "confidence": float between 0.50 and 1.00
}

Complaint Title: ${title}
Complaint Description: ${description}`;

      const contents: any[] = [prompt];

      if (imageBuffer && imageMimeType) {
        contents.push({
          inlineData: {
            data: imageBuffer.toString('base64'),
            mimeType: imageMimeType,
          },
        });
      }

      // 10 second timeout promise
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API call timed out after 10000ms')), 10000)
      );

      const apiCall = model.generateContent(contents);
      const result: any = await Promise.race([apiCall, timeoutPromise]);
      const responseText = result.response.text();

      // Clean possible markdown code fence wrappers
      const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsedRaw = JSON.parse(cleanJson);

      const validated = aiResponseSchema.parse(parsedRaw);

      const category = validated.category;
      const dept = validated.department || DEPT_MAP[category];

      return {
        category,
        aiSeverityRating: validated.aiSeverityRating,
        tags: validated.tags,
        summary: validated.summary,
        detectedLanguage: validated.detectedLanguage,
        isSimulated: false,
        source: 'gemini',
        department: dept,
        severityFactors: validated.severityFactors || {
          safetyRisk: validated.aiSeverityRating >= 8 ? 'critical' : validated.aiSeverityRating >= 6 ? 'high' : 'medium',
          affectedPopulation: 'street',
          infrastructureDamage: 'moderate',
          publicHealthRisk: category === 'Drainage' || category === 'Water Supply' || category === 'Sanitation',
        },
        suggestedActions: validated.suggestedActions || ['Field inspection assigned to zonal engineer'],
        confidence: validated.confidence || 0.92,
      };
    } catch (err: any) {
      logger.warn(`Gemini analysis failed or timed out: ${err.message}. Falling back to deterministic mock.`);
      return this.mockAnalyze(title, description);
    }
  }

  /**
   * Gemini 1.5 Flash multimodal image pre-analysis
   */
  static async analyzeImage(
    imageBuffer: Buffer,
    imageMimeType: string,
    originalFilename?: string
  ): Promise<ImageAnalysisResult> {
    if (!ENV.GEMINI_API_KEY || ENV.GEMINI_API_KEY.trim() === '' || ENV.GEMINI_API_KEY.includes('your_gemini_api_key')) {
      logger.info('Running image analysis in deterministic Simulated AI demo mode.');
      return this.mockAnalyzeImage(originalFilename);
    }

    try {
      const genAI = new GoogleGenerativeAI(ENV.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `Analyze this civic issue photograph taken by a citizen in Hyderabad.
Identify the civic infrastructure defect (e.g., pothole, blocked drain, leaking pipeline, dangling wire, garbage dump).
Return ONLY valid JSON matching this schema:
{
  "category": "Roads" | "Drainage" | "Electricity" | "Water Supply" | "Sanitation" | "Street Lights" | "Parks" | "Other",
  "description": "objective 1-2 sentence description of visible defect and hazard",
  "evidenceStrength": "low" | "medium" | "high" | "strong",
  "severity": integer between 1 and 10,
  "confidence": float between 0.50 and 1.00,
  "suggestedDepartment": "GHMC-ROADS" | "GHMC-DRAIN" | "TSSPDCL-ELEC" | "HMWSSB-WATER" | "GHMC-SANITATION" | "GHMC-LIGHT" | "GHMC-PARKS" | "GHMC-GENERAL"
}`;

      const contents = [
        prompt,
        {
          inlineData: {
            data: imageBuffer.toString('base64'),
            mimeType: imageMimeType,
          },
        },
      ];

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Image analysis timed out after 10000ms')), 10000)
      );

      const apiCall = model.generateContent(contents);
      const result: any = await Promise.race([apiCall, timeoutPromise]);
      const responseText = result.response.text();

      const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      const validated = imageAnalysisSchema.parse(parsed);

      return {
        category: validated.category,
        description: validated.description,
        evidenceStrength: validated.evidenceStrength,
        severity: validated.severity,
        confidence: validated.confidence,
        suggestedDepartment: validated.suggestedDepartment || DEPT_MAP[validated.category],
        isSimulated: false,
        source: 'gemini',
      };
    } catch (err: any) {
      logger.warn(`Gemini image analysis error: ${err.message}. Using mock.`);
      return this.mockAnalyzeImage(originalFilename);
    }
  }
}
