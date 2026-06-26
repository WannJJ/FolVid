import { useVideoStore } from "@/stores/useVideoStore";
import { useTranslation } from "react-i18next";
import styles from "./VideoList.module.css";

export function HLSToggle() {
  const { t } = useTranslation();
  const { useHLS, setUseHLS } = useVideoStore();

  return (
    <div className={styles.toggleWrapper}>
      <label className={styles.toggleLabel}>
        <input
          type="checkbox"
          checked={useHLS}
          onChange={(e) => setUseHLS(e.target.checked)}
        />
        <span>
          {useHLS ? t("videoList.hlsEnabled") : t("videoList.hlsDisabled")}
        </span>
      </label>
      <div className={styles.tooltip}>
        {useHLS
          ? t("videoList.hlsEnabledTooltip")
          : t("videoList.hlsDisabledTooltip")}
      </div>
    </div>
  );
}
