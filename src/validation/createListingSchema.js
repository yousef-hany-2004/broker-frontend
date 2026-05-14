import { z } from "zod";

export const createListingSchema = z.object({
  // Step 1
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be at most 100 characters"),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description must be at most 1000 characters"),
  type: z.coerce
    .number({ required_error: "Type is required" })
    .refine((v) => [1, 2].includes(v), "Invalid type"),
  intent: z.coerce
    .number({ required_error: "Intent is required" })
    .refine((v) => [1, 2].includes(v), "Invalid intent"), // fixed: was [1, 3]
  areaSize: z.coerce
    .number({ required_error: "Area size is required" })
    .positive("Area size must be greater than 0"),
  bedrooms: z.coerce.number().int().min(0).optional().nullable(),
  bathrooms: z.coerce.number().int().min(0).optional().nullable(),

  // Step 2
  latitude: z
    .number({ required_error: "Please pick a location on the map" })
    .nullable()
    .refine((v) => v !== null, "Please pick a location on the map"),
  longitude: z
    .number({ required_error: "Please pick a location on the map" })
    .nullable()
    .refine((v) => v !== null, "Please pick a location on the map"),
  country: z.string().min(1, "Country is required"),
  state: z.string().min(1, "State is required"),
  city: z.string().min(1, "City is required"),
  formattedAddress: z.string().min(1, "Address is required"),
  unitOrBuildingNumber: z.string().trim().optional().or(z.literal("")),

  // Step 3
  priceAmount: z.coerce
    .number({ required_error: "Price is required" })
    .positive("Price must be greater than 0"),
  priceCurrency: z.string().trim().min(1, "Currency is required"),
  priceUnit: z.coerce
    .number({ required_error: "Price unit is required" })
    .refine((v) => [1, 2, 3, 4, 5].includes(v), "Invalid price unit"),
});
