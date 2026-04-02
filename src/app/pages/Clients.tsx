import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';
import { apiCall } from '../lib/supabase';
import { Plus, Search, Phone, Mail, Database, ArrowLeft } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { toast } from 'sonner';
import AppHeader from '../components/AppHeader';

interface Client {
  id: string;
  fullName: string;
  cpfCnpj: string;
  email: string;
  phone: string;
  whatsapp: string;
  status: string;
  createdAt: string;
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [seeding, setSeeding] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    let filtered = clients;

    // Filter by status (hide inactive and deleted by default)
    if (!showInactive) {
      filtered = filtered.filter(client => client.status === 'active');
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (client) =>
          client.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.cpfCnpj.includes(searchTerm) ||
          client.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredClients(filtered);
  }, [searchTerm, clients, showInactive]);

  const loadClients = async () => {
    try {
      const data = await apiCall('/clients');
      setClients(data.clients || []);
      setFilteredClients(data.clients || []);
    } catch (error) {
      console.error('Error loading clients:', error);
      toast.error('Erro ao carregar clientes');
      setClients([]);
      setFilteredClients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedData = async () => {
    if (!confirm('Isso criará 6 novos clientes e 5 contratos de teste. Deseja continuar?')) {
      return;
    }
    
    setSeeding(true);
    try {
      const response = await apiCall('/seed', { method: 'POST' });
      toast.success(`Dados criados: ${response.summary.clients} clientes e ${response.summary.contracts} contratos!`);
      await loadClients(); // Reload clients
    } catch (error: any) {
      console.error('Error seeding data:', error);
      toast.error(error.message || 'Erro ao criar dados de teste');
    } finally {
      setSeeding(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive'; className?: string }> = {
      active: { label: 'Ativo', variant: 'default', className: 'bg-green-600' },
      inactive: { label: 'Inativo', variant: 'secondary' },
      deleted: { label: 'Excluído', variant: 'destructive' },
    };

    const config = statusConfig[status] || { label: status, variant: 'secondary' };
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 max-w-full">
      <AppHeader />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Clientes</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">Gerencie os clientes cadastrados</p>
        </div>
        <div className="flex gap-2">
          <Link to="/clients/new">
            <Button className="gap-2 text-sm bg-emerald-700 hover:bg-emerald-800">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Novo Cliente</span>
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Buscar por nome, CPF/CNPJ ou e-mail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="text-sm text-gray-600">
              {filteredClients.length} cliente(s)
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filter checkbox for inactive/deleted clients */}
          <div className="mb-4 flex items-center space-x-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <Checkbox 
              id="show-inactive" 
              checked={showInactive}
              onCheckedChange={(checked) => setShowInactive(checked as boolean)}
            />
            <label
              htmlFor="show-inactive"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Mostrar clientes inativos e excluídos
            </label>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Carregando clientes...</p>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Nenhum cliente encontrado</p>
              <Link to="/clients/new">
                <Button className="mt-4 gap-2">
                  <Plus className="h-4 w-4" />
                  Cadastrar Primeiro Cliente
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Mobile view - Cards */}
              <div className="block md:hidden space-y-4">
                {filteredClients.map((client) => (
                  <Link key={client.id} to={`/clients/${client.id}`}>
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-blue-600 truncate">{client.fullName}</h3>
                              <p className="text-sm text-gray-600">{client.cpfCnpj}</p>
                            </div>
                            {getStatusBadge(client.status)}
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2 text-gray-600">
                              <Phone className="h-3 w-3" />
                              <span>{client.phone}</span>
                            </div>
                            {client.email && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <Mail className="h-3 w-3" />
                                <span className="truncate">{client.email}</span>
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 pt-2 border-t">
                            Cadastrado em: {formatDate(client.createdAt)}
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
                      <TableHead>Nome Completo</TableHead>
                      <TableHead>CPF/CNPJ</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Cadastrado em</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">
                          <Link 
                            to={`/clients/${client.id}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                          >
                            {client.fullName}
                          </Link>
                        </TableCell>
                        <TableCell>{client.cpfCnpj}</TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2 text-gray-600">
                              <Phone className="h-3 w-3" />
                              {client.phone}
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Mail className="h-3 w-3" />
                              {client.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(client.status)}
                        </TableCell>
                        <TableCell>{formatDate(client.createdAt)}</TableCell>
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