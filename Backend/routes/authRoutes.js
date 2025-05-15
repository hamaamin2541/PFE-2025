import express from 'express';
import { login, register, createAdmin, add_newuser} from '../controllers/authController.js';


const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/add_newuser', add_newuser);
router.post('/create-admin', createAdmin);

export default router;
