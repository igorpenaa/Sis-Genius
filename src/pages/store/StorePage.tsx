import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Package2, BarChart3, Tags, Truck, Cog } from 'lucide-react';

interface MenuCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}

function MenuCard({ icon, title, description, onClick }: MenuCardProps) {
  return (
    <button
      onClick={onClick}
      className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 text-left w-full"
    >
      <div className="flex items-start space-x-4">
        <div className="p-3 bg-indigo-100 rounded-lg">
          <div className="text-indigo-600 w-6 h-6">
            {icon}
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-gray-600 mt-1 text-sm">{description}</p>
        </div>
      </div>
    </button>
  );
}

export function StorePage() {
  const navigate = useNavigate();

  const menuItems = [
    {
      icon: <Package2 />,
      title: 'Produtos',
      description: 'Gerencie seu catálogo de produtos, preços e estoque',
      path: '/store/products'
    },
    {
      icon: <BarChart3 />,
      title: 'Relatórios',
      description: 'Visualize relatórios de vendas, estoque e desempenho',
      path: '/store/reports'
    },
    {
      icon: <Tags />,
      title: 'Promoções',
      description: 'Configure descontos e ofertas especiais',
      path: '/store/promotions'
    },
    {
      icon: <Truck />,
      title: 'Fornecedores',
      description: 'Gerencie seus fornecedores e pedidos de compra',
      path: '/store/suppliers'
    }
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Gestão da Loja</h1>
        <p className="text-gray-600 mt-1">
          Gerencie todos os aspectos da sua loja em um só lugar
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {menuItems.map((item, index) => (
          <MenuCard
            key={index}
            icon={item.icon}
            title={item.title}
            description={item.description}
            onClick={() => navigate(item.path)}
          />
        ))}
      </div>
    </div>
  );
}