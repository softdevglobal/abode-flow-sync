import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Header, MobileNav } from '@/components/layout/MobileNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  QrCode, Camera, CheckCircle2, MapPin, Clock, Loader2, 
  LogIn, AlertCircle, Keyboard, ArrowLeft, Bed, Bath, Car
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

type CheckInState = 'idle' | 'scanning' | 'manual' | 'loading' | 'success' | 'error';

export default function CheckIn() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  
  const inspectionId = searchParams.get('inspectionId');
  
  const [state, setState] = useState<CheckInState>('idle');
  const [manualCode, setManualCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [checkedInAt, setCheckedInAt] = useState<Date | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  // Fetch inspection details when inspectionId is present
  const { data: inspection, isLoading: inspectionLoading, error: inspectionError } = useQuery({
    queryKey: ['inspection-checkin', inspectionId],
    queryFn: async () => {
      if (!inspectionId) return null;
      
      const { data, error } = await supabase
        .from('inspections')
        .select(`
          id,
          date_time,
          duration,
          status,
          property:properties(
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
        .eq('id', inspectionId)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Inspection not found');
      
      return data;
    },
    enabled: !!inspectionId && !!user,
  });

  // Check if already checked in
  const { data: existingBooking } = useQuery({
    queryKey: ['existing-booking', inspectionId, user?.id],
    queryFn: async () => {
      if (!inspectionId || !user?.id) return null;
      
      const { data, error } = await supabase
        .from('inspection_bookings')
        .select('id, checked_in_at, status')
        .eq('inspection_id', inspectionId)
        .eq('customer_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!inspectionId && !!user?.id,
  });

  // Mutation to create booking and check in
  const checkInMutation = useMutation({
    mutationFn: async () => {
      if (!inspectionId || !user?.id) {
        throw new Error('Missing inspection ID or user');
      }

      // Check if booking already exists
      if (existingBooking) {
        // Update existing booking with check-in time
        if (!existingBooking.checked_in_at) {
          const { error } = await supabase
            .from('inspection_bookings')
            .update({
              checked_in_at: new Date().toISOString(),
              status: 'attended',
            })
            .eq('id', existingBooking.id);

          if (error) throw error;
        }
        return existingBooking;
      }

      // Create new booking with check-in
      const { data, error } = await supabase
        .from('inspection_bookings')
        .insert({
          inspection_id: inspectionId,
          customer_id: user.id,
          status: 'attended',
          checked_in_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setCheckedInAt(new Date());
      setState('success');
      toast.success('Successfully checked in!');
      queryClient.invalidateQueries({ queryKey: ['existing-booking'] });
    },
    onError: (error: any) => {
      console.error('Check-in error:', error);
      setErrorMessage(error.message || 'Failed to check in. Please try again.');
      setState('error');
      toast.error('Failed to check in');
    },
  });

  // Auto check-in when inspection data is loaded and user is authenticated
  useEffect(() => {
    if (inspectionId && inspection && user && state === 'idle' && !existingBooking?.checked_in_at) {
      setState('loading');
      checkInMutation.mutate();
    } else if (existingBooking?.checked_in_at) {
      setCheckedInAt(new Date(existingBooking.checked_in_at));
      setState('success');
    }
  }, [inspectionId, inspection, user, existingBooking]);

  // Handle QR code scan result
  const handleScanResult = (result: string) => {
    try {
      // Expected format: URL with inspectionId query param
      // e.g., https://app.example.com/checkin?inspectionId=xxx
      const url = new URL(result);
      const scannedInspectionId = url.searchParams.get('inspectionId');
      
      if (scannedInspectionId) {
        setShowScanner(false);
        setSearchParams({ inspectionId: scannedInspectionId });
      } else {
        toast.error('Invalid QR code. Please try again.');
      }
    } catch {
      // Try to use result directly as inspection ID
      if (result && result.length > 10) {
        setShowScanner(false);
        setSearchParams({ inspectionId: result });
      } else {
        toast.error('Invalid QR code format');
      }
    }
  };

  // Handle manual code entry
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      setSearchParams({ inspectionId: manualCode.trim() });
      setState('idle');
    }
  };

  // Reset to scan another
  const handleReset = () => {
    setSearchParams({});
    setState('idle');
    setManualCode('');
    setErrorMessage('');
    setCheckedInAt(null);
  };

  const property = inspection?.property as {
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

  // Loading auth state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <Header userRole="customer" />
        <main className="container px-4 py-6 max-w-lg mx-auto">
          <Card className="text-center">
            <CardContent className="pt-8 pb-8">
              <LogIn className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Sign in to Check In</h2>
              <p className="text-muted-foreground mb-6">
                You need to be signed in to check in to property inspections.
              </p>
              <Button asChild size="lg">
                <Link to={`/auth?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`}>
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <MobileNav userRole="customer" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header userRole="customer" />

      <main className="container px-4 py-6 max-w-lg mx-auto">
        <div className="mb-8 text-center">
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            Inspection Check-In
          </h1>
          <p className="text-muted-foreground text-sm">
            {inspectionId 
              ? 'Verifying your check-in...' 
              : 'Scan the QR code at the property to register your attendance'}
          </p>
        </div>

        {/* Loading State - Fetching inspection */}
        {inspectionId && (inspectionLoading || state === 'loading') && (
          <Card className="text-center">
            <CardContent className="pt-8 pb-8">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
              <h2 className="font-semibold text-lg mb-2">
                {inspectionLoading ? 'Finding inspection...' : 'Checking you in...'}
              </h2>
              {property && (
                <p className="text-muted-foreground text-sm">
                  {property.address}, {property.suburb}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {(inspectionError || state === 'error') && (
          <Card className="text-center border-destructive">
            <CardContent className="pt-8 pb-8">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h2 className="font-semibold text-lg mb-2">Check-In Failed</h2>
              <p className="text-muted-foreground text-sm mb-6">
                {errorMessage || inspectionError?.message || 'Could not complete check-in'}
              </p>
              <Button variant="outline" onClick={handleReset}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Success State */}
        {state === 'success' && property && (
          <Card className="text-center animate-scale-in border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
            <CardContent className="pt-8 pb-8">
              <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>

              <h2 className="font-display text-xl font-bold text-foreground mb-2">
                You're Checked In!
              </h2>

              <div className="bg-card rounded-lg p-4 mb-6 text-left border">
                {property.images?.[0] && (
                  <img 
                    src={property.images[0]} 
                    alt={property.title}
                    className="w-full h-32 object-cover rounded-lg mb-3"
                  />
                )}
                <h3 className="font-semibold mb-2">{property.title}</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{property.address}, {property.suburb} {property.state} {property.postcode}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Checked in at {checkedInAt ? format(checkedInAt, 'h:mm a') : 'now'}</span>
                  </div>
                  <div className="flex items-center gap-4 pt-1">
                    <span className="flex items-center gap-1">
                      <Bed className="w-4 h-4" /> {property.bedrooms || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Bath className="w-4 h-4" /> {property.bathrooms || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Car className="w-4 h-4" /> {property.parking || 0}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-6">
                The agent has been notified of your arrival. 
                Feel free to explore the property!
              </p>

              <div className="space-y-2">
                <Button asChild variant="default" className="w-full">
                  <Link to={`/property/${property.id}`}>
                    View Property Details
                  </Link>
                </Button>
                <Button variant="outline" className="w-full" onClick={handleReset}>
                  Scan Another Property
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Idle State - No inspection ID */}
        {!inspectionId && state !== 'manual' && !showScanner && (
          <Card className="text-center">
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

              <div className="space-y-3">
                <Button 
                  variant="gold" 
                  size="lg" 
                  className="w-full"
                  onClick={() => setShowScanner(true)}
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Scan QR Code
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setState('manual')}
                >
                  <Keyboard className="w-4 h-4 mr-2" />
                  Enter Code Manually
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* QR Scanner */}
        {showScanner && (
          <Card>
            <CardContent className="pt-6 pb-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold">Scan QR Code</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowScanner(false)}>
                  Cancel
                </Button>
              </div>
              
              <div className="aspect-square bg-muted rounded-lg overflow-hidden mb-4 flex items-center justify-center">
                <QRScanner onResult={handleScanResult} />
              </div>
              
              <p className="text-xs text-muted-foreground text-center">
                Point your camera at the QR code displayed at the property
              </p>
            </CardContent>
          </Card>
        )}

        {/* Manual Entry */}
        {state === 'manual' && !inspectionId && (
          <Card>
            <CardContent className="pt-6 pb-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold">Enter Inspection Code</h3>
                <Button variant="ghost" size="sm" onClick={() => setState('idle')}>
                  Cancel
                </Button>
              </div>
              
              <form onSubmit={handleManualSubmit}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="code">Inspection ID</Label>
                    <Input
                      id="code"
                      placeholder="Enter the inspection code..."
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Ask the agent for the inspection code if you can't scan the QR
                    </p>
                  </div>
                  <Button type="submit" className="w-full" disabled={!manualCode.trim()}>
                    Check In
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Tips Card - show when idle */}
        {!inspectionId && state === 'idle' && !showScanner && (
          <Card className="mt-6">
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
        )}
      </main>

      <MobileNav userRole="customer" />
    </div>
  );
}

// QR Scanner Component
function QRScanner({ onResult }: { onResult: (result: string) => void }) {
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    // Check for camera permission
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(() => setHasPermission(true))
      .catch(() => {
        setHasPermission(false);
        setError('Camera access denied. Please enable camera permissions.');
      });
  }, []);

  if (hasPermission === null) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
        <p className="text-sm text-muted-foreground">Requesting camera access...</p>
      </div>
    );
  }

  if (hasPermission === false || error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground mb-4">
          {error || 'Camera not available'}
        </p>
        <p className="text-xs text-muted-foreground">
          Please use the manual entry option instead
        </p>
      </div>
    );
  }

  // Use dynamic import for QR scanner to avoid SSR issues
  return <QRScannerInner onResult={onResult} />;
}

// Inner scanner component that uses the library
function QRScannerInner({ onResult }: { onResult: (result: string) => void }) {
  const [Scanner, setScanner] = useState<any>(null);

  useEffect(() => {
    // Dynamically import the QR scanner
    import('@yudiel/react-qr-scanner').then((module) => {
      setScanner(() => module.Scanner);
    }).catch(() => {
      console.error('Failed to load QR scanner');
    });
  }, []);

  if (!Scanner) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
        <p className="text-sm text-muted-foreground">Loading scanner...</p>
      </div>
    );
  }

  return (
    <Scanner
      onScan={(result: any) => {
        if (result?.[0]?.rawValue) {
          onResult(result[0].rawValue);
        }
      }}
      onError={(error: any) => console.error('Scanner error:', error)}
      styles={{
        container: { width: '100%', height: '100%' },
        video: { width: '100%', height: '100%', objectFit: 'cover' },
      }}
    />
  );
}
