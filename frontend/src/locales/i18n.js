import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import de from "./de.json";
import en from "./en.json";
import vi from "./vi.json";

i18n
  .use(LanguageDetector) // Tự động phát hiện ngôn ngữ trình duyệt
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      vi: { translation: vi },
      de: { translation: de },
    },
    fallbackLng: "en", // Nếu không có ngôn ngữ phù hợp thì dùng tiếng Anh
    detection: {
      order: ["localStorage", "navigator"], // Ưu tiên localStorage trước, rồi mới đến trình duyệt
      caches: ["localStorage"], // Lưu vào localStorage sau khi user đổi
    },
    interpolation: {
      escapeValue: false, // React đã tự escape
    },
  });

export default i18n;
