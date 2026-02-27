import React, { useState, useEffect } from 'react';
import { useERP } from '../contexts/ERPContext';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ShoppingCart, FileText, Clock, AlertTriangle, Plus, Undo2, DollarSign, Info, Hammer } from 'lucide-react';

export const PurchaseOrder: React.FC = () => {
  const { inventory, createRequest, requests } = useERP();
  const { user } = useAuth();

  const isManagement = ['GESTOR', 'ADM_MASTER'].includes(user?.role || '');

  // State
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [customItemName, setCustomItemName] = useState<string>('');
  const [customCategory, setCustomCategory] = useState<string>('Geral');
  
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [observation, setObservation] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // Derived State: Selected Item Details
  const selectedItem = inventory.find(i => String(i.id) === String(selectedItemId));
  
  // Extract unique categories for the custom item dropdown
  const availableCategories = Array.from(new Set(inventory.map(i => i.category)));

  // Effect: Auto-populate Unit Price when an item is selected
  useEffect(() => {
    if (selectedItem) {
      setUnitPrice(selectedItem.price);
    } else if (isCustomMode) {
      setUnitPrice(0);
    }
  }, [selectedItem, isCustomMode]);

  // Validation Effect: Check for High Volume (Existing items only)
  useEffect(() => {
    if (!isCustomMode && selectedItem && quantity > 0) {
      const maxAverageProxy = selectedItem.min_qty * 3;
      const threshold = maxAverageProxy * 2;
      const projectedStock = selectedItem.current_qty + quantity;

      if (projectedStock > threshold) {
        setWarningMessage("Alto volume solicitado. Por favor, verifique se esta é uma reposição urgente.");
      } else {
        setWarningMessage(null);
      }
    } else {
      setWarningMessage(null);
    }
  }, [quantity, selectedItem, isCustomMode]);

  // Handle Item Selection (detect custom option)
  const handleItemSelect = (val: string) => {
    if (val === '__NEW__') {
      setIsCustomMode(true);
      setSelectedItemId('');
    } else {
      setSelectedItemId(val);
      setIsCustomMode(false);
    }
  };

  const handleCancelCustom = () => {
    setIsCustomMode(false);
    setCustomItemName('');
    setCustomCategory('Geral');
    setSelectedItemId('');
  };

  // Filter requests to show only current user's history
  const myRequests = requests.filter(r => r.requester_id === user?.id);

  // Sort by date desc
  const sortedRequests = [...myRequests].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    if (dateB !== dateA) {
      return dateB - dateA;
    }
    return parseInt(b.id, 10) - parseInt(a.id, 10);
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const isValid = (isCustomMode && customItemName) || (!isCustomMode && selectedItemId);
    const isPriceValid = !isManagement || unitPrice > 0;

    if (isValid && isPriceValid && quantity > 0) {
      if (isCustomMode) {
        createRequest(null, quantity, unitPrice, observation, { name: customItemName, category: customCategory });
      } else {
        createRequest(selectedItemId, quantity, unitPrice, observation);
      }
      
      setSuccessMessage("Solicitação de produção enviada com sucesso!");
      
      // Reset form
      setSelectedItemId('');
      setIsCustomMode(false);
      setCustomItemName('');
      setQuantity(1);
      setObservation('');
      
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'PENDENTE': return <Badge variant="warning">Pendente</Badge>;
      case 'APROVADO': return <Badge variant="success">Aprovado</Badge>;
      case 'REJEITADO': return <Badge variant="danger">Rejeitado</Badge>;
      case 'COMPRADO': return <Badge variant="default">Comprado</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getItemName = (req: any) => {
    if (req.custom_item_name) return `${req.custom_item_name} (Novo)`;
    return inventory.find(i => String(i.id) === String(req.item_id))?.name || 'Item removido';
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-stone-900">Solicitações de Produção</h1>
          <p className="text-stone-500">Crie novas ordens de fabricação e acompanhe seus pedidos de material</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Production Order Form */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader className="bg-stone-50 border-b border-stone-100">
              <CardTitle className="flex items-center gap-2">
                <Hammer className="w-5 h-5 text-amber-600" />
                Nova Solicitação
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {successMessage && (
                  <div className="p-3 bg-green-50 text-green-700 text-sm rounded-md border border-green-200 animate-in fade-in slide-in-from-top-2">
                    {successMessage}
                  </div>
                )}
                
                {warningMessage && (
                  <div className="p-3 bg-yellow-50 text-yellow-800 text-sm rounded-md border border-yellow-200 flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{warningMessage}</span>
                  </div>
                )}
                
                {!isCustomMode ? (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-stone-700">Selecione o Item</label>
                      {selectedItem && (
                        <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                          Estoque Atual: {selectedItem.current_qty} {selectedItem.unit}
                        </span>
                      )}
                    </div>
                    <select 
                      required={!isCustomMode}
                      className="w-full p-2.5 bg-white border border-stone-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:outline-none text-sm"
                      value={selectedItemId}
                      onChange={(e) => handleItemSelect(e.target.value)}
                    >
                      <option value="">Selecione...</option>
                      {inventory.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                      <option disabled>--------------------</option>
                      <option value="__NEW__" className="font-medium text-amber-600">
                        + Solicitar novo item não cadastrado
                      </option>
                    </select>
                  </div>
                ) : (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 bg-amber-50/50 p-3 rounded-md border border-amber-100">
                    <div className="flex justify-between items-center">
                       <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">Novo Item</span>
                       <button 
                         type="button" 
                         onClick={handleCancelCustom}
                         className="text-xs flex items-center text-stone-500 hover:text-stone-800"
                       >
                         <Undo2 className="w-3 h-3 mr-1" /> Voltar
                       </button>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">Nome do Novo Item</label>
                      <input 
                        required={isCustomMode}
                        type="text" 
                        placeholder="Ex: Cadeira Gamer"
                        className="w-full p-2.5 border border-stone-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:outline-none text-sm bg-white"
                        value={customItemName}
                        onChange={(e) => setCustomItemName(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">Categoria</label>
                      <input 
                        required={isCustomMode}
                        type="text" 
                        list="category-suggestions"
                        placeholder="Selecione ou digite..."
                        className="w-full p-2.5 border border-stone-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:outline-none text-sm bg-white"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                      />
                      <datalist id="category-suggestions">
                        {availableCategories.map(cat => (
                          <option key={cat} value={cat} />
                        ))}
                      </datalist>
                    </div>
                  </div>
                )}

                <div className={`grid ${isManagement ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">
                        Quantidade {selectedItem ? `(${selectedItem.unit})` : ''}
                      </label>
                      <input 
                        required
                        type="number" 
                        min="1"
                        className="w-full p-2.5 border border-stone-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:outline-none text-sm"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                      />
                    </div>
                    {isManagement && (
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Preço Unit. (R$)</label>
                        <input 
                          required
                          type="number" 
                          min="0"
                          step="0.01"
                          className="w-full p-2.5 border border-stone-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:outline-none text-sm"
                          value={unitPrice}
                          onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    )}
                </div>

                {isManagement && (
                  <div className="p-3 bg-stone-50 rounded-md flex justify-between items-center transition-all duration-300">
                      <span className="text-sm font-medium text-stone-600">Valor Total Estimado:</span>
                      <span className="text-lg font-bold text-stone-900">
                          {formatCurrency(quantity * unitPrice)}
                      </span>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Observação / Motivo</label>
                  <textarea 
                    className="w-full p-2.5 border border-stone-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:outline-none text-sm min-h-[100px]"
                    placeholder="Ex: Necessário para o projeto da Mesa de Jantar X..."
                    value={observation}
                    onChange={(e) => setObservation(e.target.value)}
                  />
                </div>

                <Button 
                  type="submit" 
                  variant="primary" 
                  className="w-full"
                  disabled={isManagement && unitPrice <= 0}
                  title={isManagement && unitPrice <= 0 ? "O preço unitário deve ser maior que zero." : ""}
                >
                  Enviar Solicitação
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-stone-500" />
                Histórico de Pedidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-stone-50 text-stone-500 font-medium">
                    <tr>
                      <th className="px-4 py-3 rounded-l-md">Item</th>
                      <th className="px-4 py-3 text-center">Qtd.</th>
                      {isManagement && <th className="px-4 py-3 text-right">Unitário</th>}
                      {isManagement && <th className="px-4 py-3 text-right">Total</th>}
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 rounded-r-md">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {sortedRequests.map(req => (
                      <tr key={req.id} className="hover:bg-stone-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-stone-900">{getItemName(req)}</div>
                          {req.observation && (
                            <div className="flex items-start gap-1 mt-1 text-xs text-stone-500 max-w-[200px] truncate">
                              <FileText className="w-3 h-3 shrink-0 mt-0.5" />
                              <span title={req.observation}>{req.observation}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center font-medium">{req.quantity}</td>
                        {isManagement && (
                          <td className="px-4 py-3 text-right text-stone-600">
                              {formatCurrency(req.unit_price || 0)}
                          </td>
                        )}
                        {isManagement && (
                          <td className="px-4 py-3 text-right font-medium text-stone-900">
                              {formatCurrency((req.unit_price || 0) * req.quantity)}
                          </td>
                        )}
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {getStatusBadge(req.status)}
                            {req.status === 'REJEITADO' && req.rejectionReason && (
                              <div className="group relative">
                                <Info className="w-4 h-4 text-stone-400 hover:text-red-500 cursor-help" />
                                <div className="absolute bottom-full mb-2 left-1/2 -transtone-x-1/2 w-48 p-2 bg-stone-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                  {req.rejectionReason}
                                  <div className="absolute top-full left-1/2 -transtone-x-1/2 border-4 border-transparent border-t-stone-800"></div>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-stone-500 whitespace-nowrap">
                          {new Date(req.date).toLocaleDateString('pt-BR')}
                        </td>
                      </tr>
                    ))}
                    {sortedRequests.length === 0 && (
                      <tr>
                        <td colSpan={isManagement ? 6 : 4} className="px-4 py-8 text-center text-stone-500">
                          Você ainda não realizou nenhum pedido.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
};