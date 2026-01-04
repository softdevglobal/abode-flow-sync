// Agency White Label Configuration
// Modify these values to customize the branding for your agency

export interface AgencyConfig {
  // Core branding
  agencyName: string;
  primaryColor: string; // HSL format: "H S% L%"
  secondaryColor: string; // HSL format: "H S% L%"
  accentColor: string; // HSL format: "H S% L%"
  logoUrl: string | null;
  faviconUrl: string | null;
  heroImageUrl: string | null;
  
  // Typography
  headingFont: string;
  bodyFont: string;
  baseFontSize: string;
  headingScale: string;
  
  // Button and Icon Colors
  buttonColor: string;
  buttonTextColor: string;
  iconColor: string;
  linkColor: string;
  
  // Hero section
  tagline: string;
  heroCTAText: string;
  
  // Contact info
  phone: string | null;
  email: string | null;
  officeAddress: string | null;
  
  // Social media
  socialFacebook: string | null;
  socialInstagram: string | null;
  socialLinkedIn: string | null;
  socialTwitter: string | null;
  
  // SEO
  metaDescription: string;
  
  // Mobile app
  splashScreenUrl: string | null;
  appIconUrl: string | null;
}

const agencyConfig: AgencyConfig = {
  agencyName: "Abode Flow Sync",
  primaryColor: "220 50% 20%", // Deep Navy
  secondaryColor: "35 15% 92%", // Warm Stone
  accentColor: "38 70% 50%", // Warm Gold
  logoUrl: "/favicon.png", // Custom logo
  faviconUrl: "/favicon.png", // Custom favicon
  heroImageUrl: null, // Hero background image
  
  // Typography defaults
  headingFont: "Manrope",
  bodyFont: "Inter",
  baseFontSize: "medium",
  headingScale: "standard",
  
  // Button and Icon Color defaults
  buttonColor: "20 90% 48%",
  buttonTextColor: "0 0% 100%",
  iconColor: "20 90% 48%",
  linkColor: "20 90% 48%",
  
  // Hero section defaults
  tagline: "Find Your Dream Home",
  heroCTAText: "Browse Properties",
  
  // Contact info defaults
  phone: null,
  email: null,
  officeAddress: null,
  
  // Social media defaults
  socialFacebook: null,
  socialInstagram: null,
  socialLinkedIn: null,
  socialTwitter: null,
  
  // SEO defaults
  metaDescription: "Your trusted real estate partner for buying, selling, and renting properties.",
  
  // Mobile app defaults
  splashScreenUrl: null,
  appIconUrl: null,
};

export default agencyConfig;
