import { BuyerLayout } from '@/components/layout/BuyerLayout';
import { AffordabilityCalculator } from '@/components/calculator/AffordabilityCalculator';

export default function CalculatorPage() {
  return (
    <BuyerLayout>
      <div className="container px-4 py-6 max-w-lg mx-auto">
        <div className="mb-6">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
            Affordability Calculator
          </h1>
          <p className="text-muted-foreground text-sm font-body">
            Estimate your home loan repayments
          </p>
        </div>

        <AffordabilityCalculator />
      </div>
    </BuyerLayout>
  );
}
