const express = require('express');
const router = express.Router();
const {
  getCompany,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany
} = require('../controllers/companyController');

router.route('/')
  .get(getCompany)
  .post(createCompany);

router.route('/:id')
  .get(getCompanyById)
  .put(updateCompany)
  .delete(deleteCompany);

module.exports = router;