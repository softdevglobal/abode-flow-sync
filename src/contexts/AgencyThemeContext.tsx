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
          .select('theme_agency_name, theme_primary_color, theme_secondary_color, theme_accent_color, theme_logo_url, theme_favicon_url')
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

    // Update favicon if provided
    if (mergedConfig.faviconUrl) {
      const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (link) {
        link.href = mergedConfig.faviconUrl;
      }
    }

    // Update document title with agency name
    document.title = `${mergedConfig.agencyName} | Real Estate`;
  }, [mergedConfig, isLoading]);

  return (
    <AgencyThemeContext.Provider value={mergedConfig}>
      {children}
    </AgencyThemeContext.Provider>
  );
}
