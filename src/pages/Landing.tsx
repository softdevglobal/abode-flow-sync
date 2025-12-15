import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAgencyTheme } from '@/contexts/AgencyThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building2,
  Search,
  Calendar,
  Home,
  Bed,
  Bath,
  Car,
  Heart,
  ArrowRight,
  MapPin,
  Users,
  Building,
  Menu,
  X,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  QrCode,
  Camera,
} from 'lucide-react';
import heroImage from '@/assets/hero-home.jpg';

export default function Landing() {
  const navigate = useNavigate();
  const config = useAgencyTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [showFloatingCheckIn, setShowFloatingCheckIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchLocation, setSearchLocation] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const statsRef = useRef<HTMLDivElement>(null);
  const [statsVisible, setStatsVisible] = useState(false);

  // Handle scroll for sticky nav and floating button
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
      setShowFloatingCheckIn(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection observer for stats animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStatsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Fetch featured properties
  const { data: featuredProperties } = useQuery({
    queryKey: ['featured-properties'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      return data;
    },
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['landing-stats'],
    queryFn: async () => {
      const [propertiesRes, agentsRes] = await Promise.all([
        supabase.from('properties').select('id', { count: 'exact' }).eq('status', 'active'),
        supabase.from('agents').select('id', { count: 'exact' }),
      ]);

      return {
        activeListings: propertiesRes.count || 0,
        totalAgents: agentsRes.count || 0,
        citiesCovered: 25, // Placeholder
      };
    },
  });

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchLocation) params.set('location', searchLocation);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (bedrooms) params.set('bedrooms', bedrooms);

    navigate(`/browse?${params.toString()}`);
  };

  const formatPrice = (price: number | null) => {
    if (!price) return 'Contact Agent';
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const AnimatedNumber = ({ value, suffix = '' }: { value: number; suffix?: string }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
      if (!statsVisible) return;

      const duration = 2000;
      const steps = 60;
      const increment = value / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          setDisplayValue(value);
          clearInterval(timer);
        } else {
          setDisplayValue(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }, [value, statsVisible]);

    return (
      <span>
        {displayValue.toLocaleString()}
        {suffix}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-background/95 backdrop-blur-md shadow-md'
            : 'bg-transparent'
        }`}
      >
        <div className="container flex items-center justify-between h-16 md:h-20">
          <Link to="/" className="flex items-center gap-2">
            {config.logoUrl ? (
              <img src={config.logoUrl} alt={config.agencyName} className="h-9 w-auto" />
            ) : (
              <div className="w-9 h-9 rounded-lg gradient-hero flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary-foreground" />
              </div>
            )}
            <span
              className={`font-display text-xl font-semibold transition-colors ${
                isScrolled ? 'text-foreground' : 'text-primary-foreground'
              }`}
            >
              {config.agencyName}
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              to="/browse"
              className={`text-sm font-medium transition-colors hover:text-accent ${
                isScrolled ? 'text-foreground' : 'text-primary-foreground'
              }`}
            >
              Browse Properties
            </Link>
            <a
              href="#how-it-works"
              className={`text-sm font-medium transition-colors hover:text-accent ${
                isScrolled ? 'text-foreground' : 'text-primary-foreground'
              }`}
            >
              About
            </a>
            <a
              href="#footer"
              className={`text-sm font-medium transition-colors hover:text-accent ${
                isScrolled ? 'text-foreground' : 'text-primary-foreground'
              }`}
            >
              Contact
            </a>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/auth">
              <Button
                variant="ghost"
                className={isScrolled ? 'text-foreground' : 'text-primary-foreground hover:bg-primary-foreground/10'}
              >
                Sign In
              </Button>
            </Link>
            <Link to="/auth">
              <Button variant="gold">Get Started</Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className={isScrolled ? 'text-foreground' : 'text-primary-foreground'} />
            ) : (
              <Menu className={isScrolled ? 'text-foreground' : 'text-primary-foreground'} />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-card border-t border-border">
            <div className="container py-4 flex flex-col gap-4">
              <Link
                to="/browse"
                className="text-foreground font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Browse Properties
              </Link>
              <a
                href="#how-it-works"
                className="text-foreground font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </a>
              <a
                href="#footer"
                className="text-foreground font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact
              </a>
              <div className="flex gap-3 pt-2">
                <Link to="/auth" className="flex-1">
                  <Button variant="outline" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth" className="flex-1">
                  <Button variant="gold" className="w-full">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Luxury modern home"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/70 to-primary/90" />
        </div>

        <div className="relative z-10 container px-4 py-20 text-center">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6 animate-fade-in">
            Find Your Dream Home
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto animate-slide-up">
            Browse thousands of properties from trusted agents across Australia
          </p>

          {/* Search Bar */}
          <div className="max-w-4xl mx-auto bg-card rounded-xl shadow-xl p-4 md:p-6 animate-scale-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2 relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search suburb or postcode..."
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
              <Select value={minPrice} onValueChange={setMinPrice}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Min Price" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="200000">$200,000</SelectItem>
                  <SelectItem value="400000">$400,000</SelectItem>
                  <SelectItem value="600000">$600,000</SelectItem>
                  <SelectItem value="800000">$800,000</SelectItem>
                  <SelectItem value="1000000">$1,000,000</SelectItem>
                  <SelectItem value="1500000">$1,500,000</SelectItem>
                  <SelectItem value="2000000">$2,000,000</SelectItem>
                </SelectContent>
              </Select>
              <Select value={maxPrice} onValueChange={setMaxPrice}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Max Price" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="500000">$500,000</SelectItem>
                  <SelectItem value="750000">$750,000</SelectItem>
                  <SelectItem value="1000000">$1,000,000</SelectItem>
                  <SelectItem value="1500000">$1,500,000</SelectItem>
                  <SelectItem value="2000000">$2,000,000</SelectItem>
                  <SelectItem value="3000000">$3,000,000</SelectItem>
                  <SelectItem value="5000000">$5,000,000+</SelectItem>
                </SelectContent>
              </Select>
              <Select value={bedrooms} onValueChange={setBedrooms}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Bedrooms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="1">1+</SelectItem>
                  <SelectItem value="2">2+</SelectItem>
                  <SelectItem value="3">3+</SelectItem>
                  <SelectItem value="4">4+</SelectItem>
                  <SelectItem value="5">5+</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleSearch}
              size="lg"
              variant="gold"
              className="w-full mt-4 h-12"
            >
              <Search className="w-5 h-5 mr-2" />
              Search Properties
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-16 md:py-24 bg-secondary">
        <div className="container px-4">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
                Featured Properties
              </h2>
              <p className="text-muted-foreground">
                Discover our latest listings
              </p>
            </div>
            <Link to="/browse">
              <Button variant="outline" className="hidden md:flex">
                View All Properties
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProperties?.map((property) => (
              <Link
                key={property.id}
                to={`/property/${property.id}`}
                className="group"
              >
                <Card className="overflow-hidden border-0 shadow-elegant transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={property.images?.[0] || '/placeholder.svg'}
                      alt={property.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <button
                      className="absolute top-3 right-3 w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center transition-colors hover:bg-card"
                      onClick={(e) => {
                        e.preventDefault();
                        // TODO: Implement favorites (requires login)
                      }}
                    >
                      <Heart className="w-5 h-5 text-muted-foreground" />
                    </button>
                    <Badge className="absolute bottom-3 left-3 bg-primary text-primary-foreground capitalize">
                      {property.property_type}
                    </Badge>
                  </div>
                  <CardContent className="p-5">
                    <p className="font-display text-2xl font-bold text-accent mb-2">
                      {property.price_display || formatPrice(property.price)}
                    </p>
                    <h3 className="font-semibold text-foreground mb-1 line-clamp-1">
                      {property.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {property.suburb}, {property.state}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Bed className="w-4 h-4" />
                        {property.bedrooms || '-'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Bath className="w-4 h-4" />
                        {property.bathrooms || '-'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Car className="w-4 h-4" />
                        {property.parking || '-'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="mt-8 text-center md:hidden">
            <Link to="/browse">
              <Button variant="outline">
                View All Properties
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 md:py-24">
        <div className="container px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Finding your perfect home is easy with {config.agencyName}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-20 h-20 rounded-2xl gradient-hero flex items-center justify-center mx-auto mb-6 transition-transform group-hover:scale-110">
                <Search className="w-10 h-10 text-primary-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-3">
                Browse Properties
              </h3>
              <p className="text-muted-foreground">
                Search thousands of listings by location, price, and features to find homes that match your criteria.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 rounded-2xl gradient-gold flex items-center justify-center mx-auto mb-6 transition-transform group-hover:scale-110">
                <Calendar className="w-10 h-10 text-accent-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-3">
                Book Inspections
              </h3>
              <p className="text-muted-foreground">
                Schedule property viewings at times that suit you, with instant confirmation from agents.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 rounded-2xl gradient-hero flex items-center justify-center mx-auto mb-6 transition-transform group-hover:scale-110">
                <Home className="w-10 h-10 text-primary-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-3">
                Find Your Home
              </h3>
              <p className="text-muted-foreground">
                Connect directly with agents and secure your dream property with confidence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Inspection Check-In Section */}
      <section className="py-16 md:py-24 bg-secondary">
        <div className="container px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="bg-accent/10 text-accent mb-4">Quick Check-In</Badge>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                Attending an Inspection?
              </h2>
              <p className="text-muted-foreground mb-6 text-lg">
                Scan the QR code at the property entrance to check in instantly. 
                The agent will be notified of your arrival and you can start exploring right away.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-muted-foreground">
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                    <QrCode className="w-4 h-4 text-accent" />
                  </div>
                  <span>Scan QR code at property</span>
                </li>
                <li className="flex items-center gap-3 text-muted-foreground">
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                    <Users className="w-4 h-4 text-accent" />
                  </div>
                  <span>Automatic attendance registration</span>
                </li>
                <li className="flex items-center gap-3 text-muted-foreground">
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                    <Camera className="w-4 h-4 text-accent" />
                  </div>
                  <span>No app download required</span>
                </li>
              </ul>
              <Link to="/check-in">
                <Button variant="gold" size="lg">
                  <QrCode className="w-5 h-5 mr-2" />
                  Open Check-In Scanner
                </Button>
              </Link>
            </div>
            <div className="relative">
              <Card className="bg-card shadow-xl rounded-2xl p-8 text-center max-w-sm mx-auto">
                <div className="w-32 h-32 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6">
                  <QrCode className="w-16 h-16 text-accent" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">Ready to Check In?</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Look for the QR code displayed at the property entrance
                </p>
                <Link to="/check-in">
                  <Button variant="outline" className="w-full">
                    <Camera className="w-4 h-4 mr-2" />
                    Scan QR Code
                  </Button>
                </Link>
              </Card>
              <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-accent/5 rounded-full blur-3xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section ref={statsRef} className="py-16 md:py-24 gradient-hero">
        <div className="container px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <p className="font-display text-4xl md:text-5xl font-bold text-primary-foreground mb-2">
                <AnimatedNumber value={stats?.activeListings || 0} suffix="+" />
              </p>
              <p className="text-primary-foreground/70">Active Listings</p>
            </div>
            <div>
              <p className="font-display text-4xl md:text-5xl font-bold text-primary-foreground mb-2">
                <AnimatedNumber value={stats?.totalAgents || 0} suffix="+" />
              </p>
              <p className="text-primary-foreground/70">Trusted Agents</p>
            </div>
            <div>
              <p className="font-display text-4xl md:text-5xl font-bold text-primary-foreground mb-2">
                <AnimatedNumber value={stats?.citiesCovered || 0} suffix="+" />
              </p>
              <p className="text-primary-foreground/70">Cities Covered</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container px-4">
          <Card className="gradient-gold rounded-2xl overflow-hidden border-0">
            <CardContent className="p-8 md:p-12 text-center">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-accent-foreground mb-4">
                Ready to Find Your Perfect Home?
              </h2>
              <p className="text-accent-foreground/80 mb-8 max-w-xl mx-auto">
                Join thousands of buyers who have found their dream property with {config.agencyName}.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/browse">
                  <Button size="lg" variant="default" className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Search className="w-4 h-4 mr-2" />
                    Browse Properties
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button size="lg" variant="outline" className="border-accent-foreground/30 text-accent-foreground hover:bg-accent-foreground/10">
                    Create Account
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer id="footer" className="bg-primary py-12 md:py-16">
        <div className="container px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                {config.logoUrl ? (
                  <img src={config.logoUrl} alt={config.agencyName} className="h-9 w-auto" />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary-foreground" />
                  </div>
                )}
                <span className="font-display text-xl font-semibold text-primary-foreground">
                  {config.agencyName}
                </span>
              </div>
              <p className="text-primary-foreground/70 max-w-sm mb-6">
                Your trusted platform for finding the perfect property. Connect with agents and discover your dream home today.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors">
                  <Facebook className="w-5 h-5 text-primary-foreground" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors">
                  <Twitter className="w-5 h-5 text-primary-foreground" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors">
                  <Instagram className="w-5 h-5 text-primary-foreground" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors">
                  <Linkedin className="w-5 h-5 text-primary-foreground" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-display font-semibold text-primary-foreground mb-4">
                Quick Links
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link to="/browse" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                    Browse Properties
                  </Link>
                </li>
                <li>
                  <Link to="/agent" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                    For Agents
                  </Link>
                </li>
                <li>
                  <Link to="/calculator" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                    Affordability Calculator
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-display font-semibold text-primary-foreground mb-4">
                Legal
              </h4>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-primary-foreground/20 pt-8">
            <p className="text-center text-primary-foreground/60 text-sm">
              © {new Date().getFullYear()} {config.agencyName}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
      {/* Floating Check-In Button */}
      <Link
        to="/check-in"
        className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
          showFloatingCheckIn 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <Button 
          variant="gold" 
          size="lg" 
          className="shadow-xl rounded-full px-6 gap-2"
        >
          <QrCode className="w-5 h-5" />
          <span className="hidden sm:inline">Check In</span>
        </Button>
      </Link>
    </div>
  );
}
