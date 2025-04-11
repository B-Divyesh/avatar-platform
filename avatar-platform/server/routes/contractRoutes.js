const express = require('express');
const router = express.Router();
const contractController = require('../controllers/contractController');
const { authMiddleware } = require('../middleware/authMiddleware');

// All routes are protected
router.use(authMiddleware);

// Contract routes
router.post('/', contractController.createContract);
router.get('/', contractController.getUserContracts);
router.get('/:id', contractController.getContractById);
router.put('/:id/status', contractController.updateContractStatus);
router.post('/:id/verify', contractController.verifyAndReleasePayment);

// Deliverable routes
router.post('/:contractId/deliverables', contractController.addDeliverable);
router.put('/deliverables/:id/status', contractController.updateDeliverableStatus);

module.exports = router;