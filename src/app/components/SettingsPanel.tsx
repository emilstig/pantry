"use client";

import { useState } from "react";
import { useSettings } from "../contexts/SettingsContext";
import styles from "./SettingsPanel.module.scss";

export default function SettingsPanel() {
  const { settings, updateSettings, isSettingsOpen, setIsSettingsOpen } =
    useSettings();
  const [tempSettings, setTempSettings] = useState(settings);

  const handleSave = () => {
    updateSettings(tempSettings);
    setIsSettingsOpen(false);
  };

  const handleCancel = () => {
    setTempSettings(settings);
    setIsSettingsOpen(false);
  };

  const handleReset = () => {
    setTempSettings({
      expiringSoonDays: 90,
      replaceDays: 30,
    });
  };

  if (!isSettingsOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <h2>Settings</h2>
          <button onClick={handleCancel} className={styles.closeButton}>
            ✕
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.section}>
            <h3>Expiry Warning Ranges</h3>
            <p className={styles.description}>
              Configure when items should show warning colors based on their
              expiry dates.
            </p>

            <div className={styles.warningPreview}>
              <div className={styles.colorLegend}>
                <div className={styles.legendItem}>
                  <div
                    className={`${styles.colorIndicator} ${styles.green}`}
                  ></div>
                  <span>Fresh (no warning)</span>
                </div>
                <div className={styles.legendItem}>
                  <div
                    className={`${styles.colorIndicator} ${styles.yellow}`}
                  ></div>
                  <span>
                    Expiring Soon (within {tempSettings.expiringSoonDays} days)
                  </span>
                </div>
                <div className={styles.legendItem}>
                  <div
                    className={`${styles.colorIndicator} ${styles.red}`}
                  ></div>
                  <span>Replace (within {tempSettings.replaceDays} days)</span>
                </div>
              </div>
            </div>

            <div className={styles.settingsGrid}>
              <div className={styles.settingItem}>
                <label htmlFor="expiringSoonDays" className={styles.label}>
                  Expiring Soon Warning
                </label>
                <div className={styles.inputGroup}>
                  <input
                    id="expiringSoonDays"
                    type="number"
                    min="1"
                    max="365"
                    value={tempSettings.expiringSoonDays}
                    onChange={e =>
                      setTempSettings(prev => ({
                        ...prev,
                        expiringSoonDays: parseInt(e.target.value) || 90,
                      }))
                    }
                    className={styles.input}
                  />
                  <span className={styles.unit}>days</span>
                </div>
                <p className={styles.helpText}>
                  Items expiring within this many days will show yellow warning
                </p>
              </div>

              <div className={styles.settingItem}>
                <label htmlFor="replaceDays" className={styles.label}>
                  Replace Warning
                </label>
                <div className={styles.inputGroup}>
                  <input
                    id="replaceDays"
                    type="number"
                    min="1"
                    max="365"
                    value={tempSettings.replaceDays}
                    onChange={e =>
                      setTempSettings(prev => ({
                        ...prev,
                        replaceDays: parseInt(e.target.value) || 30,
                      }))
                    }
                    className={styles.input}
                  />
                  <span className={styles.unit}>days</span>
                </div>
                <p className={styles.helpText}>
                  Items expiring within this many days will show red warning
                </p>
              </div>
            </div>

            <div className={styles.validation}>
              {tempSettings.replaceDays >= tempSettings.expiringSoonDays && (
                <div className={styles.error}>
                  ⚠️ Replace warning should be less than Expiring Soon warning
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button onClick={handleReset} className={styles.resetButton}>
            Reset to Defaults
          </button>
          <div className={styles.actionButtons}>
            <button onClick={handleCancel} className={styles.cancelButton}>
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={
                tempSettings.replaceDays >= tempSettings.expiringSoonDays
              }
              className={styles.saveButton}
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
