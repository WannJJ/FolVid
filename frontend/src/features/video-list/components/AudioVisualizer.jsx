import { useEffect, useRef } from "react";

export function AudioVisualizer({ width = 160, height = 90, isActive = true }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Tạo seed ngẫu nhiên cố định cho mỗi instance để chuyển động không đồng bộ
    const seeds = Array.from({ length: 20 }, () => ({
      freq: 0.3 + Math.random() * 1.2,
      phase: Math.random() * Math.PI * 2,
      speed: 0.002 + Math.random() * 0.004,
    }));

    const animate = (time) => {
      if (!isActive) {
        // Fade out hoặc dừng
        ctx.fillStyle = "#0f0f1a";
        ctx.fillRect(0, 0, width, height);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // Background tối xanh đậm
      ctx.fillStyle = "#0f0f1a";
      ctx.fillRect(0, 0, width, height);

      const barCount = 16;
      const gap = 2;
      const barWidth = (width - (barCount - 1) * gap) / barCount;
      const centerY = height / 2;
      const maxBarHeight = height * 0.75;

      for (let i = 0; i < barCount; i++) {
        const seed = seeds[i];
        const t = time * seed.speed;

        // Kết hợp nhiều sóng sin để tạo chuyển động tự nhiên
        const wave1 = Math.sin(t * seed.freq + seed.phase);
        const wave2 = Math.sin(t * seed.freq * 2.3 + seed.phase * 1.5) * 0.4;
        const wave3 = Math.sin(t * 0.7 + i * 0.5) * 0.2;

        const amplitude = Math.abs(wave1 + wave2 + wave3);
        // Normalize về 0..1
        const norm = Math.min(1, Math.max(0.15, amplitude / 1.6));
        const barHeight = norm * maxBarHeight;

        const x = i * (barWidth + gap);
        const y = centerY - barHeight / 2;

        // Gradient từ xanh cyan -> tím -> hồng
        const grad = ctx.createLinearGradient(0, y + barHeight, 0, y);
        grad.addColorStop(0, "#06b6d4"); // cyan
        grad.addColorStop(0.4, "#8b5cf6"); // tím
        grad.addColorStop(0.8, "#ec4899"); // hồng
        grad.addColorStop(1, "#f43f5e"); // đỏ nhạt

        ctx.fillStyle = grad;

        // Glow effect (chỉ set 1 lần để tránh lag)
        if (i === 0) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = "rgba(139, 92, 246, 0.5)";
        }

        // Bo góc thanh bar bằng fillRect thường (canvas nhỏ nên không cần roundRect phức tạp)
        ctx.fillRect(x, y, barWidth, barHeight);
      }

      // Reset shadow để không ảnh hưởng frame sau
      ctx.shadowBlur = 0;

      // Vẽ thêm 2 vòng tròn pulse ở 2 bên như loa mini
      const pulse = 0.5 + 0.5 * Math.sin(time * 0.005);
      const radius = 6 + pulse * 4;

      // Loa trái
      ctx.beginPath();
      ctx.arc(20, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(6, 182, 212, 0.3)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(20, centerY, radius * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(6, 182, 212, 0.8)";
      ctx.fill();

      // Loa phải
      ctx.beginPath();
      ctx.arc(width - 20, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(236, 72, 153, 0.3)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(width - 20, centerY, radius * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(236, 72, 153, 0.8)";
      ctx.fill();

      rafRef.current = requestAnimationFrame(animate);
    };

    if (isActive) {
      rafRef.current = requestAnimationFrame(animate);
    } else {
      // Vẽ 1 frame tĩnh "paused"
      ctx.fillStyle = "#0f0f1a";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#334155";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("♪ AUDIO", width / 2, height / 2);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isActive, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        borderRadius: "4px",
      }}
    />
  );
}
