import { Link } from 'react-router-dom';
import { Building2, Search, Calendar, Key, ArrowRight, QrCode, Gavel, Users, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAgencyTheme } from '@/contexts/AgencyThemeContext';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const steps = [
  {
    icon: Search,
    title: 'Browse Properties',
    description: 'Explore thousands of listings with advanced filters. Search by location, price, bedrooms, and property type to find your perfect match.',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    icon: Calendar,
    title: 'Schedule Inspections',
    description: 'Book open home inspections or request private viewings at your convenience. RSVP directly from property pages and add to your calendar.',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  {
    icon: QrCode,
    title: 'Check In with QR',
    description: 'Scan QR codes at property inspections to instantly check in. Agents can track attendance and follow up with interested buyers.',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  {
    icon: Gavel,
    title: 'Bid at Live Auctions',
    description: 'Participate in real-time auctions from anywhere. Watch live bidding, place your bids, and track auction results.',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    icon: Users,
    title: 'Connect with Agents',
    description: 'Message agents directly, request more information, and receive notifications about properties you\'re interested in.',
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
  },
  {
    icon: Key,
    title: 'Secure Your Dream Home',
    description: 'From first inspection to final settlement, we guide you through every step of the property purchase process.',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
  },
];

const agentFeatures = [
  {
    title: 'List Properties',
    description: 'Create beautiful property listings with photos, videos, and detailed descriptions.',
  },
  {
    title: 'Manage Inspections',
    description: 'Schedule open homes, generate QR codes, and track attendee check-ins in real-time.',
  },
  {
    title: 'Run Live Auctions',
    description: 'Conduct online auctions with real-time bidding and instant notifications.',
  },
  {
    title: 'CRM Dashboard',
    description: 'Track leads, manage customer interactions, and grow your business.',
  },
];

export default function HowItWorks() {
  const config = useAgencyTheme();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
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
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-grid">
        <div className="container px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              How <span className="text-gradient">Abode Flow Sync</span> Works
            </h1>
            <p className="text-lg text-muted-foreground font-body">
              Whether you're a buyer searching for your dream home or an agent looking to streamline your business, 
              we've got you covered.
            </p>
          </div>
        </div>
      </section>

      {/* For Buyers Section */}
      <section className="py-16 md:py-20">
        <div className="container px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              For Buyers
            </h2>
            <p className="text-muted-foreground font-body max-w-2xl mx-auto">
              Your journey to homeownership starts here. Follow these simple steps to find and secure your perfect property.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {steps.map((step, index) => (
              <Card key={index} className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-colors">
                <CardContent className="p-6">
                  <div className={`w-14 h-14 rounded-xl ${step.bgColor} flex items-center justify-center mb-4`}>
                    <step.icon className={`w-7 h-7 ${step.color}`} />
                  </div>
                  <div className="text-sm font-medium text-muted-foreground mb-2 font-body">
                    Step {index + 1}
                  </div>
                  <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-sm font-body">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link to="/browse">
              <Button size="lg" className="shadow-glow-sm font-body">
                Start Browsing Properties
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* For Agents Section */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              For Agents
            </h2>
            <p className="text-muted-foreground font-body max-w-2xl mx-auto">
              Powerful tools to grow your real estate business and provide exceptional service to your clients.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {agentFeatures.map((feature, index) => (
              <Card key={index} className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6">
                  <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm font-body">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link to="/agent">
              <Button variant="outline" size="lg" className="font-body hover:border-primary/50">
                Agent Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20">
        <div className="container px-4">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm max-w-3xl mx-auto">
            <CardContent className="p-8 md:p-12 text-center">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-muted-foreground font-body mb-8">
                Join thousands of Australians who have found their dream home with Abode Flow Sync.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/browse">
                  <Button size="lg" className="shadow-glow-sm font-body">
                    Browse Properties
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button variant="outline" size="lg" className="font-body">
                    Create Account
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
