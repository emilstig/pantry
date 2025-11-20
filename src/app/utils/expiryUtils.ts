import { WarningSettings } from "../contexts/SettingsContext";

export function getExpiryStatus(
  expiryDate: string,
  settings: WarningSettings
): string {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "expired";
  if (diffDays <= settings.replaceDays) return "replace";
  if (diffDays <= settings.expiringSoonDays) return "expiring-soon";
  return "good";
}

export function getDaysUntilExpiry(expiryDate: string): number {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
