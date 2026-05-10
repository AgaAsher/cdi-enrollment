// Usage: node scripts/hash-password.mjs <password>
// Prints a scrypt hash in salt:hash format. Paste into ADMIN_PASSWORD_HASH in .env.local

import { scryptSync, randomBytes } from "crypto";

const password = process.argv[2];
if (!password) {
  console.error("Usage: node scripts/hash-password.mjs <password>");
  process.exit(1);
}
if (password.length < 12) {
  console.error("Password must be at least 12 characters");
  process.exit(1);
}

const salt = randomBytes(16).toString("hex");
const hash = scryptSync(password, salt, 64).toString("hex");
console.log(`${salt}:${hash}`);
