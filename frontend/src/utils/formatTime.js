/**
 * Chuyển số giây thành chuỗi định dạng HH:MM:SS hoặc MM:SS
 * @param {number} seconds - Số giây (có thể là số thập phân)
 * @returns {string} Chuỗi thời gian đã format
 */
export const formatTime = (seconds) => {
  if (isNaN(seconds)) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const mm = m.toString().padStart(2, "0");
  const ss = s.toString().padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
};
