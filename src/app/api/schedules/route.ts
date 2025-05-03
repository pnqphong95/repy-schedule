import { NextResponse } from 'next/server';
import { z } from 'zod';
import { addMonths, addDays, isWeekend, format } from 'date-fns';
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

function adjustForWeekend(date: Date): Date {
  let adjustedDate = date;
  while (isWeekend(adjustedDate)) {
    adjustedDate = addDays(adjustedDate, 1);
  }
  return adjustedDate;
}

function calculateSchedule(request: ScheduleRequest): ScheduleResponse {
  const {
    totalAmount,
    loanTerm,
    interestRate,
    disbursementDate = new Date().toISOString(),
    firstPaymentDate,
    promotions = [],
    earlyRepaymentPenalties = []
  } = request;

  const schedule: ScheduleResponse['schedule'] = [];
  const principalPerPeriod = totalAmount / loanTerm;
  let remainingPrincipal = totalAmount;
  let currentDate = new Date(firstPaymentDate || disbursementDate);

  for (let period = 1; period <= loanTerm; period++) {
    const paymentDate = adjustForWeekend(currentDate);
    const daysInPeriod = period === 1
      ? Math.max(1, (paymentDate.getTime() - new Date(disbursementDate).getTime()) / (1000 * 60 * 60 * 24))
      : 30; // Assuming 30 days per month for simplicity

    // Find applicable promotion
    const promotion = promotions.find(p => p.period === period);
    const currentInterestRate = promotion ? promotion.interestRate : interestRate;

    const interestAmount = remainingPrincipal * (currentInterestRate / 100) * (daysInPeriod / 360);
    const totalPayment = principalPerPeriod + interestAmount;

    schedule.push({
      period,
      paymentDate: format(paymentDate, 'yyyy-MM-dd'),
      principalAmount: principalPerPeriod,
      daysInPeriod,
      interestRate: currentInterestRate,
      interestAmount,
      totalPayment,
      remainingPrincipal
    });

    remainingPrincipal -= principalPerPeriod;
    currentDate = addMonths(currentDate, 1);
  }

  return { schedule };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = scheduleSchema.parse(body);
    const schedule = calculateSchedule(validatedData);
    
    return NextResponse.json(schedule);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 