import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

/**
 * Request validation middleware factory.
 * Validates request body, params, or query against a Zod schema.
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: {
          message: 'Validation error',
          details: result.error.issues.map((i) => ({
            field: i.path.join('.'),
            message: i.message,
          })),
        },
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

export function validateParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      res.status(400).json({
        error: {
          message: 'Invalid parameters',
          details: result.error.issues.map((i) => ({
            field: i.path.join('.'),
            message: i.message,
          })),
        },
      });
      return;
    }
    next();
  };
}

/** Common validation schemas */
export const documentIdSchema = z.object({
  id: z.string().uuid('Invalid document ID format'),
});

export const documentTypeSchema = z.object({
  documentType: z.enum(['freelance_services', 'residential_lease'], {
    errorMap: () => ({ message: 'Document type must be "freelance_services" or "residential_lease"' }),
  }),
});
