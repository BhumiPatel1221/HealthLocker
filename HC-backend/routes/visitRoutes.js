const express = require('express');
const router = express.Router();
const {
    createVisit,
    getMyVisits,
    getVisitById,
    getPatientVisits,
    addVisitNotes,
} = require('../controllers/visitController');
const verifyJWT = require('../middleware/verifyJWT');
const roleMiddleware = require('../middleware/roleMiddleware');

// All visit routes require authentication
router.use(verifyJWT);

// Patient routes
router.post('/', roleMiddleware('patient'), createVisit);
router.get('/', roleMiddleware('patient'), getMyVisits);

// Shared — patient (own visit) or authorized doctor
router.get('/:id', getVisitById);

// Doctor routes removed as per user request.

module.exports = router;
