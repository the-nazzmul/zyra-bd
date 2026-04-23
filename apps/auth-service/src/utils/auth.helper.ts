import { ValidationError } from '@zyra-bd/error-handler';
import crypto from 'crypto';
import redis from '@zyra-bd/redis';
import { sendEmail } from './send-mail';
import { NextFunction } from 'express';

const isOtpRateLimitDisabled = process.env.DISABLE_OTP_RATE_LIMIT === 'true';

export const ValidateRegistrationData = (
  data: any,
  userType: 'user' | 'seller',
) => {
  const { name, email, password, phone, country } = data;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (
    !name ||
    !email ||
    !password ||
    (userType === 'seller' && (!phone || !country))
  ) {
    throw new ValidationError('Missing required fields');
  }

  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format');
  }
};

export const CheckOtpRestrictions = async (
  email: string,
  next: NextFunction,
) => {
  if (isOtpRateLimitDisabled) {
    return;
  }

  if (await redis.get(`otp_lock:${email}`)) {
    return next(
      new ValidationError(
        'Too many OTP requests. Please try again after 30 minutes',
      ),
    );
  }
  if (await redis.get(`otp_spam_lock:${email}`)) {
    return next(
      new ValidationError(
        'Too many OTP requests. Please try again after 1 hour',
      ),
    );
  }
  if (await redis.get(`otp_cooldown:${email}`)) {
    return next(
      new ValidationError('Please wait 1 minute before requesting a new OTP'),
    );
  }
};

export const trackOtpRequest = async (email: string, next: NextFunction) => {
  if (isOtpRateLimitDisabled) {
    return;
  }

  const optRequestKey = `otp_request_count:${email}`;
  const optRequests = parseInt((await redis.get(optRequestKey)) || '0');

  if (optRequests >= 2) {
    await redis.set(`otp_spam_lock:${email}`, 'locked', 'EX', 3600);
    return next(
      new ValidationError(
        'Too many OTP requests. Please try again after 1 hour',
      ),
    );
  }

  await redis.set(optRequestKey, optRequests + 1, 'EX', 3600);
};

export const SendOtp = async (
  name: string,
  email: string,
  template: string,
) => {
  const otp = crypto.randomInt(1000, 9999).toString();
  const isEmailSent = await sendEmail(email, 'Verify your email', template, {
    name,
    otp,
  });

  if (!isEmailSent) {
    throw new ValidationError(
      'Unable to send OTP email at the moment. Please try again.',
    );
  }
  //set this OTP in redis with email with 5 minutes expiration
  await redis.set(`otp:${email}`, otp, 'EX', 300);
  await redis.set(`otp_cooldown:${email}`, 'true', 'EX', 60);
};
