import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Send, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BuyerLayout } from '@/components/layout/BuyerLayout';
import { toast } from 'sonner';

export default function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success('Message sent!', {
      description: 'We\'ll get back to you within 24 hours.',
    });
    setIsSubmitting(false);
    (e.target as HTMLFormElement).reset();
  };

  return (
    <BuyerLayout>
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-grid">
        <div className="container px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              Get in <span className="text-gradient">Touch</span>
            </h1>
            <p className="text-lg text-muted-foreground font-body">
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-12 md:py-16">
        <div className="container px-4">
          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Contact Info Cards */}
            <div className="space-y-4">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Mail className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-foreground mb-1">Email Us</h3>
                      <p className="text-sm text-muted-foreground font-body">
                        hello@abodeflowsync.com.au
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Phone className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-foreground mb-1">Call Us</h3>
                      <p className="text-sm text-muted-foreground font-body">
                        1800 ABODE (1800 226 33)
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-foreground mb-1">Visit Us</h3>
                      <p className="text-sm text-muted-foreground font-body">
                        123 George Street<br />
                        Sydney NSW 2000
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <Card className="lg:col-span-2 border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-primary" />
                  Send us a message
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="font-body">First Name</Label>
                      <Input id="firstName" placeholder="John" required className="font-body" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="font-body">Last Name</Label>
                      <Input id="lastName" placeholder="Smith" required className="font-body" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="font-body">Email</Label>
                    <Input id="email" type="email" placeholder="john@example.com" required className="font-body" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="font-body">Phone (Optional)</Label>
                    <Input id="phone" type="tel" placeholder="0400 000 000" className="font-body" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="subject" className="font-body">Subject</Label>
                    <Input id="subject" placeholder="How can we help?" required className="font-body" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message" className="font-body">Message</Label>
                    <Textarea 
                      id="message" 
                      placeholder="Tell us more about your enquiry..." 
                      rows={5} 
                      required 
                      className="font-body resize-none"
                    />
                  </div>
                  
                  <Button type="submit" className="w-full shadow-glow-sm font-body" disabled={isSubmitting}>
                    {isSubmitting ? (
                      'Sending...'
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </BuyerLayout>
  );
}