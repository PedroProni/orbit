import { chmodSync, writeFileSync } from 'node:fs';
import mongoose from 'mongoose';
import { LocalStore } from '../import/local-store';
import { issueAccessLinks } from './access-link.runner';

const arg = (name: string): string | undefined => {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
};

async function main(): Promise<void> {
  const uri = arg('mongo-uri');
  const out = arg('out');
  const baseUrl = arg('base-url');
  if (!uri || !out || !baseUrl) throw new Error('Usage: --mongo-uri <uri> --base-url <url> --out <file> (--email <address> | --all) [--allow-remote]');
  if (!process.argv.includes('--allow-remote')) LocalStore.assertLocal(uri);
  const connection = await mongoose.createConnection(uri).asPromise();
  try {
    const rows = await issueAccessLinks(connection, { email: arg('email'), all: process.argv.includes('--all'), baseUrl, now: new Date() });
    writeFileSync(out, rows.map(row => `${row.email}\t${row.kind}\t${row.expiresAt.toISOString()}\t${row.link}`).join('\n') + '\n', { mode: 0o600 });
    chmodSync(out, 0o600);
    console.log(JSON.stringify({ issued: rows.length, invite: rows.filter(row => row.kind === 'invite').length, reset: rows.filter(row => row.kind === 'reset').length, out }));
  } finally {
    await connection.close();
  }
}

main().catch((error: Error) => {
  console.error(error.message);
  process.exit(1);
});
