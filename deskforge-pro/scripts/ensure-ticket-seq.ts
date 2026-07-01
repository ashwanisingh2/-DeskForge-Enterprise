import {prisma} from '../lib/prisma';

/** Ensures a Postgres sequence `ticket_seq` exists, starting above the current max ticket number. */
async function main() {
  const rows = await prisma.$queryRawUnsafe<{max: number}[]>(
    'SELECT COALESCE(MAX(CAST(SUBSTRING(id FROM 5) AS INTEGER)),0) AS max FROM "Ticket"',
  );
  const max = Number(rows[0].max);
  const start = max + 1;
  await prisma.$executeRawUnsafe('CREATE SEQUENCE IF NOT EXISTS ticket_seq');
  await prisma.$executeRawUnsafe(`SELECT setval('ticket_seq', ${start}, false)`);
  const check = await prisma.$queryRawUnsafe<{last_value: bigint}[]>('SELECT last_value FROM ticket_seq');
  console.log(`ticket_seq ready — next value ${start} (current max TKT-${String(max).padStart(4, '0')}); last_value=${String(check[0].last_value)}`);
}

main()
  .catch((e) => {
    console.error('FAILED:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
