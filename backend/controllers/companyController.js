const Company = require('../models/Company');

// @desc    Get company details
// @route   GET /api/company
// @access  Public
const getCompany = async (req, res) => {
  try {
    const company = await Company.findOne({ isActive: true });
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company details not found.' });
    }
    res.json({ success: true, data: company });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get company by ID
// @route   GET /api/company/:id
// @access  Public
const getCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }
    res.json({ success: true, data: company });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create company
// @route   POST /api/company
// @access  Private
const createCompany = async (req, res) => {
  try {
    const company = await Company.create(req.body);
    res.status(201).json({ success: true, data: company });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update company
// @route   PUT /api/company/:id
// @access  Private
const updateCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    // Apply all fields from request body
    Object.keys(req.body).forEach(key => {
      company[key] = req.body[key];
    });

    // fyTargets is a Mixed field — Mongoose won't detect changes automatically
    if (req.body.fyTargets !== undefined) {
      company.markModified('fyTargets');
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
// @access  Private
const deleteCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndDelete(req.params.id);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }
    res.json({ success: true, message: 'Company deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── FY-SPECIFIC ROUTES (kept for future use) ─────────────────

const getCurrentFY = async (req, res) => {
  const today = new Date();
  const fyStartYear = today.getMonth() < 3 ? today.getFullYear() - 1 : today.getFullYear();
  res.json({
    success: true,
    data: {
      startYear: fyStartYear,
      label: `FY ${fyStartYear}–${String(fyStartYear + 1).slice(-2)}`,
    }
  });
};

const getFYTargets = async (req, res) => {
  try {
    const company = await Company.findOne({ isActive: true });
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    const targets = (company.fyTargets || {})[req.params.fy] || [];
    res.json({ success: true, data: targets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const saveFYTargets = async (req, res) => {
  try {
    const { fy } = req.params;
    const company = await Company.findOne({ isActive: true });
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    if (!company.fyTargets) company.fyTargets = {};
    company.fyTargets[fy] = req.body.targets;
    company.markModified('fyTargets');
    await company.save();
    res.json({ success: true, data: company.fyTargets[fy] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllFYTargets = async (req, res) => {
  try {
    const company = await Company.findOne({ isActive: true });
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    res.json({ success: true, data: company.fyTargets || {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteFYTargets = async (req, res) => {
  try {
    const { fy } = req.params;
    const company = await Company.findOne({ isActive: true });
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    if (company.fyTargets?.[fy]) {
      delete company.fyTargets[fy];
      company.markModified('fyTargets');
      await company.save();
    }
    res.json({ success: true, message: `Targets for ${fy} deleted` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCompany, getCompanyById, createCompany, updateCompany, deleteCompany,
  getCurrentFY, getFYTargets, saveFYTargets, getAllFYTargets, deleteFYTargets,
};