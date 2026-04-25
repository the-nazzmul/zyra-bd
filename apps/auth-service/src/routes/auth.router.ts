import express, { Router } from 'express';
import { userRegistrationController, verifyOtpController } from '../controllers/auth.controller';

const authRouter: Router = express.Router();

authRouter.post('/user-registration', userRegistrationController);
authRouter.post('/verify-user', verifyOtpController);

export default authRouter;
