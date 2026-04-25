import { ValidationError } from '@zyra-bd/error-handler';
import crypto from 'crypto';
import redis from '@zyra-bd/redis';
import { sendEmail } from './send-mail';

const isOtpRateLimitDisabled = process.env.DISABLE_OTP_RATE_LIMIT === 'true';

export const ValidateRegistrationData = (
  data: any,
  userType: 'user' | 'seller',
) => {
  const { name, email, password, phone, country } = data;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

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

  if (!passwordRegex.test(password)) {
    throw new ValidationError(
      'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character',
    );
  }
};

export const CheckOtpRestrictions = async (email: string) => {
  if (isOtpRateLimitDisabled) {
    return;
  }

  if (await redis.get(`otp_lock:${email}`)) {
    throw new ValidationError(
      'Too many OTP requests. Please try again after 30 minutes',
    );
  }
  if (await redis.get(`otp_spam_lock:${email}`)) {
    throw new ValidationError(
      'Too many OTP requests. Please try again after 1 hour',
    );
  }
  if (await redis.get(`otp_cooldown:${email}`)) {
    throw new ValidationError(
      'Please wait 1 minute before requesting a new OTP',
    );
  }
};

export const trackOtpRequest = async (email: string) => {
  if (isOtpRateLimitDisabled) {
    return;
  }

  const optRequestKey = `otp_request_count:${email}`;
  const optRequests = parseInt((await redis.get(optRequestKey)) || '0');

  if (optRequests >= 2) {
    await redis.set(`otp_spam_lock:${email}`, 'locked', 'EX', 3600);
    throw new ValidationError(
      'Too many OTP requests. Please try again after 1 hour',
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

export const verifyOtp = async (email: string, otp: string | number) => {
  const storedOtp = await redis.get(`otp:${email}`);

  if (!storedOtp) {
    throw new ValidationError('Invalid or expired OTP');
  }

  const failedAttempts = parseInt(
    (await redis.get(`otp_attempts:${email}`)) || '0',
  );

  if (storedOtp !== String(otp)) {
    if (failedAttempts >= 2) {
      await redis.set(`otp_spam_lock:${email}`, 'locked', 'EX', 1800); //lock for 30 minutes
      await redis.del(`otp:${email}`, `otp_attempts:${email}`);

      throw new ValidationError(
        'Too many failed attempts. Now your account is locked for 30 minutes. Please try again later',
      );
    }
    await redis.set(`otp_attempts:${email}`, failedAttempts + 1, 'EX', 300);
    throw new ValidationError(
      `Invalid OTP. You have ${2 - failedAttempts} attempts left`,
    );
  }
  await redis.del(`otp:${email}`, `otp_attempts:${email}`);
};
