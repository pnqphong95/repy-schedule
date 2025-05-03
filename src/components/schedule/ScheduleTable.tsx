import type { ScheduleResponse } from '@/types/schedule';

interface ScheduleTableProps {
  schedule: ScheduleResponse;
}

export function ScheduleTable({ schedule }: ScheduleTableProps) {
  return (
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
  );
} 