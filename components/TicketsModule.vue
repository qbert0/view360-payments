<script setup lang="ts">
import { computed, ref } from 'vue';
import type { BookingAdapter, BookingResult, PaymentConfig } from '#payments/lib/types';
import { localDate, validateBooking } from '#payments/lib/booking';
import '../payments.css';
const props = defineProps<{ config: PaymentConfig; adapter: BookingAdapter; eventId?: string; initialTicketId?: string; initialVisitDate?: string }>();
const emit = defineEmits<{ notification: [message: string, kind: 'success' | 'error'] }>();
const ticketId = ref(
  props.config.tickets.find(ticket => ticket.id === props.initialTicketId)?.id
  ?? props.config.tickets[0]?.id
  ?? '',
);
const visitDate = ref(props.initialVisitDate ?? '');
const name = ref('');
const phone = ref('');
const quantity = ref(1);
const consent = ref(false);
const busy = ref(false);
const error = ref('');
const result = ref<BookingResult | null>(null);
let requestId = '';
let lastPayload = '';
const ticket = computed(() => props.config.tickets.find(t => t.id === ticketId.value));
const total = computed(() => ticket.value?.price == null ? null : ticket.value.price * quantity.value);
function price(value: number | null) { return value === null ? 'Chờ xác nhận chi phí' : value === 0 ? 'Miễn phí' : value.toLocaleString('vi-VN') + ' ₫'; }
async function submit() {
  if (busy.value || result.value) return;
  error.value = '';
  try {
    if (!consent.value) throw new Error('Vui lòng đồng ý cung cấp thông tin liên hệ.');
    const payload = { ticketId: ticketId.value, eventId: props.eventId, visitDate: visitDate.value, name: name.value.trim(), phone: phone.value.trim(), quantity: quantity.value };
    const fingerprint = JSON.stringify(payload);
    if (fingerprint !== lastPayload) { requestId = crypto.randomUUID(); lastPayload = fingerprint; }
    const input = { ...payload, requestId };
    validateBooking(input, props.config);
    busy.value = true;
    result.value = await props.adapter.submit(input);
    emit('notification', 'Yêu cầu đã được lưu, đang chờ xác nhận lịch.', 'success');
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Không gửi được yêu cầu. Vui lòng thử lại.';
    emit('notification', error.value, 'error');
  } finally { busy.value = false; }
}
const checkoutUrl = computed(() => {
  try { const url = new URL(result.value?.checkoutUrl ?? ''); return url.protocol === 'https:' ? url.href : undefined; } catch { return undefined; }
});
function reset() { result.value = null; requestId = ''; lastPayload = ''; }
</script>
<template>
  <main class="visit-module">
    <p class="visit-muted">{{ config.name }} · Tham quan</p><h1>Đăng ký lịch tham quan</h1>
    <p>Gửi ngày dự kiến và nhu cầu của bạn. Lịch tham quan chỉ có hiệu lực sau khi đơn vị tổ chức xác nhận.</p>
    <div v-if="result" class="visit-notice" role="status">
      <h2>Đã lưu yêu cầu {{ result.id }}</h2><p>Yêu cầu đang chờ xử lý, chưa phải vé vào cửa hay xác nhận lịch.</p>
      <p v-if="result.payment === 'awaiting-quote'">Chi phí sẽ được xác nhận sau.</p>
      <p v-else-if="result.payment === 'pending'">Chưa thanh toán · {{ price(result.total) }}</p>
      <p v-else>Không yêu cầu thanh toán.</p>
      <a v-if="checkoutUrl && result.payment === 'pending'" :href="checkoutUrl" class="visit-button" rel="noopener noreferrer">Tiếp tục thanh toán</a>
      <button class="visit-button" @click="reset">Tạo yêu cầu khác</button>
    </div>
    <form v-else @submit.prevent="submit">
      <fieldset :disabled="busy" class="visit-grid">
        <div><h2>Hình thức tham quan</h2>
          <label v-for="option in config.tickets" :key="option.id" class="visit-card" :class="{ selected: ticketId === option.id }">
            <input v-model="ticketId" type="radio" :value="option.id" name="ticket" /> {{ option.label }}
            <p>{{ option.description }}</p><ul><li v-for="line in option.includes" :key="line">{{ line }}</li></ul><p>{{ price(option.price) }}</p>
          </label>
        </div>
        <div class="visit-card"><h2>Thông tin đăng ký</h2>
          <label>Ngày tham quan<input v-model="visitDate" type="date" :min="localDate()" required /></label>
          <label>Số khách<input v-model.number="quantity" type="number" min="1" max="100" step="1" required /></label>
          <label>Họ tên<input v-model="name" autocomplete="name" maxlength="120" required /></label>
          <label>Số điện thoại<input v-model="phone" type="tel" autocomplete="tel" maxlength="24" required /></label>
          <label><input v-model="consent" type="checkbox" required /> Tôi đồng ý cung cấp thông tin để xử lý yêu cầu và liên hệ xác nhận.</label>
          <p>Tổng dự kiến: <strong>{{ price(total) }}</strong></p>
          <p v-if="error" class="visit-notice visit-error" role="alert">{{ error }}</p>
          <button class="visit-button" :disabled="busy || !ticket" type="submit">{{ busy ? 'Đang gửi…' : 'Gửi yêu cầu' }}</button>
        </div>
      </fieldset>
    </form>
  </main>
</template>
