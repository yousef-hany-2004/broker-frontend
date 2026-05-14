import { z } from "zod";

export const paymentMethodBillingSchema = z.object({
  currency: z.string().min(1, "Currency is required."),
  paymentMethod: z.string().min(1, "Please select a payment method type."),
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters.")
    .max(20, "First name must be at most 20 characters.")
    .regex(/^[A-Za-z]+$/, "First name must contain letters only."),
  lastName: z
    .string()
    .trim()
    .min(2, "Last name must be at least 2 characters.")
    .max(20, "Last name must be at most 20 characters.")
    .regex(/^[A-Za-z]+$/, "Last name must contain letters only."),
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
      "Phone must be an Egyptian number (010, 011, 012, 015).",
    ),
  country: z.string().min(1, "Country is required."),
  city: z.string().min(1, "City is required."),
  street: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => !val || /^[A-Za-z0-9\s]+$/.test(val),
      "Street can contain letters and numbers only.",
    ),
  zipCode: z
    .string()
    .trim()
    .min(1, "Zip code is required.")
    .refine(
      (val) => /^[0-9]{5}$/.test(val),
      "Zip code must be exactly 5 digits.",
    ),
});
