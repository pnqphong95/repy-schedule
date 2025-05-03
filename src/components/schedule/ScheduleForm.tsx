"use client";

import { useState, useCallback } from 'react';
import { useForm, FormProvider, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { ScheduleTable } from './ScheduleTable';
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
}) satisfies z.ZodType<ScheduleRequest>;

type FormData = z.infer<typeof scheduleSchema>;

// Throttle delay in milliseconds
const THROTTLE_DELAY = 1000;

// Simple hash function for request body
function hashRequest(data: FormData): string {
  return JSON.stringify(data);
}

// Currency formatter
const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

// Format currency input
function formatCurrencyInput(value: string): string {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '');
  // Convert to number and format
  const number = parseInt(digits, 10);
  if (isNaN(number)) return '';
  return currencyFormatter.format(number);
}

// Format percentage input
function formatPercentageInput(value: string): string {
  // Remove all non-digit and non-decimal characters
  const digits = value.replace(/[^\d.]/g, '');
  // Ensure only one decimal point
  const parts = digits.split('.');
  if (parts.length > 2) {
    return `${parts[0]}.${parts.slice(1).join('')}`;
  }
  // Limit to 2 decimal places
  if (parts.length === 2 && parts[1].length > 2) {
    return `${parts[0]}.${parts[1].slice(0, 2)}`;
  }
  return digits;
}

export function ScheduleForm() {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRequestTime, setLastRequestTime] = useState<number>(0);
  const [lastRequestHash, setLastRequestHash] = useState<string>('');
  const [lastResponse, setLastResponse] = useState<ScheduleResponse | null>(null);

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
    control,
    formState: { errors },
  } = methods;

  const {
    fields: promotionFields,
    append: appendPromotion,
    remove: removePromotion,
  } = useFieldArray({
    control,
    name: 'promotions',
  });

  const {
    fields: penaltyFields,
    append: appendPenalty,
    remove: removePenalty,
  } = useFieldArray({
    control,
    name: 'earlyRepaymentPenalties',
  });

  const submitRequest = useCallback(async (data: FormData) => {
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
      setLastResponse(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const onSubmit = useCallback(async (data: FormData) => {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    const currentRequestHash = hashRequest(data);

    // Always show loading state
    setLoading(true);

    // Check if this is a duplicate request
    if (currentRequestHash === lastRequestHash && lastResponse) {
      // Simulate network delay for consistency
      await new Promise(resolve => setTimeout(resolve, 500));
      setSchedule(lastResponse);
      setLoading(false);
      return;
    }

    // Check throttling
    if (timeSinceLastRequest < THROTTLE_DELAY) {
      // Simulate network delay for consistency
      await new Promise(resolve => setTimeout(resolve, THROTTLE_DELAY - timeSinceLastRequest));
    }

    setLastRequestTime(now);
    setLastRequestHash(currentRequestHash);
    await submitRequest(data);
  }, [lastRequestTime, lastRequestHash, lastResponse, submitRequest]);

  return (
    <FormProvider {...methods}>
      <div className="max-w-2xl mx-auto p-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="totalAmount">Total Loan Amount</Label>
              <Input
                id="totalAmount"
                type="text"
                inputMode="numeric"
                {...register('totalAmount', {
                  setValueAs: (value) => {
                    const numericValue = parseInt(value.replace(/\D/g, ''), 10);
                    return isNaN(numericValue) ? 0 : numericValue;
                  },
                  onChange: (e) => {
                    const formatted = formatCurrencyInput(e.target.value);
                    e.target.value = formatted;
                  }
                })}
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
                type="text"
                inputMode="decimal"
                {...register('interestRate', {
                  setValueAs: (value) => {
                    const numericValue = parseFloat(value);
                    return isNaN(numericValue) ? 0 : numericValue;
                  },
                  onChange: (e) => {
                    const formatted = formatPercentageInput(e.target.value);
                    e.target.value = formatted;
                  }
                })}
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
            <div className="space-y-6 border-t pt-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Promotions</h3>
                {promotionFields.map((field, index) => (
                  <div key={field.id} className="flex items-end space-x-4">
                    <div className="flex-1">
                      <Label htmlFor={`promotions.${index}.period`}>Period (months)</Label>
                      <Input
                        id={`promotions.${index}.period`}
                        type="number"
                        {...register(`promotions.${index}.period`, { valueAsNumber: true })}
                      />
                      {errors.promotions?.[index]?.period && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.promotions[index]?.period?.message}
                        </p>
                      )}
                    </div>
                    <div className="flex-1">
                      <Label htmlFor={`promotions.${index}.interestRate`}>Interest Rate (%)</Label>
                      <Input
                        id={`promotions.${index}.interestRate`}
                        type="text"
                        inputMode="decimal"
                        {...register(`promotions.${index}.interestRate`, {
                          setValueAs: (value) => {
                            const numericValue = parseFloat(value);
                            return isNaN(numericValue) ? 0 : numericValue;
                          },
                          onChange: (e) => {
                            const formatted = formatPercentageInput(e.target.value);
                            e.target.value = formatted;
                          }
                        })}
                      />
                      {errors.promotions?.[index]?.interestRate && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.promotions[index]?.interestRate?.message}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => removePromotion(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => appendPromotion({ period: 0, interestRate: 0 })}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Promotion
                </Button>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Early Repayment Penalties</h3>
                {penaltyFields.map((field, index) => (
                  <div key={field.id} className="flex items-end space-x-4">
                    <div className="flex-1">
                      <Label htmlFor={`earlyRepaymentPenalties.${index}.period`}>Period (months)</Label>
                      <Input
                        id={`earlyRepaymentPenalties.${index}.period`}
                        type="number"
                        {...register(`earlyRepaymentPenalties.${index}.period`, { valueAsNumber: true })}
                      />
                      {errors.earlyRepaymentPenalties?.[index]?.period && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.earlyRepaymentPenalties[index]?.period?.message}
                        </p>
                      )}
                    </div>
                    <div className="flex-1">
                      <Label htmlFor={`earlyRepaymentPenalties.${index}.penaltyRate`}>Penalty Rate (%)</Label>
                      <Input
                        id={`earlyRepaymentPenalties.${index}.penaltyRate`}
                        type="text"
                        inputMode="decimal"
                        {...register(`earlyRepaymentPenalties.${index}.penaltyRate`, {
                          setValueAs: (value) => {
                            const numericValue = parseFloat(value);
                            return isNaN(numericValue) ? 0 : numericValue;
                          },
                          onChange: (e) => {
                            const formatted = formatPercentageInput(e.target.value);
                            e.target.value = formatted;
                          }
                        })}
                      />
                      {errors.earlyRepaymentPenalties?.[index]?.penaltyRate && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.earlyRepaymentPenalties[index]?.penaltyRate?.message}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => removePenalty(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => appendPenalty({ period: 0, penaltyRate: 0 })}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Penalty
                </Button>
              </div>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Schedule...
              </>
            ) : (
              'Generate Schedule'
            )}
          </Button>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}
        </form>

        {schedule && <ScheduleTable schedule={schedule} />}
      </div>
    </FormProvider>
  );
} 