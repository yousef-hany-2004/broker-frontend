import { z } from "zod";

export const forgetPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .regex(
      /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
      "Email must be a valid email address",
    ),
});
