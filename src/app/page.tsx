import { ScheduleForm } from '@/components/schedule/ScheduleForm';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-center text-green-800 mb-8">
          Loan Repayment Schedule Generator
        </h1>
        <ScheduleForm />
      </div>
    </main>
  );
}
