import { z } from 'zod';

// Wallet import schema
export const walletImportSchema = z.object({
  name: z.string().min(1, 'Wallet name is required').max(100, 'Wallet name must be less than 100 characters').default('Imported Wallet'),
  balance: z.preprocess(
    (val) => {
      const num = parseFloat(String(val));
      return isNaN(num) ? 0 : num;
    },
    z.number().finite().safe()
  ),
  currency: z.string().min(1).max(10).regex(/^[A-Z]{3}$/, 'Currency must be a 3-letter code').default('USD'),
});

// Transaction import schema  
export const transactionImportSchema = z.object({
  reason: z.string().min(1, 'Reason is required').max(200, 'Reason must be less than 200 characters').default('Imported Transaction'),
  type: z.enum(['income', 'expense']).default('expense'),
  income: z.preprocess(
    (val) => {
      if (val === null || val === undefined || val === '') return null;
      const num = parseFloat(String(val));
      return isNaN(num) ? null : num;
    },
    z.number().finite().safe().nullable()
  ),
  expense: z.preprocess(
    (val) => {
      if (val === null || val === undefined || val === '') return null;
      const num = parseFloat(String(val));
      return isNaN(num) ? null : num;
    },
    z.number().finite().safe().nullable()
  ),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').default(() => new Date().toISOString().split('T')[0]),
  wallet_id: z.string().uuid('Invalid wallet ID format'),
  category_id: z.preprocess(
    (val) => (val === '' || val === undefined ? null : val),
    z.string().uuid('Invalid category ID format').nullable()
  ),
});

// Transfer import schema
export const transferImportSchema = z.object({
  from_wallet_id: z.string().uuid('Invalid from wallet ID format'),
  to_wallet_id: z.string().uuid('Invalid to wallet ID format'),
  amount: z.preprocess(
    (val) => {
      const num = parseFloat(String(val));
      return isNaN(num) ? 0 : num;
    },
    z.number().finite().safe().positive('Amount must be positive')
  ),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').default(() => new Date().toISOString().split('T')[0]),
  description: z.preprocess(
    (val) => (val === '' || val === undefined ? null : String(val).slice(0, 500)),
    z.string().max(500).nullable()
  ),
  status: z.enum(['pending', 'completed', 'cancelled']).default('completed'),
});

// Category import schema
export const categoryImportSchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Category name must be less than 100 characters').default('Imported Category'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color').default('#3B82F6'),
});

export type WalletImport = z.infer<typeof walletImportSchema>;
export type TransactionImport = z.infer<typeof transactionImportSchema>;
export type TransferImport = z.infer<typeof transferImportSchema>;
export type CategoryImport = z.infer<typeof categoryImportSchema>;

// Helper function to validate and return results
export function validateImportRow<T>(
  schema: z.ZodSchema<T>,
  row: Record<string, unknown>
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(row);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    errors: result.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`),
  };
}
