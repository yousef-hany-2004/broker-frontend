import { z } from "zod";

export const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(2, "First name must be at least 2 characters")
      .max(20, "First name must be at most 20 characters")
      .regex(/^[A-Za-z]+$/, "First name must contain letters only"),
    lastName: z
      .string()
      .trim()
      .min(2, "Last name must be at least 2 characters")
      .max(20, "Last name must be at most 20 characters")
      .regex(/^[A-Za-z]+$/, "Last name must contain letters only"),
    email: z
      .string()
      .trim()
      .regex(
        /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
        "Email must be a valid email address",
      ),
    phoneNumber: z
      .string()
      .trim()
      .regex(
        /^01[0125][0-9]{8}$/,
        "Phone must be Egyptian number (010,011,012,015) and 8 digits",
      ),
    address: z.object({
      country: z.string().min(1, "Country is required."),
      city: z.string().min(1, "City is required."),
      street: z
        .string()
        .trim()
        .optional()
        .or(z.literal(""))
        .refine(
          (val) => !val || /^[A-Za-z0-9\s]+$/.test(val),
          "Street can contain letters and numbers",
        ),
      state: z.string().min(1, "State is required."),
      zipCode: z
        .string()
        .trim()
        .min(1, "Zip code is required")
        .refine(
          (val) => /^[0-9]{5}$/.test(val),
          "Zip code must be exactly 7 digits",
        ),
    }),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(32, "Password must be at most 32 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character",
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
