import React from 'react';
import EmotionScanner from './components/EmotionScanner';
import { VoiceProvider } from '@humeai/voice-react';

function App() {
  const API_KEY = import.meta.env.VITE_HUME_API_KEY || "";

  return (
    <VoiceProvider auth={{ type: 'apiKey', value: API_KEY }}>
      <EmotionScanner />
    </VoiceProvider>
  );
}

export default App;
