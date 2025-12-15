import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, Users, ArrowRight, Home, Star, Shield, Briefcase } from 'lucide-react';
import heroImage from '@/assets/hero-home.jpg';

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt="Luxury modern home at sunset" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-primary/50" />
        </div>

        {/* Content */}
        <div className="relative z-10 container px-4 py-20">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-6 animate-fade-in">
              <div className="w-10 h-10 rounded-lg bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-semibold text-primary-foreground">Abode Flow Sync</span>
            </div>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6 animate-slide-up leading-tight">
              Real Estate Platform
              <span className="text-accent"> Prototype</span>
            </h1>

            <p className="text-lg text-primary-foreground/80 mb-8 animate-slide-up stagger-1 max-w-xl">
              Choose your view to explore the platform. Agents can manage listings and inspections. Buyers can browse properties.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 animate-slide-up stagger-2">
              <Link to="/agent">
                <Button variant="gold" size="xl" className="w-full sm:w-auto">
                  <Briefcase className="w-5 h-5 mr-2" />
                  Agent View
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/browse">
                <Button variant="heroOutline" size="xl" className="w-full sm:w-auto">
                  <Home className="w-5 h-5 mr-2" />
                  Buyer View
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-secondary">
        <div className="container px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Platform Features
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A complete real estate management platform for agents and property seekers.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card variant="elevated" className="text-center">
              <CardContent className="pt-8 pb-6">
                <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-7 h-7 text-accent" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">Agent Dashboard</h3>
                <p className="text-sm text-muted-foreground">
                  Manage property listings, schedule inspections, and track client requests from one central hub.
                </p>
              </CardContent>
            </Card>

            <Card variant="elevated" className="text-center">
              <CardContent className="pt-8 pb-6">
                <div className="w-14 h-14 rounded-xl bg-success/10 flex items-center justify-center mx-auto mb-4">
                  <Star className="w-7 h-7 text-success" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">Property Listings</h3>
                <p className="text-sm text-muted-foreground">
                  Create and manage detailed property listings with images, features, and pricing information.
                </p>
              </CardContent>
            </Card>

            <Card variant="elevated" className="text-center">
              <CardContent className="pt-8 pb-6">
                <div className="w-14 h-14 rounded-xl bg-info/10 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-7 h-7 text-info" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">Buyer Experience</h3>
                <p className="text-sm text-muted-foreground">
                  Browse properties, use affordability calculators, and request viewings seamlessly.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container px-4">
          <div className="gradient-hero rounded-2xl p-8 md:p-12 text-center">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-primary-foreground mb-4">
              Ready to Explore?
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
              Choose a view to get started with the platform prototype.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/agent">
                <Button variant="gold" size="lg">
                  <Briefcase className="w-4 h-4 mr-2" />
                  Agent View
                </Button>
              </Link>
              <Link to="/browse">
                <Button variant="heroOutline" size="lg">
                  <Home className="w-4 h-4 mr-2" />
                  Buyer View
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-accent" />
              <span className="font-display font-semibold">Abode Flow Sync</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Prototype - Real Estate Platform
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
