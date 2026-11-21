/**
 * Creates the first administrator against a real MongoDB (MONGO_URI).
 *
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a-long-passphrase' npm run create-admin
 *
 * (With USE_MEMORY_DB=true the database is private to the server process, so set ADMIN_EMAIL and
 * ADMIN_PASSWORD in .env instead and the server creates the account on startup.)
 */
import { connectDB, disconnectDB } from '../config/db';
import { bootstrapAdmin } from '../services/seedService';

(async () => {
  await connectDB();
  const result = await bootstrapAdmin();
  console.log(
    result === 'created' ? 'Administrator created.' : result === 'exists' ? 'An account with that email already exists. Nothing changed.' : 'Set ADMIN_EMAIL and ADMIN_PASSWORD first.',
  );
  await disconnectDB();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
