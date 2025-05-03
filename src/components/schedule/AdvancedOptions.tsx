"use client";

import { useState } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';

export function AdvancedOptions() {
  const { control, register, formState: { errors } } = useFormContext();
  const [activeTab, setActiveTab] = useState<'promotions' | 'penalties'>('promotions');

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

  return (
    <div className="space-y-6">
      <div className="flex space-x-4 border-b">
        <button
          type="button"
          className={`pb-2 px-4 ${
            activeTab === 'promotions'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('promotions')}
        >
          Promotions
        </button>
        <button
          type="button"
          className={`pb-2 px-4 ${
            activeTab === 'penalties'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('penalties')}
        >
          Early Repayment Penalties
        </button>
      </div>

      {activeTab === 'promotions' && (
        <div className="space-y-4">
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
                  type="number"
                  step="0.01"
                  {...register(`promotions.${index}.interestRate`, { valueAsNumber: true })}
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
      )}

      {activeTab === 'penalties' && (
        <div className="space-y-4">
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
                  type="number"
                  step="0.01"
                  {...register(`earlyRepaymentPenalties.${index}.penaltyRate`, { valueAsNumber: true })}
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
      )}
    </div>
  );
} 