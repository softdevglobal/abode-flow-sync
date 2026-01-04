import React, { createContext, useContext, useEffect, useState } from 'react';
import agencyConfig, { AgencyConfig } from '@/config/agencyConfig';
import { supabase } from '@/integrations/supabase/client';

const AgencyThemeContext = createContext<AgencyConfig>(agencyConfig);

export function useAgencyTheme() {
  return useContext(AgencyThemeContext);
}

interface AgencyThemeProviderProps {
  children: React.ReactNode;
  config?: Partial<AgencyConfig>;
  agentId?: string;
}

const DEMO_AGENT_ID = 'da39b948-790b-4a66-94b4-394445a98062';

// Font mappings for CSS
const FONT_MAP: Record<string, string> = {
  'Manrope': '"Manrope", sans-serif',
  'Inter': '"Inter", sans-serif',
  'Roboto': '"Roboto", sans-serif',
  'Libre Caslon Text': '"Libre Caslon Text", serif',
};

// Font size mappings
const FONT_SIZE_MAP: Record<string, string> = {
  'small': '14px',
  'medium': '16px',
  'large': '18px',
};

// Heading scale mappings
const HEADING_SCALE_MAP: Record<string, { h1: string; h2: string; h3: string; h4: string; h5: string; h6: string }> = {
  'compact': { h1: '1.75rem', h2: '1.5rem', h3: '1.25rem', h4: '1.125rem', h5: '1rem', h6: '0.875rem' },
  'standard': { h1: '2.25rem', h2: '1.875rem', h3: '1.5rem', h4: '1.25rem', h5: '1.125rem', h6: '1rem' },
  'large': { h1: '3rem', h2: '2.25rem', h3: '1.875rem', h4: '1.5rem', h5: '1.25rem', h6: '1.125rem' },
};

export function AgencyThemeProvider({ children, config, agentId }: AgencyThemeProviderProps) {
  const [dbConfig, setDbConfig] = useState<Partial<AgencyConfig> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch theme from database
  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const id = agentId || DEMO_AGENT_ID;
        const { data, error } = await supabase
          .from('agents')
          .select(`
            theme_agency_name, 
            theme_primary_color, 
            theme_secondary_color, 
            theme_accent_color, 
            theme_logo_url, 
            theme_favicon_url, 
            theme_hero_image_url,
            theme_heading_font,
            theme_body_font,
            theme_base_font_size,
            theme_heading_scale,
            theme_button_color,
            theme_button_text_color,
            theme_icon_color,
            theme_link_color,
            phone,
            email,
            office_address,
            tagline,
            hero_cta_text,
            social_facebook,
            social_instagram,
            social_linkedin,
            social_twitter,
            meta_description
          `)
          .eq('id', id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching theme:', error);
        } else if (data) {
          const themeFromDb: Partial<AgencyConfig> = {};
          if (data.theme_agency_name) themeFromDb.agencyName = data.theme_agency_name;
          if (data.theme_primary_color) themeFromDb.primaryColor = data.theme_primary_color;
          if (data.theme_secondary_color) themeFromDb.secondaryColor = data.theme_secondary_color;
          if (data.theme_accent_color) themeFromDb.accentColor = data.theme_accent_color;
          if (data.theme_logo_url) themeFromDb.logoUrl = data.theme_logo_url;
          if (data.theme_favicon_url) themeFromDb.faviconUrl = data.theme_favicon_url;
          if (data.theme_hero_image_url) themeFromDb.heroImageUrl = data.theme_hero_image_url;
          if (data.theme_heading_font) themeFromDb.headingFont = data.theme_heading_font;
          if (data.theme_body_font) themeFromDb.bodyFont = data.theme_body_font;
          if (data.theme_base_font_size) themeFromDb.baseFontSize = data.theme_base_font_size;
          if (data.theme_heading_scale) themeFromDb.headingScale = data.theme_heading_scale;
          if (data.theme_button_color) themeFromDb.buttonColor = data.theme_button_color;
          if (data.theme_button_text_color) themeFromDb.buttonTextColor = data.theme_button_text_color;
          if (data.theme_icon_color) themeFromDb.iconColor = data.theme_icon_color;
          if (data.theme_link_color) themeFromDb.linkColor = data.theme_link_color;
          if (data.phone) themeFromDb.phone = data.phone;
          if (data.email) themeFromDb.email = data.email;
          if (data.office_address) themeFromDb.officeAddress = data.office_address;
          if (data.tagline) themeFromDb.tagline = data.tagline;
          if (data.hero_cta_text) themeFromDb.heroCTAText = data.hero_cta_text;
          if (data.social_facebook) themeFromDb.socialFacebook = data.social_facebook;
          if (data.social_instagram) themeFromDb.socialInstagram = data.social_instagram;
          if (data.social_linkedin) themeFromDb.socialLinkedIn = data.social_linkedin;
          if (data.social_twitter) themeFromDb.socialTwitter = data.social_twitter;
          if (data.meta_description) themeFromDb.metaDescription = data.meta_description;
          
          if (Object.keys(themeFromDb).length > 0) {
            setDbConfig(themeFromDb);
          }
        }
      } catch (err) {
        console.error('Failed to fetch theme:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTheme();
  }, [agentId]);

  // Merge configs: dbConfig overrides config overrides agencyConfig
  const mergedConfig = { ...agencyConfig, ...config, ...dbConfig };

  useEffect(() => {
    if (isLoading) return;
    
    const root = document.documentElement;

    // Set primary color
    root.style.setProperty('--primary', mergedConfig.primaryColor);
    
    // Set secondary color
    root.style.setProperty('--secondary', mergedConfig.secondaryColor);
    
    // Set accent color
    root.style.setProperty('--accent', mergedConfig.accentColor);
    
    // Update ring to match primary
    root.style.setProperty('--ring', mergedConfig.primaryColor);

    // Update sidebar colors based on primary
    root.style.setProperty('--sidebar-background', mergedConfig.primaryColor);
    root.style.setProperty('--sidebar-primary', mergedConfig.accentColor);

    // Update gradient-hero based on primary
    const [h, s, l] = mergedConfig.primaryColor.split(' ');
    const lighterL = parseInt(l) + 10;
    root.style.setProperty(
      '--gradient-hero',
      `linear-gradient(135deg, hsl(${mergedConfig.primaryColor}) 0%, hsl(${h} ${s} ${lighterL}%) 100%)`
    );

    // Apply typography settings
    const headingFontStack = FONT_MAP[mergedConfig.headingFont] || FONT_MAP['Manrope'];
    const bodyFontStack = FONT_MAP[mergedConfig.bodyFont] || FONT_MAP['Inter'];
    const baseFontSize = FONT_SIZE_MAP[mergedConfig.baseFontSize] || FONT_SIZE_MAP['medium'];
    const headingScale = HEADING_SCALE_MAP[mergedConfig.headingScale] || HEADING_SCALE_MAP['standard'];

    root.style.setProperty('--font-display', headingFontStack);
    root.style.setProperty('--font-body', bodyFontStack);
    root.style.setProperty('--base-font-size', baseFontSize);
    root.style.setProperty('--heading-h1', headingScale.h1);
    root.style.setProperty('--heading-h2', headingScale.h2);
    root.style.setProperty('--heading-h3', headingScale.h3);
    root.style.setProperty('--heading-h4', headingScale.h4);
    root.style.setProperty('--heading-h5', headingScale.h5);
    root.style.setProperty('--heading-h6', headingScale.h6);

    // Apply button and icon colors
    root.style.setProperty('--button-bg', mergedConfig.buttonColor);
    root.style.setProperty('--button-text', mergedConfig.buttonTextColor);
    root.style.setProperty('--icon-color', mergedConfig.iconColor);
    root.style.setProperty('--link-color', mergedConfig.linkColor);

    // Update favicon if provided
    if (mergedConfig.faviconUrl) {
      const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (link) {
        link.href = mergedConfig.faviconUrl;
      }
    }

    // Update document title with agency name
    document.title = `${mergedConfig.agencyName} | Real Estate`;
    
    // Update meta description
    if (mergedConfig.metaDescription) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', mergedConfig.metaDescription);
    }
  }, [mergedConfig, isLoading]);

  return (
    <AgencyThemeContext.Provider value={mergedConfig}>
      {children}
    </AgencyThemeContext.Provider>
  );
}