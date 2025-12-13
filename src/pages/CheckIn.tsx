import { useState } from 'react';
import { Header, MobileNav } from '@/components/layout/MobileNav';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode, Camera, CheckCircle2, MapPin, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function CheckIn() {
  const [checkedIn, setCheckedIn] = useState(false);
  const [scanning, setScanning] = useState(false);

  const handleScan = () => {
    setScanning(true);
    // Simulate QR scan
    setTimeout(() => {
      setScanning(false);
      setCheckedIn(true);
      toast.success('Successfully checked in!');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header userRole="customer" />

      <main className="container px-4 py-6 max-w-lg mx-auto">
        <div className="mb-8 text-center">
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            Inspection Check-In
          </h1>
          <p className="text-muted-foreground text-sm">
            Scan the QR code at the property to register your attendance
          </p>
        </div>

        {!checkedIn ? (
          <Card variant="elevated" className="text-center">
            <CardContent className="pt-8 pb-8">
              <div className="w-24 h-24 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6">
                <QrCode className="w-12 h-12 text-accent" />
              </div>

              <h2 className="font-display text-lg font-semibold mb-2">
                Ready to Check In?
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Look for the QR code displayed at the property entrance
              </p>

              <Button 
                variant="gold" 
                size="lg" 
                className="w-full"
                onClick={handleScan}
                disabled={scanning}
              >
                {scanning ? (
                  <>
                    <div className="w-5 h-5 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin mr-2" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5 mr-2" />
                    Scan QR Code
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card variant="glass" className="text-center animate-scale-in">
            <CardContent className="pt-8 pb-8">
              <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-success" />
              </div>

              <h2 className="font-display text-xl font-bold text-foreground mb-2">
                You're Checked In!
              </h2>

              <div className="bg-secondary rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold mb-3">Modern Family Home with Pool</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>42 Harbour View Drive, Mosman</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Checked in at {new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-6">
                The agent has been notified of your arrival. 
                Feel free to explore the property!
              </p>

              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setCheckedIn(false)}
              >
                Scan Another Property
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Tips Card */}
        <Card variant="flat" className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Inspection Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Arrive on time for scheduled inspections</li>
              <li>• Bring photo ID for private viewings</li>
              <li>• Take photos and notes for reference</li>
              <li>• Ask questions about the property</li>
            </ul>
          </CardContent>
        </Card>
      </main>

      <MobileNav userRole="customer" />
    </div>
  );
}
