import { z } from 'zod';

// Common validation schemas
export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(255, 'Email must be less than 255 characters');

export const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters')
  .max(72, 'Password must be less than 72 characters');

export const phoneSchema = z
  .string()
  .trim()
  .min(1, 'Phone number is required')
  .regex(/^[\d\s+\-()]+$/, 'Please enter a valid phone number')
  .max(20, 'Phone number must be less than 20 characters');

export const nameSchema = z
  .string()
  .trim()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be less than 100 characters')
  .regex(/^[a-zA-Z\s\-']+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes');

export const carPlateSchema = z
  .string()
  .trim()
  .min(2, 'License plate is required')
  .max(15, 'License plate must be less than 15 characters')
  .regex(/^[A-Za-z0-9\-\s]+$/, 'License plate can only contain letters, numbers, hyphens, and spaces');

export const carModelSchema = z
  .string()
  .trim()
  .min(2, 'Car model is required')
  .max(50, 'Car model must be less than 50 characters');

// Passenger Sign Up Schema
export const passengerSignUpSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

// Passenger Sign In Schema
export const passengerSignInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required')
});

// Driver Sign Up Schema
export const driverSignUpSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  carModel: carModelSchema,
  carPlate: carPlateSchema,
  password: passwordSchema,
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

// Driver Sign In Schema
export const driverSignInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required')
});

// Admin Sign In Schema
export const adminSignInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required')
});

// Password Reset Schema
export const resetPasswordSchema = z.object({
  email: emailSchema
});

// Quick Registration Schema (for ride booking)
export const quickRegistrationSchema = z.object({
  name: nameSchema,
  phone: phoneSchema
});

// Helper function to validate and get errors
export function validateForm<T>(schema: z.ZodSchema<T>, data: unknown): { 
  success: boolean; 
  data?: T; 
  errors?: Record<string, string>;
} {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors: Record<string, string> = {};
  result.error.issues.forEach((issue) => {
    const path = issue.path.join('.');
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  });
  
  return { success: false, errors };
}
