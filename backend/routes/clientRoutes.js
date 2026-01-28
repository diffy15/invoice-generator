const express = require('express');
const router = express.Router();
const {
  getClients,
  getClientById,
  createClient,
  updateClient,
  toggleClientStatus,
  deleteClient
} = require('../controllers/clientController');

router.route('/')
  .get(getClients)
  .post(createClient);

router.route('/:id')
  .get(getClientById)
  .put(updateClient)
  .delete(deleteClient);

router.patch('/:id/toggle', toggleClientStatus);

module.exports = router;