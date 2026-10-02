import { useEffect, useState, useRef } from 'react';
import { useVoice } from '@humeai/voice-react';

export function useHumeAudioSkill() {
  const { connect, disconnect, status, messages, error } = useVoice();
  const [audioEmotions, setAudioEmotions] = useState({
    happy: 0,
    surprised: 0,
    angry: 0,
    sad: 0,
    neutral: 1
  });

  const [hasAudioData, setHasAudioData] = useState(false);
  const lastMessageId = useRef(null);

  useEffect(() => {
    // Process the latest user message from Hume to extract vocal emotions
    if (messages && messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      
      // Only process if it's a new user_message with prosody scores
      if (
        latestMessage.type === 'user_message' && 
        latestMessage.id !== lastMessageId.current &&
        latestMessage.models?.prosody?.scores
      ) {
        lastMessageId.current = latestMessage.id;
        const scores = latestMessage.models.prosody.scores;
        setHasAudioData(true);

        // Map Hume's 48 emotions to our 5 core categories
        const getScore = (name) => scores[name] || 0;

        const happy = getScore('Joy') + getScore('Amusement') + getScore('Excitement');
        const surprised = getScore('Surprise (positive)') + getScore('Surprise (negative)');
        const angry = getScore('Anger') + getScore('Annoyance');
        const sad = getScore('Sadness') + getScore('Disappointment') + getScore('Distress');
        const curious = getScore('Curiosity') + getScore('Interest') + getScore('Confusion');
        const neutral = getScore('Calm') + getScore('Concentration');

        // Normalize
        const total = happy + surprised + angry + sad + neutral + curious || 1;

        setAudioEmotions({
          happy: happy / total,
          surprised: surprised / total,
          angry: angry / total,
          sad: sad / total,
          curious: curious / total,
          neutral: neutral / total
        });
      }
    }
  }, [messages]);

  return {
    audioEmotions,
    hasAudioData,
    isAudioScanning: status === 'connected',
    audioStatus: status,
    audioError: error,
    startAudio: connect,
    stopAudio: disconnect
  };
}
