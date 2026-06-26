import { useUIStore } from "@/stores/useUIStore";
import { useTranslation } from "react-i18next";

export function UploadModalButton() {
  const { t } = useTranslation();
  const { setShowUploadModal } = useUIStore();
  return (
    <div
      style={{
        padding: "16px",
        borderTop: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <button
        onClick={() => setShowUploadModal(true)}
        style={{
          width: "100%",
          padding: "14px",
          background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
          color: "#fff",
          border: "none",
          borderRadius: "12px",
          cursor: "pointer",
          fontSize: "0.95rem",
          fontWeight: "600",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          boxShadow: "0 4px 15px rgba(59, 130, 246, 0.3)",
          transition: "all 0.2s",
        }}
      >
        {t("videoList.uploadVideo")}
      </button>
    </div>
  );
}
