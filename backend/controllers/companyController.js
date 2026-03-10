const Company = require('../models/Company');
const { buildFYSkeleton, recalcAchievedForFY, getFYStartYear } = require('../utils/fyHelper');

// @desc    Get company details
// @route   GET /api/company
const getCompany = async (req, res) => {
  try {
    const company = await Company.findOne({ isActive: true });
    if (!company) return res.status(404).json({ success: false, message: 'Company details not found.' });
    res.json({ success: true, data: company });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get company by ID
// @route   GET /api/company/:id
const getCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    res.json({ success: true, data: company });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create company
// @route   POST /api/company
const createCompany = async (req, res) => {
  try {
    const company = await Company.create(req.body);
    res.status(201).json({ success: true, data: company });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update company (general fields + targets)
// @route   PUT /api/company/:id
const updateCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });

    // Apply all non-fyData fields
    Object.keys(req.body).forEach(key => {
      if (key !== 'fyData') company[key] = req.body[key];
    });

    // If targets are being updated via fyData, merge targets only (never overwrite achieved)
    if (req.body.fyData) {
      if (!company.fyData) company.fyData = {};

      Object.keys(req.body.fyData).forEach(fyKey => {
        const incoming = req.body.fyData[fyKey];
        if (!company.fyData[fyKey]) {
          // First time setting this FY — build skeleton then apply targets
          company.fyData[fyKey] = {
            months: buildFYSkeleton(parseInt(fyKey), incoming.months || []),
            lastSyncedAt: new Date(),
          };
        } else {
          // FY exists — merge targets into existing months, keep achieved intact
          const existingMonths = company.fyData[fyKey].months || [];
          if (incoming.months) {
            incoming.months.forEach(inMonth => {
              const slot = existingMonths.find(m => m.month === inMonth.month && m.year === inMonth.year);
              if (slot) {
                slot.target = inMonth.target ?? slot.target;
                // Never touch slot.achieved here
              } else {
                existingMonths.push({ ...inMonth, achieved: 0 });
              }
            });
            company.fyData[fyKey].months = existingMonths;
          }
        }
      });

      company.markModified('fyData');
    }

    await company.save();
    res.json({ success: true, data: company.toObject() });
  } catch (error) {
    console.error('Update company error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete company
// @route   DELETE /api/company/:id
const deleteCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndDelete(req.params.id);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    res.json({ success: true, message: 'Company deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── FY-SPECIFIC ROUTES ────────────────────────────────────────

// @desc    Get current FY info
// @route   GET /api/company/current-fy
const getCurrentFY = async (req, res) => {
  const fyStartYear = getFYStartYear();
  res.json({
    success: true,
    data: {
      startYear: fyStartYear,
      label: `FY ${fyStartYear}–${String(fyStartYear + 1).slice(-2)}`,
    }
  });
};

// @desc    Get fyData for a specific FY (targets + achieved)
// @route   GET /api/company/fy-data/:fy
const getFYData = async (req, res) => {
  try {
    const fyKey = req.params.fy; // e.g. "2025"
    const company = await Company.findOne({ isActive: true });
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });

    const fyData = (company.fyData || {})[fyKey];
    if (!fyData) {
      // Return blank skeleton — no targets or achieved yet
      return res.json({
        success: true,
        data: { months: buildFYSkeleton(parseInt(fyKey)), lastSyncedAt: null }
      });
    }
    res.json({ success: true, data: fyData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Save targets for a specific FY (keeps achieved intact)
// @route   PUT /api/company/fy-data/:fy
const saveFYTargets = async (req, res) => {
  try {
    const fyKey      = req.params.fy;
    const fyYear     = parseInt(fyKey);
    const { months } = req.body; // array of { month, year, target }

    const company = await Company.findOne({ isActive: true });
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    if (!company.fyData) company.fyData = {};

    if (!company.fyData[fyKey]) {
      // Brand new FY — build skeleton with targets, achieved = 0
      company.fyData[fyKey] = {
        months: buildFYSkeleton(fyYear, months),
        lastSyncedAt: new Date(),
      };
    } else {
      // Merge targets into existing months, preserve achieved
      const existingMonths = company.fyData[fyKey].months || [];
      months.forEach(inMonth => {
        const slot = existingMonths.find(m => m.month === inMonth.month && m.year === inMonth.year);
        if (slot) {
          slot.target = inMonth.target ?? 0;
        } else {
          existingMonths.push({ month: inMonth.month, year: inMonth.year, target: inMonth.target ?? 0, achieved: 0 });
        }
      });
      company.fyData[fyKey].months      = existingMonths;
      company.fyData[fyKey].lastSyncedAt = new Date();
    }

    company.markModified('fyData');
    await company.save();

    res.json({ success: true, data: company.fyData[fyKey] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Force-resync achieved figures for a FY from invoice data
// @route   POST /api/company/fy-data/:fy/sync
const syncFYAchieved = async (req, res) => {
  try {
    const fyKey  = req.params.fy;
    const fyYear = parseInt(fyKey);

    const company = await Company.findOne({ isActive: true });
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    if (!company.fyData) company.fyData = {};

    const existingMonths = company.fyData[fyKey]?.months || [];
    const updatedMonths  = await recalcAchievedForFY(fyYear, existingMonths);

    company.fyData[fyKey] = {
      months: updatedMonths,
      lastSyncedAt: new Date(),
    };

    company.markModified('fyData');
    await company.save();

    res.json({ success: true, message: `Synced FY ${fyKey}`, data: company.fyData[fyKey] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all FY data (overview)
// @route   GET /api/company/fy-data
const getAllFYData = async (req, res) => {
  try {
    const company = await Company.findOne({ isActive: true });
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    res.json({ success: true, data: company.fyData || {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete FY data
// @route   DELETE /api/company/fy-data/:fy
const deleteFYData = async (req, res) => {
  try {
    const fyKey   = req.params.fy;
    const company = await Company.findOne({ isActive: true });
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    if (company.fyData?.[fyKey]) {
      delete company.fyData[fyKey];
      company.markModified('fyData');
      await company.save();
    }
    res.json({ success: true, message: `FY ${fyKey} data deleted` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCompany, getCompanyById, createCompany, updateCompany, deleteCompany,
  getCurrentFY,
  getFYData, saveFYTargets, syncFYAchieved, getAllFYData, deleteFYData,
};