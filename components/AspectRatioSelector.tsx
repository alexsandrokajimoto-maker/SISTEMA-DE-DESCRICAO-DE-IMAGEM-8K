
import React from 'react';
import { AspectRatio } from '../types';

interface AspectRatioSelectorProps {
  selectedRatio: AspectRatio;
  onRatioChange: (ratio: AspectRatio) => void;
}

const AspectRatioSelector: React.FC<AspectRatioSelectorProps> = ({
  selectedRatio,
  onRatioChange,
}) => {
  return (
    <div className="mb-6">
      <label htmlFor="aspect-ratio-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Selecione a proporção da imagem para o prompt:
      </label>
      <div className="relative">
        <select
          id="aspect-ratio-select"
          value={selectedRatio}
          onChange={(e) => onRatioChange(e.target.value as AspectRatio)}
          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md
                     dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:focus:ring-indigo-400 dark:focus:border-indigo-400"
          aria-label="Selecionar proporção da imagem"
        >
          {Object.values(AspectRatio).map((ratio) => (
            <option key={ratio} value={ratio}>
              {ratio}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default AspectRatioSelector;
