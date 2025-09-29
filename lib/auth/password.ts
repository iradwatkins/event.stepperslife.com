import * as argon2 from 'argon2';

// Password validation regex
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
}

/**
 * Validate password strength and requirements
 */
export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[@$!%*?&]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Calculate strength
  let strength: 'weak' | 'medium' | 'strong' = 'weak';

  if (errors.length === 0) {
    if (password.length >= 12 && /[^A-Za-z\d@$!%*?&]/.test(password)) {
      strength = 'strong';
    } else if (password.length >= 10) {
      strength = 'medium';
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength
  };
}

/**
 * Hash password using Argon2id
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    // Validate password first
    const validation = validatePassword(password);

    if (!validation.isValid) {
      throw new Error('Password does not meet requirements');
    }

    // Use Argon2id for hashing (more secure than bcrypt)
    const hash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16, // 64 MB
      timeCost: 3,
      parallelism: 1,
    });

    return hash;
  } catch (error) {
    console.error('Error hashing password:', error);
    throw new Error('Failed to hash password');
  }
}

/**
 * Verify password against hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}

/**
 * Generate a secure random token
 */
export function generateToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';

  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return token;
}

/**
 * Generate verification token with expiry
 */
export function generateVerificationToken(): {
  token: string;
  expires: Date;
} {
  const token = generateToken(48);
  const expires = new Date();
  expires.setHours(expires.getHours() + 24); // 24 hour expiry

  return { token, expires };
}

/**
 * Generate password reset token with expiry
 */
export function generatePasswordResetToken(): {
  token: string;
  expires: Date;
} {
  const token = generateToken(48);
  const expires = new Date();
  expires.setHours(expires.getHours() + 1); // 1 hour expiry

  return { token, expires };
}