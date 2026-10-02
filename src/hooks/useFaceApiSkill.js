import { useState, useRef, useCallback, useEffect } from 'react';
import * as faceapi from '@vladmandic/face-api';
import { FilesetResolver, FaceLandmarker, DrawingUtils } from '@mediapipe/tasks-vision';

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';

export function useFaceApiSkill() {
  const [topEmotions, setTopEmotions] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  const animationRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const lastUpdateRef = useRef(0);
  
  const mpLandmarkerRef = useRef(null);
  const drawingUtilsRef = useRef(null);

  // Initialize both Neural Networks (Face-API for emotion, MediaPipe for 3D Mesh)
  useEffect(() => {
    let isMounted = true;
    const loadModels = async () => {
      try {
        // 1. Load Face-API for high-accuracy ML emotions
        const faceApiPromise = Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
        ]);

        // 2. Load MediaPipe strictly for the 478-point 3D web warp
        const mpPromise = async () => {
          const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm");
          return FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
              delegate: "GPU"
            },
            outputFaceBlendshapes: true, // Re-enabled to heuristically calculate 'Curious'
            outputFaceTransformationMatrixes: true,
            runningMode: "VIDEO",
            numFaces: 1
          });
        };

        const [, landmarker] = await Promise.all([faceApiPromise, mpPromise()]);

        if (isMounted) {
          mpLandmarkerRef.current = landmarker;
          setModelsLoaded(true);
        } else {
          landmarker.close();
        }
      } catch (err) {
        console.error("Failed to load Dual AI models", err);
        if (isMounted) setError("Failed to initialize Dual AI models.");
      }
    };
    loadModels();

    return () => {
      isMounted = false;
      if (mpLandmarkerRef.current) {
        mpLandmarkerRef.current.close();
        mpLandmarkerRef.current = null;
      }
    };
  }, []);

  const predictWebcam = useCallback(async () => {
    if (!videoRef.current || !isScanning) return;

    let startTimeMs = performance.now();
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video.videoWidth > 0 && canvas) {
      if (canvas.width !== video.videoWidth) {
        // Only update intrinsic size, do not mutate CSS so object-cover works perfectly
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
    }
    
    if (video.currentTime > 0) {
      try {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        let curiousScore = 0;

        // 1. DUAL ENGINE: Run MediaPipe for the 3D Web Warp & Blendshapes
        if (mpLandmarkerRef.current) {
          const mpResult = mpLandmarkerRef.current.detectForVideo(video, startTimeMs);
          if (mpResult && mpResult.faceLandmarks && mpResult.faceLandmarks.length > 0) {
            
            // Heuristically calculate "Curious" from muscle blendshapes
            if (mpResult.faceBlendshapes && mpResult.faceBlendshapes.length > 0) {
              const shapes = mpResult.faceBlendshapes[0].categories;
              const getB = (name) => shapes.find(c => c.categoryName === name)?.score || 0;
              
              // Curiosity often involves asymmetrical eyebrows and slight squinting
              const browAsymmetry = Math.abs(getB('browOuterUpLeft') - getB('browOuterUpRight'));
              const innerUp = getB('browInnerUp');
              const squint = (getB('eyeSquintLeft') + getB('eyeSquintRight')) / 2;
              
              curiousScore = (browAsymmetry * 2.0) + (innerUp * 0.5) + (squint * 0.5);
            }

            if (!drawingUtilsRef.current) {
              drawingUtilsRef.current = new DrawingUtils(ctx);
            }
            // Draw the gorgeous 3D web warp the user requested using MediaPipe's exact color format
            for (const landmarks of mpResult.faceLandmarks) {
              drawingUtilsRef.current.drawConnectors(
                landmarks, 
                FaceLandmarker.FACE_LANDMARKS_TESSELATION, 
                { color: "#818cf8", lineWidth: 1 } 
              );
              drawingUtilsRef.current.drawConnectors(
                landmarks, 
                FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE, 
                { color: "#6366f1", lineWidth: 1.5 }
              );
              drawingUtilsRef.current.drawConnectors(
                landmarks, 
                FaceLandmarker.FACE_LANDMARKS_LEFT_EYE, 
                { color: "#6366f1", lineWidth: 1.5 }
              );
              // Draw the Irises (Eye Tracking)
              drawingUtilsRef.current.drawConnectors(
                landmarks, 
                FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS, 
                { color: "#10b981", lineWidth: 2 } // Glowing Emerald for the pupils
              );
              drawingUtilsRef.current.drawConnectors(
                landmarks, 
                FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS, 
                { color: "#10b981", lineWidth: 2 }
              );
            }
          }
        }

        // 2. DUAL ENGINE: Run Face-API for highly accurate ML Emotions (throttled to 150ms for performance)
        if (startTimeMs - lastUpdateRef.current > 150) {
          const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceExpressions();
          
          if (detection) {
            const exp = detection.expressions;
            
            // ACCURACY BOOST: Apply a mathematical curve to amplify micro-expressions so it doesn't default to 'Neutral' too aggressively
            const curve = 0.6; // Lower = more sensitive to micro-expressions
            
            const emotions = [
              { name: 'happy', score: Math.pow(exp.happy, curve) },
              { name: 'surprised', score: Math.pow(exp.surprised + (exp.fearful || 0), curve) },
              { name: 'angry', score: Math.pow(exp.angry + (exp.disgusted || 0), curve) },
              { name: 'sad', score: Math.pow(exp.sad, curve) },
              { name: 'curious', score: Math.pow(curiousScore, curve) * 0.7 }, // Scale down curious slightly so it isn't overpowering
              { name: 'neutral', score: exp.neutral } // Keep neutral linear
            ];

            const total = emotions.reduce((acc, curr) => acc + curr.score, 0) || 1;
            const normalized = emotions.map(e => ({ name: e.name, score: e.score / total }));
            
            setTopEmotions(normalized);
            lastUpdateRef.current = startTimeMs;
          }
        }
      } catch (err) {
        console.error("Error during dual detection:", err);
      }
    }

    if (isScanning) {
      animationRef.current = requestAnimationFrame(predictWebcam);
    }
  }, [isScanning]);

  useEffect(() => {
    if (isScanning && modelsLoaded) {
      animationRef.current = requestAnimationFrame(predictWebcam);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isScanning, modelsLoaded, predictWebcam]);

  const startScanning = useCallback(async (videoElement, canvasElement) => {
    if (!modelsLoaded) {
      setError("Dual AI engines are initializing, please wait...");
      return;
    }
    videoRef.current = videoElement;
    canvasRef.current = canvasElement;
    setIsScanning(true);
    setError(null);
  }, [modelsLoaded]);

  const stopScanning = useCallback(() => {
    setIsScanning(false);
    setTopEmotions([]);
    videoRef.current = null;
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      canvasRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  return { topEmotions, isScanning, error, startScanning, stopScanning };
}
