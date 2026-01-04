import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ThemeSettings {
  theme_agency_name: string | null;
  theme_primary_color: string | null;
  theme_secondary_color: string | null;
  theme_accent_color: string | null;
  theme_logo_url: string | null;
  theme_favicon_url: string | null;
  theme_hero_image_url: string | null;
  allow_partner_listings: boolean | null;
  
  // Typography
  theme_heading_font: string | null;
  theme_body_font: string | null;
  theme_base_font_size: string | null;
  theme_heading_scale: string | null;
  
  // Button and Icon Colors
  theme_button_color: string | null;
  theme_button_text_color: string | null;
  theme_icon_color: string | null;
  theme_link_color: string | null;
  
  bio: string | null;
  license_number: string | null;
  profile_image: string | null;
  
  phone: string | null;
  email: string | null;
  office_address: string | null;
  
  tagline: string | null;
  hero_cta_text: string | null;
  
  social_facebook: string | null;
  social_instagram: string | null;
  social_linkedin: string | null;
  social_twitter: string | null;
  
  meta_description: string | null;
  
  notification_email_enabled: boolean | null;
  notification_sound_enabled: boolean | null;
  
  splash_screen_url: string | null;
  app_icon_url: string | null;
}

const DEMO_AGENT_ID = 'da39b948-790b-4a66-94b4-394445a98062';

export function useAgentThemeSettings(agentId?: string) {
  const id = agentId || DEMO_AGENT_ID;
  
  return useQuery({
    queryKey: ['agent-theme', id],
    queryFn: async () => {
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
          allow_partner_listings,
          theme_heading_font,
          theme_body_font,
          theme_base_font_size,
          theme_heading_scale,
          theme_button_color,
          theme_button_text_color,
          theme_icon_color,
          theme_link_color,
          bio,
          license_number,
          profile_image,
          phone,
          email,
          office_address,
          tagline,
          hero_cta_text,
          social_facebook,
          social_instagram,
          social_linkedin,
          social_twitter,
          meta_description,
          notification_email_enabled,
          notification_sound_enabled,
          splash_screen_url,
          app_icon_url
        `)
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as ThemeSettings | null;
    },
  });
}

export function useUpdateAgentTheme() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ agentId, settings }: { agentId: string; settings: Partial<ThemeSettings> }) => {
      const { data, error } = await supabase
        .from('agents')
        .update(settings)
        .eq('id', agentId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { agentId }) => {
      queryClient.invalidateQueries({ queryKey: ['agent-theme', agentId] });
      queryClient.invalidateQueries({ queryKey: ['agent-theme'] });
    },
  });
}

// Helper to convert hex to HSL string
export function hexToHSL(hex: string): string {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  // Parse hex values
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// Helper to convert HSL string to hex
export function hslToHex(hsl: string): string {
  const parts = hsl.match(/(\d+)\s+(\d+)%\s+(\d+)%/);
  if (!parts) return '#000000';
  
  const h = parseInt(parts[1]) / 360;
  const s = parseInt(parts[2]) / 100;
  const l = parseInt(parts[3]) / 100;
  
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
