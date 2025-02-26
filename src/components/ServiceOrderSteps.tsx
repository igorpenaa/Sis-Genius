import React from 'react';
import { Check } from 'lucide-react';

interface Step {
  title: string;
  description: string;
}

interface StepsProps {
  steps: Step[];
  currentStep: number;
  isMobile?: boolean;
}

export function ServiceOrderSteps({ steps, currentStep, isMobile }: StepsProps) {
  if (isMobile) {
    return (
      <nav aria-label="Progress" className="mb-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            Etapa {currentStep + 1} de {steps.length}
          </span>
          <span className="text-sm font-medium text-indigo-600">
            {steps[currentStep].title}
          </span>
        </div>
        <div className="mt-1">
          <div className="overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-indigo-600 transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav aria-label="Progress" className="mb-8">
      <ol role="list" className="space-y-4 md:flex md:space-y-0 md:space-x-8">
        {steps.map((step, index) => (
          <li key={step.title} className="md:flex-1">
            <div className={`group pl-4 py-2 flex flex-col border-l-4 md:pl-0 md:pt-4 md:pb-0 md:border-l-0 md:border-t-4 ${index <= currentStep ? 'border-indigo-600' : 'border-gray-200'}`}>
              <span className={`text-xs font-semibold tracking-wide uppercase ${index <= currentStep ? 'text-indigo-600' : 'text-gray-500'}`}>
                {`ETAPA ${index + 1}`}
              </span>
              <span className="text-sm font-medium">
                {step.title}
              </span>
              {index <= currentStep && (
                <span className="text-xs text-gray-500">{step.description}</span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}