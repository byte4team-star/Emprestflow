import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { apiCall } from '../lib/supabase';
import { ArrowLeft, Edit, Phone, Mail, MapPin, Briefcase, DollarSign, FileText, Home } from 'lucide-react';

export default function ClientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClient();
  }, [id]);

  const loadClient = async () => {
    try {
      const data = await apiCall(`/clients/${id}`);
      setClient(data.client);
    } catch (error) {
      console.error('Error loading client:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!client) {
    return <div>Cliente não encontrado</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link to="/clients" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm">
              <ArrowLeft className="h-4 w-4" />
              Voltar para Clientes
            </Link>
            <span className="text-gray-400">|</span>
            <Link to="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm">
              <Home className="h-4 w-4" />
              Dashboard
            </Link>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{client.fullName}</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">Detalhes do cliente</p>
        </div>
        <div className="flex gap-2">
          <Link to={`/clients/${id}/edit`}>
            <Button className="gap-2">
              <Edit className="h-4 w-4" />
              Editar
            </Button>
          </Link>
          <Link to={`/contracts/new?clientId=${id}`}>
            <Button variant="outline" className="gap-2">
              <FileText className="h-4 w-4" />
              Novo Contrato
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">CPF/CNPJ</p>
              <p className="font-medium">{client.cpfCnpj}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">RG</p>
              <p className="font-medium">{client.rg}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Data de Nascimento</p>
              <p className="font-medium">
                {client.birthDate ? new Date(client.birthDate).toLocaleDateString('pt-BR') : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                {client.status === 'active' ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Telefone</p>
                <p className="font-medium">{client.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">WhatsApp</p>
                <p className="font-medium">{client.whatsapp || '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">E-mail</p>
                <p className="font-medium">{client.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Endereço</p>
                <p className="font-medium">{client.address || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dados Profissionais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Profissão</p>
                <p className="font-medium">{client.occupation || '-'}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Empresa</p>
              <p className="font-medium">{client.company || '-'}</p>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Renda Mensal</p>
                <p className="font-medium">{client.monthlyIncome || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {client.referredBy && (
          <Card>
            <CardHeader>
              <CardTitle>Indicação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Indicado por</p>
                <p className="font-medium">{client.referredBy.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Telefone</p>
                <p className="font-medium">{client.referredBy.phone}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Documentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['front', 'back', 'selfie', 'video'].map((type) => (
              <div
                key={type}
                className={`p-4 border rounded-lg text-center ${
                  client.documents?.[type]
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300'
                }`}
              >
                <p className="text-sm font-medium capitalize">
                  {type === 'front'
                    ? 'Frente'
                    : type === 'back'
                    ? 'Verso'
                    : type === 'selfie'
                    ? 'Selfie'
                    : 'Vídeo'}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {client.documents?.[type] ? '✓ Enviado' : '✗ Pendente'}
                </p>
                {client.documents?.[type] && (
                  <a
                    href={client.documents[type]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    Ver documento
                  </a>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}