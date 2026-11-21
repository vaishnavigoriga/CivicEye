import { Request, Response } from 'express';
import fs from 'fs';
import mongoose from 'mongoose';
import { Complaint, ComplaintCategory, IComplaintMedia, ComplaintDataSource } from '../models/Complaint';
import { Counter, getNextSequence } from '../models/Counter';
import { AIService } from '../services/aiService';
import { SeverityService } from '../services/severityService';
import { DuplicateService } from '../services/duplicateService';
import { StorageService } from '../services/storageService';
import { sendSuccess, sendError } from '../utils/responseHelper';
import { logger } from '../utils/logger';

export class ComplaintController {
  /**
   * Pre-submission image analysis using Gemini 1.5 Flash multimodal vision
   */
  static async analyzeImage(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        sendError(res, 'No image file uploaded for analysis', 400);
        return;
      }

      const imageBuffer = fs.readFileSync(req.file.path);
      const analysis = await AIService.analyzeImage(imageBuffer, req.file.mimetype, req.file.originalname);

      sendSuccess(res, analysis, 'Image analyzed successfully');
    } catch (err: any) {
      logger.error('Error analyzing image:', err);
      sendError(res, err.message || 'Image analysis failed', 500);
    }
  }

  /**
   * Submit new complaint with text, image, voice, AI classification, severity scoring, and duplicate grouping
   */
  static async submitComplaint(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Authentication required to submit complaint', 401);
        return;
      }

      const {
        title,
        description,
        language = 'en',
        address,
        area,
        ward,
        latitude,
        longitude,
        transcribedText,
        transcriptionSource,
      } = req.body;

      if (!title || !description || !address || !area) {
        sendError(res, 'Title, description, address, and area are required fields.', 400);
        return;
      }

      const lat = parseFloat(latitude || '17.3850');
      const lng = parseFloat(longitude || '78.4867');

      if (isNaN(lat) || isNaN(lng)) {
        sendError(res, 'Invalid geographical coordinates provided.', 400);
        return;
      }

      // Process uploaded files (image or audio)
      const mediaList: IComplaintMedia[] = [];
      let imageBuffer: Buffer | undefined;
      let imageMimeType: string | undefined;

      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[] | undefined;

      if (files) {
        const fileArray = Array.isArray(files) ? files : Object.values(files).flat();
        for (const file of fileArray) {
          const isAudio = file.fieldname === 'audio' || file.mimetype.startsWith('audio/');
          const subfolder = isAudio ? 'audio' : 'images';
          const fileUrl = StorageService.getFileUrl(file, subfolder);

          mediaList.push({
            type: isAudio ? 'audio' : 'image',
            url: fileUrl,
            mimeType: file.mimetype,
            uploadedAt: new Date(),
          });

          if (!isAudio && !imageBuffer) {
            try {
              imageBuffer = fs.readFileSync(file.path);
              imageMimeType = file.mimetype;
            } catch (e) {
              logger.warn(`Could not read uploaded image buffer for AI: ${e}`);
            }
          }
        }
      }

      // 1. AI Analysis (Gemini 1.5 Flash with deterministic mock fallback)
      const aiResult = await AIService.analyzeComplaint(title, description, imageBuffer, imageMimeType);

      // 2. Transparent Multi-factor Severity Scoring
      const severity = SeverityService.calculatePriority(
        aiResult.aiSeverityRating,
        aiResult.category,
        0, // 0 initial upvotes
        new Date()
      );

      // 3. 500m GeoSpatial + Jaccard Duplicate Grouping
      const duplicateCheck = await DuplicateService.checkAndGroupDuplicates(
        lng,
        lat,
        aiResult.category,
        title,
        description
      );

      // 4. Generate sequential reference ID (CE-HYD-YYYY-XXXXXX)
      const seq = await getNextSequence('complaints');
      const year = new Date().getFullYear();
      const referenceId = `CE-HYD-${year}-${seq.toString().padStart(6, '0')}`;

      // 5. Create and persist complaint document
      const complaint = new Complaint({
        referenceId,
        citizenId: req.user.id,
        title: title.trim(),
        description: description.trim(),
        language,
        category: aiResult.category,
        location: {
          address: address.trim(),
          area: area.trim(),
          ward: ward?.trim() || 'GHMC Ward',
          geo: {
            type: 'Point',
            coordinates: [lng, lat], // GeoJSON standard: [longitude, latitude]
          },
        },
        media: mediaList,
        transcription: transcribedText
          ? {
              transcribedText,
              transcriptionSource: transcriptionSource || 'gemini',
              language,
            }
          : undefined,
        aiAnalysis: {
          category: aiResult.category,
          aiSeverityRating: aiResult.aiSeverityRating,
          priorityScore: severity.priorityScore,
          tags: aiResult.tags,
          summary: aiResult.summary,
          detectedLanguage: aiResult.detectedLanguage,
          isSimulated: aiResult.isSimulated,
          source: aiResult.source,
          department: aiResult.department,
          severityFactors: aiResult.severityFactors,
          suggestedActions: aiResult.suggestedActions,
          confidence: aiResult.confidence,
          computedAt: new Date(),
        },
        duplicateGroupId: duplicateCheck.duplicateGroupId,
        duplicateStatus: duplicateCheck.isDuplicateSuspect ? 'unreviewed' : 'unreviewed',
        duplicateSimilarityScore: duplicateCheck.similarityScore,
        status: 'pending',
        timeline: [
          {
            status: 'pending',
            note: 'Grievance submitted by citizen and queued for department verification.',
            updatedBy: req.user.id,
            timestamp: new Date(),
          },
        ],
        upvotes: 0,
        upvotedBy: [],
        dataSource: 'CITIZEN_SUBMITTED',
      });

      await complaint.save();

      sendSuccess(
        res,
        {
          complaint,
          severityDetails: severity,
          duplicateNotice: duplicateCheck.isDuplicateSuspect
            ? {
                isSuspect: true,
                message: `Notice: A similar ${aiResult.category} complaint was recently logged within 500 meters. Both reports have been grouped for administrator review.`,
                similarityScore: duplicateCheck.similarityScore,
                matchedComplaintTitle: duplicateCheck.matchedComplaintTitle,
              }
            : null,
        },
        'Complaint submitted successfully',
        201
      );
    } catch (err: any) {
      logger.error('Error submitting complaint:', err);
      sendError(res, err.message || 'Failed to submit complaint', 500);
    }
  }

  /**
   * List public / citizen complaints with search, category, status, area, and dataSource filters
   */
  static async getComplaints(req: Request, res: Response): Promise<void> {
    try {
      const {
        category,
        status,
        area,
        dataSource,
        search,
        page = '1',
        limit = '10',
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      const query: any = {};

      if (category && category !== 'All') {
        query.category = category;
      }
      if (status && status !== 'All') {
        query.status = status;
      }
      if (area && area !== 'All') {
        query['location.area'] = area;
      }
      if (dataSource && dataSource !== 'All') {
        query.dataSource = dataSource;
      }
      if (search) {
        const regex = new RegExp(String(search), 'i');
        query.$or = [
          { referenceId: regex },
          { title: regex },
          { description: regex },
          { 'location.address': regex },
          { 'location.area': regex },
        ];
      }

      const pageNum = parseInt(String(page), 10) || 1;
      const limitNum = parseInt(String(limit), 10) || 10;
      const skip = (pageNum - 1) * limitNum;

      const sortField = String(sortBy) === 'priorityScore' ? 'aiAnalysis.priorityScore' : String(sortBy);
      const sortDirection = sortOrder === 'asc' ? 1 : -1;

      const [complaints, total] = await Promise.all([
        Complaint.find(query)
          .populate('citizenId', 'name email preferredLanguage')
          .populate('department', 'name code')
          .sort({ [sortField]: sortDirection })
          .skip(skip)
          .limit(limitNum),
        Complaint.countDocuments(query),
      ]);

      sendSuccess(res, {
        complaints,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  }

  /**
   * Get complaints filed by the currently logged-in citizen
   */
  static async getMyComplaints(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Authentication required', 401);
        return;
      }

      const complaints = await Complaint.find({ citizenId: req.user.id })
        .populate('department', 'name code')
        .sort({ createdAt: -1 });

      sendSuccess(res, { complaints });
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  }

  /**
   * Get complaints GeoJSON feature collection for Leaflet Map
   * Note: GeoJSON stores [longitude, latitude]. We transform to [latitude, longitude] Leaflet points.
   */
  static async getMapData(req: Request, res: Response): Promise<void> {
    try {
      const { category, status, dataSource } = req.query;
      const query: any = {};

      if (category && category !== 'All') query.category = category;
      if (status && status !== 'All') query.status = status;
      if (dataSource && dataSource !== 'All') query.dataSource = dataSource;

      const complaints = await Complaint.find(query)
        .select('referenceId title category status location aiAnalysis createdAt upvotes dataSource')
        .lean();

      const features = complaints.map((c) => {
        const [lng, lat] = c.location.geo.coordinates;
        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            // Coordinates provided in Leaflet standard format [lat, lng] for direct React-Leaflet usage
            coordinates: [lat, lng],
          },
          properties: {
            id: c._id,
            referenceId: c.referenceId || `CE-HYD-2026-${String(c._id).slice(-6).toUpperCase()}`,
            title: c.title,
            category: c.category,
            status: c.status,
            priorityScore: c.aiAnalysis?.priorityScore || 50,
            aiSeverityRating: c.aiAnalysis?.aiSeverityRating || 5,
            isSimulated: c.aiAnalysis?.isSimulated || false,
            address: c.location.address,
            area: c.location.area,
            upvotes: c.upvotes || 0,
            dataSource: c.dataSource || 'CITIZEN_SUBMITTED',
            createdAt: c.createdAt,
          },
        };
      });

      sendSuccess(res, {
        type: 'FeatureCollection',
        features,
        total: features.length,
      });
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  }

  /**
   * Public aggregated metrics for Recharts visualizations
   */
  static async getAnalyticsSummary(req: Request, res: Response): Promise<void> {
    try {
      const [
        totalCount,
        resolvedCount,
        inProgressCount,
        pendingCount,
        byCategory,
        byStatus,
        byArea,
        byDataSource,
        recentComplaints,
      ] = await Promise.all([
        Complaint.countDocuments(),
        Complaint.countDocuments({ status: 'resolved' }),
        Complaint.countDocuments({ status: 'in-progress' }),
        Complaint.countDocuments({ status: 'pending' }),
        Complaint.aggregate([
          { $group: { _id: '$category', count: { $sum: 1 }, avgScore: { $avg: '$aiAnalysis.priorityScore' } } },
          { $project: { category: '$_id', count: 1, avgScore: { $round: ['$avgScore', 1] }, _id: 0 } },
          { $sort: { count: -1 } },
        ]),
        Complaint.aggregate([
          { $group: { _id: '$status', count: { $sum: 1 } } },
          { $project: { status: '$_id', count: 1, _id: 0 } },
        ]),
        Complaint.aggregate([
          { $group: { _id: '$location.area', count: { $sum: 1 } } },
          { $project: { area: '$_id', count: 1, _id: 0 } },
          { $sort: { count: -1 } },
          { $limit: 8 },
        ]),
        Complaint.aggregate([
          { $group: { _id: '$dataSource', count: { $sum: 1 } } },
          { $project: { source: '$_id', count: 1, _id: 0 } },
        ]),
        Complaint.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .select('referenceId title category status location.area aiAnalysis.priorityScore dataSource createdAt'),
      ]);

      // Calculate resolution rate
      const resolutionRate = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0;

      sendSuccess(res, {
        kpis: {
          totalCount,
          resolvedCount,
          inProgressCount,
          pendingCount,
          resolutionRate,
        },
        byCategory,
        byStatus,
        byArea,
        byDataSource,
        recentComplaints,
      });
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  }

  /**
   * Single complaint details by ID or referenceId
   */
  static async getComplaintById(req: Request, res: Response): Promise<void> {
    try {
      const rawId = req.params.id as string;
      if (!rawId) {
        sendError(res, 'Complaint identifier is required', 400);
        return;
      }

      // Check whether search query matches MongoDB ObjectId or human-readable referenceId
      const isObjectId = mongoose.Types.ObjectId.isValid(rawId);
      const query = isObjectId ? { $or: [{ _id: rawId }, { referenceId: rawId }] } : { referenceId: rawId };

      const complaint = await Complaint.findOne(query)
        .populate('citizenId', 'name email preferredLanguage')
        .populate('department', 'name code contactEmail')
        .populate('timeline.updatedBy', 'name role');

      if (!complaint) {
        sendError(res, 'Complaint not found', 404);
        return;
      }

      // If duplicate group exists, fetch related grouped complaints for transparency
      let duplicateGroup: any[] = [];
      if (complaint.duplicateGroupId) {
        duplicateGroup = await Complaint.find({
          duplicateGroupId: complaint.duplicateGroupId,
          _id: { $ne: complaint._id },
        }).select('referenceId title category status location.area createdAt');
      }

      sendSuccess(res, {
        complaint,
        duplicateGroup,
      });
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  }

  /**
   * Upvote a complaint (citizens can upvote to increase community urgency proxy)
   */
  static async toggleUpvote(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Authentication required to upvote', 401);
        return;
      }

      const { id } = req.params;
      const complaint = await Complaint.findById(id);
      if (!complaint) {
        sendError(res, 'Complaint not found', 404);
        return;
      }

      const userId = new mongoose.Types.ObjectId(req.user.id);
      const hasUpvoted = complaint.upvotedBy.some((uid) => uid.equals(userId));

      if (hasUpvoted) {
        // Remove upvote
        complaint.upvotedBy = complaint.upvotedBy.filter((uid) => !uid.equals(userId));
        complaint.upvotes = Math.max(0, complaint.upvotes - 1);
      } else {
        // Add upvote
        complaint.upvotedBy.push(userId);
        complaint.upvotes += 1;
      }

      // Recalculate priority score with updated upvote count
      const updatedSeverity = SeverityService.calculatePriority(
        complaint.aiAnalysis.aiSeverityRating,
        complaint.category,
        complaint.upvotes,
        complaint.createdAt
      );

      complaint.aiAnalysis.priorityScore = updatedSeverity.priorityScore;
      await complaint.save();

      sendSuccess(res, {
        upvotes: complaint.upvotes,
        hasUpvoted: !hasUpvoted,
        priorityScore: complaint.aiAnalysis.priorityScore,
      });
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  }
}
