import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Menu,
  Store,
  PackageCheck,
  Smartphone,
  Shield,
  Settings,
  Cog,
  Users,
  ShoppingCart,
  LogOut,
  ChevronLeft,
  Wrench,
  FileText,
  Truck,
  Briefcase,
  ClipboardList,
  BarChart3,
  Tags,
  DollarSign,
  ArrowLeftRight,
  PieChart,
  Database,
  Building2,
  Box,
  Receipt,
  Wallet,
  CreditCard,
  Package,
  LineChart,
  UserCog,
  Building
} from 'lucide-react';
import { useState } from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  path?: string;
  children?: MenuItem[];
}

export function Layout({ children }: LayoutProps) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(window.innerWidth > 500);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [isHoveringToggle, setIsHoveringToggle] = useState(false);
  const isMobile = window.innerWidth <= 500;
  const [activeMenuItem, setActiveMenuItem] = useState<string | null>(null);

  // Handle window resize
  React.useEffect(() => {
    const handleResize = () => {
      const isMobileView = window.innerWidth <= 500;
      if (isMobileView) {
        setIsExpanded(false);
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile menu when navigating
  React.useEffect(() => {
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  }, [window.location.pathname]);

  const menuItems: MenuItem[] = [
    {
      label: 'Cadastros',
      icon: <FileText className="w-5 h-5" />,
      children: [
        { label: 'Clientes', icon: <Users className="w-5 h-5" />, path: '/customers' },
        { label: 'Fornecedores', icon: <Truck className="w-5 h-5" />, path: '/suppliers' },
        { label: 'Funcionários', icon: <Briefcase className="w-5 h-5" />, path: '/employees' },
        { label: 'Transportadoras', icon: <Truck className="w-5 h-5" />, path: '/carriers' }
      ]
    },
    {
      label: 'Produtos',
      icon: <Box className="w-5 h-5" />,
      children: [
        { label: 'Gerenciar produtos', icon: <Store className="w-5 h-5" />, path: '/store/products' },
        { label: 'Gerenciar peças', icon: <Cog className="w-5 h-5" />, path: '/store/parts' },
        { label: 'Valores de venda', icon: <Tags className="w-5 h-5" />, path: '/products/prices' },
        { label: 'Etiquetas', icon: <Tags className="w-5 h-5" />, path: '/products/labels' }
      ]
    },
    {
      label: 'Serviços',
      icon: <Wrench className="w-5 h-5" />,
      children: [
        { label: 'Gerenciar serviços', icon: <Wrench className="w-5 h-5" />, path: '/services' }
      ]
    },
    {
      label: 'Estoque',
      icon: <PackageCheck className="w-5 h-5" />,
      children: [
        { label: 'Lançar Estoque', icon: <Box className="w-5 h-5" />, path: '/inventory/add' },
        { label: 'Listar Estoque', icon: <ClipboardList className="w-5 h-5" />, path: '/inventory/list' }
      ]
    },
    {
      label: 'Ordens de serviços',
      icon: <ClipboardList className="w-5 h-5" />,
      children: [
        { label: 'Gerenciar O.S.', icon: <Wrench className="w-5 h-5" />, path: '/service-orders' },
        { label: 'Checklist', icon: <ClipboardList className="w-5 h-5" />, path: '/service-orders/checklist' },
        { label: 'Garantia', icon: <Shield className="w-5 h-5" />, path: '/service-orders/warranties' }
      ]
    },
    {
      label: 'Vendas',
      icon: <ShoppingCart className="w-5 h-5" />,
      children: [
        { label: 'Aparelhos', icon: <Smartphone className="w-5 h-5" />, path: '/sales/devices/list' },
        { label: 'Produtos', icon: <Box className="w-5 h-5" />, path: '/sales/products/list' },
      ]
    },
    {
      label: 'Financeiro',
      icon: <DollarSign className="w-5 h-5" />,
      children: [
        { label: 'Caixa', icon: <DollarSign className="w-5 h-5" />, path: '/financial/history' },
        { label: 'Contas a pagar', icon: <Wallet className="w-5 h-5" />, path: '/financial/payables' },
        { label: 'Contas a receber', icon: <Wallet className="w-5 h-5" />, path: '/financial/receivables' },
        { label: 'Fluxo de caixa', icon: <LineChart className="w-5 h-5" />, path: '/financial/cash-flow' },
        { label: 'Transferencias', icon: <ArrowLeftRight className="w-5 h-5" />, path: '/financial/billing' },
      ]
    },
    {
      label: 'Opções auxiliares',
      icon: <Settings className="w-5 h-5" />,
      children: [
        { label: 'Caixas', icon: <Box className="w-5 h-5" />, path: '/settings/cashiers' },
        { label: 'Contas bancárias', icon: <Wallet className="w-5 h-5" />, path: '/settings/bank-accounts' },
        { label: 'Formas de pagamento', icon: <CreditCard className="w-5 h-5" />, path: '/settings/payment-methods' },
        { label: 'Categoria', icon: <Tags className="w-5 h-5" />, path: '/settings/categories' },
        { label: 'Centro de Custo', icon: <Building2 className="w-5 h-5" />, path: '/settings/cost-centers' }
      ]
    },
    {
      label: 'Relatórios',
      icon: <PieChart className="w-5 h-5" />,
      children: [
        { label: 'Cadastros', icon: <Database className="w-5 h-5" />, path: '/reports/registers' },
        { label: 'Vendas', icon: <ShoppingCart className="w-5 h-5" />, path: '/reports/sales' },
        { label: 'Ordens de serviços', icon: <Wrench className="w-5 h-5" />, path: '/reports/service-orders' },
        { label: 'Comissão', icon: <DollarSign className="w-5 h-5" />, path: '/reports/commission' },
        { label: 'Estoque', icon: <Box className="w-5 h-5" />, path: '/reports/inventory' },
        { label: 'Financeiro', icon: <DollarSign className="w-5 h-5" />, path: '/reports/financial' },
        { label: 'Logs do sistema', icon: <FileText className="w-5 h-5" />, path: '/reports/system-logs' }
      ]
    },
    {
      label: 'Configurações',
      icon: <Settings className="w-5 h-5" />,
      children: [
        { label: 'Gerais', icon: <Settings className="w-5 h-5" />, path: '/settings/general' },
        { label: 'Meu plano', icon: <CreditCard className="w-5 h-5" />, path: '/settings/plan' },
        { label: 'Nível de Acesso', icon: <UserCog className="w-5 h-5" />, path: '/settings/users' },
        { label: 'Dados da empresa', icon: <Building className="w-5 h-5" />, path: '/settings/company' }
      ]
    }
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const toggleMenuItem = (label: string) => {
    setExpandedItem(prev => prev === label ? null : label);
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const isItemExpanded = expandedItem === item.label;
    const hasChildren = item.children && item.children.length > 0;
    const currentPath = window.location.pathname;
    const isActive = item.path ? currentPath === item.path : false;
    const isChildActive = hasChildren && item.children?.some(child => {
      if (!child.path) return false;
      // For exact matches or index routes
      if (currentPath === child.path) return true;
      // For child routes that have additional segments
      if (child.path.endsWith('/list') && currentPath.startsWith(child.path.replace('/list', ''))) return true;
      if (child.path.endsWith('/new') && currentPath.startsWith(child.path.replace('/new', ''))) return true;
      if (child.path.includes('/edit/')) return currentPath.startsWith(child.path.split('/edit/')[0]);
      return false;
    });

    return (
      <div key={item.label}>
        <button
          onClick={() => {
            if (hasChildren) {
              setExpandedItem(prev => prev === item.label ? null : item.label);
              setActiveMenuItem(null);
            } else if (item.path) {
              navigate(item.path);
              setExpandedItem(null);
              setActiveMenuItem(item.label);
              if (isMobile) {
                setIsMobileMenuOpen(false);
              }
            }
          }}
          className={`
            w-full flex items-center px-4 py-2 text-white hover:bg-white/10 rounded-lg
            ${isActive || isChildActive ? 'bg-gradient-to-r from-blue-600/80 to-orange-500/80' : 'hover:bg-white/10'}
            ${level > 0 ? 'pl-8 bg-white/5' : ''}
            ${!isExpanded && level === 0 ? 'justify-center' : ''}
            transition-all duration-200
          `}
        >
          <span className="w-5 h-5 opacity-80">{item.icon}</span>
          {(isExpanded || isMobile) && (
            <>
              <span className="ml-3 whitespace-nowrap opacity-90">{item.label}</span>
              {hasChildren && (
                <ChevronLeft
                  className={`w-4 h-4 ml-auto opacity-60 transition-transform ${
                    isItemExpanded ? 'rotate-[-90deg]' : ''
                  }`}
                />
              )}
            </>
          )}
        </button>
        {(isExpanded || isMobile) && hasChildren && isItemExpanded && (
          <div className="mt-1 bg-white/5 rounded-lg py-1">
            {item.children?.map(child => {
              const currentPath = window.location.pathname;
              const isChildActive = child.path ? (
                currentPath === child.path ||
                (child.path.endsWith('/list') && currentPath.startsWith(child.path.replace('/list', ''))) ||
                (child.path.endsWith('/new') && currentPath.startsWith(child.path.replace('/new', ''))) ||
                (child.path.includes('/edit/') && currentPath.startsWith(child.path.split('/edit/')[0]))
              ) : false;
              return (
                <button
                  key={child.label}
                  onClick={() => child.path && navigate(child.path)}
                  className={`
                    w-full flex items-center px-4 py-2 text-white hover:bg-white/10 rounded-lg
                    ${isChildActive ? 'bg-gradient-to-r from-blue-600/60 to-orange-500/60' : 'hover:bg-white/10'}
                    pl-8 bg-white/5
                    transition-all duration-200
                  `}
                >
                  <span className="w-5 h-5 opacity-80">{child.icon}</span>
                  <span className="ml-3 whitespace-nowrap opacity-90">{child.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-blue-600 to-orange-500 z-50 flex items-center justify-between px-4">
        <img 
          src="https://cursodecelular.net/wp-content/uploads/2025/02/LOGO-REDE-GENIUS-DEITADO.png"
          alt="Genius Logo"
          className="h-8"
        />
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Floating Menu Toggle Button */}
      <button
        onClick={toggleExpand}
        onMouseEnter={() => setIsHoveringToggle(true)}
        onMouseLeave={() => setIsHoveringToggle(false)}
        className={`
          hidden lg:flex fixed z-50 flex-col items-center py-6 px-2
          bg-gradient-to-br from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600
          text-white rounded-r-lg shadow-lg transition-all duration-300
          ${isExpanded ? 'left-60' : 'left-16'}
          top-1/2 -translate-y-1/2
        `}
      >
        <ChevronLeft className={`w-5 h-5 transition-transform duration-300 ${!isExpanded ? 'rotate-180' : ''}`} />
        <span 
          className={`
            writing-mode-vertical origin-center font-medium text-sm mt-2
            transition-all duration-300
            ${isHoveringToggle ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
          `}
        >
          {isExpanded ? 'Recuar Menu' : 'Expandir Menu'}
        </span>
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 h-full bg-gradient-to-b from-blue-600 to-blue-800 shadow-xl transition-all duration-300 z-40 
          sidebar-scrollbar overflow-y-auto
          ${isMobile ? (isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}
          ${isExpanded ? 'w-64' : 'w-20'}
          ${isMobile ? 'w-64 mt-16 h-[calc(100vh-4rem)]' : ''}
        `}
      >
        <div className={`flex flex-col items-center pt-8 pb-6 ${isMobile ? 'hidden' : ''}`}>
          {isExpanded ? (
            <button
              onClick={() => navigate('/')}
              className="transition-transform hover:scale-105 focus:outline-none"
            >
              <img 
                src="https://cursodecelular.net/wp-content/uploads/2025/02/LOGO-REDE-GENIUS-DEITADO.png"
                alt="Genius Logo"
                className="h-10"
              />
            </button>
          ) : (
            <button
              onClick={() => navigate('/')}
              className="transition-transform hover:scale-105 focus:outline-none"
            >
              <img 
                src="https://cursodecelular.net/wp-content/uploads/2025/02/LOGO-REDE-GENIUS-DEITADO.png"
                alt="Genius Logo"
                className="h-10 w-10 object-cover"
              />
            </button>
          )}
        </div>
        
        <nav className="px-2 space-y-1">
          <div className={isMobile ? 'pb-20' : ''}>
            {menuItems.map(item => renderMenuItem(item))}
          
            <div className="pt-4 mt-4 border-t border-white/10">
              <button
                onClick={handleLogout}
                className={`
                  w-full flex items-center px-4 py-2 text-white hover:bg-white/10 rounded-lg
                  ${!isExpanded && !isMobile ? 'justify-center' : ''}
                `}
              >
                <LogOut className="w-5 h-5" />
                {(isExpanded || isMobile) && <span className="ml-3">Sair</span>}
              </button>
            </div>
          </div>
        </nav>
      </aside>

      {/* Main content */}
      <main 
        className={`
          transition-all duration-300 p-8
          ${isMobile ? 'ml-0 mt-16' : isExpanded ? 'ml-64' : 'ml-20'}
          bg-gradient-to-br from-gray-50 to-gray-100
        `}
      >
        {children}
      </main>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}