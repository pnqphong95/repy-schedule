export interface Promotion {
  period: number;
  interestRate: number;
}

export interface EarlyRepaymentPenalty {
  period: number;
  penaltyRate: number;
}

export interface ScheduleRequest {
  totalAmount: number;
  loanTerm: number;
  interestRate: number;
  disbursementDate?: string;
  firstPaymentDate?: string;
  promotions?: Promotion[];
  earlyRepaymentPenalties?: EarlyRepaymentPenalty[];
}

export interface ScheduleItem {
  period: number;
  paymentDate: string;
  principalAmount: number;
  daysInPeriod: number;
  interestRate: number;
  interestAmount: number;
  totalPayment: number;
  remainingPrincipal: number;
}

export interface ScheduleResponse {
  schedule: ScheduleItem[];
} 