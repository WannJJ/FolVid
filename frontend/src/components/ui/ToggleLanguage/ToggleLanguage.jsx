import { useTranslation } from "react-i18next";

export function ToggleLanguage() {
  const { i18n } = useTranslation();

  // Hàm đổi ngôn ngữ
  const toggleLang = () => {
    const languages = ["vi", "en", "de"];
    const currentIndex = languages.indexOf(i18n.language);
    const nextLang = languages[(currentIndex + 1) % languages.length];
    i18n.changeLanguage(nextLang);
  };
  return (
    <button
      onClick={toggleLang}
      style={{
        float: "right",
        background: "#444",
        color: "#fff",
        border: "none",
        padding: "4px 8px",
        borderRadius: "4px",
        cursor: "pointer",
      }}
    >
      {i18n.language === "vi"
        ? "🇻🇳 VI"
        : i18n.language === "de"
          ? "🇩🇪 DE"
          : "🇺🇸 EN"}
    </button>
  );
}
