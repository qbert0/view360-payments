import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineNuxtConfig({
  alias: { '#payments': root },
  css: [fileURLToPath(new URL('./payments.css', import.meta.url))],
  components: [
    { path: fileURLToPath(new URL('./components', import.meta.url)), prefix: 'Payments' },
  ],
  runtimeConfig: {
    paymentConfig: {},
    bookingStorageDir: '',
  },
});
