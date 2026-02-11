import { z } from "zod";

const trimmedString = z.string().trim();
const optionalTrimmedString = z.preprocess(
  (value) => (typeof value === "string" ? value.trim() : value),
  z.string().max(500).optional().or(z.literal("")),
);

const baseSchema = z.object({
  formId: z.enum(["contact", "request_proposal"]),
  name: trimmedString.min(2).max(120),
  email: trimmedString.email().max(254),
  sourcePage: trimmedString.max(120).optional().default(""),
  honeypot: z.string().optional().default(""),
  turnstileToken: trimmedString.min(1, "Missing anti-bot token"),
});

export const contactFormSchema = baseSchema.extend({
  formId: z.literal("contact"),
  phone: z
    .string()
    .trim()
    .max(40)
    .optional()
    .or(z.literal("")),
  message: trimmedString.min(10).max(4000),
});

export const requestProposalFormSchema = baseSchema.extend({
  formId: z.literal("request_proposal"),
  phone: trimmedString.min(7).max(40),
  propertyType: trimmedString.min(1).max(160),
  bestTimeToCall: optionalTrimmedString,
  buildingSize: optionalTrimmedString,
  buildingAddress: optionalTrimmedString,
  heardAboutUs: optionalTrimmedString,
  additionalInfo: z
    .string()
    .trim()
    .max(4000)
    .optional()
    .or(z.literal("")),
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;
export type RequestProposalFormInput = z.infer<typeof requestProposalFormSchema>;
