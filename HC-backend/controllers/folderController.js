const Folder = require('../models/Folder');
const File = require('../models/File');
const MedicalRecord = require('../models/MedicalRecord');
const catchAsync = require('../utils/catchAsync');
const { sendSuccess, sendCreated } = require('../utils/response');
const { BadRequestError, ForbiddenError, NotFoundError } = require('../utils/AppError');
const { createAuditLog } = require('../services/auditService');

// Create folder
const createFolder = catchAsync(async (req, res) => {
  const { name, parent } = req.body;
  if (!name) throw new BadRequestError('Folder name is required');
  // Validate parent ownership if provided
  let parentFolder = null;
  if (parent) {
    parentFolder = await Folder.findById(parent);
    if (!parentFolder || parentFolder.owner.toString() !== req.user._id.toString()) {
      throw new ForbiddenError('Invalid parent folder');
    }
  }
  const folder = await Folder.create({ name, owner: req.user._id, parent: parent || null });
  await createAuditLog({ userId: req.user._id, action: 'FOLDER_CREATED', role: req.user.role, targetId: folder._id, targetModel: 'Folder', description: `Folder created: ${name}`, req });
  sendCreated(res, { folder }, 'Folder created');
});

// Rename folder
const renameFolder = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name) throw new BadRequestError('Folder name is required');
  const folder = await Folder.findById(id);
  if (!folder || folder.owner.toString() !== req.user._id.toString()) throw new ForbiddenError('Not your folder');
  folder.name = name;
  await folder.save();
  await createAuditLog({ userId: req.user._id, action: 'FOLDER_RENAMED', role: req.user.role, targetId: folder._id, targetModel: 'Folder', description: `Folder renamed: ${name}`, req });
  sendSuccess(res, { folder }, 'Folder renamed');
});

// Delete folder (and files)
const deleteFolder = catchAsync(async (req, res) => {
  const { id } = req.params;
  const folder = await Folder.findById(id);
  if (!folder || folder.owner.toString() !== req.user._id.toString()) throw new ForbiddenError('Not your folder');
  // Soft delete folder
  folder.isDeleted = true;
  folder.deletedAt = new Date();
  await folder.save();
  // Soft delete all files in this folder
  await File.updateMany({ folder: id }, { isDeleted: true, deletedAt: new Date() });
  await MedicalRecord.updateMany({ folder: id }, { isDeleted: true, deletedAt: new Date() });
  await createAuditLog({ userId: req.user._id, action: 'FOLDER_DELETED', role: req.user.role, targetId: folder._id, targetModel: 'Folder', description: `Folder deleted: ${folder.name}`, req });
  sendSuccess(res, null, 'Folder deleted');
});

// List folders (flat or tree)
const listFolders = catchAsync(async (req, res) => {
  const folders = await Folder.find({ owner: req.user._id, isDeleted: false });
  sendSuccess(res, { folders }, 'Folders retrieved');
});

module.exports = { createFolder, renameFolder, deleteFolder, listFolders };