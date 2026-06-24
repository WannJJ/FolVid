/**
 * Chuyển bytes thành chuỗi dễ đọc (KB, MB, GB)
 * @param {number} bytes - Số bytes
 * @param {number} decimals - Số chữ số thập phân (mặc định 2)
 * @returns {string} Chuỗi đã format, ví dụ "1.50 MB"
 */
export function formatSize(bytes) {
  if (!bytes) return "0 B";
  const mb = bytes / 1024 / 1024;
  return mb > 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(1)} MB`;
}
