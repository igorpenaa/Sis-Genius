import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  UserPlus,
  Edit2,
  Trash2,
  User
} from 'lucide-react';
import { collection, getDocs, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Employee } from '../../types/employee';
import { DeleteConfirmationModal } from '../../components/DeleteConfirmationModal';

import { UserX } from 'lucide-react';

interface DeleteModalState {
  isOpen: boolean;
  employeeId: string | null;
  employeeName: string;
}

export function EmployeeListPage() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
    isOpen: false,
    employeeId: null,
    employeeName: ''
  });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [hasEmployees, setHasEmployees] = useState<boolean | null>(null);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const employeesRef = collection(db, 'employees');
      const q = query(employeesRef, orderBy('name'));
      const snapshot = await getDocs(q);
      
      const employeesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        birthDate: doc.data().birthDate?.toDate()
      })) as Employee[];

      setEmployees(employeesData);
      setHasEmployees(employeesData.length > 0);
    } catch (error) {
      console.error('Error loading employees:', error);
      setHasEmployees(false);
    } finally {
      setLoading(false);
    }
  };

  const handleNewEmployee = () => {
    navigate('/employees/new');
  };

  const handleEdit = (employeeId: string) => {
    navigate(`/employees/edit/${employeeId}`);
  };

  const handleDelete = (employee: Employee) => {
    setDeleteModal({
      isOpen: true,
      employeeId: employee.id,
      employeeName: employee.name
    });
  };

  const confirmDelete = async () => {
    if (!deleteModal.employeeId) return;
    
    setDeleteLoading(true);
    try {
      await deleteDoc(doc(db, 'employees', deleteModal.employeeId));
      await loadEmployees();
      setDeleteModal({ isOpen: false, employeeId: null, employeeName: '' });
    } catch (error) {
      console.error('Error deleting employee:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.cpf?.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Lista de Funcionários</h1>
              <p className="text-gray-600 mt-1">Visualize e gerencie todos os seus funcionários</p>
            </div>
            <button
              onClick={handleNewEmployee}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Novo Funcionário
            </button>
          </div>

          {/* Search Bar */}
          <div className="mt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por nome, email ou CPF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Employee List */}
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : !hasEmployees ? (
        <div className="flex flex-col items-center justify-center p-8 min-h-[400px]">
          <UserX className="w-[200px] h-[200px] text-gray-200 mb-8" />
          <div className="text-center max-w-md">
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              Nenhum funcionário cadastrado
            </h3>
            <p className="text-gray-500 mb-8">
              Você ainda não possui funcionários em sua equipe. Clique no botão abaixo para começar a cadastrar.
            </p>
            <button
              onClick={() => navigate('/employees/new')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center mx-auto"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Cadastrar Funcionário
            </button>
          </div>
        </div>
      ) : (
        <div className="p-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Funcionário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    WhatsApp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Função
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Comissões
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEmployees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {employee.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {employee.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{employee.phones.whatsapp}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {employee.role === 'vendedor' && 'Vendedor'}
                          {employee.role === 'tecnico' && 'Técnico'}
                          {employee.role === 'supervisor' && 'Supervisor'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div>Vendas: {employee.salesCommissionPercentage}%</div>
                          <div>Serviços: {employee.servicesCommissionPercentage}%</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          employee.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {employee.status === 'active' ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(employee.id)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(employee)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      )}

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, employeeId: null, employeeName: '' })}
        onConfirm={confirmDelete}
        title={deleteModal.employeeName}
        loading={deleteLoading}
      />
    </div>
  );
}