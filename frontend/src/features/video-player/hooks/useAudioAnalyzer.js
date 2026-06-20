// useAudioAnalyzer.js
import { useEffect, useRef, useState } from "react";

export function useAudioAnalyzer(mediaRef) {
  const [frequencyData, setFrequencyData] = useState(() => new Uint8Array(64));
  const rafRef = useRef(null);
  const ctxRef = useRef(null);

  useEffect(() => {
    const media = mediaRef?.current;
    if (!media) return;

    // Cố gắng set CORS (lý tưởng nhất vẫn là set trong JSX)
    if (!media.crossOrigin) {
      media.setAttribute("crossorigin", "anonymous");
    }

    let audioCtx = ctxRef.current;
    let analyser;
    let dataArray;
    let isSetup = false;

    const setup = () => {
      if (isSetup) return;
      isSetup = true;

      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        ctxRef.current = audioCtx;
      }
      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }

      try {
        // Chỉ tạo MediaElementSource 1 lần duy nhất
        let source = media.__folvidSource;
        if (!source) {
          source = audioCtx.createMediaElementSource(media);
          media.__folvidSource = source;
        }

        // Tái sử dụng hoặc tạo mới Analyser
        analyser = media.__folvidAnalyser;
        if (!analyser) {
          analyser = audioCtx.createAnalyser();
          analyser.fftSize = 128; // frequencyBinCount = 64
          analyser.smoothingTimeConstant = 0.85;
          media.__folvidAnalyser = analyser;
        }

        // Chỉ connect 1 lần
        if (!media.__folvidConnected) {
          source.connect(analyser);
          analyser.connect(audioCtx.destination);
          media.__folvidConnected = true;
        }

        dataArray = new Uint8Array(analyser.frequencyBinCount);
      } catch (err) {
        console.error("Audio Analyzer setup failed:", err);
      }
    };

    const draw = () => {
      if (!analyser) return;
      rafRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);
      setFrequencyData(new Uint8Array(dataArray)); // clone để React nhận diện thay đổi
    };

    const start = () => {
      setup();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      draw();
    };

    const stop = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };

    media.addEventListener("play", start);
    media.addEventListener("pause", stop);
    media.addEventListener("ended", stop);

    // Trường hợp media đang play sẵn khi component mount
    if (!media.paused) {
      start();
    }

    return () => {
      media.removeEventListener("play", start);
      media.removeEventListener("pause", stop);
      media.removeEventListener("ended", stop);
      stop();
    };
  }, [mediaRef]);

  return frequencyData;
}
