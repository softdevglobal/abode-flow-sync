import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Facebook, Instagram, Linkedin, Twitter } from 'lucide-react';
import { useAgencyTheme } from '@/contexts/AgencyThemeContext';

export function Footer() {
  const theme = useAgencyTheme();

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            {theme.logoUrl ? (
              <img src={theme.logoUrl} alt={theme.agencyName} className="h-10 w-auto brightness-0 invert" />
            ) : (
              <h3 className="text-xl font-bold">{theme.agencyName}</h3>
            )}
            {theme.tagline && (
              <p className="text-primary-foreground/80 text-sm">{theme.tagline}</p>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-primary-foreground/80">
              <li><Link to="/browse" className="hover:text-primary-foreground transition-colors">Browse Properties</Link></li>
              <li><Link to="/auctions" className="hover:text-primary-foreground transition-colors">Auctions</Link></li>
              <li><Link to="/how-it-works" className="hover:text-primary-foreground transition-colors">How It Works</Link></li>
              <li><Link to="/calculator" className="hover:text-primary-foreground transition-colors">Affordability Calculator</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3 text-primary-foreground/80">
              {theme.phone && (
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <a href={`tel:${theme.phone}`} className="hover:text-primary-foreground transition-colors">
                    {theme.phone}
                  </a>
                </li>
              )}
              {theme.email && (
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <a href={`mailto:${theme.email}`} className="hover:text-primary-foreground transition-colors">
                    {theme.email}
                  </a>
                </li>
              )}
              {theme.officeAddress && (
                <li className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{theme.officeAddress}</span>
                </li>
              )}
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h4 className="font-semibold mb-4">Follow Us</h4>
            <div className="flex gap-4">
              {theme.socialFacebook && (
                <a 
                  href={theme.socialFacebook} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {theme.socialInstagram && (
                <a 
                  href={theme.socialInstagram} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {theme.socialLinkedIn && (
                <a 
                  href={theme.socialLinkedIn} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-5 w-5" />
                </a>
              )}
              {theme.socialTwitter && (
                <a 
                  href={theme.socialTwitter} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center text-primary-foreground/60 text-sm">
          <p>&copy; {new Date().getFullYear()} {theme.agencyName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
