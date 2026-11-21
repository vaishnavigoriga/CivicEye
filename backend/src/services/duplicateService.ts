import { v4 as uuidv4 } from 'uuid';
import { Complaint, IComplaint } from '../models/Complaint';
import { ENV } from '../config/env';
import { logger } from '../utils/logger';

export interface DuplicateCheckResult {
  isDuplicateSuspect: boolean;
  duplicateGroupId?: string;
  similarityScore?: number;
  matchedComplaintId?: string;
  matchedComplaintTitle?: string;
}

export class DuplicateService {
  /**
   * Tokenize string into unique lowercase words, omitting basic stopwords
   */
  private static tokenize(text: string): Set<string> {
    const stopwords = new Set([
      'the', 'is', 'at', 'which', 'on', 'in', 'a', 'an', 'and', 'or', 'to',
      'of', 'for', 'with', 'near', 'from', 'by', 'it', 'my', 'area', 'road',
      'please', 'fix', 'problem', 'issue', 'complaint'
    ]);

    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopwords.has(w));

    return new Set(words);
  }

  /**
   * Jaccard Similarity index = |A ∩ B| / |A ∪ B|
   */
  static calculateJaccardSimilarity(text1: string, text2: string): number {
    const tokensA = this.tokenize(text1);
    const tokensB = this.tokenize(text2);

    if (tokensA.size === 0 || tokensB.size === 0) return 0;

    let intersection = 0;
    tokensA.forEach((token) => {
      if (tokensB.has(token)) intersection++;
    });

    const union = tokensA.size + tokensB.size - intersection;
    return union > 0 ? intersection / union : 0;
  }

  /**
   * Geo-spatial (500m 2dsphere) + Text similarity duplicate grouping
   */
  static async checkAndGroupDuplicates(
    lng: number,
    lat: number,
    category: string,
    title: string,
    description: string,
    excludeComplaintId?: string
  ): Promise<DuplicateCheckResult> {
    try {
      const lookbackDate = new Date();
      lookbackDate.setDate(lookbackDate.getDate() - ENV.DUPLICATE_LOOKBACK_DAYS);

      // 1. Geospatial 500m radius query via MongoDB 2dsphere index
      const query: any = {
        'location.geo': {
          $nearSphere: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat],
            },
            $maxDistance: ENV.DUPLICATE_RADIUS_METRES, // Default 500 meters
          },
        },
        category,
        status: { $nin: ['resolved', 'rejected'] },
        createdAt: { $gte: lookbackDate },
      };

      if (excludeComplaintId) {
        query._id = { $ne: excludeComplaintId };
      }

      const nearbyComplaints = await Complaint.find(query).limit(10);

      const incomingCombinedText = `${title} ${description}`;
      let highestSimilarity = 0;
      let closestMatch: IComplaint | null = null;

      // 2. Check Jaccard word similarity against nearby complaints
      for (const candidate of nearbyComplaints) {
        const candidateText = `${candidate.title} ${candidate.description}`;
        const score = this.calculateJaccardSimilarity(incomingCombinedText, candidateText);

        if (score > highestSimilarity) {
          highestSimilarity = score;
          closestMatch = candidate;
        }
      }

      // Check if threshold met
      if (closestMatch && highestSimilarity >= ENV.DUPLICATE_JACCARD_THRESHOLD) {
        logger.info(
          `Suspected duplicate detected! Similarity: ${(highestSimilarity * 100).toFixed(1)}% with complaint ${closestMatch._id}`
        );

        // Group together: use existing groupId or generate a new group UUID
        let groupId = closestMatch.duplicateGroupId;
        if (!groupId) {
          groupId = uuidv4();
          closestMatch.duplicateGroupId = groupId;
          await closestMatch.save();
        }

        return {
          isDuplicateSuspect: true,
          duplicateGroupId: groupId,
          similarityScore: parseFloat(highestSimilarity.toFixed(2)),
          matchedComplaintId: (closestMatch._id as any).toString(),
          matchedComplaintTitle: closestMatch.title,
        };
      }

      return {
        isDuplicateSuspect: false,
      };
    } catch (err: any) {
      logger.warn(`Duplicate check error (continuing without blocking): ${err.message}`);
      return { isDuplicateSuspect: false };
    }
  }
}
