import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Plus, FileText, AlertCircle, ArrowLeft, Calendar } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { apiCall } from '../lib/supabase';
import { formatDateBR } from '../lib/date-utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import AppHeader from '../components/AppHeader';

export default function Contracts() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      const data = await apiCall('/contracts');
      setContracts(data.contracts);
    } catch (error) {
      console.error('Error loading contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="space-y-6 max-w-full">
      <AppHeader />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Contratos</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">Gerencie os contratos e parcelas</p>
        </div>
        <Link to="/contracts/new">
          <Button className="gap-2 text-sm bg-emerald-700 hover:bg-emerald-800">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Novo Contrato</span>
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="text-sm text-gray-600">{contracts.length} contrato(s)</div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Carregando contratos...</p>
            </div>
          ) : contracts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Nenhum contrato encontrado</p>
              <Link to="/contracts/new">
                <Button className="mt-4 gap-2">
                  <Plus className="h-4 w-4" />
                  Criar Primeiro Contrato
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Mobile view - Cards */}
              <div className="block md:hidden space-y-4">
                {contracts.map((contract) => (
                  <Link key={contract.id} to={`/contracts/${contract.id}`}>
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-blue-600 truncate">
                                {contract.client?.fullName || 'Cliente não encontrado'}
                              </h3>
                              <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                                <FileText className="h-3 w-3" />
                                <span className="font-medium">{formatCurrency(contract.totalAmount)}</span>
                              </div>
                            </div>
                            <Badge variant={contract.status === 'active' ? 'default' : 'secondary'}>
                              {contract.status === 'active' ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </div>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <FileText className="h-3 w-3" />
                              <span>
                                {contract.installments}x de {formatCurrency(contract.installmentAmount)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              <span>1º venc: {formatDateBR(contract.firstDueDate)}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>

              {/* Desktop view - Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Valor Total</TableHead>
                      <TableHead>Parcelas</TableHead>
                      <TableHead>Primeiro Vencimento</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contracts.map((contract) => (
                      <TableRow key={contract.id}>
                        <TableCell className="font-medium">
                          <Link 
                            to={`/contracts/${contract.id}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                          >
                            {contract.client?.fullName || 'Cliente não encontrado'}
                          </Link>
                        </TableCell>
                        <TableCell>{formatCurrency(contract.totalAmount)}</TableCell>
                        <TableCell>
                          {contract.installments}x de {formatCurrency(contract.installmentAmount)}
                        </TableCell>
                        <TableCell>{formatDateBR(contract.firstDueDate)}</TableCell>
                        <TableCell>
                          <Badge variant={contract.status === 'active' ? 'default' : 'secondary'}>
                            {contract.status === 'active' ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}