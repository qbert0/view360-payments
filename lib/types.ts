export type SiteId = 'song-van' | 'duc-thuy';
export interface TicketOption {
  id: string;
  label: string;
  description: string;
  includes: string[];
  /** null = price requires confirmation; zero explicitly means free. */
  price: number | null;
}
export interface PaymentConfig {
  siteId: SiteId;
  name: string;
  introduction: string;
  tickets: TicketOption[];
}
export interface BookingRequest {
  requestId: string;
  ticketId: string;
  eventId?: string;
  visitDate: string;
  quantity: number;
  name: string;
  phone: string;
}
export interface BookingResult {
  id: string;
  status: 'received';
  payment: 'not-required' | 'awaiting-quote' | 'pending';
  total: number | null;
  /** Only a server-created payment provider checkout URL. */
  checkoutUrl?: string;
}
export interface BookingAdapter {
  submit(input: BookingRequest): Promise<BookingResult>;
}
