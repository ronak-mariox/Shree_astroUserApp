import type { ImageSourcePropType } from 'react-native';

/**
 * The profile branch Figma pinned across five frames (180:163649 Profile,
 * 180:163551 Edit Profile, 180:164193 Transaction History,
 * 180:164348 Consultations, 180:163797 Notifications).
 */

export const account = {
  avatarPhoto: require('../assets/images/edit-profile-avatar.png') as ImageSourcePropType,
  name: 'Arjun Sharma',
  email: 'arjun@example.com',
  sunSign: 'Leo',
  identityLine: 'Leo · 15 Aug 1995 · Mumbai',
  phone: '+91 98765 43210',
  dateOfBirth: '15/08/1999',
  timeOfBirth: '06 : 30 AM',
  placeOfBirth: 'Mumbai, Maharashtra',
  version: 'Shree Astro v1.0.0 · © 2026 Shree Astro Pvt. Ltd.',
};

export const accountStats = [
  { value: '₹1,250', label: 'Wallet' },
  { value: '14', label: 'Consults' },
  { value: '4', label: 'Kundlis' },
];

export type MenuKey =
  | 'editProfile'
  | 'wallet'
  | 'transactions'
  | 'consultations'
  | 'notifications'
  | 'aiAssistant';

/** Each row's tile carries its own 135° gradient (nodes 180:163685 onward). */
export const profileMenu: ReadonlyArray<{
  key: MenuKey;
  label: string;
  from: string;
  to: string;
}> = [
  { key: 'editProfile', label: 'Edit Profile', from: '#FFBF00', to: '#FF8C00' },
  { key: 'wallet', label: 'Wallet', from: '#0EA5E9', to: '#38BDF8' },
  {
    key: 'transactions',
    label: 'Transaction History',
    from: '#10B981',
    to: '#34D399',
  },
  {
    key: 'consultations',
    label: 'Consultation History',
    from: '#FF8C00',
    to: '#FF4E00',
  },
  {
    key: 'notifications',
    label: 'Notifications',
    from: '#EC4899',
    to: '#F472B6',
  },
  {
    key: 'aiAssistant',
    label: 'AI Astrology Assistant',
    from: '#6366F1',
    to: '#818CF8',
  },
];

export type LedgerFilter = 'all' | 'added' | 'spent';

export const ledgerFilters: ReadonlyArray<{
  key: LedgerFilter;
  label: string;
}> = [
  { key: 'all', label: 'All' },
  { key: 'added', label: '↑ Added' },
  { key: 'spent', label: '↓ Spent' },
];

export type LedgerEntry = {
  id: string;
  title: string;
  detail: string;
  timestamp: string;
  amount: string;
  reference: string;
  credit: boolean;
};

export const ledger: ReadonlyArray<LedgerEntry> = [
  { id: 'l-1', title: 'Wallet Top-up', detail: 'UPI – GPay', timestamp: '13 Jul 2026 · 12:34 PM', amount: '+₹500', reference: '71312345', credit: true },
  { id: 'l-2', title: 'Chat Consultation', detail: 'Pt. Rajesh Sharma · 32 min', timestamp: '12 Jul 2026 · 11:32 AM', amount: '-₹640', reference: '71211231', credit: false },
  { id: 'l-3', title: 'Voice Consultation', detail: 'Kavita Joshi · 18 min', timestamp: '8 Jul 2026 · 3:44 PM', amount: '-₹270', reference: '70833412', credit: false },
  { id: 'l-4', title: 'Wallet Top-up', detail: 'Debit Card – HDFC', timestamp: '5 Jul 2026 · 2:10 PM', amount: '+₹1000', reference: '70521001', credit: true },
  { id: 'l-5', title: 'Chat Consultation', detail: 'Dr. Suresh Patel · 25 min', timestamp: '1 Jul 2026 · 10:05 AM', amount: '-₹375', reference: '70110055', credit: false },
  { id: 'l-6', title: 'Wallet Top-up', detail: 'Net Banking – SBI', timestamp: '25 Jun 2026 · 6:20 PM', amount: '+₹2000', reference: '62518202', credit: true },
  { id: 'l-7', title: 'Voice Consultation', detail: 'Guru Prakash Das · 12 min', timestamp: '20 Jun 2026 · 8:15 AM', amount: '-₹420', reference: '62008151', credit: false },
];

export type Channel = 'chat' | 'voice';

export const consultationFilters: ReadonlyArray<{
  key: 'all' | Channel;
  label: string;
}> = [
  { key: 'all', label: 'All' },
  { key: 'chat', label: 'Chat' },
  { key: 'voice', label: 'Voice' },
];

export const consultationHistory: ReadonlyArray<{
  id: string;
  astrologer: string;
  photo: ImageSourcePropType;
  topic: string;
  timestamp: string;
  amount: string;
  duration: string;
  channel: Channel;
}> = [
  { id: 'c-1', astrologer: 'Pt. Rajesh Sharma', photo: require('../assets/images/astrologer-rajesh.png'), topic: 'Career & Finance', timestamp: '12 Jul 2026 · 11:00 AM', amount: '-₹640', duration: '32 min', channel: 'chat' },
  { id: 'c-2', astrologer: 'Kavita Joshi', photo: require('../assets/images/astrologer-kavita.png'), topic: 'Marriage & Relationships', timestamp: '8 Jul 2026 · 3:30 PM', amount: '-₹270', duration: '18 min', channel: 'voice' },
  { id: 'c-3', astrologer: 'Dr. Suresh Patel', photo: require('../assets/images/astrologer-suresh.jpg'), topic: 'Vastu & Property', timestamp: '1 Jul 2026 · 10:00 AM', amount: '-₹375', duration: '25 min', channel: 'chat' },
  { id: 'c-4', astrologer: 'Guru Prakash Das', photo: require('../assets/images/astro-guru.jpg'), topic: 'General Kundli Analysis', timestamp: '20 Jun 2026 · 8:00 AM', amount: '-₹420', duration: '12 min', channel: 'voice' },
];

/** Tint behind a notification's glyph, keyed by what the alert is about. */
export type NotificationTint = 'warm' | 'lilac' | 'mint';

export const notifications: ReadonlyArray<{
  id: string;
  glyph: string;
  tint: NotificationTint;
  title: string;
  body: string;
  time: string;
  unread: boolean;
}> = [
  { id: 'n-1', glyph: '☿', tint: 'warm', title: 'Mercury goes Direct today!', body: 'Mercury retrograde ends today. Favorable time for signing contracts and new communications.', time: '2 hrs ago', unread: true },
  { id: 'n-2', glyph: '⏰', tint: 'lilac', title: 'Consultation Reminder', body: 'Your scheduled session with Pt. Rajesh Sharma starts in 30 minutes.', time: '5 hrs ago', unread: true },
  { id: 'n-3', glyph: '💰', tint: 'mint', title: 'Wallet Credited ₹500', body: 'Your wallet has been successfully topped up with ₹500 via UPI.', time: 'Yesterday', unread: false },
  { id: 'n-4', glyph: '♌', tint: 'warm', title: "Today's Horoscope Ready", body: 'Your daily Leo horoscope for 13 July 2026 is now available. Tap to read.', time: 'Yesterday', unread: false },
  { id: 'n-5', glyph: '✅', tint: 'lilac', title: 'Consultation Completed', body: 'Your 32-minute chat with Pt. Rajesh Sharma has ended. ₹640 deducted.', time: '2 days ago', unread: false },
  { id: 'n-6', glyph: '🌕', tint: 'warm', title: 'Full Moon Alert', body: 'Full Moon in Capricorn on 15 July. Significant planetary alignment affecting your career house.', time: '3 days ago', unread: false },
];
