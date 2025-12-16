import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Mail, User, MessageCircle, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Agent } from '@/types';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface AgentEnquiryCardProps {
  agent: Agent;
  propertyTitle: string;
  className?: string;
}

export function AgentEnquiryCard({ agent, propertyTitle, className }: AgentEnquiryCardProps) {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [showPhone, setShowPhone] = useState(false);
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const handleRevealPhone = () => {
    setShowPhone(true);
  };

  const handleEnquiryClick = () => {
    if (!authLoading && !user) {
      setShowAuthDialog(true);
    } else {
      setIsEnquiryOpen(true);
    }
  };

  const handleEmailClick = (e: React.MouseEvent) => {
    if (!authLoading && !user) {
      e.preventDefault();
      setShowAuthDialog(true);
    }
  };

  const handleSignIn = () => {
    sessionStorage.setItem('redirectAfterAuth', window.location.pathname);
    navigate('/auth');
  };

  const handleEnquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Enquiry sent! The agent will respond shortly.');
    setIsEnquiryOpen(false);
  };

  return (
    <>
      <Card className={`shadow-elegant ${className}`}>
        <CardContent className="p-6">
          {/* Agent Info */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              {agent.avatar ? (
                <img src={agent.avatar} alt={agent.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-primary-foreground" />
              )}
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg">{agent.name}</h3>
              {agent.company && (
                <p className="text-muted-foreground text-sm">{agent.company}</p>
              )}
              {agent.license && (
                <p className="text-muted-foreground text-xs mt-0.5">Lic. {agent.license}</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Phone Button */}
            <Button
              variant="outline"
              className="w-full justify-start h-12"
              onClick={handleRevealPhone}
            >
              <Phone className="w-5 h-5 mr-3 text-accent" />
              {showPhone ? (
                <a href={`tel:${agent.phone}`} className="font-medium">
                  {agent.phone}
                </a>
              ) : (
                <span className="font-medium">Reveal phone number</span>
              )}
            </Button>

            {/* Email Button */}
            <Button
              variant="outline"
              className="w-full justify-start h-12"
              onClick={handleEmailClick}
              asChild={!authLoading && !!user}
            >
              {!authLoading && user ? (
                <a href={`mailto:${agent.email}?subject=Enquiry about ${propertyTitle}`}>
                  <Mail className="w-5 h-5 mr-3 text-accent" />
                  <span className="font-medium">Email agent</span>
                </a>
              ) : (
                <>
                  <Mail className="w-5 h-5 mr-3 text-accent" />
                  <span className="font-medium">Email agent</span>
                </>
              )}
            </Button>

            {/* Enquiry Form Dialog */}
            <Dialog open={isEnquiryOpen} onOpenChange={setIsEnquiryOpen}>
              <DialogTrigger asChild>
                <Button variant="gold" className="w-full h-12" onClick={handleEnquiryClick}>
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Get in touch
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-background border-border">
                <DialogHeader>
                  <DialogTitle className="font-display">Contact {agent.name}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleEnquirySubmit} className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First name</Label>
                      <Input id="firstName" placeholder="John" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last name</Label>
                      <Input id="lastName" placeholder="Smith" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="john@example.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" type="tel" placeholder="0400 000 000" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      placeholder={`Hi, I'm interested in ${propertyTitle}...`}
                      rows={4}
                      required
                    />
                  </div>
                  <Button type="submit" variant="gold" className="w-full">
                    Send enquiry
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Auth Required Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="sm:max-w-md bg-background border-border">
          <DialogHeader>
            <DialogTitle className="font-display">Sign in required</DialogTitle>
            <DialogDescription className="font-body">
              You need to sign in to contact the agent.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <LogIn className="w-8 h-8 text-primary" />
            </div>
            <p className="text-muted-foreground mb-4 font-body">
              Create an account or sign in to send enquiries, request inspections, and save your favourite properties.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAuthDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSignIn}>
              <LogIn className="w-4 h-4 mr-2" />
              Sign In
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
