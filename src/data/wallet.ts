/**
 * The wallet and top-up flow Figma pinned across five frames
 * (180:163074 Wallet, 180:163233 Add Money, 180:163307 Payment,
 * 180:163391 Processing, 180:163421 Success).
 */

export const wallet = {
  balance: '₹ 1,250',
  balanceValue: 1250,
  equivalent: '≈ 62 mins of chat consultation',
  totalSpent: '₹3,240',
  totalAdded: '₹4,500',
};

/** Preset top-ups on the wallet screen. */
export const quickAddAmounts = [100, 500, 1000, 2000];

/** Preset top-ups on the add-money screen, where 1000 reads as "₹1K". */
export const quickSelectAmounts = [
  { value: 100, label: '₹100' },
  { value: 200, label: '₹200' },
  { value: 500, label: '₹500' },
  { value: 1000, label: '₹1K' },
  { value: 2000, label: '₹2K' },
  { value: 5000, label: '₹5K' },
];

export const amountLimits = { min: 100, max: 50000 };

export type RechargeOption = {
  amount: number;
  /** Credited alongside `amount` once payment succeeds — see services/api.ts's startTopUp/confirmTopUp; there is no real payment gateway yet, so this is the whole recharge program, not just a display number. */
  bonus: number;
  /** The one tile Figma marks "Most Popular" (node 180:151580) and the low-balance popup selects by default. */
  popular?: boolean;
};

/** The low-balance popup's fixed recharge tiers (Figma node 180:151551). */
export const rechargeOptions: ReadonlyArray<RechargeOption> = [
  { amount: 20, bonus: 10 },
  { amount: 50, bonus: 25 },
  { amount: 100, bonus: 50 },
  { amount: 200, bonus: 100 },
  { amount: 500, bonus: 250, popular: true },
  { amount: 1000, bonus: 150 },
];

/** Shown as the popup's payment breakdown — not actually collected anywhere yet (see the note on RechargeOption). */
export const RECHARGE_GST_PERCENT = 18;

export type Transaction = {
  id: string;
  title: string;
  timestamp: string;
  amount: string;
  /** Credits show a green tile and a leading plus. */
  credit: boolean;
};

export const transactions: ReadonlyArray<Transaction> = [
  {
    id: 't-1',
    title: 'Added to Wallet',
    timestamp: '13 Jul 2026 · 9:15 AM',
    amount: '+₹500',
    credit: true,
  },
  {
    id: 't-2',
    title: 'Chat – Pt. Rajesh Sharma',
    timestamp: '12 Jul 2026 · 11:32 AM',
    amount: '₹640',
    credit: false,
  },
  {
    id: 't-3',
    title: 'Voice – Kavita Joshi',
    timestamp: '8 Jul 2026 · 3:44 PM',
    amount: '₹270',
    credit: false,
  },
  {
    id: 't-4',
    title: 'Added to Wallet',
    timestamp: '5 Jul 2026 · 2:10 PM',
    amount: '+₹1000',
    credit: true,
  },
  {
    id: 't-5',
    title: 'Chat – Dr. Suresh Patel',
    timestamp: '1 Jul 2026 · 10:05 AM',
    amount: '₹375',
    credit: false,
  },
];

export type PaymentMethodId = 'upi' | 'card' | 'netbanking';

export const paymentMethods: ReadonlyArray<{
  id: PaymentMethodId;
  glyph: string;
  name: string;
  detail: string;
}> = [
  { id: 'upi', glyph: '📱', name: 'UPI', detail: 'GPay, PhonePe, Paytm' },
  {
    id: 'card',
    glyph: '💳',
    name: 'Credit / Debit Card',
    detail: 'Visa, Mastercard, RuPay',
  },
  {
    id: 'netbanking',
    glyph: '🏦',
    name: 'Net Banking',
    detail: 'All major banks',
  },
];

/** The receipt Figma shows after a successful top-up. */
export const receipt = {
  transactionId: 'TXN26071312345',
  method: 'UPI (GPay)',
  dateTime: '13 Jul 2026, 12:34 PM',
  previousBalance: '₹750',
  newBalance: '₹1,250',
};

/**
 * Confetti scattered behind the success screen, as percentages of the 390 x 844
 * frame Figma drew them on (nodes 180:163468 – 180:163475).
 */
export const confetti = [
  { left: 10.0, top: 15.0, color: '#FF8C00' },
  { left: 21.0, top: 35.0, color: '#FF4E00' },
  { left: 32.0, top: 55.0, color: '#22C55E' },
  { left: 43.0, top: 15.0, color: '#6366F1' },
  { left: 54.0, top: 35.0, color: '#FF8C00' },
  { left: 65.0, top: 55.0, color: '#FF4E00' },
  { left: 76.0, top: 15.0, color: '#22C55E' },
  { left: 87.0, top: 35.0, color: '#6366F1' },
];
