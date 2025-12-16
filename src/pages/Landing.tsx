import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
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
  Menu,
  X,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  QrCode,
  Camera,
  Gavel,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
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

  // Fetch live auctions
  const { data: liveAuctions } = useQuery({
    queryKey: ['live-auctions-landing'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('auctions')
        .select(`
          *,
          property:property_id (
            id,
            title,
            address,
            suburb,
            state,
            postcode,
            images,
            bedrooms,
            bathrooms,
            parking
          )
        `)
        .in('status', ['live', 'pending'])
        .order('start_time', { ascending: true })
        .limit(4);

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
            ? 'bg-background/95 backdrop-blur-md border-b border-border'
            : 'bg-transparent'
        }`}
      >
        <div className="container flex items-center justify-between h-16 md:h-20">
          <Link to="/" className="flex items-center gap-3">
            {config.logoUrl ? (
              <img src={config.logoUrl} alt={config.agencyName} className="h-9 w-auto" />
            ) : (
              <div className="w-10 h-10 rounded-xl gradient-orange flex items-center justify-center shadow-glow-sm">
                <Building2 className="w-5 h-5 text-accent-foreground" />
              </div>
            )}
            <span className="font-display text-xl font-bold text-foreground">
              {config.agencyName}
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              to="/browse"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Properties
            </Link>
            <Link
              to="/auctions"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Auctions
            </Link>
            <a
              href="#how-it-works"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              How It Works
            </a>
            <a
              href="#footer"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Contact
            </a>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />
            <Link to="/auth">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/auth">
              <Button variant="accent">
                Get Started
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
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
                Properties
              </Link>
              <Link
                to="/auctions"
                className="text-foreground font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Auctions
              </Link>
              <a
                href="#how-it-works"
                className="text-foreground font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                How It Works
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
                  <Button variant="accent" className="w-full">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section - Phenomenon Style */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-16 bg-grid">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[120px] animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-accent/10 rounded-full blur-[100px] animate-float" style={{ animationDelay: '2s' }} />
        
        <div className="relative z-10 container px-4 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <Badge className="bg-accent/10 text-accent border-accent/20 mb-6 animate-fade-in">
                <Sparkles className="w-3 h-3 mr-1" />
                Australia's Modern Real Estate Platform
              </Badge>
              
              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-extrabold text-foreground mb-6 animate-fade-in leading-tight">
                Find Your{' '}
                <span className="text-gradient">Dream Home</span>
                {' '}Today
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto lg:mx-0 animate-slide-up">
                Browse thousands of properties, attend live auctions, and connect with trusted agents across Australia.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-10 animate-scale-in">
                <Link to="/browse">
                  <Button variant="accent" size="xl">
                    Browse Properties
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/agent">
                  <Button variant="outline" size="xl">
                    For Agents
                  </Button>
                </Link>
              </div>
            </div>

            {/* Hero Image with Touch-Friendly Animations - Visible on all screens */}
            <motion.div 
              className="relative order-first lg:order-last mb-8 lg:mb-0"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <motion.div
                className="relative rounded-2xl lg:rounded-3xl overflow-hidden shadow-2xl cursor-pointer"
                whileHover={{ 
                  scale: 1.02,
                  rotateY: 3,
                  rotateX: -1,
                }}
                whileTap={{ 
                  scale: 0.97,
                  rotateY: 0,
                  rotateX: 0,
                }}
                transition={{ 
                  type: "spring", 
                  stiffness: 400, 
                  damping: 25 
                }}
                style={{ transformStyle: "preserve-3d", perspective: 1000 }}
              >
                <motion.img
                  src={heroImage}
                  alt="Beautiful modern home"
                  className="w-full h-[280px] sm:h-[350px] lg:h-[500px] object-cover"
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  whileTap={{ scale: 1.05 }}
                  transition={{ duration: 0.6 }}
                />
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-background/20 to-transparent" />
                
                {/* Floating badge - responsive sizing */}
                <motion.div 
                  className="absolute bottom-4 left-4 right-4 lg:bottom-6 lg:left-6 lg:right-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                >
                  <motion.div 
                    className="bg-card/90 backdrop-blur-md rounded-xl lg:rounded-2xl p-3 lg:p-4 border border-border/50"
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg lg:rounded-xl gradient-orange flex items-center justify-center shrink-0">
                        <Home className="w-5 h-5 lg:w-6 lg:h-6 text-accent-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground text-sm lg:text-base">Dream Homes Await</p>
                        <p className="text-xs lg:text-sm text-muted-foreground">Discover {stats?.activeListings || 0}+ properties</p>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>

                {/* Touch ripple effect overlay */}
                <motion.div 
                  className="absolute inset-0 rounded-2xl lg:rounded-3xl pointer-events-none"
                  initial={{ opacity: 0 }}
                  whileTap={{ 
                    opacity: 1,
                    transition: { duration: 0.1 }
                  }}
                  style={{
                    background: "radial-gradient(circle at center, rgba(249, 115, 22, 0.2) 0%, transparent 70%)"
                  }}
                />

                {/* Glow effect on hover/tap */}
                <motion.div 
                  className="absolute inset-0 rounded-2xl lg:rounded-3xl pointer-events-none"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  whileTap={{ opacity: 0.8 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    boxShadow: "inset 0 0 40px rgba(249, 115, 22, 0.15), 0 0 30px rgba(249, 115, 22, 0.1)"
                  }}
                />
              </motion.div>

              {/* Decorative elements - smaller on mobile */}
              <motion.div 
                className="absolute -top-2 -right-2 lg:-top-4 lg:-right-4 w-16 h-16 lg:w-24 lg:h-24 bg-accent/20 rounded-full blur-xl"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <motion.div 
                className="absolute -bottom-2 -left-2 lg:-bottom-4 lg:-left-4 w-20 h-20 lg:w-32 lg:h-32 bg-accent/15 rounded-full blur-xl"
                animate={{ 
                  scale: [1, 1.3, 1],
                  opacity: [0.4, 0.7, 0.4]
                }}
                transition={{ 
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1
                }}
              />
            </motion.div>
          </div>

          {/* Search Bar - Full Width Below */}
          <Card variant="glass" className="max-w-4xl mx-auto mt-16 animate-scale-in">
            <CardContent className="p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="lg:col-span-2 relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search suburb or postcode..."
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    className="pl-10 h-12 bg-muted/50 border-border"
                  />
                </div>
                <Select value={minPrice} onValueChange={setMinPrice}>
                  <SelectTrigger className="h-12 bg-muted/50 border-border">
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
                  <SelectTrigger className="h-12 bg-muted/50 border-border">
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
                  <SelectTrigger className="h-12 bg-muted/50 border-border">
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
                variant="accent"
                className="w-full mt-4 h-12"
              >
                <Search className="w-5 h-5 mr-2" />
                Search Properties
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-16 md:py-24 bg-card/50">
        <div className="container px-4">
          <div className="flex items-center justify-between mb-10">
            <div>
              <Badge className="bg-accent/10 text-accent border-accent/20 mb-3">Featured</Badge>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
                Latest Properties
              </h2>
              <p className="text-muted-foreground">
                Discover our newest listings
              </p>
            </div>
            <Link to="/browse">
              <Button variant="outline" className="hidden md:flex">
                View All
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
                <Card variant="property" className="overflow-hidden">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={property.images?.[0] || '/placeholder.svg'}
                      alt={property.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <button
                      className="absolute top-3 right-3 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center transition-colors hover:bg-background"
                      onClick={(e) => {
                        e.preventDefault();
                      }}
                    >
                      <Heart className="w-5 h-5 text-muted-foreground" />
                    </button>
                    <Badge className="absolute bottom-3 left-3 bg-background/80 backdrop-blur-sm text-foreground capitalize border-0">
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

      {/* Live Auctions Section */}
      {liveAuctions && liveAuctions.length > 0 && (
        <section className="py-16 md:py-24 bg-background">
          <div className="container px-4">
            <div className="flex items-center justify-between mb-10">
              <div>
                <Badge className="bg-red-500/10 text-red-500 border-red-500/20 mb-3">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse" />
                  Live Now
                </Badge>
                <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
                  Live Auctions
                </h2>
                <p className="text-muted-foreground">
                  Bid on properties in real-time
                </p>
              </div>
              <Link to="/auctions">
                <Button variant="outline" className="hidden md:flex">
                  View All Auctions
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {liveAuctions.map((auction) => {
                const property = auction.property as {
                  id: string;
                  title: string;
                  address: string;
                  suburb: string;
                  state: string;
                  postcode: string;
                  images: string[] | null;
                  bedrooms: number | null;
                  bathrooms: number | null;
                  parking: number | null;
                } | null;

                return (
                  <Link
                    key={auction.id}
                    to={`/auction/live/${auction.id}`}
                    className="group"
                  >
                    <Card variant="interactive" className="overflow-hidden relative">
                      {auction.status === 'live' && (
                        <div className="absolute top-3 left-3 z-10">
                          <Badge className="bg-red-500 text-white border-0 animate-pulse">
                            <Gavel className="w-3 h-3 mr-1" />
                            LIVE
                          </Badge>
                        </div>
                      )}
                      {auction.status === 'pending' && (
                        <div className="absolute top-3 left-3 z-10">
                          <Badge variant="secondary" className="border-0">
                            Upcoming
                          </Badge>
                        </div>
                      )}
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <img
                          src={property?.images?.[0] || '/placeholder.svg'}
                          alt={property?.title || 'Auction Property'}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                        <div className="absolute bottom-3 left-3 right-3">
                          <p className="text-foreground text-sm truncate">
                            {property?.suburb}, {property?.state}
                          </p>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-foreground mb-2 line-clamp-1">
                          {property?.title || 'Auction Property'}
                        </h3>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground">Current Bid</p>
                            <p className="font-display text-xl font-bold text-accent">
                              {formatPrice(auction.current_bid || 0)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-xs">+{formatPrice(auction.min_increment)}</span>
                          </div>
                        </div>
                        <Button 
                          variant="accent" 
                          size="sm" 
                          className="w-full mt-3"
                        >
                          <Gavel className="w-4 h-4 mr-2" />
                          {auction.status === 'live' ? 'Bid Now' : 'View Auction'}
                        </Button>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>

            <div className="mt-8 text-center md:hidden">
              <Link to="/auctions">
                <Button variant="outline">
                  View All Auctions
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section id="how-it-works" className="py-16 md:py-24 bg-card/50">
        <div className="container px-4">
          <div className="text-center mb-12">
            <Badge className="bg-accent/10 text-accent border-accent/20 mb-4">Process</Badge>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Finding your perfect home is easy with {config.agencyName}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card variant="glass" className="text-center p-8 group">
              <div className="w-16 h-16 rounded-2xl gradient-orange flex items-center justify-center mx-auto mb-6 transition-all group-hover:shadow-glow group-hover:scale-110">
                <Search className="w-8 h-8 text-accent-foreground" />
              </div>
              <h3 className="font-display text-xl font-bold mb-3 text-foreground">
                Browse Properties
              </h3>
              <p className="text-muted-foreground">
                Search thousands of listings by location, price, and features to find homes that match your criteria.
              </p>
            </Card>

            <Card variant="glass" className="text-center p-8 group">
              <div className="w-16 h-16 rounded-2xl gradient-orange flex items-center justify-center mx-auto mb-6 transition-all group-hover:shadow-glow group-hover:scale-110">
                <Calendar className="w-8 h-8 text-accent-foreground" />
              </div>
              <h3 className="font-display text-xl font-bold mb-3 text-foreground">
                Book Inspections
              </h3>
              <p className="text-muted-foreground">
                Schedule property viewings at times that suit you, with instant confirmation from agents.
              </p>
            </Card>

            <Card variant="glass" className="text-center p-8 group">
              <div className="w-16 h-16 rounded-2xl gradient-orange flex items-center justify-center mx-auto mb-6 transition-all group-hover:shadow-glow group-hover:scale-110">
                <Home className="w-8 h-8 text-accent-foreground" />
              </div>
              <h3 className="font-display text-xl font-bold mb-3 text-foreground">
                Find Your Home
              </h3>
              <p className="text-muted-foreground">
                Connect directly with agents and secure your dream property with confidence.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Inspection Check-In Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="bg-accent/10 text-accent border-accent/20 mb-4">Quick Check-In</Badge>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                Attending an Inspection?
              </h2>
              <p className="text-muted-foreground mb-6 text-lg">
                Scan the QR code at the property entrance to check in instantly. 
                The agent will be notified of your arrival and you can start exploring right away.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-muted-foreground">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <QrCode className="w-5 h-5 text-accent" />
                  </div>
                  <span>Scan QR code at property</span>
                </li>
                <li className="flex items-center gap-3 text-muted-foreground">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-accent" />
                  </div>
                  <span>Automatic attendance registration</span>
                </li>
                <li className="flex items-center gap-3 text-muted-foreground">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Camera className="w-5 h-5 text-accent" />
                  </div>
                  <span>No app download required</span>
                </li>
              </ul>
              <Link to="/checkin">
                <Button variant="accent" size="lg">
                  <QrCode className="w-5 h-5 mr-2" />
                  Open Check-In Scanner
                </Button>
              </Link>
            </div>
            <div className="relative">
              <Card variant="glow" className="p-8 text-center max-w-sm mx-auto">
                <div className="w-32 h-32 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6">
                  <QrCode className="w-16 h-16 text-accent" />
                </div>
                <h3 className="font-display text-xl font-bold mb-2 text-foreground">Ready to Check In?</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Look for the QR code displayed at the property entrance
                </p>
                <Link to="/checkin">
                  <Button variant="outline" className="w-full">
                    <Camera className="w-4 h-4 mr-2" />
                    Scan QR Code
                  </Button>
                </Link>
              </Card>
              <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-accent/10 rounded-full blur-[80px]" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section ref={statsRef} className="py-16 md:py-24 gradient-orange">
        <div className="container px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <p className="font-display text-5xl md:text-6xl font-extrabold text-accent-foreground mb-2">
                <AnimatedNumber value={stats?.activeListings || 0} suffix="+" />
              </p>
              <p className="text-accent-foreground/70 font-medium">Active Listings</p>
            </div>
            <div>
              <p className="font-display text-5xl md:text-6xl font-extrabold text-accent-foreground mb-2">
                <AnimatedNumber value={stats?.totalAgents || 0} suffix="+" />
              </p>
              <p className="text-accent-foreground/70 font-medium">Trusted Agents</p>
            </div>
            <div>
              <p className="font-display text-5xl md:text-6xl font-extrabold text-accent-foreground mb-2">
                <AnimatedNumber value={stats?.citiesCovered || 0} suffix="+" />
              </p>
              <p className="text-accent-foreground/70 font-medium">Cities Covered</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-card/50">
        <div className="container px-4">
          <Card variant="glow" className="overflow-hidden border-accent/30">
            <CardContent className="p-8 md:p-12 text-center">
              <h2 className="font-display text-2xl md:text-4xl font-bold text-foreground mb-4">
                Ready to Find Your{' '}
                <span className="text-gradient">Perfect Home</span>?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Join thousands of buyers who have found their dream property with {config.agencyName}.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/browse">
                  <Button size="lg" variant="accent">
                    <Search className="w-4 h-4 mr-2" />
                    Browse Properties
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button size="lg" variant="outline">
                    Create Account
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer id="footer" className="bg-card border-t border-border py-12 md:py-16">
        <div className="container px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                {config.logoUrl ? (
                  <img src={config.logoUrl} alt={config.agencyName} className="h-9 w-auto" />
                ) : (
                  <div className="w-10 h-10 rounded-xl gradient-orange flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-accent-foreground" />
                  </div>
                )}
                <span className="font-display text-xl font-bold text-foreground">
                  {config.agencyName}
                </span>
              </div>
              <p className="text-muted-foreground max-w-sm mb-6">
                Your trusted platform for finding the perfect property. Connect with agents and discover your dream home today.
              </p>
              <div className="flex gap-3">
                <a href="#" className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center hover:bg-accent/20 hover:text-accent transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center hover:bg-accent/20 hover:text-accent transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center hover:bg-accent/20 hover:text-accent transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center hover:bg-accent/20 hover:text-accent transition-colors">
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-display font-bold text-foreground mb-4">
                Quick Links
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link to="/browse" className="text-muted-foreground hover:text-accent transition-colors">
                    Browse Properties
                  </Link>
                </li>
                <li>
                  <Link to="/agent" className="text-muted-foreground hover:text-accent transition-colors">
                    For Agents
                  </Link>
                </li>
                <li>
                  <Link to="/calculator" className="text-muted-foreground hover:text-accent transition-colors">
                    Affordability Calculator
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-display font-bold text-foreground mb-4">
                Legal
              </h4>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-muted-foreground hover:text-accent transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-accent transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-accent transition-colors">
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-8 text-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} {config.agencyName}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Floating Check-In Button */}
      {showFloatingCheckIn && (
        <Link
          to="/checkin"
          className="fixed bottom-6 right-6 z-40"
        >
          <Button
            variant="accent"
            size="lg"
            className="rounded-full shadow-glow animate-pulse-glow"
          >
            <QrCode className="w-5 h-5 mr-2" />
            Check In
          </Button>
        </Link>
      )}
    </div>
  );
}