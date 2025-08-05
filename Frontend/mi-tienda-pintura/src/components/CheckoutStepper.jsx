// src/components/CheckoutStepper.jsx
import React from 'react';
import Icon from './Icon';

const ICONS = {
  check: "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z",
  address: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
  shipping: "M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zM18 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z",
  payment: "M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z",
};

const steps = [
  { name: 'Dirección', icon: ICONS.address },
  { name: 'Envío', icon: ICONS.shipping },
  { name: 'Pago', icon: ICONS.payment },
];

/**
 * Componente visual que muestra el progreso del checkout.
 * @param {object} props
 * @param {number} props.currentStep - El índice del paso actual (0, 1, 2).
 */
const CheckoutStepper = ({ currentStep }) => {
  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-center">
        {steps.map((step, stepIdx) => (
          <li key={step.name} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20 flex-1' : ''}`}>
            {stepIdx < currentStep ? (
              // Pasos completados
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-[#0F3460]" />
                </div>
                <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[#0F3460] hover:bg-[#1a4a8a]">
                  <Icon path={ICONS.check} className="h-5 w-5 text-white" />
                </div>
                <span className="absolute -bottom-6 text-xs text-center w-full text-gray-700 font-semibold">{step.name}</span>
              </>
            ) : stepIdx === currentStep ? (
              // Paso actual
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-gray-200" />
                </div>
                <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#0F3460] bg-white">
                  <Icon path={step.icon} className="h-5 w-5 text-[#0F3460]" />
                </div>
                <span className="absolute -bottom-6 text-xs text-center w-full text-[#0F3460] font-bold">{step.name}</span>
              </>
            ) : (
              // Pasos futuros
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-gray-200" />
                </div>
                <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 bg-white">
                   <Icon path={step.icon} className="h-5 w-5 text-gray-400" />
                </div>
                 <span className="absolute -bottom-6 text-xs text-center w-full text-gray-500">{step.name}</span>
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default CheckoutStepper;
