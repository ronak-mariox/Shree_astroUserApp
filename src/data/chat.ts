import type { ImageSourcePropType } from 'react-native';

import type { ChatMessage } from '../components/ChatBubble';

/** The AI assistant's identity and opening turn (Figma node 180:163495). */
export const assistant = {
  name: 'AI Astrology Assistant',
  status: 'Online',
  avatar: require('../assets/images/ai-assistant.png') as ImageSourcePropType,
};

export const openingMessages: ReadonlyArray<ChatMessage> = [
  {
    id: 'welcome',
    role: 'assistant',
    text: 'Namaste! 🙏 I am your AI Astrology Assistant. I can answer questions about your birth chart, planetary transits, compatibility, and more. How may I guide you today?',
  },
];

export const suggestedPrompts: ReadonlyArray<string> = [
  'What does my Jupiter placement mean?',
  'When will my Saturn Mahadasha end?',
  'Is 2026 good for career growth?',
  'Tell me about my Lagna lord',
];
