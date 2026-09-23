import { z } from "zod";

export const createAnnouncementSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Titre trop court (3 caractères minimum)")
    .max(120, "Titre trop long (120 caractères maximum)"),

  description: z
    .string()
    .trim()
    .max(5000, "Description trop longue (5000 caractères maximum)")
    .optional()
    .nullable(),

  jobTypeId: z.string().min(1, "Poste invalide"),
  regionId: z.string().min(1, "Localisation invalide"),

  city: z.string().trim().max(100).optional().nullable(),

  salaryMin: z
    .number({ error: "Salaire invalide" })
    .min(10000, "Salaire minimum 10 000 F")
    .max(10_000_000, "Salaire trop élevé")
    .finite()
    .optional()
    .nullable(),

  salaryPeriod: z.enum(["HEURE", "JOUR", "SEMAINE", "MOIS"]).optional().nullable(),
  workArrangement: z.enum(["NAVETTE", "LOGE_SUR_PLACE"]).optional().nullable(),
  shift: z.enum(["JOUR", "NUIT"]).optional().nullable(),
  contractDuration: z.enum(["TEMPORAIRE", "PERMANENT"]).optional().nullable(),

  workDays: z.array(z.string().max(20)).max(7).optional(),

  workStartTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Heure invalide (format HH:MM)")
    .optional()
    .nullable(),

  workEndTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Heure invalide (format HH:MM)")
    .optional()
    .nullable(),

  experienceYearsRequired: z.number().int().min(0).max(50).optional().nullable(),
  isUrgent: z.boolean().optional(),

  contactPhone: z
    .string()
    .regex(/^\+?[0-9\s-]{8,20}$/, "Numéro de téléphone invalide")
    .optional()
    .nullable(),

  contactWhatsapp: z
    .string()
    .regex(/^\+?[0-9\s-]{8,20}$/, "Numéro WhatsApp invalide")
    .optional()
    .nullable(),
});

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;