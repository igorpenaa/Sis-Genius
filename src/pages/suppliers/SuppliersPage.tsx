import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  TrendingUp,
  DollarSign,
  Calendar,
  Building2,
  User,
  Truck,
  Globe,
  Menu,
  X
} from 'lucide-react';
import { collection, query, orderBy, getDocs, where, limit, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Supplier } from '../../types/supplier';
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

interface TopSupplierCardProps {
  supplier: any;
  position: number;
}

function TopSupplierCard({ supplier, position }: TopSupplierCardProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1">
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-semibold">
            {position}
          </div>
          <div className="ml-3">
            <h4 className="text-sm font-medium text-gray-900">{supplier.name}</h4>
            <p className="text-xs text-gray-500">
              {supplier.type === 'company' ? supplier.cnpj : supplier.cpf}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-900">
            {formatCurrency(supplier.totalPurchases || 0)}
          </p>
          <p className="text-xs text-gray-500">Total em compras</p>
        </div>
      </div>
    </div>
  );
}

export function SuppliersPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    newThisMonth: 0,
    active: 0,
    totalPurchasesMonth: 0,
    totalPurchasesToday: 0
  });
  const [topSuppliers, setTopSuppliers] = useState<any[]>([]);

  useEffect(() => {
    loadSupplierStats();
    loadTopSuppliers();
  }, []);

  const loadSupplierStats = async () => {
    try {
      const suppliersRef = collection(db, 'suppliers');
      const totalQuery = await getDocs(suppliersRef);
      
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfDay = new Date(now.setHours(0, 0, 0, 0));
      
      const newThisMonthQuery = query(
        suppliersRef,
        where('createdAt', '>=', Timestamp.fromDate(firstDayOfMonth))
      );
      
      const activeQuery = query(
        suppliersRef,
        where('status', '==', 'active')
      );

      const purchasesRef = collection(db, 'purchases');
      const monthPurchasesQuery = query(
        purchasesRef,
        where('createdAt', '>=', Timestamp.fromDate(firstDayOfMonth))
      );
      const todayPurchasesQuery = query(
        purchasesRef,
        where('createdAt', '>=', Timestamp.fromDate(startOfDay))
      );

      const [newThisMonthSnap, activeSnap, monthPurchasesSnap, todayPurchasesSnap] = await Promise.all([
        getDocs(newThisMonthQuery),
        getDocs(activeQuery),
        getDocs(monthPurchasesQuery),
        getDocs(todayPurchasesQuery)
      ]);

      const totalPurchasesMonth = monthPurchasesSnap.docs.reduce((acc, doc) => acc + (doc.data().total || 0), 0);
      const totalPurchasesToday = todayPurchasesSnap.docs.reduce((acc, doc) => acc + (doc.data().total || 0), 0);

      setStats({
        total: totalQuery.size,
        newThisMonth: newThisMonthSnap.size,
        active: activeSnap.size,
        totalPurchasesMonth,
        totalPurchasesToday
      });
    } catch (error) {
      console.error('Error loading supplier stats:', error);
    }
  };

  const loadTopSuppliers = async () => {
    try {
      const suppliersRef = collection(db, 'suppliers');
      const purchasesRef = collection(db, 'purchases');
      const purchasesQuery = query(
        purchasesRef,
        orderBy('createdAt', 'desc')
      );
      
      const purchasesSnapshot = await getDocs(purchasesQuery);
      
      // Agregar compras por fornecedor
      const supplierPurchases = purchasesSnapshot.docs.reduce((acc, doc) => {
        const data = doc.data();
        const supplierId = data.supplierId;
        const total = data.total || 0;
        
        if (!acc[supplierId]) {
          acc[supplierId] = {
            total: 0,
            count: 0,
            lastPurchase: null
          };
        }
        
        acc[supplierId].total += total;
        acc[supplierId].count += 1;
        
        const purchaseDate = data.createdAt?.toDate();
        if (!acc[supplierId].lastPurchase || 
            (purchaseDate && purchaseDate > acc[supplierId].lastPurchase)) {
          acc[supplierId].lastPurchase = purchaseDate;
        }
        
        return acc;
      }, {} as Record<string, { total: number; count: number; lastPurchase: Date | null }>);
      
      // Buscar detalhes dos fornecedores
      const q = query(
        suppliersRef,
        where('status', '==', 'active')
      );
      
      const suppliersSnapshot = await getDocs(q);
      const suppliers = suppliersSnapshot.docs
        .map(doc => {
          const supplierData = doc.data();
          const purchases = supplierPurchases[doc.id] || { total: 0, count: 0, lastPurchase: null };
          
          return {
            id: doc.id,
            ...supplierData,
            totalPurchases: purchases.total,
            purchaseCount: purchases.count,
            lastPurchaseDate: purchases.lastPurchase,
            createdAt: supplierData.createdAt?.toDate(),
            updatedAt: supplierData.updatedAt?.toDate()
          };
        })
        .filter(supplier => supplier.totalPurchases > 0)
        .sort((a, b) => b.totalPurchases - a.totalPurchases)
        .slice(0, 5);

      setTopSuppliers(suppliers);
    } catch (error) {
      console.error('Error loading top suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewSupplier = () => {
    navigate('/suppliers/new');
    setMenuOpen(false);
  };

  const handleViewAllSuppliers = () => {
    navigate('/suppliers/list');
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 md:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Fornecedores</h1>
            
            {/* Desktop buttons */}
            <div className="hidden md:flex space-x-4">
              <button
                onClick={handleViewAllSuppliers}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
              >
                <Users className="w-5 h-5 mr-2" />
                Ver Todos
              </button>
              <button
                onClick={handleNewSupplier}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Novo Fornecedor
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
                onClick={handleNewSupplier}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Novo Fornecedor
              </button>
              <button
                onClick={handleViewAllSuppliers}
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
              title="Total de Fornecedores"
              value={stats.total}
              description="Base total de fornecedores"
            />
          </div>
          <div className="w-[280px] md:w-auto flex-shrink-0 snap-start">
            <StatCard
              icon={<Calendar className="w-5 h-5 text-indigo-600" />}
              title="Novos no Mês"
              value={stats.newThisMonth}
              description="Fornecedores cadastrados este mês"
              trend={{ value: "+12%", up: true }}
            />
          </div>
          <div className="w-[280px] md:w-auto flex-shrink-0 snap-start">
            <StatCard
              icon={<DollarSign className="w-5 h-5 text-indigo-600" />}
              title="Fornecedores Ativos"
              value={stats.active}
              description="Fornecedores com status ativo"
              trend={{ value: "+5%", up: true }}
            />
          </div>
        </div>

        {/* Top Suppliers */}
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Fornecedores</h2>
          <div className="space-y-3">
            {topSuppliers.map((supplier, index) => (
              <TopSupplierCard
                key={supplier.id}
                supplier={supplier}
                position={index + 1}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}