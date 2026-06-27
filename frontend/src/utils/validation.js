import { z } from 'zod';

export const registerSchema = z
  .object({
    full_name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(150, 'Name must not exceed 150 characters'),
    email: z
      .string()
      .email('Please enter a valid email address'),
    phone: z
      .string()
      .refine((val) => val === '' || /^[\d\+\-\s]{7,15}$/.test(val), {
        message: 'Please enter a valid phone number (7 to 15 digits)',
      })
      .optional()
      .or(z.literal('')),
    address: z
      .string()
      .max(500, 'Address must not exceed 500 characters')
      .optional()
      .or(z.literal('')),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .refine((val) => /[A-Za-z]/.test(val), {
        message: 'Password must contain at least one letter',
      })
      .refine((val) => /[0-9]/.test(val), {
        message: 'Password must contain at least one number',
      }),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
