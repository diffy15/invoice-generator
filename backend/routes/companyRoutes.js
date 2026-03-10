const express = require('express');
const router  = express.Router();
const {
  getCompany, getCompanyById, createCompany, updateCompany, deleteCompany,
  getCurrentFY,
  getFYData, saveFYTargets, syncFYAchieved, getAllFYData, deleteFYData,
} = require('../controllers/companyController');

// ── IMPORTANT: specific routes MUST come before /:id ─────────
// Otherwise Express matches /current-fy and /fy-data as /:id

// FY utility
router.get('/current-fy', getCurrentFY);

// FY data overview
router.get('/fy-data', getAllFYData);

// FY data for specific year
router.route('/fy-data/:fy')
  .get(getFYData)
  .put(saveFYTargets)
  .delete(deleteFYData);

// Force-resync achieved for a specific FY from invoice data
router.post('/fy-data/:fy/sync', syncFYAchieved);

// ── General company routes ────────────────────────────────────
router.route('/')
  .get(getCompany)
  .post(createCompany);

router.route('/:id')
  .get(getCompanyById)
  .put(updateCompany)
  .delete(deleteCompany);

module.exports = router;