import { render } from '@testing-library/react';
import React from 'react';
import App from './src/App.jsx';
import { describe, it, vi } from 'vitest';

vi.mock('@vladmandic/face-api', () => ({
  nets: {},
  detectSingleFace: vi.fn(),
  TinyFaceDetectorOptions: vi.fn(),
  draw: {}
}));

describe('App', () => {
  it('renders without crashing', () => {
    try {
      render(<App />);
      console.log("Rendered successfully");
    } catch (e) {
      console.error("Render error:", e);
      throw e;
    }
  });
});
