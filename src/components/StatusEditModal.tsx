import React, { useState, useEffect } from 'react';
import { ServiceOrder } from '../types/serviceOrder';
import { serviceOrderStatus } from '../utils/serviceOrderStatus';

interface StatusEditModalProps {
  isOpen: boolean;
  order: ServiceOrder | null;
  onClose: () => void;
  onConfirm: (order: ServiceOrder, newStatus: string) => void;
}

export function StatusEditModal({ isOpen, order, onClose, onConfirm }: StatusEditModalProps) {
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    if (order) {
      setSelectedStatus(order.status || '');
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const handleConfirm = () => {
    if (order) {
      onConfirm(order, selectedStatus);
    }
  };

  const handleStatusChange = (newStatus: string) => {
    setSelectedStatus(newStatus);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h2 className="text-xl font-semibold mb-4">Alterar Status da O.S. #{order.orderNumber}</h2>
        
        <div className="space-y-2">
          {Object.entries(serviceOrderStatus).map(([key, label]) => {
            let bgColor;
            switch (key) {
              case 'quote':
                bgColor = 'bg-gray-100 hover:bg-gray-200';
                break;
              case 'open':
                bgColor = 'bg-blue-100 hover:bg-blue-200';
                break;
              case 'in_progress':
                bgColor = 'bg-yellow-100 hover:bg-yellow-200';
                break;
              case 'completed':
                bgColor = 'bg-green-100 hover:bg-green-200';
                break;
              case 'canceled':
                bgColor = 'bg-red-100 hover:bg-red-200';
                break;
              case 'awaiting_parts':
                bgColor = 'bg-orange-100 hover:bg-orange-200';
                break;
              case 'approved':
                bgColor = 'bg-emerald-100 hover:bg-emerald-200';
                break;
              case 'warranty_return':
                bgColor = 'bg-purple-100 hover:bg-purple-200';
                break;
              default:
                bgColor = 'bg-gray-100 hover:bg-gray-200';
            }

            return (
              <button
                key={key}
                onClick={() => handleStatusChange(key)}
                className={`w-full text-left px-4 py-2 rounded transition-colors ${bgColor} ${
                  selectedStatus === key ? 'font-medium ring-2 ring-offset-1 ring-blue-500' : ''
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-white bg-blue-500 hover:bg-blue-700"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
