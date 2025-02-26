import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AuthProvider } from './contexts/AuthContext';
import { DashboardPage } from './pages/DashboardPage';
import { PrivateRoute } from './components/PrivateRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { CustomersPage } from './pages/customers/CustomersPage';
import { CustomerListPage } from './pages/customers/CustomerListPage';
import { CustomerFormPage } from './pages/customers/CustomerFormPage';
import { StorePage } from './pages/store/StorePage';
import { SuppliersPage } from './pages/suppliers/SuppliersPage';
import { SupplierListPage } from './pages/suppliers/SupplierListPage';
import { SupplierFormPage } from './pages/suppliers/SupplierFormPage';
import { ProductsPage } from './pages/store/products/ProductsListPage';
import { EmployeesPage } from './pages/employees/EmployeesPage';
import { EmployeeListPage } from './pages/employees/EmployeeListPage';
import { EmployeeFormPage } from './pages/employees/EmployeeFormPage';
import { ServicesPage } from './pages/services/ServicesPage';
import { ServiceListPage } from './pages/services/ServiceListPage';
import { ServiceFormPage } from './pages/services/ServiceFormPage';
import { ServiceQuotesPage } from './pages/quotes/services/ServiceQuotesPage';
import { ServiceQuoteListPage } from './pages/quotes/services/ServiceQuoteListPage';
import { ServiceQuoteFormPage } from './pages/quotes/services/ServiceQuoteFormPage';
import { PartsPage } from './pages/store/parts/PartsPage';
import { PartListPage } from './pages/store/parts/PartListPage';
import { PartFormPage } from './pages/store/parts/PartFormPage';
import { ServiceOrdersPage } from './pages/service-orders/ServiceOrdersPage';
import { ServiceOrderListPage } from './pages/service-orders/ServiceOrderListPage';
import { ServiceOrderFormMaster } from './pages/service-orders/ServiceOrderFormMaster';
import { WarrantyListPage } from './pages/service-orders/WarrantyListPage';
import { WarrantyFormPage } from './pages/service-orders/WarrantyFormPage';
import { ChecklistsPage } from './pages/checklists/ChecklistsPage';
import { CompanyDataPage } from './pages/settings/CompanyDataPage';
import { ProductSalesListPage } from './pages/sales/products/ProductSalesListPage';
import { ProductSaleFormPage } from './pages/sales/products/ProductSaleFormPage';
import { DeviceSaleFormPage, DeviceSalesListPage } from './pages/sales/devices';
import { initializeDefaultWarranties } from './config/defaultWarranties';

function App() {
  useEffect(() => {
    initializeDefaultWarranties();
  }, []);

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/customers" element={<CustomersPage />} />
                    <Route path="/customers/list" element={<CustomerListPage />} />
                    <Route path="/customers/new" element={<CustomerFormPage />} />
                    <Route path="/customers/edit/:id" element={<CustomerFormPage />} />
                    <Route path="/store" element={<StorePage />} />
                    <Route path="/store/products" element={<ProductsPage />} />
                    <Route path="/store/parts" element={<PartsPage />} />
                    <Route path="/store/parts/list" element={<PartListPage />} />
                    <Route path="/store/parts/new" element={<PartFormPage />} />
                    <Route path="/store/parts/edit/:id" element={<PartFormPage />} />
                    <Route path="/service-orders" element={<ServiceOrdersPage />} />
                    <Route path="/service-orders/list" element={<ServiceOrderListPage />} />
                    <Route path="/service-orders/new" element={<ServiceOrderFormMaster />} />
                    <Route path="/service-orders/edit/:id" element={<ServiceOrderFormMaster />} />
                    <Route path="/service-orders/checklist" element={<ChecklistsPage />} />
                    <Route path="/service-orders/warranties" element={<WarrantyListPage />} />
                    <Route path="/service-orders/warranties/new" element={<WarrantyFormPage />} />
                    <Route path="/service-orders/warranties/edit/:id" element={<WarrantyFormPage />} />
                    <Route path="/employees" element={<EmployeesPage />} />
                    <Route path="/employees/list" element={<EmployeeListPage />} />
                    <Route path="/employees/new" element={<EmployeeFormPage />} />
                    <Route path="/employees/edit/:id" element={<EmployeeFormPage />} />
                    <Route path="/services" element={<ServicesPage />} />
                    <Route path="/services/list" element={<ServiceListPage />} />
                    <Route path="/services/new" element={<ServiceFormPage />} />
                    <Route path="/services/edit/:id" element={<ServiceFormPage />} />
                    <Route path="/quotes/services" element={<ServiceQuotesPage />} />
                    <Route path="/quotes/services/list" element={<ServiceQuoteListPage />} />
                    <Route path="/quotes/services/new" element={<ServiceQuoteFormPage />} />
                    <Route path="/quotes/services/edit/:id" element={<ServiceQuoteFormPage />} />
                    <Route path="/suppliers" element={<SuppliersPage />} />
                    <Route path="/suppliers/list" element={<SupplierListPage />} />
                    <Route path="/suppliers/new" element={<SupplierFormPage />} />
                    <Route path="/suppliers/edit/:id" element={<SupplierFormPage />} />
                    <Route path="/settings/plan" element={<DashboardPage />} />
                    <Route path="/settings/users" element={<DashboardPage />} />
                    <Route path="/settings/company" element={<CompanyDataPage />} />
                    <Route path="/sales/devices/list" element={<DeviceSalesListPage />} />
                    <Route path="/sales/devices/new" element={<DeviceSaleFormPage />} />
                    <Route path="/sales/devices/edit/:id" element={<DeviceSaleFormPage />} />
                    <Route path="/sales/products/list" element={<ProductSalesListPage />} />
                    <Route path="/sales/products/new" element={<ProductSaleFormPage />} />
                    <Route path="/sales/products/edit/:id" element={<ProductSaleFormPage />} />
                  </Routes>
                </Layout>
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;