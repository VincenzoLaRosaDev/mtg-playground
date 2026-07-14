/**
 * pg v8+ warns when sslmode is require/prefer/verify-ca (treated as verify-full today).
 * Neon docs often use sslmode=require — normalize to verify-full for explicit semantics.
 */
export function normalizePgConnectionString(connectionString: string): string {
  return connectionString.replace(
    /([?&]sslmode=)(require|prefer|verify-ca)(?=(&|$))/i,
    "$1verify-full",
  );
}
