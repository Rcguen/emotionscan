# Real-time Client-side Emotion AI Scanner

A React application that leverages client-side WebAssembly inference to detect and display real-time facial emotions directly in your browser.

## Tech Stack
- **React** & **Vite**
- **Tailwind CSS v4**
- **Google MediaPipe (WebAssembly)**
- **Vitest** for TDD

## Core Engineering Highlights
- **Zero Server Latency & No API Keys**: 100% offline inference running entirely on your local machine. No external servers or API rate limits.
- **Advanced Facial Muscle Tracking**: The custom `useMediaPipeSkill` hooks into Google's Vision models, mapping 52 raw facial muscle blendshapes into a normalized array of real-time emotional telemetry (Happy, Surprised, Angry, Sad, Neutral).
- **Strict TDD Methodology**: Architected utilizing a strict 6-phase Test-Driven Development (TDD) engineering pipeline (Plan, Test, Implement, Review, Verify, Document).
- **Optimized Memory Management**: Robust React hooks that safely initialize, throttle via `requestAnimationFrame`, and automatically garbage-collect the 15MB WebAssembly `FaceLandmarker` instances to completely eliminate memory leaks.

## Setup & Run Instructions
1. Install the dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Run the Vitest TDD test suite:
   ```bash
   npm run test
   ```
4. Compile and minify for production:
   ```bash
   npm run build
   ```
