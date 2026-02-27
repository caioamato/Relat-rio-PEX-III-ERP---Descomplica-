import React, { useState, useMemo } from 'react';
import { useERP } from '../contexts/ERPContext';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { AlertTriangle, Clock, DollarSign, TrendingUp, Filter, ArrowUpRight, ArrowDownRight, Minus, Hammer } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const Dashboard: React.FC = () => {
  const { inventory, requests } = useERP();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');

  const isManagement = ['GESTOR', 'ADM_MASTER'].includes(user?.role || '');

  // 1. Extract Unique Categories for Filter
  const categories = useMemo(() => {
    const cats = Array.from(new Set(inventory.map(i => i.category)));
    return ['Todas', ...cats];
  }, [inventory]);

  // 2. Filter Data based on Selection
  const filteredInventory = useMemo(() => {
    if (selectedCategory === 'Todas') return inventory;
    return inventory.filter(i => i.category === selectedCategory);
  }, [inventory, selectedCategory]);

  const filteredRequests = useMemo(() => {
    if (selectedCategory === 'Todas') return requests;
    return requests.filter(req => {
      const item = inventory.find(i => i.id === req.item_id);
      if (item) return item.category === selectedCategory;
      return req.custom_category === selectedCategory;
    });
  }, [requests, inventory, selectedCategory]);

  // 3. Recalculate Metrics Locally
  const metrics = useMemo(() => {
    const criticalItemsCount = filteredInventory.filter(i => i.status === 'Crítico').length;
    const pendingRequestsCount = filteredRequests.filter(r => r.status === 'PENDENTE').length;
    
    // Valor em Produção: Pedidos APROVADOS (aguardando chegada/finalização)
    const productionValue = filteredRequests
      .filter(r => r.status === 'APROVADO')
      .reduce((acc, r) => acc + (Number(r.unit_price) * r.quantity), 0);

    const totalStockValue = filteredInventory.reduce((acc, item) => acc + (item.price * item.current_qty), 0);
    
    const totalMinQty = filteredInventory.reduce((acc, item) => acc + item.min_qty, 0);
    const avgMinQty = filteredInventory.length > 0 ? Math.ceil(totalMinQty / filteredInventory.length) : 0;

    return {
      criticalItemsCount,
      pendingRequestsCount,
      productionValue,
      totalStockValue,
      avgMinQty
    };
  }, [filteredInventory, filteredRequests]);

  // 4. Prepare Chart Data
  const chartData = filteredInventory.map(item => ({
    name: item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name,
    qty: item.current_qty,
    min: item.min_qty,
    status: item.status
  }));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-stone-900">Painel de Produção</h1>
          <p className="text-stone-500">Acompanhe os indicadores da marcenaria</p>
        </div>

        <div className="flex items-center gap-2 bg-white p-1.5 rounded-md border border-stone-200 shadow-sm">
          <Filter className="w-4 h-4 text-stone-400 ml-2" />
          <select 
            className="bg-transparent border-none text-sm font-medium text-stone-700 focus:ring-0 cursor-pointer pr-8"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className={`grid gap-4 ${isManagement ? 'md:grid-cols-4' : 'md:grid-cols-2'}`}>
        {/* Critical Items Card */}
        <Card className="border-l-4 border-l-red-500 transition-all hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-stone-500 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Itens Críticos
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-stone-900">{metrics.criticalItemsCount}</div>
            <p className="text-xs text-stone-500 mt-1">Abaixo do estoque mínimo</p>
          </CardContent>
        </Card>

        {/* Pending Requests Card */}
        <Card className="border-l-4 border-l-amber-500 transition-all hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-stone-500 flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              Pedidos Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-stone-900">{metrics.pendingRequestsCount}</div>
            <p className="text-xs text-stone-500 mt-1">Aguardando aprovação</p>
          </CardContent>
        </Card>

        {/* FINANCIAL METRICS - Restricted to Management */}
        {isManagement && (
          <>
            <Card className="border-l-4 border-l-orange-500 transition-all hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-stone-500 flex items-center gap-2">
                  <Hammer className="h-4 w-4 text-orange-500" />
                  Valor em Produção
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-stone-900">{formatCurrency(metrics.productionValue)}</div>
                <p className="text-xs text-stone-500 mt-1">Pedidos aprovados/em curso</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-600 transition-all hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-stone-500 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  Valor em Estoque
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-stone-900">{formatCurrency(metrics.totalStockValue)}</div>
                <p className="text-xs text-stone-500 mt-1">Patrimônio investido</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Chart */}
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-amber-600" />
                Níveis de Estoque por Item
              </CardTitle>
              <div className="flex items-center gap-2 text-xs text-stone-500">
                <span className="block w-4 h-0.5 border-t border-dashed border-red-500"></span>
                <span>Média de Estoque Mínimo ({metrics.avgMinQty})</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={60} 
                    interval={0} 
                    fontSize={12}
                    tick={{ fill: '#78716c' }}
                  />
                  <YAxis tick={{ fill: '#78716c' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e7e5e4', borderRadius: '8px' }}
                    itemStyle={{ color: '#78350f' }}
                  />
                  <Bar dataKey="qty" name="Quantidade" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.qty <= entry.min ? '#ef4444' : '#d97706'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
