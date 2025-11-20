"use client";

import { useSettings } from "../contexts/SettingsContext";
import styles from "./SettingsButton.module.scss";

export default function SettingsButton() {
  const { setIsSettingsOpen } = useSettings();

  return (
    <button
      onClick={() => setIsSettingsOpen(true)}
      className={styles.settingsButton}
      title="Settings"
    >
      ⚙️
    </button>
  );
}
