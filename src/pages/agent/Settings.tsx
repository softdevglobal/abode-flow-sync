import { useState, useEffect } from "react";
import { AgentLayout } from "@/components/layout/AgentLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Upload, Palette, User, Phone, Globe, Bell, Image, Share2, Search } from "lucide-react";
import agencyConfig from "@/config/agencyConfig";
import { useAgentThemeSettings, useUpdateAgentTheme, hexToHSL, hslToHex } from "@/hooks/useAgentThemeSettings";
import { supabase } from "@/integrations/supabase/client";

const DEMO_AGENT_ID = 'da39b948-790b-4a66-94b4-394445a98062';

export default function Settings() {
  const { data: themeSettings, isLoading } = useAgentThemeSettings(DEMO_AGENT_ID);
  const updateTheme = useUpdateAgentTheme();
  
  // Branding state
  const [agencyName, setAgencyName] = useState(agencyConfig.agencyName);
  const [primaryColor, setPrimaryColor] = useState(hslToHex(agencyConfig.primaryColor));
  const [secondaryColor, setSecondaryColor] = useState(hslToHex(agencyConfig.secondaryColor));
  const [accentColor, setAccentColor] = useState(hslToHex(agencyConfig.accentColor));
  const [logoUrl, setLogoUrl] = useState(agencyConfig.logoUrl || '');
  const [faviconUrl, setFaviconUrl] = useState(agencyConfig.faviconUrl || '');
  const [heroImageUrl, setHeroImageUrl] = useState(agencyConfig.heroImageUrl || '');
  
  // Profile state
  const [bio, setBio] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [profileImage, setProfileImage] = useState('');
  
  // Contact state
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [officeAddress, setOfficeAddress] = useState('');
  
  // Hero section state
  const [tagline, setTagline] = useState(agencyConfig.tagline);
  const [heroCTAText, setHeroCTAText] = useState(agencyConfig.heroCTAText);
  
  // Social media state
  const [socialFacebook, setSocialFacebook] = useState('');
  const [socialInstagram, setSocialInstagram] = useState('');
  const [socialLinkedIn, setSocialLinkedIn] = useState('');
  const [socialTwitter, setSocialTwitter] = useState('');
  
  // SEO state
  const [metaDescription, setMetaDescription] = useState(agencyConfig.metaDescription);
  
  // Notification state
  const [notificationEmail, setNotificationEmail] = useState(true);
  const [notificationSound, setNotificationSound] = useState(true);
  
  // Mobile app state
  const [splashScreenUrl, setSplashScreenUrl] = useState('');
  const [appIconUrl, setAppIconUrl] = useState('');
  
  // Partner settings
  const [allowPartnerListings, setAllowPartnerListings] = useState(true);
  
  // Upload states
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingSplash, setUploadingSplash] = useState(false);
  const [uploadingAppIcon, setUploadingAppIcon] = useState(false);

  // Load settings from database
  useEffect(() => {
    if (themeSettings) {
      if (themeSettings.theme_agency_name) setAgencyName(themeSettings.theme_agency_name);
      if (themeSettings.theme_primary_color) setPrimaryColor(hslToHex(themeSettings.theme_primary_color));
      if (themeSettings.theme_secondary_color) setSecondaryColor(hslToHex(themeSettings.theme_secondary_color));
      if (themeSettings.theme_accent_color) setAccentColor(hslToHex(themeSettings.theme_accent_color));
      if (themeSettings.theme_logo_url) setLogoUrl(themeSettings.theme_logo_url);
      if (themeSettings.theme_favicon_url) setFaviconUrl(themeSettings.theme_favicon_url);
      if (themeSettings.theme_hero_image_url) setHeroImageUrl(themeSettings.theme_hero_image_url);
      if (themeSettings.allow_partner_listings !== null) setAllowPartnerListings(themeSettings.allow_partner_listings);
      
      // Profile
      if (themeSettings.bio) setBio(themeSettings.bio);
      if (themeSettings.license_number) setLicenseNumber(themeSettings.license_number);
      if (themeSettings.profile_image) setProfileImage(themeSettings.profile_image);
      
      // Contact
      if (themeSettings.phone) setPhone(themeSettings.phone);
      if (themeSettings.email) setEmail(themeSettings.email);
      if (themeSettings.office_address) setOfficeAddress(themeSettings.office_address);
      
      // Hero
      if (themeSettings.tagline) setTagline(themeSettings.tagline);
      if (themeSettings.hero_cta_text) setHeroCTAText(themeSettings.hero_cta_text);
      
      // Social
      if (themeSettings.social_facebook) setSocialFacebook(themeSettings.social_facebook);
      if (themeSettings.social_instagram) setSocialInstagram(themeSettings.social_instagram);
      if (themeSettings.social_linkedin) setSocialLinkedIn(themeSettings.social_linkedin);
      if (themeSettings.social_twitter) setSocialTwitter(themeSettings.social_twitter);
      
      // SEO
      if (themeSettings.meta_description) setMetaDescription(themeSettings.meta_description);
      
      // Notifications
      if (themeSettings.notification_email_enabled !== null) setNotificationEmail(themeSettings.notification_email_enabled);
      if (themeSettings.notification_sound_enabled !== null) setNotificationSound(themeSettings.notification_sound_enabled);
      
      // Mobile
      if (themeSettings.splash_screen_url) setSplashScreenUrl(themeSettings.splash_screen_url);
      if (themeSettings.app_icon_url) setAppIconUrl(themeSettings.app_icon_url);
    }
  }, [themeSettings]);

  const uploadFile = async (file: File, bucket: string, folder: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${crypto.randomUUID()}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, { upsert: true });
    
    if (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
      return null;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);
    
    return publicUrl;
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setUrl: (url: string) => void,
    setUploading: (uploading: boolean) => void,
    folder: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }
    
    setUploading(true);
    const url = await uploadFile(file, 'agent-assets', folder);
    if (url) {
      setUrl(url);
      toast.success('Image uploaded successfully');
    }
    setUploading(false);
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
          theme_hero_image_url: heroImageUrl || null,
          allow_partner_listings: allowPartnerListings,
          bio: bio || null,
          license_number: licenseNumber || null,
          profile_image: profileImage || null,
          phone: phone || null,
          email: email || null,
          office_address: officeAddress || null,
          tagline: tagline || null,
          hero_cta_text: heroCTAText || null,
          social_facebook: socialFacebook || null,
          social_instagram: socialInstagram || null,
          social_linkedin: socialLinkedIn || null,
          social_twitter: socialTwitter || null,
          meta_description: metaDescription || null,
          notification_email_enabled: notificationEmail,
          notification_sound_enabled: notificationSound,
          splash_screen_url: splashScreenUrl || null,
          app_icon_url: appIconUrl || null,
        },
      });
      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    }
  };

  const handleReset = () => {
    setAgencyName(agencyConfig.agencyName);
    setPrimaryColor(hslToHex(agencyConfig.primaryColor));
    setSecondaryColor(hslToHex(agencyConfig.secondaryColor));
    setAccentColor(hslToHex(agencyConfig.accentColor));
    setLogoUrl(agencyConfig.logoUrl || '');
    setFaviconUrl(agencyConfig.faviconUrl || '');
    setHeroImageUrl(agencyConfig.heroImageUrl || '');
    setTagline(agencyConfig.tagline);
    setHeroCTAText(agencyConfig.heroCTAText);
    setMetaDescription(agencyConfig.metaDescription);
    setBio('');
    setLicenseNumber('');
    setProfileImage('');
    setPhone('');
    setEmail('');
    setOfficeAddress('');
    setSocialFacebook('');
    setSocialInstagram('');
    setSocialLinkedIn('');
    setSocialTwitter('');
    setNotificationEmail(true);
    setNotificationSound(true);
    setSplashScreenUrl('');
    setAppIconUrl('');
    setAllowPartnerListings(true);
    toast.info('Settings reset to defaults');
  };

  if (isLoading) {
    return (
      <AgentLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AgentLayout>
    );
  }

  return (
    <AgentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Customize your agency's white-label experience</p>
        </div>

        <Tabs defaultValue="branding" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto gap-2">
            <TabsTrigger value="branding" className="flex items-center gap-2 text-xs sm:text-sm">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Branding</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2 text-xs sm:text-sm">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2 text-xs sm:text-sm">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">Content</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2 text-xs sm:text-sm">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Preferences</span>
            </TabsTrigger>
          </TabsList>

          {/* Branding Tab */}
          <TabsContent value="branding" className="space-y-6">
            {/* Agency Identity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Agency Identity
                </CardTitle>
                <CardDescription>Upload your agency's visual assets</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="agencyName">Agency Name</Label>
                  <Input
                    id="agencyName"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    placeholder="Your Agency Name"
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {/* Logo */}
                  <div className="space-y-2">
                    <Label>Logo</Label>
                    <div className="flex items-center gap-4">
                      {logoUrl && (
                        <img src={logoUrl} alt="Logo" className="h-12 w-12 object-contain rounded border bg-background" />
                      )}
                      <div className="flex-1 space-y-2">
                        <div className="relative">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, setLogoUrl, setUploadingLogo, 'logos')}
                            className="hidden"
                            id="logo-upload"
                          />
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => document.getElementById('logo-upload')?.click()}
                            disabled={uploadingLogo}
                          >
                            {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                            Upload Logo
                          </Button>
                        </div>
                        <Input
                          placeholder="Or paste URL..."
                          value={logoUrl}
                          onChange={(e) => setLogoUrl(e.target.value)}
                          className="text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Favicon */}
                  <div className="space-y-2">
                    <Label>Favicon</Label>
                    <div className="flex items-center gap-4">
                      {faviconUrl && (
                        <img src={faviconUrl} alt="Favicon" className="h-12 w-12 object-contain rounded border bg-background" />
                      )}
                      <div className="flex-1 space-y-2">
                        <div className="relative">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, setFaviconUrl, setUploadingFavicon, 'favicons')}
                            className="hidden"
                            id="favicon-upload"
                          />
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => document.getElementById('favicon-upload')?.click()}
                            disabled={uploadingFavicon}
                          >
                            {uploadingFavicon ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                            Upload Favicon
                          </Button>
                        </div>
                        <Input
                          placeholder="Or paste URL..."
                          value={faviconUrl}
                          onChange={(e) => setFaviconUrl(e.target.value)}
                          className="text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hero Image */}
                <div className="space-y-2">
                  <Label>Hero Background Image</Label>
                  <div className="flex items-start gap-4">
                    {heroImageUrl && (
                      <img src={heroImageUrl} alt="Hero" className="h-20 w-32 object-cover rounded border" />
                    )}
                    <div className="flex-1 space-y-2">
                      <div className="relative">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, setHeroImageUrl, setUploadingHero, 'heroes')}
                          className="hidden"
                          id="hero-upload"
                        />
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => document.getElementById('hero-upload')?.click()}
                          disabled={uploadingHero}
                        >
                          {uploadingHero ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                          Upload Hero Image
                        </Button>
                      </div>
                      <Input
                        placeholder="Or paste URL..."
                        value={heroImageUrl}
                        onChange={(e) => setHeroImageUrl(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Brand Colors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Brand Colors
                </CardTitle>
                <CardDescription>Choose colors that represent your brand</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        id="primaryColor"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="h-10 w-14 rounded border cursor-pointer"
                      />
                      <Input
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="secondaryColor">Secondary Color</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        id="secondaryColor"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="h-10 w-14 rounded border cursor-pointer"
                      />
                      <Input
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accentColor">Accent Color</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        id="accentColor"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="h-10 w-14 rounded border cursor-pointer"
                      />
                      <Input
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Color Preview */}
                <div className="mt-6 p-4 rounded-lg border bg-muted/50">
                  <p className="text-sm font-medium mb-3">Preview</p>
                  <div className="flex flex-wrap gap-3">
                    <div
                      className="h-12 w-24 rounded-lg flex items-center justify-center text-xs font-medium shadow-sm"
                      style={{ backgroundColor: primaryColor, color: '#fff' }}
                    >
                      Primary
                    </div>
                    <div
                      className="h-12 w-24 rounded-lg flex items-center justify-center text-xs font-medium shadow-sm"
                      style={{ backgroundColor: secondaryColor }}
                    >
                      Secondary
                    </div>
                    <div
                      className="h-12 w-24 rounded-lg flex items-center justify-center text-xs font-medium shadow-sm"
                      style={{ backgroundColor: accentColor, color: '#fff' }}
                    >
                      Accent
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mobile App Assets */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Mobile App Assets
                </CardTitle>
                <CardDescription>Assets for mobile app installation (PWA)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* App Icon */}
                  <div className="space-y-2">
                    <Label>App Icon (512x512)</Label>
                    <div className="flex items-center gap-4">
                      {appIconUrl && (
                        <img src={appIconUrl} alt="App Icon" className="h-12 w-12 object-contain rounded-xl border bg-background" />
                      )}
                      <div className="flex-1 space-y-2">
                        <div className="relative">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, setAppIconUrl, setUploadingAppIcon, 'app-icons')}
                            className="hidden"
                            id="appicon-upload"
                          />
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => document.getElementById('appicon-upload')?.click()}
                            disabled={uploadingAppIcon}
                          >
                            {uploadingAppIcon ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                            Upload App Icon
                          </Button>
                        </div>
                        <Input
                          placeholder="Or paste URL..."
                          value={appIconUrl}
                          onChange={(e) => setAppIconUrl(e.target.value)}
                          className="text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Splash Screen */}
                  <div className="space-y-2">
                    <Label>Splash Screen</Label>
                    <div className="flex items-center gap-4">
                      {splashScreenUrl && (
                        <img src={splashScreenUrl} alt="Splash" className="h-12 w-12 object-contain rounded border bg-background" />
                      )}
                      <div className="flex-1 space-y-2">
                        <div className="relative">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, setSplashScreenUrl, setUploadingSplash, 'splash')}
                            className="hidden"
                            id="splash-upload"
                          />
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => document.getElementById('splash-upload')?.click()}
                            disabled={uploadingSplash}
                          >
                            {uploadingSplash ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                            Upload Splash Screen
                          </Button>
                        </div>
                        <Input
                          placeholder="Or paste URL..."
                          value={splashScreenUrl}
                          onChange={(e) => setSplashScreenUrl(e.target.value)}
                          className="text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Agent Profile
                </CardTitle>
                <CardDescription>Your public agent information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Image */}
                <div className="space-y-2">
                  <Label>Profile Photo</Label>
                  <div className="flex items-center gap-4">
                    {profileImage ? (
                      <img src={profileImage} alt="Profile" className="h-20 w-20 object-cover rounded-full border-2 border-primary" />
                    ) : (
                      <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 space-y-2">
                      <div className="relative">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, setProfileImage, setUploadingProfile, 'profiles')}
                          className="hidden"
                          id="profile-upload"
                        />
                        <Button
                          variant="outline"
                          onClick={() => document.getElementById('profile-upload')?.click()}
                          disabled={uploadingProfile}
                        >
                          {uploadingProfile ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                          Upload Photo
                        </Button>
                      </div>
                      <Input
                        placeholder="Or paste URL..."
                        value={profileImage}
                        onChange={(e) => setProfileImage(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="licenseNumber">License Number</Label>
                  <Input
                    id="licenseNumber"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="e.g., LIC-12345678"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio / About</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell potential clients about yourself and your experience..."
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">{bio.length}/500 characters</p>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contact Information
                </CardTitle>
                <CardDescription>How clients can reach you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g., 0400 000 000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="agent@agency.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="officeAddress">Office Address</Label>
                  <Input
                    id="officeAddress"
                    value={officeAddress}
                    onChange={(e) => setOfficeAddress(e.target.value)}
                    placeholder="123 Main Street, Sydney NSW 2000"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            {/* Hero Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Hero Section
                </CardTitle>
                <CardDescription>Customize your landing page hero</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input
                    id="tagline"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="Find Your Dream Home"
                  />
                  <p className="text-xs text-muted-foreground">Displayed below your agency name on the landing page</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="heroCTA">Call-to-Action Button</Label>
                  <Input
                    id="heroCTA"
                    value={heroCTAText}
                    onChange={(e) => setHeroCTAText(e.target.value)}
                    placeholder="Browse Properties"
                  />
                  <p className="text-xs text-muted-foreground">The main button text on your landing page</p>
                </div>
              </CardContent>
            </Card>

            {/* Social Media Links */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5" />
                  Social Media Links
                </CardTitle>
                <CardDescription>Connect your social profiles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="facebook">Facebook</Label>
                    <Input
                      id="facebook"
                      value={socialFacebook}
                      onChange={(e) => setSocialFacebook(e.target.value)}
                      placeholder="https://facebook.com/youragency"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      value={socialInstagram}
                      onChange={(e) => setSocialInstagram(e.target.value)}
                      placeholder="https://instagram.com/youragency"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <Input
                      id="linkedin"
                      value={socialLinkedIn}
                      onChange={(e) => setSocialLinkedIn(e.target.value)}
                      placeholder="https://linkedin.com/company/youragency"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="twitter">Twitter / X</Label>
                    <Input
                      id="twitter"
                      value={socialTwitter}
                      onChange={(e) => setSocialTwitter(e.target.value)}
                      placeholder="https://twitter.com/youragency"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SEO Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  SEO Settings
                </CardTitle>
                <CardDescription>Optimize for search engines</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="metaDescription">Meta Description</Label>
                  <Textarea
                    id="metaDescription"
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    placeholder="Your trusted real estate partner for buying, selling, and renting properties."
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">{metaDescription.length}/160 characters recommended</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            {/* Notification Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>Control how you receive alerts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive important updates via email</p>
                  </div>
                  <Switch
                    checked={notificationEmail}
                    onCheckedChange={setNotificationEmail}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Sound Notifications</Label>
                    <p className="text-sm text-muted-foreground">Play doorbell sound for new leads</p>
                  </div>
                  <Switch
                    checked={notificationSound}
                    onCheckedChange={setNotificationSound}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Partner Network */}
            <Card>
              <CardHeader>
                <CardTitle>Partner Network</CardTitle>
                <CardDescription>Manage collaboration with partner agents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Allow Partner Listings</Label>
                    <p className="text-sm text-muted-foreground">Let partner agents display their listings in your app</p>
                  </div>
                  <Switch
                    checked={allowPartnerListings}
                    onCheckedChange={setAllowPartnerListings}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t">
          <Button variant="outline" onClick={handleReset}>
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} disabled={updateTheme.isPending} className="sm:ml-auto">
            {updateTheme.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Save Changes
          </Button>
        </div>
      </div>
    </AgentLayout>
  );
}