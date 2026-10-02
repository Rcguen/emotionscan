import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EmotionScanner from '../components/EmotionScanner';
import { useFaceApiSkill } from '../hooks/useFaceApiSkill';
import { useHumeAudioSkill } from '../hooks/useHumeAudioSkill';

// Mock the hooks
vi.mock('../hooks/useFaceApiSkill', () => ({
  useFaceApiSkill: vi.fn()
}));

vi.mock('../hooks/useHumeAudioSkill', () => ({
  useHumeAudioSkill: vi.fn()
}));

describe('EmotionScanner Component', () => {
  const mockStartScanning = vi.fn();
  const mockStopScanning = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default hook return value
    useFaceApiSkill.mockReturnValue({
      topEmotions: [],
      isScanning: false,
      error: null,
      startScanning: mockStartScanning,
      stopScanning: mockStopScanning
    });

    useHumeAudioSkill.mockReturnValue({
      audioEmotions: {},
      isAudioScanning: false,
      audioStatus: 'disconnected',
      audioError: null,
      startAudio: vi.fn(),
      stopAudio: vi.fn()
    });

    // Mock getUserMedia
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: vi.fn() }],
        }),
      },
      configurable: true,
    });
  });

  it('renders initial state correctly', () => {
    render(<EmotionScanner />);
    expect(screen.getByText('EmotionScan')).toBeInTheDocument();
    expect(screen.getByText('INITIALIZE SENSORS')).toBeInTheDocument();
  });

  it('calls startScanning when button is clicked', async () => {
    render(<EmotionScanner />);
    
    await act(async () => {
      fireEvent.click(screen.getByText('INITIALIZE SENSORS'));
    });
    
    expect(global.navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({ video: true, audio: true });
  });

  it('displays emotions when scanning', () => {
    useFaceApiSkill.mockReturnValue({
      topEmotions: [
        { name: 'happy', score: 0.85 },
        { name: 'neutral', score: 0.15 }
      ],
      isScanning: true,
      error: null,
      startScanning: mockStartScanning,
      stopScanning: mockStopScanning
    });

    render(<EmotionScanner />);
    
    expect(screen.getAllByText('happy').length).toBeGreaterThan(0);
    expect(screen.getByText('85.0')).toBeInTheDocument();
    expect(screen.getByText('TERMINATE')).toBeInTheDocument();
  });
});
