// Agency White Label Configuration
// Modify these values to customize the branding for your agency

export interface AgencyConfig {
  agencyName: string;
  primaryColor: string; // HSL format: "H S% L%"
  secondaryColor: string; // HSL format: "H S% L%"
  accentColor: string; // HSL format: "H S% L%"
  logoUrl: string | null;
  faviconUrl: string | null;
}

const agencyConfig: AgencyConfig = {
  agencyName: "Abode Flow Sync",
  primaryColor: "220 50% 20%", // Deep Navy
  secondaryColor: "35 15% 92%", // Warm Stone
  accentColor: "38 70% 50%", // Warm Gold
  logoUrl: "/favicon.png", // Custom logo
  faviconUrl: "/favicon.png", // Custom favicon
};

export default agencyConfig;
