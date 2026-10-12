import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { validateBooking } from '#payments/lib/booking';
import type { BookingRequest, BookingResult, PaymentConfig } from '#payments/lib/types';

export default defineEventHandler(async event => {
  setHeader(event, 'Cache-Control', 'no-store');
  const runtime = useRuntimeConfig(event);
  const config = runtime.paymentConfig as PaymentConfig;
  const input = await readBody<BookingRequest>(event);
  let total: number | null;
  try { ({ total } = validateBooking(input, config)); }
  catch (error) { throw createError({ statusCode: 400, statusMessage: 'Invalid booking', data: { message: (error as Error).message } }); }
  // Production must explicitly use a persistent volume. Serverless /tmp is not a booking database.
  const root = runtime.bookingStorageDir || (import.meta.dev ? resolve('.data/bookings') : '');
  if (!root) throw createError({ statusCode: 503, data: { message: 'Chức năng tiếp nhận đăng ký chưa được mở. Vui lòng quay lại sau.' } });
  if (total !== null && total > 0) throw createError({ statusCode: 503, data: { message: 'Chương trình có phí chưa được kết nối cổng thanh toán.' } });
  const directory = resolve(root, config.siteId);
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const file = resolve(directory, `${input.requestId}.json`);
  // Pick fields explicitly: no price, site, payment status or arbitrary payload from client.
  const booking = { ticketId: input.ticketId, eventId: input.eventId ?? null, visitDate: input.visitDate, quantity: input.quantity, name: input.name.trim(), phone: input.phone.trim() };
  const result: BookingResult = { id: randomUUID(), status: 'received', total, payment: total === null ? 'awaiting-quote' : 'not-required' };
  try {
    await writeFile(file, JSON.stringify({ siteId: config.siteId, createdAt: new Date().toISOString(), booking, result }), { flag: 'wx', mode: 0o600 });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw createError({ statusCode: 503, data: { message: 'Chưa lưu được yêu cầu. Vui lòng thử lại.' } });
    const previous = JSON.parse(await readFile(file, 'utf8'));
    if (JSON.stringify(previous.booking) !== JSON.stringify(booking)) throw createError({ statusCode: 409, data: { message: 'Mã yêu cầu đã dùng cho nội dung khác.' } });
    return previous.result as BookingResult;
  }
  setResponseStatus(event, 201);
  return result;
});
