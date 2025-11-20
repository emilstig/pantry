import PantryApp from "./components/PantryApp";
import { SettingsProvider } from "./contexts/SettingsContext";

export default function Home() {
  return (
    <SettingsProvider>
      <PantryApp />
    </SettingsProvider>
  );
}
