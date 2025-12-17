import { useState, useEffect, useRef } from 'react';
import { AgentLayout } from '@/components/layout/AgentLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAgentThemeSettings, useUpdateAgentTheme, hexToHSL, hslToHex } from '@/hooks/useAgentThemeSettings';
import { toast } from 'sonner';
import { Palette, Building2, Save, RotateCcw, Loader2, Upload, X, Image } from 'lucide-react';
import agencyConfig from '@/config/agencyConfig';
import { supabase } from '@/integrations/supabase/client';

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
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  
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
  
  const uploadFile = async (file: File, type: 'logo' | 'favicon'): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${DEMO_AGENT_ID}/${type}-${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('agent-assets')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });
    
    if (error) {
      console.error('Upload error:', error);
      toast.error(`Failed to upload ${type}`);
      return null;
    }
    
    const { data: urlData } = supabase.storage
      .from('agent-assets')
      .getPublicUrl(data.path);
    
    return urlData.publicUrl;
  };
  
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB');
      return;
    }
    
    setUploadingLogo(true);
    const url = await uploadFile(file, 'logo');
    if (url) {
      setLogoUrl(url);
      toast.success('Logo uploaded successfully');
    }
    setUploadingLogo(false);
    
    // Reset input
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };
  
  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    // Validate file size (max 500KB for favicon)
    if (file.size > 500 * 1024) {
      toast.error('Favicon must be less than 500KB');
      return;
    }
    
    setUploadingFavicon(true);
    const url = await uploadFile(file, 'favicon');
    if (url) {
      setFaviconUrl(url);
      toast.success('Favicon uploaded successfully');
    }
    setUploadingFavicon(false);
    
    // Reset input
    if (faviconInputRef.current) {
      faviconInputRef.current.value = '';
    }
  };
  
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
            <CardContent className="space-y-6">
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
              
              {/* Logo Upload */}
              <div className="space-y-3">
                <Label>Logo</Label>
                <div className="flex items-start gap-4">
                  {/* Preview */}
                  <div className="w-32 h-20 rounded-lg border border-border bg-background flex items-center justify-center overflow-hidden">
                    {logoUrl ? (
                      <img 
                        src={logoUrl} 
                        alt="Logo preview" 
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <Image className="w-8 h-8 text-muted-foreground/50" />
                    )}
                  </div>
                  
                  {/* Upload controls */}
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => logoInputRef.current?.click()}
                        disabled={uploadingLogo}
                        className="gap-2"
                      >
                        {uploadingLogo ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        Upload Logo
                      </Button>
                      {logoUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setLogoUrl('')}
                          className="gap-2 text-destructive hover:text-destructive"
                        >
                          <X className="w-4 h-4" />
                          Remove
                        </Button>
                      )}
                    </div>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <p className="text-xs text-muted-foreground">
                      Recommended: 200x50px, PNG or SVG (max 2MB)
                    </p>
                    {/* Manual URL input */}
                    <Input
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="Or enter logo URL..."
                      className="bg-background text-sm"
                    />
                  </div>
                </div>
              </div>
              
              {/* Favicon Upload */}
              <div className="space-y-3">
                <Label>Favicon</Label>
                <div className="flex items-start gap-4">
                  {/* Preview */}
                  <div className="w-16 h-16 rounded-lg border border-border bg-background flex items-center justify-center overflow-hidden">
                    {faviconUrl ? (
                      <img 
                        src={faviconUrl} 
                        alt="Favicon preview" 
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <Image className="w-6 h-6 text-muted-foreground/50" />
                    )}
                  </div>
                  
                  {/* Upload controls */}
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => faviconInputRef.current?.click()}
                        disabled={uploadingFavicon}
                        className="gap-2"
                      >
                        {uploadingFavicon ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        Upload Favicon
                      </Button>
                      {faviconUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setFaviconUrl('')}
                          className="gap-2 text-destructive hover:text-destructive"
                        >
                          <X className="w-4 h-4" />
                          Remove
                        </Button>
                      )}
                    </div>
                    <input
                      ref={faviconInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFaviconUpload}
                      className="hidden"
                    />
                    <p className="text-xs text-muted-foreground">
                      Recommended: 32x32px, PNG or ICO (max 500KB)
                    </p>
                    {/* Manual URL input */}
                    <Input
                      value={faviconUrl}
                      onChange={(e) => setFaviconUrl(e.target.value)}
                      placeholder="Or enter favicon URL..."
                      className="bg-background text-sm"
                    />
                  </div>
                </div>
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