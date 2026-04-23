import { NextFunction, Request, Response } from 'express';
import {
  CheckOtpRestrictions,
  SendOtp,
  trackOtpRequest,
  ValidateRegistrationData,
} from '../utils/auth.helper';
import prisma from '@zyra-bd/prisma';
import { ValidationError } from '@zyra-bd/error-handler';

//Register a new user
export const userRegistrationController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    ValidateRegistrationData(req.body, 'user');
    const { name, email } = req.body;

    const existingUser = await prisma.users.findUnique({ where: { email } });

    if (existingUser) {
      return next(new ValidationError('User email already exists'));
    }

    await CheckOtpRestrictions(email, next);

    await trackOtpRequest(email, next);

    await SendOtp(name, email, 'user-activation-mail');

    res
      .status(200)
      .json({ message: 'OTP sent to your email. Please verify your account' });
  } catch (error) {
    return next(error);
  }
};
