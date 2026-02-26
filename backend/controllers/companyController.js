const Company = require('../models/Company');

// @desc    Get company details (usually just one company)
// @route   GET /api/company
// @access  Public
const getCompany = async (req, res) => {
  try {
    const company = await Company.findOne({ isActive: true });
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company details not found. Please set up company information.'
      });
    }
    
    console.log('GET company - monthlyTargets:', company.monthlyTargets?.length, 'items');
    
    res.json({
      success: true,
      data: company
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get company by ID
// @route   GET /api/company/:id
// @access  Public
const getCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }
    
    res.json({
      success: true,
      data: company
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create company
// @route   POST /api/company
// @access  Private
const createCompany = async (req, res) => {
  try {
    console.log('Creating company with monthlyTargets:', req.body.monthlyTargets?.length);
    const company = await Company.create(req.body);
    console.log('Created company monthlyTargets:', company.monthlyTargets?.length);
    
    res.status(201).json({
      success: true,
      data: company
    });
  } catch (error) {
    console.error('Create company error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update company
// @route   PUT /api/company/:id
// @access  Private
const updateCompany = async (req, res) => {
  try {
    console.log('Updating company ID:', req.params.id);
    console.log('monthlyTargets in request:', req.body.monthlyTargets?.length, 'items');
    console.log('First target:', req.body.monthlyTargets?.[0]);
    
    // Find and update
    const company = await Company.findById(req.params.id);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }
    
    // Update fields manually to ensure monthlyTargets is saved
    Object.keys(req.body).forEach(key => {
      company[key] = req.body[key];
    });
    
    await company.save();
    
    console.log('After save - monthlyTargets:', company.monthlyTargets?.length, 'items');
    console.log('First target after save:', company.monthlyTargets?.[0]);
    
    // Convert to plain object to ensure all fields are included
    const companyObj = company.toObject();
    console.log('Sending response with monthlyTargets:', companyObj.monthlyTargets?.length, 'items');
    
    res.json({
      success: true,
      data: companyObj
    });
  } catch (error) {
    console.error('Update company error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete company
// @route   DELETE /api/company/:id
// @access  Private
const deleteCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndDelete(req.params.id);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Company deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getCompany,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany
};