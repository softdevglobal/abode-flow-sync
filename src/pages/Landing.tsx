import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, Users, ArrowRight, Home, Star, Shield } from 'lucide-react';
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
              <span className="font-display text-xl font-semibold text-primary-foreground">PropConnect</span>
            </div>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6 animate-slide-up leading-tight">
              Find Your Dream Home, 
              <span className="text-accent"> Simplified</span>
            </h1>

            <p className="text-lg text-primary-foreground/80 mb-8 animate-slide-up stagger-1 max-w-xl">
              Connect with trusted agents, schedule viewings, and discover properties that match your lifestyle. 
              Your next chapter starts here.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 animate-slide-up stagger-2">
              <Link to="/browse">
                <Button variant="gold" size="xl" className="w-full sm:w-auto">
                  <Home className="w-5 h-5 mr-2" />
                  Browse Properties
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/agent">
                <Button variant="heroOutline" size="xl" className="w-full sm:w-auto">
                  <Building2 className="w-5 h-5 mr-2" />
                  Agent Portal
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
              Why Choose PropConnect?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A modern platform designed for both real estate professionals and property seekers.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card variant="elevated" className="text-center">
              <CardContent className="pt-8 pb-6">
                <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-7 h-7 text-accent" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">Easy Connections</h3>
                <p className="text-sm text-muted-foreground">
                  Request viewings instantly and communicate directly with agents through our streamlined platform.
                </p>
              </CardContent>
            </Card>

            <Card variant="elevated" className="text-center">
              <CardContent className="pt-8 pb-6">
                <div className="w-14 h-14 rounded-xl bg-success/10 flex items-center justify-center mx-auto mb-4">
                  <Star className="w-7 h-7 text-success" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">Smart Tools</h3>
                <p className="text-sm text-muted-foreground">
                  Use our affordability calculator, QR check-ins, and real-time notifications to stay informed.
                </p>
              </CardContent>
            </Card>

            <Card variant="elevated" className="text-center">
              <CardContent className="pt-8 pb-6">
                <div className="w-14 h-14 rounded-xl bg-info/10 flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-7 h-7 text-info" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">Trusted & Secure</h3>
                <p className="text-sm text-muted-foreground">
                  Licensed agents, verified listings, and secure communication for your peace of mind.
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
              Ready to Get Started?
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
              Whether you're a property seeker or an agent, PropConnect has the tools you need.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/browse">
                <Button variant="gold" size="lg">
                  Start Browsing
                </Button>
              </Link>
              <Link to="/calculator">
                <Button variant="heroOutline" size="lg">
                  Try Calculator
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
              <span className="font-display font-semibold">PropConnect</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              © 2024 PropConnect. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
