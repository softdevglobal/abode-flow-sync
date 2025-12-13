import { Header, MobileNav } from '@/components/layout/MobileNav';
import { AffordabilityCalculator } from '@/components/calculator/AffordabilityCalculator';

export default function CalculatorPage() {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header userRole="customer" />

      <main className="container px-4 py-6 max-w-lg mx-auto">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            Affordability Calculator
          </h1>
          <p className="text-muted-foreground text-sm">
            Estimate your home loan repayments
          </p>
        </div>

        <AffordabilityCalculator />
      </main>

      <MobileNav userRole="customer" />
    </div>
  );
}
