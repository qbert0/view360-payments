import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { PaymentConfig } from '#payments/lib/types';

export default defineEventHandler(async event => {
  const runtime = useRuntimeConfig(event);
  if (!import.meta.dev && !runtime.adminKey) throw createError({ statusCode: 503, statusMessage: 'Admin authentication is not configured' });
  const site = (runtime.paymentConfig as PaymentConfig).siteId;
  const root = runtime.bookingStorageDir || (import.meta.dev ? resolve('.data/bookings') : '');
  if (!root) return { items: [] };
  const directory = resolve(root, site);
  let files: string[];
  try { files = await readdir(directory); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { items: [] }; throw error; }
  const items = await Promise.all(files.filter(file => /^[a-f0-9-]{36}\.json$/i.test(file)).map(async file => JSON.parse(await readFile(resolve(directory, file), 'utf8'))));
  setHeader(event, 'Cache-Control', 'no-store');
  return { items: items.sort((a,b) => b.createdAt.localeCompare(a.createdAt)) };
});
