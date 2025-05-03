import { NextRequest, NextResponse } from 'next/server';
import { apiMiddleware } from '@/middleware/api';
import { z } from 'zod';
import { addMonths, addDays, isWeekend, format } from 'date-fns';
import type { ScheduleRequest, ScheduleResponse } from '@/types/schedule';

export const runtime = 'edge';

// Rate limiting configuration
const RATE_LIMIT = 10; // requests
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds

// In-memory store for rate limiting (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

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
  _earlyRepaymentPenalties: z.array(z.object({
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

export async function POST(request: NextRequest) {
  // Apply API middleware
  const middlewareResponse = apiMiddleware(request);
  if (middlewareResponse.status !== 200) {
    return middlewareResponse;
  }

  // Get client IP for rate limiting
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0] : 'unknown';
  const now = Date.now();

  // Check rate limit
  const rateLimit = rateLimitStore.get(ip);
  if (rateLimit) {
    if (now > rateLimit.resetTime) {
      // Reset if window has passed
      rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    } else if (rateLimit.count >= RATE_LIMIT) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    } else {
      // Increment count
      rateLimit.count++;
    }
  } else {
    // First request from this IP
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
  }

  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = scheduleSchema.parse(body);

    const schedule = calculateSchedule(validatedData);
    
    return NextResponse.json(schedule);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid request data', details: error.errors }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 