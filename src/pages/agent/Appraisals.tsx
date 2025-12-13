import { useState } from 'react';
import { Header, MobileNav } from '@/components/layout/MobileNav';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, FileText, DollarSign, MapPin } from 'lucide-react';
import { toast } from 'sonner';

export default function AgentAppraisals() {
  const [appraisals] = useState([
    {
      id: '1',
      address: '123 Ocean Drive, Bondi Beach NSW 2026',
      priceFrom: 2500000,
      priceTo: 2800000,
      confidence: 'high',
      notes: 'Excellent location with ocean views. Recent comparable sales support this range.',
      createdAt: new Date('2024-01-10'),
    },
    {
      id: '2',
      address: '45 Garden Street, Alexandria NSW 2015',
      priceFrom: 1200000,
      priceTo: 1350000,
      confidence: 'medium',
      notes: 'Inner-city townhouse with good renovation potential.',
      createdAt: new Date('2024-01-08'),
    },
  ]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const confidenceColors = {
    low: 'text-destructive',
    medium: 'text-warning',
    high: 'text-success',
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header userRole="agent" />

      <main className="container px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-1">
              Appraisals
            </h1>
            <p className="text-muted-foreground text-sm">
              Property value estimates
            </p>
          </div>
          <Button variant="gold">
            <Plus className="w-4 h-4 mr-2" />
            New Appraisal
          </Button>
        </div>

        {/* Disclaimer */}
        <Card variant="glass" className="mb-6">
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">
              <strong>Disclaimer:</strong> Appraisals are indicative only and not a formal valuation. 
              These estimates are based on comparable sales and market conditions at the time of assessment. 
              For legal or financial purposes, please obtain a licensed valuation.
            </p>
          </CardContent>
        </Card>

        {/* Appraisal List */}
        <div className="space-y-4">
          {appraisals.map((appraisal) => (
            <Card key={appraisal.id} variant="elevated">
              <CardContent className="pt-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate">{appraisal.address}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4 text-accent" />
                      <span className="font-display text-lg font-bold">
                        {formatCurrency(appraisal.priceFrom)} - {formatCurrency(appraisal.priceTo)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm text-muted-foreground">Confidence:</span>
                      <span className={`text-sm font-medium capitalize ${confidenceColors[appraisal.confidence as keyof typeof confidenceColors]}`}>
                        {appraisal.confidence}
                      </span>
                    </div>
                    {appraisal.notes && (
                      <p className="text-sm text-muted-foreground bg-secondary rounded-lg p-3">
                        {appraisal.notes}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <MobileNav userRole="agent" />
    </div>
  );
}
