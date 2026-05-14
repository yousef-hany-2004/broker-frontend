import { z } from "zod";

export const updateProfileSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "First name must be at least 2 characters")
    .max(20, "First name must be at most 20 characters")
    .regex(/^[A-Za-z]+$/, "First name must contain letters only"),
  lastName: z
    .string()
    .trim()
    .min(2, "Last name must be at least 2 characters")
    .max(20, "Last name must be at most 20 characters")
    .regex(/^[A-Za-z]+$/, "Last name must contain letters only"),
  country: z
    .string()
    .trim()
    .min(2, "Country must be at least 2 characters")
    .regex(/^[A-Za-z]+$/, "Country must contain letters only"),
  city: z
    .string()
    .trim()
    .min(2, "City must be at least 2 characters")
    .regex(/^[A-Za-z]+$/, "City must contain letters only"),
  street: z.string().trim().optional().or(z.literal("")),
  state: z
    .string()
    .trim()
    .min(1, "State is required")
    .regex(/^[A-Za-z\s]+$/, "State must contain letters only"),
  zipCode: z
    .string()
    .trim()
    .min(1, "Zip code is required")
    .regex(/^[0-9]{5}$/, "Zip code must be exactly 5 digits"),
});
