import React, { useState } from 'react';
import { Search } from 'lucide-react';

interface Option {
  id: string;
  label: string;
  description?: string;
}

interface SearchSelectProps {
  value: Option | null;
  onChange: (option: Option | null) => void;
  options: Option[];
  placeholder?: string;
  label?: string;
  required?: boolean;
  className?: string;
  id?: string;
}

export function SearchSelect({
  value,
  onChange,
  options,
  placeholder = 'Selecionar...',
  label,
  required = false,
  className = '',
  id
}: SearchSelectProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOptions = options.filter(option => {
    if (!option || !option.label) return false;
    
    const labelMatch = option.label.toLowerCase().includes(searchTerm.toLowerCase());
    const descriptionMatch = option.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    
    return labelMatch || descriptionMatch;
  });

  return (
    <div className="relative">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && '*'}
        </label>
      )}
      <div className="mt-1">
        <div
          onClick={() => setShowDropdown(true)}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white cursor-pointer flex items-center justify-between ${className}`}
        >
          <span className={value ? 'text-gray-900' : 'text-gray-500'}>
            {value ? value.label : placeholder}
          </span>
          <Search className="w-5 h-5 text-gray-400" />
        </div>
        {showDropdown && (
          <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200">
            <div className="p-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar..."
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                autoFocus
              />
            </div>
            <div className="max-h-60 overflow-y-auto">
              {filteredOptions.map(option => (
                <div
                  key={option.id}
                  onClick={() => {
                    onChange(option);
                    setShowDropdown(false);
                    setSearchTerm('');
                  }}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  <div className="font-medium">{option.label}</div>
                  {option.description && (
                    <div className="text-sm text-gray-500">{option.description}</div>
                  )}
                </div>
              ))}
              {filteredOptions.length === 0 && (
                <div className="px-4 py-2 text-gray-500 text-center">
                  Nenhum resultado encontrado
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
