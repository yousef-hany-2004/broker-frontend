import { z } from "zod";

const PROVIDER_PREFIXES = { 1: "010", 2: "012", 3: "011", 4: "015" };

export const payoutMethodSchema = z
  .object({
    provider: z.string().min(1, "Please select a provider."),

    accountIdentifier: z
      .string()
      .min(1, "Phone number is required.")
      .regex(/^\d{11}$/, "Must be exactly 11 digits.")
      .regex(/^(010|011|012|015)/, "Must start with 010, 011, 012, or 015."),

    accountHolderName: z
      .string()
      .min(2, "Must be at least 2 characters.")
      .regex(
        /^[a-zA-Z\u0600-\u06FF\s]+$/,
        "Letters only, no numbers or symbols.",
      ),

    otpCode: z.string().regex(/^\d{6}$/, "OTP must be exactly 6 digits."),
  })
  .superRefine((data, ctx) => {
    const expected = PROVIDER_PREFIXES[data.provider];
    if (
      expected &&
      data.accountIdentifier &&
      !data.accountIdentifier.startsWith(expected)
    ) {
      ctx.addIssue({
        path: ["accountIdentifier"],
        code: z.ZodIssueCode.custom,
        message: `This provider requires a number starting with ${expected}.`,
      });
    }
  });
