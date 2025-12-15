import React, { createContext, useContext, useEffect } from 'react';
import agencyConfig, { AgencyConfig } from '@/config/agencyConfig';

const AgencyThemeContext = createContext<AgencyConfig>(agencyConfig);

export function useAgencyTheme() {
  return useContext(AgencyThemeContext);
}

interface AgencyThemeProviderProps {
  children: React.ReactNode;
  config?: Partial<AgencyConfig>;
}

export function AgencyThemeProvider({ children, config }: AgencyThemeProviderProps) {
  const mergedConfig = { ...agencyConfig, ...config };

  useEffect(() => {
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
  }, [mergedConfig]);

  return (
    <AgencyThemeContext.Provider value={mergedConfig}>
      {children}
    </AgencyThemeContext.Provider>
  );
}
