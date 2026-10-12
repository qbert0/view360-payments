import type { BookingRequest, PaymentConfig } from './types';

export function localDate(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

export function validateBooking(input: BookingRequest, config: PaymentConfig) {
  if (!input || !/^[a-f0-9-]{36}$/i.test(input.requestId ?? '')) throw new Error('Mã yêu cầu không hợp lệ.');
  const ticket = config.tickets.find(t => t.id === input.ticketId);
  if (!ticket) throw new Error('Hình thức tham quan không tồn tại.');
  if (typeof input.name !== 'string' || !input.name.trim() || input.name.length > 120) throw new Error('Vui lòng nhập họ tên hợp lệ.');
  if (typeof input.phone !== 'string' || !/^\+?[\d ()-]{8,24}$/.test(input.phone)) throw new Error('Số điện thoại không hợp lệ.');
  if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > 100) throw new Error('Số khách phải từ 1 đến 100.');
  const date = input.visitDate;
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date || date < localDate()) throw new Error('Ngày tham quan không hợp lệ hoặc đã qua.');
  if (input.eventId !== undefined && (typeof input.eventId !== 'string' || input.eventId.length > 120)) throw new Error('Mã sự kiện không hợp lệ.');
  const total = ticket.price === null ? null : ticket.price * input.quantity;
  if (total !== null && (!Number.isSafeInteger(total) || total < 0)) throw new Error('Giá vé chưa được cấu hình hợp lệ.');
  return { ticket, total };
}
