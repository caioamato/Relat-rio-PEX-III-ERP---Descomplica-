import React, { useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useERP } from '../contexts/ERPContext';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Lock, FileText, Package, ShoppingCart, Activity, Filter, Calendar, User as UserIcon, ListFilter, Download, FileDown } from 'lucide-react';
import { InventoryItem, ItemStatus } from '../types';
// @ts-ignore
import jsPDF from 'https://esm.sh/jspdf@2.5.1';
// @ts-ignore
import autoTable from 'https://esm.sh/jspdf-autotable@3.8.2';

export const Reports: React.FC = () => {
  const { inventory, requests, logs, users, addLog } = useERP();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'stock' | 'orders' | 'logs'>('stock');

  // ... (rest of states and helpers same as before)
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterUser, setFilterUser] = useState('all');

  if (!user) return null;
  const hasAccess = ['ADM_MASTER', 'GESTOR'].includes(user.role);

  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const getItemDisplayStatus = (item: InventoryItem): ItemStatus => {
    if (item.status === 'Normal') return 'Normal';
    const hasPendingReplenishment = requests.some(
      r => r.item_id === item.id && r.status === 'APROVADO'
    );
    return hasPendingReplenishment ? 'Em Reposição' : 'Crítico';
  };

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'Crítico': return 'danger';
      case 'Em Reposição': return 'warning';
      case 'Normal': return 'success';
      case 'APROVADO': return 'success';
      case 'REJEITADO': return 'danger';
      case 'PENDENTE': return 'warning';
      case 'COMPRADO': return 'default';
      default: return 'outline';
    }
  };

  const categories = useMemo(() => {
    const cats = new Set(inventory.map(i => i.category));
    requests.forEach(r => { if(r.custom_category) cats.add(r.custom_category); });
    return Array.from(cats);
  }, [inventory, requests]);

  const filteredStock = useMemo(() => {
    return inventory.filter(item => {
      const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
      const status = getItemDisplayStatus(item);
      const matchesStatus = filterStatus === 'all' || status === filterStatus;
      return matchesCategory && matchesStatus;
    });
  }, [inventory, filterCategory, filterStatus, requests]);

  const filteredOrders = useMemo(() => {
    return requests.filter(req => {
      const reqDate = req.date;
      const matchesDate = (!startDate || reqDate >= startDate) && (!endDate || reqDate <= endDate);
      const matchesUser = filterUser === 'all' || String(req.requester_id) === filterUser;
      const item = inventory.find(i => i.id === req.item_id);
      const category = item ? item.category : req.custom_category || 'Outros';
      const matchesCategory = filterCategory === 'all' || category === filterCategory;
      return matchesDate && matchesUser && matchesCategory;
    });
  }, [requests, inventory, startDate, endDate, filterUser, filterCategory]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const logDate = log.timestamp.split('T')[0];
      const matchesDate = (!startDate || logDate >= startDate) && (!endDate || logDate <= endDate);
      const matchesUser = filterUser === 'all' || String(log.user_id) === filterUser;
      return matchesDate && matchesUser;
    });
  }, [logs, startDate, endDate, filterUser]);

  // --- PDF Export Logic ---
  const handleExportPDF = () => {
    const doc = new jsPDF();
    const dateStr = new Date().toLocaleDateString('pt-BR');
    const reportNames = {
      'stock': 'Relatório de Estoque Atual',
      'orders': 'Relatório de Pedidos de Produção',
      'logs': 'Relatório de Log de Atividades'
    };

    // Header do Estúdio Cruzeta
    doc.setFillColor(120, 53, 15); // Cor Amber-900 (Marrom Madeira)
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('ESTÚDIO CRUZETA', 15, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('SISTEMA DE GESTÃO DE PRODUÇÃO E MARCENARIA', 15, 28);
    doc.text(`Emitido em: ${dateStr}`, 160, 28);

    // Title
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(16);
    doc.text(reportNames[activeTab], 15, 55);

    if (activeTab === 'stock') {
      const tableData = filteredStock.map(item => [
        item.sku,
        item.name,
        item.category,
        item.current_qty,
        item.unit,
        formatCurrency(item.price),
        formatCurrency(item.price * item.current_qty),
        getItemDisplayStatus(item)
      ]);

      autoTable(doc, {
        startY: 65,
        head: [['SKU', 'Item', 'Categoria', 'Qtd', 'Unid', 'Preço Unit', 'Total', 'Status']],
        body: tableData,
        headStyles: { fillColor: [120, 53, 15] },
        alternateRowStyles: { fillColor: [250, 245, 235] },
        theme: 'striped'
      });

    } else if (activeTab === 'orders') {
      const tableData = filteredOrders.map(req => {
        const item = inventory.find(i => String(i.id) === String(req.item_id));
        const itemName = item ? item.name : req.custom_item_name || 'Item Desconhecido';
        return [
          req.date,
          req.requester_name,
          itemName,
          req.quantity,
          formatCurrency((req.unit_price || 0) * req.quantity),
          req.status
        ];
      });

      autoTable(doc, {
        startY: 65,
        head: [['Data', 'Solicitante', 'Item', 'Qtd', 'Total', 'Status']],
        body: tableData,
        headStyles: { fillColor: [120, 53, 15] },
        theme: 'striped'
      });

    } else if (activeTab === 'logs') {
      const tableData = filteredLogs.map(log => [
        new Date(log.timestamp).toLocaleString('pt-BR'),
        log.user_name,
        log.action,
        log.description
      ]);

      autoTable(doc, {
        startY: 65,
        head: [['Data/Hora', 'Usuário', 'Ação', 'Descrição']],
        body: tableData,
        headStyles: { fillColor: [120, 53, 15] },
        theme: 'striped'
      });
    }

    const fileName = `Estudio_Cruzeta_${activeTab}_${new Date().getTime()}.pdf`;
    doc.save(fileName);
    addLog('Exportação PDF', `${user.name} baixou o relatório: ${reportNames[activeTab]}`);
  };

  const handleExportCSV = () => {
    const dateStr = new Date().toISOString().split('T')[0];
    const BOM = "\uFEFF";
    let csvContent = BOM;
    let fileName = '';
    
    const safeStr = (val: any) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(';') || str.includes('\n')) return `"${str.replace(/"/g, '""')}"`;
      return str;
    };

    if (activeTab === 'stock') {
      fileName = `Relatorio_Estoque_${dateStr}.csv`;
      const headers = ['SKU', 'Item', 'Categoria', 'Qtd Atual', 'Unidade', 'Preço Unit', 'Valor Total', 'Status'];
      csvContent += headers.join(';') + '\n';
      csvContent += filteredStock.map(item => [item.sku, item.name, item.category, item.current_qty, item.unit, item.price.toFixed(2), (item.price * item.current_qty).toFixed(2), getItemDisplayStatus(item)].map(safeStr).join(';')).join('\n');
    } else if (activeTab === 'orders') {
      fileName = `Relatorio_Pedidos_${dateStr}.csv`;
      const headers = ['Data', 'Solicitante', 'Item', 'Qtd', 'Preço Unit', 'Total', 'Status'];
      csvContent += headers.join(';') + '\n';
      csvContent += filteredOrders.map(req => {
        const item = inventory.find(i => String(i.id) === String(req.item_id));
        return [req.date, req.requester_name, item ? item.name : req.custom_item_name, req.quantity, req.unit_price, (req.unit_price * req.quantity).toFixed(2), req.status].map(safeStr).join(';');
      }).join('\n');
    } else if (activeTab === 'logs') {
      fileName = `Relatorio_Logs_${dateStr}.csv`;
      const headers = ['Data Hora', 'Usuario', 'Acao', 'Descricao'];
      csvContent += headers.join(';') + '\n';
      csvContent += filteredLogs.map(log => [new Date(log.timestamp).toLocaleString('pt-BR'), log.user_name, log.action, log.description].map(safeStr).join(';')).join('\n');
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    addLog('Exportação CSV', `${user.name} baixou o relatório: ${activeTab}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-stone-900">Relatórios Gerenciais</h1>
          <p className="text-stone-500">Visualização consolidada do Estúdio Cruzeta</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV} title="Baixar planilha Excel/CSV">
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
          <Button variant="primary" onClick={handleExportPDF} title="Baixar relatório formatado para impressão">
            <FileDown className="w-4 h-4 mr-2" />
            Gerar PDF
          </Button>
        </div>
      </div>

      {/* --- Global Filter Bar --- */}
      <div className="bg-white p-4 rounded-lg border border-stone-200 shadow-sm flex flex-col md:flex-row gap-4 items-end md:items-center justify-between animate-in fade-in slide-in-from-top-2">
         <div className="flex items-center gap-2 text-stone-700 font-semibold text-sm">
            <Filter className="w-4 h-4 text-amber-600" />
            Filtros do Relatório
         </div>

         <div className="flex flex-wrap gap-3 items-center flex-1 justify-end">
            
            {/* Condition: Stock Tab -> Category & Status */}
            {activeTab === 'stock' && (
              <>
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-stone-500">Categoria</label>
                    <select 
                      className="form-select text-sm border-stone-300 rounded-md focus:ring-amber-500 focus:border-amber-500 py-1.5"
                      value={filterCategory}
                      onChange={e => setFilterCategory(e.target.value)}
                    >
                      <option value="all">Todas as Categorias</option>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-stone-500">Status</label>
                    <select 
                      className="form-select text-sm border-stone-300 rounded-md focus:ring-amber-500 focus:border-amber-500 py-1.5"
                      value={filterStatus}
                      onChange={e => setFilterStatus(e.target.value)}
                    >
                      <option value="all">Todos os Status</option>
                      <option value="Normal">Normal</option>
                      <option value="Crítico">Crítico</option>
                      <option value="Em Reposição">Em Reposição</option>
                    </select>
                </div>
              </>
            )}

            {/* Condition: Orders OR Logs -> Date, User, Category */}
            {(activeTab === 'orders' || activeTab === 'logs') && (
              <>
                 <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-stone-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Período
                    </label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="date" 
                        className="text-sm border-stone-300 rounded-md focus:ring-amber-500 focus:border-amber-500 py-1.5"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                      />
                      <span className="text-stone-400">-</span>
                      <input 
                        type="date" 
                        className="text-sm border-stone-300 rounded-md focus:ring-amber-500 focus:border-amber-500 py-1.5"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                      />
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-stone-500 flex items-center gap-1">
                      <UserIcon className="w-3 h-3" /> Usuário
                    </label>
                    <select 
                      className="form-select text-sm border-stone-300 rounded-md focus:ring-amber-500 focus:border-amber-500 py-1.5 min-w-[150px]"
                      value={filterUser}
                      onChange={e => setFilterUser(e.target.value)}
                    >
                      <option value="all">Todos os Usuários</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-stone-500 flex items-center gap-1">
                      <ListFilter className="w-3 h-3" /> Categoria
                    </label>
                    <select 
                      className={`form-select text-sm border-stone-300 rounded-md focus:ring-amber-500 focus:border-amber-500 py-1.5 ${activeTab === 'logs' ? 'opacity-50 cursor-not-allowed bg-stone-100' : ''}`}
                      value={filterCategory}
                      onChange={e => setFilterCategory(e.target.value)}
                      disabled={activeTab === 'logs'}
                      title={activeTab === 'logs' ? "Filtro de categoria não aplicável para logs" : ""}
                    >
                      <option value="all">Todas as Categorias</option>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
              </>
            )}
         </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-stone-200 pb-1">
        <button
          onClick={() => { setActiveTab('stock'); setFilterCategory('all'); setFilterStatus('all'); }}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${
            activeTab === 'stock' 
              ? 'bg-white border-x border-t border-stone-200 text-amber-600 -mb-[1px]' 
              : 'text-stone-500 hover:text-stone-700 hover:bg-stone-50'
          }`}
        >
          <Package className="w-4 h-4" />
          Estoque Atual
        </button>
        <button
          onClick={() => { setActiveTab('orders'); setFilterCategory('all'); setFilterUser('all'); setStartDate(''); setEndDate(''); }}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${
            activeTab === 'orders' 
              ? 'bg-white border-x border-t border-stone-200 text-amber-600 -mb-[1px]' 
              : 'text-stone-500 hover:text-stone-700 hover:bg-stone-50'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          Histórico de Pedidos
        </button>
        <button
          onClick={() => { setActiveTab('logs'); setFilterCategory('all'); setFilterUser('all'); setStartDate(''); setEndDate(''); }}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${
            activeTab === 'logs' 
              ? 'bg-white border-x border-t border-stone-200 text-amber-600 -mb-[1px]' 
              : 'text-stone-500 hover:text-stone-700 hover:bg-stone-50'
          }`}
        >
          <Activity className="w-4 h-4" />
          Log de Movimentações
        </button>
      </div>

      {/* Tab Content */}
      <Card className="min-h-[400px]">
        <CardContent className="p-0">
          
          {/* TAB: STOCK */}
          {activeTab === 'stock' && (
            <div className="overflow-x-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
              <table className="w-full text-sm text-left">
                <thead className="bg-stone-50 text-stone-500 font-medium">
                  <tr>
                    <th className="px-6 py-4">SKU</th>
                    <th className="px-6 py-4">Item</th>
                    <th className="px-6 py-4">Categoria</th>
                    <th className="px-6 py-4 text-right">Qtd. Atual</th>
                    <th className="px-6 py-4 text-center">Unid.</th>
                    <th className="px-6 py-4 text-right">Preço Unit.</th>
                    <th className="px-6 py-4 text-right">Valor Total</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredStock.map(item => {
                    const status = getItemDisplayStatus(item);
                    return (
                      <tr key={item.id} className="hover:bg-stone-50">
                        <td className="px-6 py-4 font-medium text-stone-600">{item.sku}</td>
                        <td className="px-6 py-4 font-medium text-stone-900">{item.name}</td>
                        <td className="px-6 py-4 text-stone-500">{item.category}</td>
                        <td className="px-6 py-4 text-right font-bold">{item.current_qty}</td>
                        <td className="px-6 py-4 text-center text-stone-400 text-xs">{item.unit}</td>
                        <td className="px-6 py-4 text-right text-stone-600">{formatCurrency(item.price)}</td>
                        <td className="px-6 py-4 text-right font-medium text-stone-900">
                           {formatCurrency(item.price * item.current_qty)}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={getBadgeVariant(status)}>{status}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredStock.length === 0 && (
                     <tr><td colSpan={8} className="text-center py-8 text-stone-500">Nenhum item encontrado com os filtros selecionados.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB: ORDERS */}
          {activeTab === 'orders' && (
            <div className="overflow-x-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
               <table className="w-full text-sm text-left">
                <thead className="bg-stone-50 text-stone-500 font-medium">
                  <tr>
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Data</th>
                    <th className="px-6 py-4">Solicitante</th>
                    <th className="px-6 py-4">Item</th>
                    <th className="px-6 py-4 text-center">Qtd.</th>
                    <th className="px-6 py-4 text-right">Valor Total</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredOrders.map(req => {
                     const item = inventory.find(i => i.id === req.item_id);
                     const itemName = item ? item.name : req.custom_item_name || 'Item Desconhecido';
                     return (
                      <tr key={req.id} className="hover:bg-stone-50">
                        <td className="px-6 py-4 text-stone-500 font-mono text-xs">#{req.id}</td>
                        <td className="px-6 py-4 text-stone-600">{new Date(req.date).toLocaleDateString('pt-BR')}</td>
                        <td className="px-6 py-4 text-stone-900 font-medium">{req.requester_name}</td>
                        <td className="px-6 py-4 text-stone-600">{itemName}</td>
                        <td className="px-6 py-4 text-center">{req.quantity}</td>
                        <td className="px-6 py-4 text-right text-stone-600">
                          {formatCurrency((req.unit_price || 0) * req.quantity)}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={getBadgeVariant(req.status)}>{req.status}</Badge>
                        </td>
                      </tr>
                     );
                  })}
                  {filteredOrders.length === 0 && (
                     <tr><td colSpan={7} className="text-center py-8 text-stone-500">Nenhum pedido encontrado no período selecionado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB: LOGS */}
          {activeTab === 'logs' && (
            <div className="overflow-x-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
               <table className="w-full text-sm text-left">
                <thead className="bg-stone-50 text-stone-500 font-medium">
                  <tr>
                    <th className="px-6 py-4">Data/Hora</th>
                    <th className="px-6 py-4">Usuário</th>
                    <th className="px-6 py-4">Ação</th>
                    <th className="px-6 py-4">Descrição</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-stone-50">
                      <td className="px-6 py-4 text-stone-500 text-xs whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 font-medium text-stone-900">{log.user_name}</td>
                      <td className="px-6 py-4 text-stone-600">
                         <span className="inline-flex items-center px-2 py-1 rounded bg-stone-100 text-xs font-medium">
                           {log.action}
                         </span>
                      </td>
                      <td className="px-6 py-4 text-stone-600 max-w-lg truncate" title={log.description}>
                        {log.description}
                      </td>
                    </tr>
                  ))}
                  {filteredLogs.length === 0 && (
                     <tr><td colSpan={4} className="text-center py-8 text-stone-500">Nenhum registro de atividade encontrado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
};
