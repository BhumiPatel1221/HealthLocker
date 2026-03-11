const express = require('express');
const router = express.Router();
const { createFolder, renameFolder, deleteFolder, listFolders } = require('../controllers/folderController');
const verifyJWT = require('../middleware/verifyJWT');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(verifyJWT);

// Create folder
router.post('/', roleMiddleware('patient'), createFolder);
// Rename folder
router.patch('/:id', roleMiddleware('patient'), renameFolder);
// Delete folder
router.delete('/:id', roleMiddleware('patient'), deleteFolder);
// List folders
router.get('/', roleMiddleware('patient'), listFolders);

module.exports = router;
