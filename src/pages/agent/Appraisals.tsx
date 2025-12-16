import { useState } from 'react';
import { AgentLayout } from '@/components/layout/AgentLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileText, DollarSign, MapPin } from 'lucide-react';

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
    medium: 'text-yellow-500',
    high: 'text-green-500',
  };

  return (
    <AgentLayout>
      <div className="container px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-1">
              Appraisals
            </h1>
            <p className="text-muted-foreground text-sm font-body">
              Property value estimates
            </p>
          </div>
          <Button className="shadow-glow-sm font-body">
            <Plus className="w-4 h-4 mr-2" />
            New Appraisal
          </Button>
        </div>

        {/* Disclaimer */}
        <Card className="mb-6 border-border/50 bg-card/50 backdrop-blur-sm rounded-xl">
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground font-body">
              <strong className="text-primary">Disclaimer:</strong> Appraisals are indicative only and not a formal valuation. 
              These estimates are based on comparable sales and market conditions at the time of assessment. 
              For legal or financial purposes, please obtain a licensed valuation.
            </p>
          </CardContent>
        </Card>

        {/* Appraisal List */}
        <div className="space-y-4">
          {appraisals.map((appraisal) => (
            <Card key={appraisal.id} className="border-border/50 bg-card/50 backdrop-blur-sm rounded-xl hover:border-primary/30 transition-colors">
              <CardContent className="pt-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1 font-body">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span className="truncate">{appraisal.address}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4 text-primary" />
                      <span className="font-display text-lg font-bold">
                        {formatCurrency(appraisal.priceFrom)} - {formatCurrency(appraisal.priceTo)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm text-muted-foreground font-body">Confidence:</span>
                      <span className={`text-sm font-medium capitalize font-body ${confidenceColors[appraisal.confidence as keyof typeof confidenceColors]}`}>
                        {appraisal.confidence}
                      </span>
                    </div>
                    {appraisal.notes && (
                      <p className="text-sm text-muted-foreground bg-muted/30 border border-border/50 rounded-xl p-3 font-body">
                        {appraisal.notes}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AgentLayout>
  );
}
