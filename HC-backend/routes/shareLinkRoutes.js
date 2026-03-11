const express = require('express');
const router = express.Router();
const verifyJWT = require('../middleware/verifyJWT');
const {
    createShareLink,
    accessShareLink,
    revokeShareLink,
    listShareLinks,
} = require('../controllers/shareLinkController');

// ─── Public ───────────────────────────────────────────────
// Access a shared resource (no auth required).
// Accepts optional ?password= query param for protected links.
router.get('/access/:token', accessShareLink);

// ─── Protected (JWT required) ─────────────────────────────
router.use(verifyJWT);

// List all share links created by the current user
router.get('/', listShareLinks);

// Create a new share link
router.post('/', createShareLink);

// Revoke a share link
router.delete('/:token', revokeShareLink);

module.exports = router;
