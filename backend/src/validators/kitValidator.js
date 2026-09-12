const { z } = require('zod');

const createKitSchema = z.object({
  jobDescription: z.string().min(50, 'Job description must be at least 50 characters long'),
  companyUrl: z.string().optional().or(z.literal('')),
  companyName: z.string().optional().or(z.literal('')),
  roleTitle: z.string().optional().or(z.literal('')),
  seniorityLevel: z.string().optional().or(z.literal('')),
  daysAvailable: z.number().int().min(1, 'Days available must be at least 1 day').max(30, 'Days available cannot exceed 30 days').default(5)
});

function validateKitInput(data) {
  return createKitSchema.safeParse(data);
}

module.exports = { createKitSchema, validateKitInput };
