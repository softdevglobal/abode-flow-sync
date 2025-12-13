import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Calculator, DollarSign, Percent, Clock, TrendingUp } from 'lucide-react';
import { AffordabilityResult } from '@/types';

export function AffordabilityCalculator() {
  const [propertyPrice, setPropertyPrice] = useState(800000);
  const [deposit, setDeposit] = useState(160000);
  const [interestRate, setInterestRate] = useState(6.5);
  const [loanTerm, setLoanTerm] = useState(30);
  const [result, setResult] = useState<AffordabilityResult | null>(null);

  const calculateAffordability = () => {
    const loanAmount = propertyPrice - deposit;
    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;

    // Monthly repayment formula: M = P[r(1+r)^n]/[(1+r)^n-1]
    const monthlyRepayment =
      (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

    const totalAmountPaid = monthlyRepayment * numberOfPayments;
    const totalInterest = totalAmountPaid - loanAmount;
    const loanToValueRatio = (loanAmount / propertyPrice) * 100;

    setResult({
      monthlyRepayment,
      totalInterest,
      totalAmountPaid,
      loanToValueRatio,
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <Card variant="elevated">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Calculator className="w-5 h-5 text-accent" />
            </div>
            <div>
              <CardTitle>Affordability Calculator</CardTitle>
              <CardDescription>Estimate your home loan repayments</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Property Price */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                Property Price
              </Label>
              <span className="font-semibold text-foreground">{formatCurrency(propertyPrice)}</span>
            </div>
            <Slider
              value={[propertyPrice]}
              onValueChange={([value]) => setPropertyPrice(value)}
              min={100000}
              max={5000000}
              step={10000}
              className="py-4"
            />
          </div>

          {/* Deposit */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                Deposit Amount
              </Label>
              <span className="font-semibold text-foreground">{formatCurrency(deposit)}</span>
            </div>
            <Slider
              value={[deposit]}
              onValueChange={([value]) => setDeposit(value)}
              min={0}
              max={propertyPrice * 0.5}
              step={5000}
              className="py-4"
            />
          </div>

          {/* Interest Rate */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-muted-foreground" />
                Interest Rate
              </Label>
              <span className="font-semibold text-foreground">{interestRate.toFixed(2)}%</span>
            </div>
            <Slider
              value={[interestRate]}
              onValueChange={([value]) => setInterestRate(value)}
              min={2}
              max={12}
              step={0.05}
              className="py-4"
            />
          </div>

          {/* Loan Term */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                Loan Term
              </Label>
              <span className="font-semibold text-foreground">{loanTerm} years</span>
            </div>
            <Slider
              value={[loanTerm]}
              onValueChange={([value]) => setLoanTerm(value)}
              min={5}
              max={30}
              step={1}
              className="py-4"
            />
          </div>

          <Button variant="gold" size="lg" className="w-full" onClick={calculateAffordability}>
            Calculate Repayments
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card variant="glass" className="animate-scale-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-success" />
              Your Estimate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-secondary rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">Monthly Repayment</p>
                <p className="text-2xl font-display font-bold text-accent">
                  {formatCurrency(result.monthlyRepayment)}
                </p>
              </div>
              <div className="bg-secondary rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">LVR</p>
                <p className="text-2xl font-display font-bold text-foreground">
                  {result.loanToValueRatio.toFixed(1)}%
                </p>
              </div>
              <div className="bg-secondary rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">Total Interest</p>
                <p className="text-xl font-display font-semibold text-foreground">
                  {formatCurrency(result.totalInterest)}
                </p>
              </div>
              <div className="bg-secondary rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">Total Paid</p>
                <p className="text-xl font-display font-semibold text-foreground">
                  {formatCurrency(result.totalAmountPaid)}
                </p>
              </div>
            </div>

            <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 mt-4">
              <p className="text-xs text-muted-foreground">
                <strong>Disclaimer:</strong> This calculator provides estimates only and does not constitute financial advice. 
                Actual repayments may vary based on lender fees, loan structure, and market conditions. 
                Please consult a licensed financial advisor before making any decisions.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
