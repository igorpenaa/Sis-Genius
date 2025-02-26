import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  TrendingUp,
  DollarSign,
  Calendar,
  Search,
  Building2,
  User,
  Menu,
  X
} from 'lucide-react';
import { collection, query, orderBy, getDocs, where, limit, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Customer } from '../../types/customer';
import { formatCurrency } from '../../utils/format';

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  description: string;
  trend?: {
    value: string;
    up: boolean;
  };
}

function StatCard({ icon, title, value, description, trend }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="p-2 bg-indigo-100 rounded-lg">
            {icon}
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-gray-900">{title}</h3>
            <span className="text-xl font-bold text-gray-900">{value}</span>
          </div>
        </div>
        {trend && (
          <div className={`flex items-center ${trend.up ? 'text-green-500' : 'text-red-500'}`}>
            <TrendingUp className={`w-4 h-4 mr-1 ${!trend.up && 'rotate-180'}`} />
            <span className="text-xs font-medium">{trend.value}</span>
          </div>
        )}
      </div>
      <p className="mt-1 text-xs text-gray-500">{description}</p>
    </div>
  );
}

interface TopCustomerCardProps {
  customer: Customer;
  position: number;
}

function TopCustomerCard({ customer, position }: TopCustomerCardProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
      <div className="flex items-center">
        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-semibold">
          {position}
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-gray-900">{customer.name}</h3>
          <p className="text-xs text-gray-500">{customer.email}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-900">
            {formatCurrency(customer.totalPurchases || 0)}
          </p>
          <p className="text-xs text-gray-500">Total em compras</p>
        </div>
      </div>
    </div>
  );
}

export function CustomersPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    newThisMonth: 0,
    active: 0
  });
  const [topCustomers, setTopCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    loadCustomerStats();
    loadTopCustomers();
  }, []);

  const loadCustomerStats = async () => {
    try {
      const customersRef = collection(db, 'customers');
      const totalQuery = await getDocs(customersRef);
      
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const newThisMonthQuery = query(
        customersRef,
        where('createdAt', '>=', Timestamp.fromDate(firstDayOfMonth))
      );
      
      const activeQuery = query(
        customersRef,
        where('status', '==', 'active')
      );

      const [newThisMonthSnap, activeSnap] = await Promise.all([
        getDocs(newThisMonthQuery),
        getDocs(activeQuery)
      ]);

      setStats({
        total: totalQuery.size,
        newThisMonth: newThisMonthSnap.size,
        active: activeSnap.size
      });
    } catch (error) {
      console.error('Error loading customer stats:', error);
    }
  };

  const loadTopCustomers = async () => {
    try {
      const customersRef = collection(db, 'customers');
      const topCustomersQuery = query(
        customersRef,
        orderBy('totalPurchases', 'desc'),
        limit(5)
      );
      
      const snapshot = await getDocs(topCustomersQuery);
      const customers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        lastPurchaseDate: doc.data().lastPurchaseDate?.toDate()
      })) as Customer[];

      setTopCustomers(customers);
    } catch (error) {
      console.error('Error loading top customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewCustomer = () => {
    navigate('/customers/new');
    setMenuOpen(false);
  };

  const handleViewAllCustomers = () => {
    navigate('/customers/list');
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 md:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-900">Clientes</h1>
            
            {/* Desktop buttons */}
            <div className="hidden md:flex space-x-4">
              <button
                onClick={handleViewAllCustomers}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
              >
                <Users className="w-5 h-5 mr-2" />
                Ver Todos
              </button>
              <button
                onClick={handleNewCustomer}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Novo Cliente
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg md:hidden"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {menuOpen && (
            <div className="absolute top-full left-0 right-0 bg-white border-t border-gray-100 shadow-lg p-4 space-y-2 md:hidden">
              <button
                onClick={handleNewCustomer}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Novo Cliente
              </button>
              <button
                onClick={handleViewAllCustomers}
                className="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
              >
                <Users className="w-5 h-5 mr-2" />
                Ver Todos
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 md:p-8">
        {/* Stats Grid - Horizontal scroll on mobile */}
        <div className="flex md:grid md:grid-cols-3 md:gap-6 overflow-x-auto space-x-4 md:space-x-0 pb-4 mb-6 -mx-4 md:mx-0 px-4 md:px-0 snap-x">
          <div className="w-[280px] md:w-auto flex-shrink-0 snap-start">
            <StatCard
              icon={<Users className="w-5 h-5 text-indigo-600" />}
              title="Total de Clientes"
              value={stats.total}
              description="Base total de clientes"
            />
          </div>
          <div className="w-[280px] md:w-auto flex-shrink-0 snap-start">
            <StatCard
              icon={<Calendar className="w-5 h-5 text-indigo-600" />}
              title="Novos no Mês"
              value={stats.newThisMonth}
              description="Clientes cadastrados este mês"
              trend={{ value: "+12%", up: true }}
            />
          </div>
          <div className="w-[280px] md:w-auto flex-shrink-0 snap-start">
            <StatCard
              icon={<DollarSign className="w-5 h-5 text-indigo-600" />}
              title="Clientes Ativos"
              value={stats.active}
              description="Clientes com status ativo"
              trend={{ value: "+5%", up: true }}
            />
          </div>
        </div>

        {/* Top Customers */}
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Clientes</h2>
          <div className="space-y-3">
            {topCustomers.map((customer, index) => (
              <TopCustomerCard
                key={customer.id}
                customer={customer}
                position={index + 1}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}