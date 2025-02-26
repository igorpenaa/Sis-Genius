import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calculator,
  BarChart3,
  Bell,
  Newspaper,
  ArrowUp,
  ArrowDown,
  DollarSign,
  Smartphone,
  ShoppingCart,
  Wrench,
  Clock
} from 'lucide-react';
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { formatCurrency } from '../utils/format';

interface DailyStats {
  productSales: number;
  serviceSales: number;
  newPhoneSales: number;
  usedPhoneSales: number;
  expenses: number;
  revenue: number;
}

interface ServiceOrder {
  id: string;
  customerName: string;
  service: string;
  status: string;
  createdAt: Date;
}

interface RecentActivity {
  id: string;
  type: 'update' | 'news' | 'notification';
  title: string;
  message: string;
  date: Date;
}

interface FinanceCardProps {
  icon: React.ReactNode;
  title: string;
  value: number;
  description: string;
  type: 'revenue' | 'expense';
}

function FinanceCard({ icon, title, value, description, type }: FinanceCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${
          type === 'revenue' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
        }`}>
          {icon}
        </div>
        <div className={`flex items-center ${
          type === 'revenue' ? 'text-green-500' : 'text-red-500'
        }`}>
          {type === 'revenue' ? <ArrowUp className="w-5 h-5" /> : <ArrowDown className="w-5 h-5" />}
        </div>
      </div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <div className="mt-1">
        <span className="text-2xl font-bold text-gray-900">{formatCurrency(value)}</span>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
    </div>
  );
}

interface StatCircleProps {
  value: number;
  total: number;
  color: string;
  label: string;
}

function StatCircle({ value, total, color, label }: StatCircleProps) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full" viewBox="0 0 36 36">
          <path
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="#eee"
            strokeWidth="3"
          />
          <path
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeDasharray={`${percentage}, 100`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-lg font-semibold">{formatCurrency(value)}</div>
      </div>
      <span className="mt-2 text-sm font-medium text-gray-600">{label}</span>
    </div>
  );
}

interface SalesCardProps {
  icon: React.ReactNode;
  title: string;
  value: number;
  color: string;
}

function SalesCard({ icon, title, value, color }: SalesCardProps) {
  return (
    <div className={`p-4 rounded-lg ${color}`}>
      <div className="flex items-center justify-between text-white">
        <div>
          <p className="text-sm opacity-90">{title}</p>
          <p className="text-xl font-bold mt-1">{formatCurrency(value)}</p>
        </div>
        {icon}
      </div>
    </div>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [monthlyStats, setMonthlyStats] = useState({ revenue: 0, expenses: 0 });
  const [dailyStats, setDailyStats] = useState<DailyStats>({
    productSales: 0,
    serviceSales: 0,
    newPhoneSales: 0,
    usedPhoneSales: 0,
    expenses: 0,
    revenue: 0
  });
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [pendingPayments, setPendingPayments] = useState<number>(0);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // TODO: Implement data loading from Firebase
      // This is sample data - replace with actual Firebase queries
      setMonthlyStats({
        revenue: 45000,
        expenses: 28000
      });

      setDailyStats({
        productSales: 2500,
        serviceSales: 1800,
        newPhoneSales: 12000,
        usedPhoneSales: 3500,
        expenses: 8000,
        revenue: 19800
      });

      setServiceOrders([
        {
          id: '1',
          customerName: 'João Silva',
          service: 'Troca de Tela',
          status: 'Em andamento',
          createdAt: new Date()
        },
        // Add more sample orders
      ]);

      setRecentActivities([
        {
          id: '1',
          type: 'update',
          title: 'Nova Atualização',
          message: 'Sistema atualizado com novos recursos',
          date: new Date()
        },
        // Add more sample activities
      ]);

      setPendingPayments(5);
      setUserName('João');
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const quickActions = {
    calculator: {
      icon: <Calculator className="w-5 h-5" />,
      title: 'Calculadora de Serviços',
      onClick: () => navigate('/calculator')
    },
    hourCalculator: {
      icon: <Clock className="w-5 h-5" />,
      title: 'Calcular Hora Trabalho',
      onClick: () => navigate('/hour-calculator')
    },
    reports: {
      icon: <BarChart3 className="w-5 h-5" />,
      title: 'Relatórios Rápidos',
      onClick: () => navigate('/quick-reports')
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Message */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Olá, {userName}! 👋</h1>
        <p className="text-gray-600">Bem-vindo de volta ao seu painel</p>
      </div>

      {/* Top Row: Monthly Finance Cards and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Monthly Finance Cards */}
        <FinanceCard
          icon={<DollarSign className="w-6 h-6" />}
          title="Receita do Mês"
          value={monthlyStats.revenue}
          description="Total de receitas no mês atual"
          type="revenue"
        />
        <FinanceCard
          icon={<DollarSign className="w-6 h-6" />}
          title="Despesa do Mês"
          value={monthlyStats.expenses}
          description="Total de despesas no mês atual"
          type="expense"
        />
        
        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h2 className="text-lg font-semibold mb-4">Ações Rápidas</h2>
          <div className="grid gap-4">
            {Object.entries(quickActions).map(([key, action]) => (
              <button
                key={key}
                onClick={action.onClick}
                className="flex items-center space-x-3 p-3 w-full text-left hover:bg-gray-50 rounded-lg group"
              >
                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600 group-hover:bg-indigo-200 transition-colors">
                  {action.icon}
                </div>
                <span className="font-medium text-gray-700">{action.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Middle Row: Service Orders and Sales Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Service Orders */}
        <div className="bg-white rounded-xl shadow-lg">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">Ordens de Serviço</h2>
          </div>
          <div className="p-6">
            {serviceOrders.length === 0 ? (
              <p className="text-gray-500 text-center">Nenhuma ordem de serviço</p>
            ) : (
              <div className="space-y-4">
                {serviceOrders.map(order => (
                  <div key={order.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium">{order.customerName}</h3>
                      <p className="text-sm text-gray-600">{order.service}</p>
                    </div>
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                      {order.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sales Cards */}
        <div className="grid grid-cols-2 gap-4">
          <SalesCard
            icon={<ShoppingCart className="w-6 h-6" />}
            title="Vendas de Produtos"
            value={dailyStats.productSales}
            color="bg-gradient-to-r from-blue-500 to-blue-600"
          />
          <SalesCard
            icon={<Wrench className="w-6 h-6" />}
            title="Vendas de Serviços"
            value={dailyStats.serviceSales}
            color="bg-gradient-to-r from-purple-500 to-purple-600"
          />
          <SalesCard
            icon={<Smartphone className="w-6 h-6" />}
            title="Celulares Novos"
            value={dailyStats.newPhoneSales}
            color="bg-gradient-to-r from-green-500 to-green-600"
          />
          <SalesCard
            icon={<Smartphone className="w-6 h-6" />}
            title="Celulares Usados"
            value={dailyStats.usedPhoneSales}
            color="bg-gradient-to-r from-orange-500 to-orange-600"
          />
        </div>
      </div>

      {/* Bottom Row: Pending Payments and Daily Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Payments */}
        <div className="bg-white rounded-xl shadow-lg">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">Serviços Concluídos - Aguardando Pagamento</h2>
          </div>
          <div className="p-6">
            {serviceOrders.length === 0 ? (
              <p className="text-gray-500 text-center">Nenhum serviço aguardando pagamento</p>
            ) : (
              <div className="space-y-4">
                {serviceOrders.map(order => (
                  <div key={order.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium">{order.customerName}</h3>
                      <p className="text-sm text-gray-600">{order.service}</p>
                    </div>
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                      Aguardando Pagamento
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Daily Statistics */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h2 className="text-lg font-semibold mb-6">Estatísticas do Dia</h2>
          <div className="flex justify-around">
            <StatCircle
              value={dailyStats.expenses}
              total={dailyStats.revenue + dailyStats.expenses}
              color="#ef4444"
              label="Despesas"
            />
            <StatCircle
              value={dailyStats.revenue}
              total={dailyStats.revenue + dailyStats.expenses}
              color="#22c55e"
              label="Receitas"
            />
          </div>
        </div>
      </div>
    </div>
  );
}