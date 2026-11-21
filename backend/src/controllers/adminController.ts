import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Complaint, ComplaintStatus } from '../models/Complaint';
import { Department } from '../models/Department';
import { AuditLog } from '../models/AuditLog';
import { StorageService } from '../services/storageService';
import { sendSuccess, sendError } from '../utils/responseHelper';
import { logger } from '../utils/logger';

export class AdminController {
  /**
   * Admin Complaints overview with sorting and search
   */
  static async getAllComplaints(req: Request, res: Response): Promise<void> {
    try {
      const {
        status,
        category,
        department,
        duplicateStatus,
        search,
        page = '1',
        limit = '20',
        sortBy = 'priorityScore',
        sortOrder = 'desc',
      } = req.query;

      const query: any = {};

      if (status && status !== 'All') query.status = status;
      if (category && category !== 'All') query.category = category;
      if (department && department !== 'All') query.department = department;
      if (duplicateStatus && duplicateStatus !== 'All') query.duplicateStatus = duplicateStatus;

      if (search) {
        const regex = new RegExp(String(search), 'i');
        query.$or = [{ title: regex }, { description: regex }, { 'location.area': regex }, { 'location.address': regex }];
      }

      const pageNum = parseInt(String(page), 10) || 1;
      const limitNum = parseInt(String(limit), 10) || 20;
      const skip = (pageNum - 1) * limitNum;

      const sortField = String(sortBy) === 'priorityScore' ? 'aiAnalysis.priorityScore' : String(sortBy);
      const sortDirection = sortOrder === 'asc' ? 1 : -1;

      const [complaints, total] = await Promise.all([
        Complaint.find(query)
          .populate('citizenId', 'name email preferredLanguage phone')
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
   * Update status with timeline note and audit logging
   */
  static async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, note } = req.body;

      if (!status || !['pending', 'assigned', 'in-progress', 'resolved', 'rejected'].includes(status)) {
        sendError(res, 'Valid status is required', 400);
        return;
      }

      const complaint = await Complaint.findById(id);
      if (!complaint) {
        sendError(res, 'Complaint not found', 404);
        return;
      }

      const previousStatus = complaint.status;
      complaint.status = status as ComplaintStatus;

      complaint.timeline.push({
        status: status as ComplaintStatus,
        note: note || `Status updated from ${previousStatus} to ${status} by administrator.`,
        updatedBy: new mongoose.Types.ObjectId(req.user!.id),
        timestamp: new Date(),
      });

      await complaint.save();

      // Log action in AuditLog
      await AuditLog.create({
        adminId: req.user!.id,
        complaintId: complaint._id,
        action: 'UPDATE_STATUS',
        previousValue: previousStatus,
        newValue: status,
        details: note,
      });

      sendSuccess(res, { complaint }, 'Complaint status updated successfully');
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  }

  /**
   * Assign department to complaint
   */
  static async assignDepartment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { departmentId, note } = req.body;

      if (!departmentId || typeof departmentId !== 'string' || !mongoose.Types.ObjectId.isValid(departmentId)) {
        sendError(res, 'Valid departmentId is required', 400);
        return;
      }

      const [complaint, department] = await Promise.all([
        Complaint.findById(id),
        Department.findById(departmentId),
      ]);

      if (!complaint) {
        sendError(res, 'Complaint not found', 404);
        return;
      }
      if (!department) {
        sendError(res, 'Department not found', 404);
        return;
      }

      const previousDept = complaint.department;
      complaint.department = department._id as any;
      if (complaint.status === 'pending') {
        complaint.status = 'assigned';
      }

      complaint.timeline.push({
        status: complaint.status,
        note: note || `Assigned to ${department.name} (${department.code})`,
        updatedBy: new mongoose.Types.ObjectId(req.user!.id),
        timestamp: new Date(),
      });

      await complaint.save();

      // Increment count on department
      await Department.findByIdAndUpdate(departmentId, { $inc: { assignedComplaintsCount: 1 } });

      // Audit log
      await AuditLog.create({
        adminId: req.user!.id,
        complaintId: complaint._id,
        action: 'ASSIGN_DEPARTMENT',
        previousValue: previousDept,
        newValue: department.code,
        details: note,
      });

      sendSuccess(res, { complaint }, `Assigned to ${department.name}`);
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  }

  /**
   * Upload resolution evidence image
   */
  static async uploadEvidence(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { caption } = req.body;

      if (!req.file) {
        sendError(res, 'Evidence image file is required', 400);
        return;
      }

      const complaint = await Complaint.findById(id);
      if (!complaint) {
        sendError(res, 'Complaint not found', 404);
        return;
      }

      const fileUrl = StorageService.getFileUrl(req.file, 'evidence');

      complaint.resolutionEvidence.push({
        url: fileUrl,
        caption: caption || 'On-site resolution evidence verified by authority.',
        uploadedAt: new Date(),
      });

      complaint.timeline.push({
        status: complaint.status,
        note: `Resolution photographic evidence uploaded: "${caption || 'Verified completion proof'}"`,
        updatedBy: new mongoose.Types.ObjectId(req.user!.id),
        timestamp: new Date(),
      });

      await complaint.save();

      await AuditLog.create({
        adminId: req.user!.id,
        complaintId: complaint._id,
        action: 'UPLOAD_EVIDENCE',
        newValue: fileUrl,
        details: caption,
      });

      sendSuccess(res, { complaint }, 'Resolution evidence uploaded successfully');
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  }

  /**
   * List unreviewed duplicate groups
   */
  static async getDuplicateGroups(req: Request, res: Response): Promise<void> {
    try {
      const grouped = await Complaint.aggregate([
        { $match: { duplicateGroupId: { $exists: true, $ne: null } } },
        {
          $group: {
            _id: '$duplicateGroupId',
            complaints: {
              $push: {
                id: '$_id',
                title: '$title',
                description: '$description',
                category: '$category',
                status: '$status',
                area: '$location.area',
                priorityScore: '$aiAnalysis.priorityScore',
                duplicateStatus: '$duplicateStatus',
                duplicateSimilarityScore: '$duplicateSimilarityScore',
                createdAt: '$createdAt',
              },
            },
            count: { $sum: 1 },
          },
        },
        { $match: { count: { $gt: 1 } } },
        { $sort: { count: -1 } },
      ]);

      sendSuccess(res, { groups: grouped });
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  }

  /**
   * Confirm or reject duplicate match for a complaint
   */
  static async reviewDuplicate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { decision } = req.body; // 'confirmed' or 'rejected'

      if (!decision || !['confirmed', 'rejected'].includes(decision)) {
        sendError(res, "Decision must be 'confirmed' or 'rejected'", 400);
        return;
      }

      const complaint = await Complaint.findById(id);
      if (!complaint) {
        sendError(res, 'Complaint not found', 404);
        return;
      }

      const previousStatus = complaint.duplicateStatus;
      complaint.duplicateStatus = decision;

      complaint.timeline.push({
        status: complaint.status,
        note: `Administrator reviewed suspected duplicate status: marked as ${decision}.`,
        updatedBy: new mongoose.Types.ObjectId(req.user!.id),
        timestamp: new Date(),
      });

      await complaint.save();

      await AuditLog.create({
        adminId: req.user!.id,
        complaintId: complaint._id,
        action: 'REVIEW_DUPLICATE',
        previousValue: previousStatus,
        newValue: decision,
      });

      sendSuccess(res, { complaint }, `Duplicate status marked as ${decision}`);
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  }

  /**
   * Admin KPI Dashboard statistics
   */
  static async getKPIs(req: Request, res: Response): Promise<void> {
    try {
      const [
        totalComplaints,
        pendingComplaints,
        assignedComplaints,
        inProgressComplaints,
        resolvedComplaints,
        duplicateGroupsCount,
        criticalSeverityCount,
      ] = await Promise.all([
        Complaint.countDocuments(),
        Complaint.countDocuments({ status: 'pending' }),
        Complaint.countDocuments({ status: 'assigned' }),
        Complaint.countDocuments({ status: 'in-progress' }),
        Complaint.countDocuments({ status: 'resolved' }),
        Complaint.distinct('duplicateGroupId', { duplicateGroupId: { $ne: null } }).then((g) => g.length),
        Complaint.countDocuments({ 'aiAnalysis.priorityScore': { $gte: 80 } }),
      ]);

      sendSuccess(res, {
        totalComplaints,
        pendingComplaints,
        assignedComplaints,
        inProgressComplaints,
        resolvedComplaints,
        duplicateGroupsCount,
        criticalSeverityCount,
      });
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  }

  /**
   * Get administrative audit trail
   */
  static async getAuditLog(req: Request, res: Response): Promise<void> {
    try {
      const logs = await AuditLog.find()
        .populate('adminId', 'name email role')
        .populate('complaintId', 'title category')
        .sort({ timestamp: -1 })
        .limit(50);

      sendSuccess(res, { logs });
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  }

  /**
   * Department management endpoints
   */
  static async getDepartments(req: Request, res: Response): Promise<void> {
    try {
      const departments = await Department.find().sort({ name: 1 });
      sendSuccess(res, { departments });
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  }

  static async createDepartment(req: Request, res: Response): Promise<void> {
    try {
      const { name, code, description, contactEmail } = req.body;
      if (!name || !code || !description || !contactEmail) {
        sendError(res, 'Name, code, description, and contactEmail are required', 400);
        return;
      }

      const existing = await Department.findOne({ code: code.toUpperCase() });
      if (existing) {
        sendError(res, 'Department with this code already exists', 409);
        return;
      }

      const department = await Department.create({
        name,
        code: code.toUpperCase(),
        description,
        contactEmail,
      });

      sendSuccess(res, { department }, 'Department created successfully', 201);
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  }

  static async updateDepartment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, description, contactEmail } = req.body;

      const department = await Department.findByIdAndUpdate(
        id,
        { name, description, contactEmail },
        { new: true }
      );

      if (!department) {
        sendError(res, 'Department not found', 404);
        return;
      }

      sendSuccess(res, { department }, 'Department updated successfully');
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  }
}
