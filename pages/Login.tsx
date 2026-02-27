import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Lock, Mail, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const Login: React.FC = () => {
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Agora chamamos o login direto passando email e senha
      // O AuthContext vai falar com o Docker/API
      await login(email, password);
      
    } catch (err: any) {
      console.error(err);
      // Se a API retornar erro, mostramos aqui
      setError('Email ou senha inválidos.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-100 p-4 relative overflow-hidden">
      
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-16 bg-amber-800 z-0"></div>
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-stone-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 z-0"></div>

      <Card className="w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-500 z-10 relative">
        <CardHeader className="text-center pb-2 pt-8">
          <CardTitle className="text-2xl font-bold text-stone-900">Estúdio Cruzeta</CardTitle>
          <p className="text-stone-500 mt-2 text-sm">Gestão de Produção & Marcenaria</p>
        </CardHeader>
        <CardContent className="pt-6 pb-8 px-8">
          
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-xs font-medium rounded-md border border-red-100 flex items-center justify-center animate-shake">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider ml-1">Email</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-stone-400 group-focus-within:text-amber-600 transition-colors" />
                </div>
                <input
                  autoFocus
                  required
                  type="email"
                  className="block w-full pl-10 pr-3 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-amber-600 transition-all text-sm bg-stone-50 focus:bg-white"
                  placeholder="admin@estudiocruzeta.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider ml-1">Senha</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-stone-400 group-focus-within:text-amber-600 transition-colors" />
                </div>
                <input
                  required
                  type="password"
                  className="block w-full pl-10 pr-3 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-amber-600 transition-all text-sm bg-stone-50 focus:bg-white"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 text-base shadow-lg bg-amber-700 hover:bg-amber-800 shadow-amber-900/20 hover:shadow-amber-900/30 transition-all" 
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Entrando...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Entrar no Sistema <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
            
            <div className="pt-2 text-center">
              <p className="text-[10px] text-stone-400">
                Acesso restrito a colaboradores autorizados.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
      
      <div className="absolute bottom-4 text-center">
        <p className="text-[10px] text-stone-400 font-medium">© {new Date().getFullYear()} Estúdio Cruzeta. Todos direitos reservados.</p>
      </div>
    </div>
  );
};
