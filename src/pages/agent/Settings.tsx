import { useState, useEffect } from 'react';
import { AgentLayout } from '@/components/layout/AgentLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAgentThemeSettings, useUpdateAgentTheme, hexToHSL, hslToHex } from '@/hooks/useAgentThemeSettings';
import { toast } from 'sonner';
import { Palette, Building2, Save, RotateCcw, Loader2 } from 'lucide-react';
import agencyConfig from '@/config/agencyConfig';

const DEMO_AGENT_ID = 'da39b948-790b-4a66-94b4-394445a98062';

export default function Settings() {
  const { data: themeSettings, isLoading } = useAgentThemeSettings(DEMO_AGENT_ID);
  const updateTheme = useUpdateAgentTheme();
  
  const [agencyName, setAgencyName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#1e3a5f');
  const [secondaryColor, setSecondaryColor] = useState('#f5f3f0');
  const [accentColor, setAccentColor] = useState('#c9a227');
  const [logoUrl, setLogoUrl] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  
  // Initialize form with saved settings or defaults
  useEffect(() => {
    if (themeSettings) {
      setAgencyName(themeSettings.theme_agency_name || agencyConfig.agencyName);
      setPrimaryColor(themeSettings.theme_primary_color ? hslToHex(themeSettings.theme_primary_color) : hslToHex(agencyConfig.primaryColor));
      setSecondaryColor(themeSettings.theme_secondary_color ? hslToHex(themeSettings.theme_secondary_color) : hslToHex(agencyConfig.secondaryColor));
      setAccentColor(themeSettings.theme_accent_color ? hslToHex(themeSettings.theme_accent_color) : hslToHex(agencyConfig.accentColor));
      setLogoUrl(themeSettings.theme_logo_url || '');
      setFaviconUrl(themeSettings.theme_favicon_url || '');
    } else if (!isLoading) {
      // Set defaults from config
      setAgencyName(agencyConfig.agencyName);
      setPrimaryColor(hslToHex(agencyConfig.primaryColor));
      setSecondaryColor(hslToHex(agencyConfig.secondaryColor));
      setAccentColor(hslToHex(agencyConfig.accentColor));
    }
  }, [themeSettings, isLoading]);
  
  const handleSave = async () => {
    try {
      await updateTheme.mutateAsync({
        agentId: DEMO_AGENT_ID,
        settings: {
          theme_agency_name: agencyName,
          theme_primary_color: hexToHSL(primaryColor),
          theme_secondary_color: hexToHSL(secondaryColor),
          theme_accent_color: hexToHSL(accentColor),
          theme_logo_url: logoUrl || null,
          theme_favicon_url: faviconUrl || null,
        },
      });
      toast.success('Theme settings saved! Refresh to see changes.');
    } catch (error) {
      toast.error('Failed to save theme settings');
    }
  };
  
  const handleReset = () => {
    setAgencyName(agencyConfig.agencyName);
    setPrimaryColor(hslToHex(agencyConfig.primaryColor));
    setSecondaryColor(hslToHex(agencyConfig.secondaryColor));
    setAccentColor(hslToHex(agencyConfig.accentColor));
    setLogoUrl('');
    setFaviconUrl('');
  };
  
  if (isLoading) {
    return (
      <AgentLayout>
        <div className="container py-8 flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </AgentLayout>
    );
  }
  
  return (
    <AgentLayout>
      <div className="container py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">Theme Settings</h1>
          <p className="text-muted-foreground mt-1">
            Customize the look and feel of your agency's branded experience
          </p>
        </div>
        
        <div className="grid gap-6">
          {/* Branding Section */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-accent" />
                Agency Branding
              </CardTitle>
              <CardDescription>
                Set your agency name and logos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="agencyName">Agency Name</Label>
                <Input
                  id="agencyName"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  placeholder="Enter your agency name"
                  className="bg-background"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="logoUrl">Logo URL</Label>
                <Input
                  id="logoUrl"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="bg-background"
                />
                <p className="text-xs text-muted-foreground">
                  Recommended size: 200x50px, PNG or SVG format
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="faviconUrl">Favicon URL</Label>
                <Input
                  id="faviconUrl"
                  value={faviconUrl}
                  onChange={(e) => setFaviconUrl(e.target.value)}
                  placeholder="https://example.com/favicon.ico"
                  className="bg-background"
                />
                <p className="text-xs text-muted-foreground">
                  Recommended size: 32x32px, ICO or PNG format
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Colors Section */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-accent" />
                Brand Colors
              </CardTitle>
              <CardDescription>
                Choose colors that reflect your agency's brand
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      id="primaryColor"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-12 h-10 rounded-lg border border-border cursor-pointer"
                    />
                    <Input
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="bg-background flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Main brand color for navigation and buttons
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      id="secondaryColor"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-12 h-10 rounded-lg border border-border cursor-pointer"
                    />
                    <Input
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="bg-background flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Background and secondary elements
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="accentColor">Accent Color</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      id="accentColor"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-12 h-10 rounded-lg border border-border cursor-pointer"
                    />
                    <Input
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="bg-background flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Highlights and call-to-action elements
                  </p>
                </div>
              </div>
              
              {/* Live Preview */}
              <div className="mt-6 p-6 rounded-xl border border-border bg-background">
                <h4 className="text-sm font-medium text-muted-foreground mb-4">Live Preview</h4>
                <div className="flex flex-wrap items-center gap-4">
                  <div 
                    className="px-6 py-3 rounded-full font-medium text-white"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Primary Button
                  </div>
                  <div 
                    className="px-6 py-3 rounded-full font-medium border-2"
                    style={{ borderColor: primaryColor, color: primaryColor }}
                  >
                    Outline Button
                  </div>
                  <div 
                    className="px-6 py-3 rounded-full font-medium text-white"
                    style={{ backgroundColor: accentColor }}
                  >
                    Accent Button
                  </div>
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div 
                  className="mt-4 p-4 rounded-lg"
                  style={{ backgroundColor: secondaryColor }}
                >
                  <p className="text-sm" style={{ color: primaryColor }}>
                    <strong>{agencyName || 'Your Agency Name'}</strong> — This is how your secondary color will appear as a background
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={handleReset}
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset to Defaults
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateTheme.isPending}
              className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {updateTheme.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </AgentLayout>
  );
}
