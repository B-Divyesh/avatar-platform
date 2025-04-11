const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authMiddleware } = require('../middleware/authMiddleware');

// All routes are protected
router.use(authMiddleware);

// AI routes
router.post('/presentations', aiController.generatePresentation);
router.post('/summaries', aiController.generateSummary);
router.post('/analyze-contract', aiController.analyzeContract);
router.get('/presentations', aiController.getUserPresentations);
router.delete('/presentations/:id', aiController.deletePresentation);

module.exports = router;