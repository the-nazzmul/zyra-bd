import { NextFunction, Request, Response } from 'express';
import {
  CheckOtpRestrictions,
  SendOtp,
  trackOtpRequest,
  ValidateRegistrationData,
  verifyOtp,
} from '../utils/auth.helper';
import prisma from '@zyra-bd/prisma';
import { ValidationError } from '@zyra-bd/error-handler';
import argon2 from 'argon2';

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

    await CheckOtpRestrictions(email);

    await trackOtpRequest(email);

    await SendOtp(name, email, 'user-activation-mail');

    res
      .status(200)
      .json({ message: 'OTP sent to your email. Please verify your account' });
  } catch (error) {
    return next(error);
  }
};

// verify OTP

export const verifyOtpController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, otp, password, name } = req.body;

    if (!email || !otp || !password || !name) {
      return next(new ValidationError('All fields are required'));
    }

    const existingUser = await prisma.users.findUnique({ where: { email } });

    if (existingUser) {
      return next(new ValidationError('User already exists with this email'));
    }

    await verifyOtp(email, otp);

    const hashedPassword = await argon2.hash(password);

    await prisma.users.create({
      data: { name, email, password: hashedPassword },
    });

    res
      .status(201)
      .json({ success: true, message: 'User registered successfully' });
  } catch (error) {
    console.log(error);
    return next(error);
  }
};
