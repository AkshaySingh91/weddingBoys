import express from 'express';
import {
  getBtsRoles,
  addBtsRole,
  updateBtsRole,
  deleteBtsRole,
} from '../../Controllers/btsRoleController.js';

const router = express.Router();

// GET all BTS roles
router.get('/', getBtsRoles);

// POST a new BTS role
router.post('/', addBtsRole);

// PUT update an existing BTS role by its id
router.put('/:roleId', updateBtsRole);

// DELETE a BTS role by its id
router.delete('/:roleId', deleteBtsRole);

export default router;
