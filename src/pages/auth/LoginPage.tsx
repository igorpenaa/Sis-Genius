import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { X, MessageCircle } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (error) {
      setError('Falha no login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  }

  const handleWhatsApp = () => {
    window.open(
      'https://wa.me/5571991683937?text=Olá tudo bom, gostaria de desenvolver um sistema.',
      '_blank'
    );
  };

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-blue-600 to-orange-500">
      {/* Background Circles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-orange-400/20 rounded-full blur-3xl" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Logo */}
        <div className="flex justify-center pt-8 px-4">
          <img 
            src="https://cursodecelular.net/wp-content/uploads/2025/02/LOGO-REDE-GENIUS-DEITADO.png"
            alt="Genius Logo"
            className="h-12"
          />
        </div>

        {/* Login Card */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-sm w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">Inscrever-se</h2>
                <button className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    USUÁRIO
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Digite seu e-mail"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    SENHA
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Digite sua senha"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50"
                >
                  {loading ? 'Entrando...' : 'ENTRAR'}
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">
                      Não tem uma conta?
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all"
                >
                  CADASTRAR
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="py-6 px-4 text-center text-white/90">
          <div className="max-w-7xl mx-auto">
            <p className="mb-2">Sistema Rede Genius - Todos os direitos reservados</p>
            <div className="flex items-center justify-center space-x-2 text-sm">
              <p>Desenvolvido por Igor P.</p>
              <button
                onClick={handleWhatsApp}
                className="inline-flex items-center px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                <span>Desenvolver sistemas</span>
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}