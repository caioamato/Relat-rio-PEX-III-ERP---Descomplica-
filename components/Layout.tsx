import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  CheckSquare, 
  LogOut, 
  Menu,
  UserCircle,
  X,
  Settings,
  ShoppingCart,
  BarChart3,
  Lock,
  Key,
  Hammer
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useERP } from '../contexts/ERPContext';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const { changeOwnPassword } = useERP();
  const location = useLocation();
  // On desktop default to true, on mobile this will act as the toggle state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Profile Modal State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle screen resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close sidebar on route change on mobile
  useEffect(() => {
    if (isMobile) setIsSidebarOpen(false);
  }, [location, isMobile]);

  if (!user) return <>{children}</>;

  const canApprove = ['GESTOR', 'ADM_MASTER'].includes(user.role);
  const canViewReports = ['GESTOR', 'ADM_MASTER'].includes(user.role);
  const isAdmin = user.role === 'ADM_MASTER';

  const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => (
    <Link to={to}>
      <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
        location.pathname === to 
          ? 'bg-amber-100 text-amber-900' 
          : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
      }`}>
        <Icon size={20} className="shrink-0" />
        {(!isMobile && !isSidebarOpen) ? null : <span className="font-medium whitespace-nowrap">{label}</span>}
      </div>
    </Link>
  );

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (passwordForm.newPassword.length < 6) {
      setPasswordError("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("A confirmação de senha não confere.");
      return;
    }

    setIsSubmitting(true);
    try {
      await changeOwnPassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordSuccess("Senha alterada com sucesso!");
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      
      // Auto close after 1.5s
      setTimeout(() => {
        setIsProfileModalOpen(false);
        setPasswordSuccess(null);
      }, 1500);

    } catch (err: any) {
      setPasswordError(err.message || "Erro ao alterar senha.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen bg-stone-50 overflow-hidden font-sans">
      {/* Mobile Overlay */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-stone-900/50 z-20 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed md:relative z-30 h-full bg-white border-r border-stone-200 
          transition-all duration-300 flex flex-col
          ${isMobile 
            ? (isSidebarOpen ? 'transtone-x-0 w-64' : '-transtone-x-full w-64') 
            : (isSidebarOpen ? 'w-64' : 'w-20')
          }
        `}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-stone-100 shrink-0">
          {(isSidebarOpen || isMobile) && (
           <div className="flex items-center gap-2 overflow-hidden">
           <div className="w-8 h-8 bg-amber-800 rounded-lg flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm">
             <Hammer size={18} />
           </div>
           <span className="font-bold text-xl text-stone-800 whitespace-nowrap">Estúdio Cruzeta</span>
           </div>
          )}
          
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-md hover:bg-stone-100 text-stone-500"
          >
            {isMobile ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <NavItem to="/" icon={LayoutDashboard} label="Visão Geral" />
          <NavItem to="/orders" icon={ShoppingCart} label="Produção" />
          <NavItem to="/inventory" icon={Package} label="Estoque" />
          {canApprove && (
            <NavItem to="/approvals" icon={CheckSquare} label="Aprovações" />
          )}
          {canViewReports && (
            <NavItem to="/reports" icon={BarChart3} label="Relatórios" />
          )}
          {isAdmin && (
             <NavItem to="/admin" icon={Settings} label="Administração" />
          )}
        </nav>

        <div className="p-4 border-t border-stone-100 shrink-0 space-y-3">
          <div className={`flex items-center ${(!isMobile && !isSidebarOpen) ? 'justify-center' : 'space-x-3'}`}>
             <div className="bg-stone-100 p-2 rounded-full shrink-0 relative group cursor-pointer" onClick={() => setIsProfileModalOpen(true)}>
               <UserCircle className="text-stone-500" size={24} />
               <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-stone-100 opacity-0 group-hover:opacity-100 transition-opacity">
                 <Settings size={12} className="text-amber-600" />
               </div>
             </div>
             {(isMobile || isSidebarOpen) && (
               <div className="flex-1 min-w-0">
                 <div className="flex items-center justify-between">
                   <p className="text-sm font-medium text-stone-900 truncate">{user.name}</p>
                   <button 
                     onClick={() => setIsProfileModalOpen(true)}
                     className="text-stone-400 hover:text-amber-600 transition-colors p-1"
                     title="Alterar Senha"
                   >
                     <Settings size={14} />
                   </button>
                 </div>
                 <p className="text-xs text-stone-500 truncate">{user.role}</p>
               </div>
             )}
          </div>
          <Button 
            variant="outline" 
            className={`w-full ${(!isMobile && !isSidebarOpen) && 'px-0 justify-center'} border-stone-200 text-stone-600 hover:bg-stone-50`}
            onClick={logout}
            title="Sair"
          >
            <LogOut size={16} className={(isMobile || isSidebarOpen) ? "mr-2" : ""} />
            {(isMobile || isSidebarOpen) && "Sair"}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden w-full relative">
        {/* Mobile Header Trigger */}
        <div className="md:hidden h-16 bg-white border-b border-stone-200 flex items-center px-4 shrink-0">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 rounded-md hover:bg-stone-100 text-stone-500 mr-3"
          >
            <Menu size={24} />
          </button>
          <span className="font-bold text-lg text-stone-800">Estúdio Cruzeta</span>
        </div>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="container mx-auto max-w-7xl">
            {children}
          </div>
        </div>
      </main>

      {/* Profile/Change Password Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md animate-in fade-in zoom-in-95 duration-200 shadow-2xl">
            <CardHeader className="relative flex flex-row items-center justify-between pb-2 border-b border-stone-100">
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 rounded-full">
                  <Key className="w-5 h-5 text-amber-700" />
                </div>
                Alterar Senha
              </CardTitle>
              <button 
                onClick={() => { setIsProfileModalOpen(false); setPasswordError(null); setPasswordSuccess(null); }} 
                className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 rounded-full p-1 hover:bg-stone-100 transition-colors"
              >
                <X size={20} />
              </button>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handlePasswordChange} className="space-y-4">
                {passwordError && (
                  <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-200 animate-in fade-in">
                    {passwordError}
                  </div>
                )}
                {passwordSuccess && (
                  <div className="p-3 bg-green-50 text-green-600 text-sm rounded-md border border-green-200 animate-in fade-in">
                    {passwordSuccess}
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Senha Atual</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -transtone-y-1/2 text-stone-400 w-4 h-4" />
                      <input 
                        required
                        type="password" 
                        className="w-full pl-10 pr-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-amber-600 focus:outline-none"
                        value={passwordForm.currentPassword}
                        onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Nova Senha</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -transtone-y-1/2 text-stone-400 w-4 h-4" />
                      <input 
                        required
                        type="password" 
                        placeholder="Mínimo 6 caracteres"
                        className="w-full pl-10 pr-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-amber-600 focus:outline-none"
                        value={passwordForm.newPassword}
                        onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Confirmar Nova Senha</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -transtone-y-1/2 text-stone-400 w-4 h-4" />
                      <input 
                        required
                        type="password" 
                        className="w-full pl-10 pr-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-amber-600 focus:outline-none"
                        value={passwordForm.confirmPassword}
                        onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => { setIsProfileModalOpen(false); setPasswordError(null); }}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-amber-700 hover:bg-amber-800 text-white"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
