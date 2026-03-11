const Visit = require('../models/Visit');
const AccessPermission = require('../models/AccessPermission');
const catchAsync = require('../utils/catchAsync');
const { sendSuccess, sendCreated } = require('../utils/response');
const { BadRequestError, ForbiddenError, NotFoundError } = require('../utils/AppError');
const { createAuditLog } = require('../services/auditService');

/**
 * POST /api/visits
 * Create a new visit entry (Patient only)
 */
const createVisit = catchAsync(async (req, res) => {
    const { visitDate, title, notes, diagnosis, hospitalName, visitType, doctorId } = req.body;

    if (!visitDate || !title) {
        throw new BadRequestError('Visit date and title are required');
    }

    const visit = await Visit.create({
        patientId: req.user._id,
        doctorId: doctorId || null,
        visitDate,
        title,
        notes: notes || '',
        diagnosis: diagnosis || '',
        hospitalName: hospitalName || '',
        visitType: visitType || 'checkup',
    });

    // Audit log
    await createAuditLog({
        userId: req.user._id,
        action: 'VISIT_CREATED',
        role: req.user.role,
        targetId: visit._id,
        targetModel: 'Visit',
        description: `Visit created: ${title}`,
        req,
    });

    sendCreated(res, { visit }, 'Visit created successfully');
});

/**
 * GET /api/visits
 * Get all visits for the current patient
 */
const getMyVisits = catchAsync(async (req, res) => {
    const { page = 1, limit = 20, sortBy = 'visitDate', order = 'desc' } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === 'asc' ? 1 : -1;

    const [visits, total] = await Promise.all([
        Visit.find({ patientId: req.user._id })
            .populate('doctorId', 'name email specialization')
            .sort({ [sortBy]: sortOrder })
            .skip(skip)
            .limit(parseInt(limit)),
        Visit.countDocuments({ patientId: req.user._id }),
    ]);

    sendSuccess(res, {
        visits,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit)),
        },
    }, 'Visits retrieved successfully');
});

/**
 * GET /api/visits/:id
 * Get a single visit by ID (Patient owner or authorized Doctor)
 */
const getVisitById = catchAsync(async (req, res) => {
    const visit = await Visit.findById(req.params.id)
        .populate('doctorId', 'name email specialization')
        .populate('patientId', 'name email');

    if (!visit) {
        throw new NotFoundError('Visit not found');
    }

    // Authorization check
    const isPatientOwner = visit.patientId._id.toString() === req.user._id.toString();
    let isDoctorAuthorized = false;

    if (req.user.role === 'doctor') {
        const permission = await AccessPermission.findOne({
            patientId: visit.patientId._id,
            doctorId: req.user._id,
            isRevoked: false,
            expiresAt: { $gt: new Date() },
            $or: [
                { visitId: visit._id },
                { visitId: null }, // Full access grant
            ],
        });
        isDoctorAuthorized = !!permission;
    }

    if (!isPatientOwner && !isDoctorAuthorized) {
        throw new ForbiddenError('You do not have permission to view this visit', 'ACCESS_DENIED');
    }

    // Audit log
    await createAuditLog({
        userId: req.user._id,
        action: 'VISIT_VIEWED',
        role: req.user.role,
        targetId: visit._id,
        targetModel: 'Visit',
        description: `Visit viewed: ${visit.title}`,
        req,
    });

    sendSuccess(res, { visit }, 'Visit retrieved successfully');
});

/**
 * GET /api/visits/patient/:patientId
 * Doctor views a patient's visits (requires valid permission)
 */
const getPatientVisits = catchAsync(async (req, res) => {
    const { patientId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Verify doctor has permission
    const permission = await AccessPermission.findOne({
        patientId,
        doctorId: req.user._id,
        isRevoked: false,
        expiresAt: { $gt: new Date() },
    });

    if (!permission) {
        throw new ForbiddenError(
            'You do not have valid permission to access this patient\'s records',
            'PERMISSION_EXPIRED_OR_REVOKED'
        );
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query: either specific visit or all visits
    const query = { patientId };
    if (permission.visitId) {
        query._id = permission.visitId;
    }

    const [visits, total] = await Promise.all([
        Visit.find(query)
            .populate('doctorId', 'name email specialization')
            .sort({ visitDate: -1 })
            .skip(skip)
            .limit(parseInt(limit)),
        Visit.countDocuments(query),
    ]);

    sendSuccess(res, {
        visits,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit)),
        },
    }, 'Patient visits retrieved successfully');
});

/**
 * PUT /api/visits/:id/notes
 * Doctor adds/updates notes for a visit
 */
const addVisitNotes = catchAsync(async (req, res) => {
    const { notes, diagnosis } = req.body;
    const visit = await Visit.findById(req.params.id);

    if (!visit) {
        throw new NotFoundError('Visit not found');
    }

    // Check doctor permission
    const permission = await AccessPermission.findOne({
        patientId: visit.patientId,
        doctorId: req.user._id,
        isRevoked: false,
        expiresAt: { $gt: new Date() },
        $or: [{ visitId: visit._id }, { visitId: null }],
    });

    if (!permission) {
        throw new ForbiddenError('You do not have permission to modify this visit', 'ACCESS_DENIED');
    }

    if (notes !== undefined) visit.notes = notes;
    if (diagnosis !== undefined) visit.diagnosis = diagnosis;
    await visit.save();

    sendSuccess(res, { visit }, 'Visit notes updated successfully');
});

module.exports = {
    createVisit,
    getMyVisits,
    getVisitById,
    getPatientVisits,
    addVisitNotes,
};
