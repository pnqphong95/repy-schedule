"use client";

import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AdvancedOptions } from './AdvancedOptions';
import type { ScheduleRequest, ScheduleResponse } from '@/types/schedule';

const scheduleSchema = z.object({
  totalAmount: z.number().positive(),
  loanTerm: z.number().int().min(1).max(600),
  interestRate: z.number().min(0),
  disbursementDate: z.string().optional(),
  firstPaymentDate: z.string().optional(),
  promotions: z.array(z.object({
    period: z.number().int().positive(),
    interestRate: z.number().min(0)
  })).optional(),
  earlyRepaymentPenalties: z.array(z.object({
    period: z.number().int().positive(),
    penaltyRate: z.number().min(0)
  })).optional()
});

type FormData = z.infer<typeof scheduleSchema>;

export function ScheduleForm() {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const methods = useForm<FormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      disbursementDate: new Date().toISOString().split('T')[0],
      firstPaymentDate: new Date().toISOString().split('T')[0],
      promotions: [],
      earlyRepaymentPenalties: [],
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = methods;

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to generate schedule');
      }

      const result = await response.json() as ScheduleResponse;
      setSchedule(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <div className="max-w-2xl mx-auto p-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="totalAmount">Total Loan Amount</Label>
              <Input
                id="totalAmount"
                type="number"
                step="0.01"
                {...register('totalAmount', { valueAsNumber: true })}
              />
              {errors.totalAmount && (
                <p className="text-red-500 text-sm mt-1">{errors.totalAmount.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="loanTerm">Loan Term (months)</Label>
              <Input
                id="loanTerm"
                type="number"
                {...register('loanTerm', { valueAsNumber: true })}
              />
              {errors.loanTerm && (
                <p className="text-red-500 text-sm mt-1">{errors.loanTerm.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="interestRate">Interest Rate (%)</Label>
              <Input
                id="interestRate"
                type="number"
                step="0.01"
                {...register('interestRate', { valueAsNumber: true })}
              />
              {errors.interestRate && (
                <p className="text-red-500 text-sm mt-1">{errors.interestRate.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="disbursementDate">Disbursement Date</Label>
              <Input
                id="disbursementDate"
                type="date"
                {...register('disbursementDate')}
              />
            </div>

            <div>
              <Label htmlFor="firstPaymentDate">First Payment Date</Label>
              <Input
                id="firstPaymentDate"
                type="date"
                {...register('firstPaymentDate')}
              />
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full"
          >
            {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
          </Button>

          {showAdvanced && (
            <div className="space-y-4 border-t pt-4">
              <AdvancedOptions />
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Generating Schedule...' : 'Generate Schedule'}
          </Button>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}
        </form>

        {schedule && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Repayment Schedule</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Principal</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interest</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Payment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining Principal</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {schedule.schedule.map((item) => (
                    <tr key={item.period}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.period}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.paymentDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.principalAmount.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.interestAmount.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.totalPayment.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.remainingPrincipal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </FormProvider>
  );
} 