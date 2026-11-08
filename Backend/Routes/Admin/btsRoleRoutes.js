import { verifyToken } from '../../Middleware/auth.js';
import { requireRole } from '../../Middleware/rbac.js';
import { ROLES } from '../../constants.js';
import express from 'express';
import {
  getBtsRoles,
  addBtsRole,
  updateBtsRole,
  deleteBtsRole,
} from '../../Controllers/btsRoleController.js';

const router = express.Router();
router.use(verifyToken);
const canEditRoles = requireRole([ROLES.PORTFOLIO_MANAGER]);

// GET all BTS roles
router.get('/', getBtsRoles);

// POST a new BTS role
router.post('/', canEditRoles, addBtsRole);

// PUT update an existing BTS role by its id
router.put('/:roleId', canEditRoles, updateBtsRole);

// DELETE a BTS role by its id
router.delete('/:roleId', canEditRoles, deleteBtsRole);

export default router;
