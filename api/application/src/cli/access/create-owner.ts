import { chmodSync, writeFileSync } from 'node:fs';
import mongoose from 'mongoose';
import { LocalStore } from '../import/local-store';
import { bootstrapOwner } from './owner-bootstrap.runner';

const arg = (name: string): string | undefined => {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
};

async function main(): Promise<void> {
  const uri = arg('mongo-uri');
  const out = arg('out');
  const baseUrl = arg('base-url');
  const email = arg('email');
  if (!uri || !out || !baseUrl || !email) throw new Error('Usage: --mongo-uri <uri> --email <address> --base-url <url> --out <file> [--name <name>] [--allow-remote]');
  if (!process.argv.includes('--allow-remote')) LocalStore.assertLocal(uri);
  const connection = await mongoose.createConnection(uri).asPromise();
  try {
    const result = await bootstrapOwner(connection, { email, name: arg('name'), baseUrl, now: new Date() });
    writeFileSync(out, `${result.email}\towner\tinvite\t${result.expiresAt.toISOString()}\t${result.link}\n`, { mode: 0o600 });
    chmodSync(out, 0o600);
    console.log(JSON.stringify({ created: true, createdWorkspace: result.createdWorkspace, out }));
  } finally {
    await connection.close();
  }
}

main().catch((error: Error) => {
  console.error(error.message);
  process.exit(1);
});
