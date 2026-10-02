import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useFaceApiSkill } from '../hooks/useFaceApiSkill';
import * as faceapi from '@vladmandic/face-api';

vi.mock('@vladmandic/face-api', () => ({
  nets: {
    tinyFaceDetector: { loadFromUri: vi.fn().mockResolvedValue() },
    faceExpressionNet: { loadFromUri: vi.fn().mockResolvedValue() }
  },
  TinyFaceDetectorOptions: vi.fn(),
  detectSingleFace: vi.fn().mockReturnValue({
    withFaceExpressions: vi.fn().mockResolvedValue({
      expressions: {
        happy: 0.9,
        sad: 0.05,
        angry: 0.02,
        surprised: 0.01,
        neutral: 0.02
      }
    })
  })
}));

vi.mock('@mediapipe/tasks-vision', () => ({
  FilesetResolver: {
    forVisionTasks: vi.fn().mockResolvedValue({})
  },
  FaceLandmarker: {
    createFromOptions: vi.fn().mockResolvedValue({
      close: vi.fn(),
      detectForVideo: vi.fn().mockReturnValue({ faceLandmarks: [] })
    })
  },
  DrawingUtils: vi.fn()
}));

describe('useFaceApiSkill', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes and loads models', async () => {
    const { result } = renderHook(() => useFaceApiSkill());
    expect(result.current.isScanning).toBe(false);
    expect(result.current.topEmotions).toEqual([]);
    
    // Allow models to load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(faceapi.nets.tinyFaceDetector.loadFromUri).toHaveBeenCalled();
    expect(faceapi.nets.faceExpressionNet.loadFromUri).toHaveBeenCalled();
  });
});
