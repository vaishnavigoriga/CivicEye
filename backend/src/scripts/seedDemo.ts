/** Adds clearly labelled DEMO records to a real MongoDB. Equivalent to SEED_DEMO_DATA=true at startup. */
import { connectDB, disconnectDB } from '../config/db';
import { ensureDepartments, seedDemoData } from '../services/seedService';

(async () => {
  await connectDB();
  await ensureDepartments();
  const n = await seedDemoData();
  console.log(n ? `Seeded ${n} DEMO complaints.` : 'DEMO data already present. Nothing changed.');
  await disconnectDB();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
