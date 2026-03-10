const express = require('express');
const router = express.Router();
const {
  getCompany,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  // NEW: FY-based controllers
  getCurrentFY,
  getFYTargets,
  saveFYTargets,
  getAllFYTargets,
  deleteFYTargets
} = require('../controllers/companyController');

// If you have auth middleware, import it here:
// const { protect } = require('../middleware/auth');

// ═══════════════════════════════════════════════════════
// EXISTING ROUTES - NO CHANGES
// ═══════════════════════════════════════════════════════

router.route('/')
  .get(getCompany)
  .post(createCompany);  // Add protect if you have auth

router.route('/:id')
  .get(getCompanyById)
  .put(updateCompany)    // Add protect if you have auth
  .delete(deleteCompany); // Add protect if you have auth

// ═══════════════════════════════════════════════════════
// NEW: FY-BASED ROUTES - ADD THESE
// ═══════════════════════════════════════════════════════

// Get current financial year info
router.get('/current-fy', getCurrentFY);

// Get all FY targets (overview)
router.get('/fy-targets', getAllFYTargets);

// Get/Save/Delete targets for specific FY
router.route('/fy-targets/:fy')
  .get(getFYTargets)
  .put(saveFYTargets)     // Add protect if you have auth
  .delete(deleteFYTargets); // Add protect if you have auth

module.exports = router;