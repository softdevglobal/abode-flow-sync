import { useQuery } from '@tanstack/react-query';
import { BuyerLayout } from '@/components/layout/BuyerLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, DollarSign, MapPin, Loader2, ClipboardList } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function BuyerAppraisals() {
  const { data: appraisals = [], isLoading } = useQuery({
    queryKey: ['public-appraisals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appraisals')
        .select(`
          *,
          agents:agent_id (
            agency_name,
            profiles:user_id (first_name, last_name)
          )
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const confidenceBadge = {
    low: { label: 'Low Confidence', variant: 'destructive' as const },
    medium: { label: 'Medium Confidence', variant: 'warning' as const },
    high: { label: 'High Confidence', variant: 'success' as const },
  };

  const getAgentName = (agent: any) => {
    if (!agent?.profiles) return 'Agent';
    const profiles = agent.profiles as any;
    const firstName = profiles.first_name || '';
    const lastName = profiles.last_name || '';
    return `${firstName} ${lastName}`.trim() || 'Agent';
  };

  if (isLoading) {
    return (
      <BuyerLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </BuyerLayout>
    );
  }

  return (
    <BuyerLayout>
      <div className="container px-4 py-6">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-foreground mb-1">
            Property Appraisals
          </h1>
          <p className="text-muted-foreground text-sm font-body">
            Recent property value estimates from our agents
          </p>
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

        {appraisals.length === 0 ? (
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm rounded-xl">
            <CardContent className="py-12 text-center">
              <ClipboardList className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-display text-lg font-semibold mb-2">No Appraisals Available</h3>
              <p className="text-muted-foreground text-sm font-body">
                Check back later for property appraisals from our agents.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {appraisals.map((appraisal) => (
              <Card 
                key={appraisal.id} 
                className="border-border/50 bg-card/50 backdrop-blur-sm rounded-xl hover:border-primary/30 transition-colors"
              >
                <CardContent className="pt-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1 font-body">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="truncate">{appraisal.address}, {appraisal.suburb} {appraisal.state} {appraisal.postcode}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-4 h-4 text-primary" />
                        <span className="font-display text-lg font-bold">
                          {formatCurrency(Number(appraisal.price_from))} - {formatCurrency(Number(appraisal.price_to))}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <Badge variant={confidenceBadge[appraisal.confidence as keyof typeof confidenceBadge]?.variant || 'secondary'}>
                          {confidenceBadge[appraisal.confidence as keyof typeof confidenceBadge]?.label || 'Unknown'}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-body">
                          by {getAgentName(appraisal.agents)} • {(appraisal.agents as any)?.agency_name || 'Agency'}
                        </span>
                      </div>
                      {appraisal.notes && (
                        <p className="text-sm text-muted-foreground bg-muted/30 border border-border/50 rounded-xl p-3 font-body">
                          {appraisal.notes}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2 font-body">
                        {new Date(appraisal.created_at).toLocaleDateString('en-AU', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </BuyerLayout>
  );
}
