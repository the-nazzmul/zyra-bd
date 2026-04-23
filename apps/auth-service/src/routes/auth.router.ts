import express, { Router } from 'express';
import { userRegistrationController } from '../controllers/auth.controller';

const authRouter: Router = express.Router();

authRouter.post('/user-registration', userRegistrationController);

export default authRouter;
