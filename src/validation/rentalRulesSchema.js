import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const rentalRulesSchema = z.object({
  checkInTime: z.string().regex(timeRegex, "Must be a valid time (HH:MM)"),
  checkOutTime: z.string().regex(timeRegex, "Must be a valid time (HH:MM)"),
  minNights: z
    .number({ invalid_type_error: "Required" })
    .int()
    .min(1, "Minimum 1 night"),
  weeklyDiscount: z
    .number({ invalid_type_error: "Must be a number" })
    .min(0)
    .max(100)
    .nullable()
    .optional(),
  monthlyDiscount: z
    .number({ invalid_type_error: "Must be a number" })
    .min(0)
    .max(100)
    .nullable()
    .optional(),
});
