import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { useAuth } from '../lib/auth-context';
import { apiCall, supabase } from '../lib/supabase';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Checkbox } from '../components/ui/checkbox';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Calendar } from '../components/ui/calendar';
import { User, Phone, Mail, MapPin, Briefcase, DollarSign, Shield, LogOut, Upload, CheckCircle, AlertCircle, FileText, X, Navigation, CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import FileUploadPreview from '../components/FileUploadPreview';
import { cn } from '../components/ui/utils';

interface ClientFormData {
  fullName: string;
  cpfCnpj: string;
  rg: string;
  birthDate: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  occupation: string;
  company: string;
  monthlyIncome: string;
  lgpdConsent: boolean;
}

interface DocumentFile {
  file: File;
  preview: string;
  type: 'image' | 'video';
}

export default function ClientPortalFirstAccess() {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [clientName, setClientName] = useState('');
  const [birthDate, setBirthDate] = useState<Date | undefined>(undefined);
  const [profilePhoto, setProfilePhoto] = useState<DocumentFile | null>(null);
  const [showErrorOverlay, setShowErrorOverlay] = useState(false);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  
  // Document upload states - 4 fotos obrigatórias + 2 opcionais + 1 vídeo obrigatório + 1 opcional
  const [documents, setDocuments] = useState<{
    photo1: DocumentFile | null;
    photo2: DocumentFile | null;
    photo3: DocumentFile | null;
    photo4: DocumentFile | null;
    photo5: DocumentFile | null;
    photo6: DocumentFile | null;
    video1: DocumentFile | null;
    video2: DocumentFile | null;
  }>({
    photo1: null,
    photo2: null,
    photo3: null,
    photo4: null,
    photo5: null,
    photo6: null,
    video1: null,
    video2: null,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ClientFormData>({
    defaultValues: {
      lgpdConsent: false,
    },
  });

  const lgpdConsent = watch('lgpdConsent');

  // Check if all REQUIRED documents are uploaded (4 fotos + 1 vídeo obrigatórios)
  const allDocumentsUploaded =
    profilePhoto !== null &&
    documents.photo1 !== null &&
    documents.photo2 !== null &&
    documents.photo3 !== null &&
    documents.photo4 !== null &&
    documents.video1 !== null;
    // photo5, photo6, video2 são OPCIONAIS

  // Debug logging
  console.log('[DOCUMENTS_CHECK]', {
    profilePhoto: !!profilePhoto,
    photo1: !!documents.photo1,
    photo2: !!documents.photo2,
    photo3: !!documents.photo3,
    photo4: !!documents.photo4,
    photo5: !!documents.photo5,
    photo6: !!documents.photo6,
    video1: !!documents.video1,
    video2: !!documents.video2,
    allDocumentsUploaded,
  });

  // Count uploaded documents
  const uploadedCount = [
    profilePhoto,
    documents.photo1,
    documents.photo2,
    documents.photo3,
    documents.photo4,
    documents.photo5,
    documents.photo6,
    documents.video1,
    documents.video2
  ].filter(doc => doc !== null).length;

  const totalRequiredDocuments = 6; // 1 profile photo + 4 document photos + 1 video

  useEffect(() => {
    // Register lgpdConsent with validation
    register('lgpdConsent', { 
      required: 'Você precisa aceitar os termos da LGPD para continuar',
      validate: (value) => value === true || 'Você precisa aceitar os termos da LGPD para continuar'
    });
  }, [register]);

  useEffect(() => {
    // Wait for auth to load
    if (authLoading) {
      return;
    }

    // Verify user is a client
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.role !== 'client') {
      toast.error('Acesso negado. Esta área é exclusiva para clientes.');
      navigate('/');
      return;
    }

    checkProfileComplete();
  }, [user, authLoading, navigate]);

  const checkProfileComplete = async () => {
    try {
      setInitialLoading(true);
      const data = await apiCall('/client-portal/my-data');

      // Check if client has completed registration
      if (data.client && isProfileComplete(data.client)) {
        // Already completed, redirect to portal
        navigate('/client-portal');
        return;
      }

      // Pre-fill email if available
      if (data.client?.email) {
        setValue('email', data.client.email);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao verificar dados do perfil');
    } finally {
      setInitialLoading(false);
    }
  };

  const isProfileComplete = (client: any) => {
    return (
      client.fullName &&
      client.cpfCnpj &&
      client.rg &&
      client.birthDate &&
      client.phone &&
      client.email &&
      client.address &&
      client.occupation &&
      client.company &&
      client.monthlyIncome &&
      client.monthlyIncome !== '' &&
      client.monthlyIncome !== 0 &&
      client.lgpdConsent
    );
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const handleSubmitClick = () => {
    console.log('[SUBMIT_CLICK] Starting validation...');
    
    // Validate conditions before submitting
    const errors: string[] = [];

    // Check LGPD consent
    if (!lgpdConsent || lgpdConsent !== true) {
      errors.push('Você precisa aceitar os termos da LGPD');
    }

    // Check all REQUIRED documents (photo5, photo6, video2 são opcionais)
    if (!allDocumentsUploaded) {
      const missingDocs: string[] = [];
      if (!profilePhoto) missingDocs.push('Foto de Perfil');
      if (!documents.photo1) missingDocs.push('Foto do Documento 1');
      if (!documents.photo2) missingDocs.push('Foto do Documento 2');
      if (!documents.photo3) missingDocs.push('Foto do Documento 3');
      if (!documents.photo4) missingDocs.push('Foto do Documento 4');
      if (!documents.video1) missingDocs.push('Vídeo de Identificação 1');
      // photo5, photo6, video2 são OPCIONAIS - não aparecem aqui

      errors.push(`Documentos obrigatórios faltando: ${missingDocs.join(', ')}`);
    }

    // If there are errors, show overlay
    if (errors.length > 0) {
      console.log('[SUBMIT_CLICK] Validation failed:', errors);
      setErrorMessages(errors);
      setShowErrorOverlay(true);
      return;
    }

    console.log('[SUBMIT_CLICK] ✅ Validation passed, triggering form submit...');
    // Otherwise, trigger form submit
    handleSubmit(onSubmit)();
  };

  const onSubmit = async (data: ClientFormData) => {
    console.log('[SUBMIT] Form data:', data);
    console.log('[SUBMIT] lgpdConsent value:', lgpdConsent, typeof lgpdConsent);
    
    // Validate all required fields
    const missingFields: string[] = [];
    if (!data.fullName) missingFields.push('Nome Completo');
    if (!data.cpfCnpj) missingFields.push('CPF/CNPJ');
    if (!data.rg) missingFields.push('RG');
    if (!data.birthDate) missingFields.push('Data de Nascimento');
    if (!data.phone) missingFields.push('Telefone');
    if (!data.email) missingFields.push('E-mail');
    if (!data.address) missingFields.push('Endereço');
    if (!data.occupation) missingFields.push('Profissão');
    if (!data.company) missingFields.push('Empresa');
    if (!data.monthlyIncome) missingFields.push('Renda Mensal');
    
    if (missingFields.length > 0) {
      toast.error(`Campos obrigatórios faltando: ${missingFields.join(', ')}`);
      console.error('[SUBMIT] Missing required fields:', missingFields);
      return;
    }
    
    // Validate LGPD consent explicitly
    if (!lgpdConsent || lgpdConsent !== true) {
      toast.error('Você precisa aceitar os termos da LGPD para continuar');
      return;
    }

    // Check if all REQUIRED documents are uploaded (photo5, photo6, video2 são opcionais)
    if (!allDocumentsUploaded) {
      const missingDocs: string[] = [];
      if (!profilePhoto) missingDocs.push('Foto de Perfil');
      if (!documents.photo1) missingDocs.push('Foto do Documento 1');
      if (!documents.photo2) missingDocs.push('Foto do Documento 2');
      if (!documents.photo3) missingDocs.push('Foto do Documento 3');
      if (!documents.photo4) missingDocs.push('Foto do Documento 4');
      if (!documents.video1) missingDocs.push('Vídeo de Identificação 1');
      // photo5, photo6, video2 são OPCIONAIS - não aparecem como faltando

      toast.error(`Documentos obrigatórios faltando: ${missingDocs.join(', ')}`);
      console.error('[SUBMIT] Missing required documents:', missingDocs);
      return;
    }

    // Check file sizes (5MB for images, 30MB for videos)
    const maxImageSizeMB = 5;
    const maxVideoSizeMB = 30;
    const maxImageSizeBytes = maxImageSizeMB * 1024 * 1024;
    const maxVideoSizeBytes = maxVideoSizeMB * 1024 * 1024;
    const oversizedFiles: string[] = [];

    const allFiles = [
      { name: 'Foto de Perfil', file: profilePhoto?.file, type: 'image' },
      { name: 'Foto do Documento 1', file: documents.photo1?.file, type: 'image' },
      { name: 'Foto do Documento 2', file: documents.photo2?.file, type: 'image' },
      { name: 'Foto do Documento 3', file: documents.photo3?.file, type: 'image' },
      { name: 'Foto do Documento 4', file: documents.photo4?.file, type: 'image' },
      { name: 'Foto do Documento 5', file: documents.photo5?.file, type: 'image' },
      { name: 'Foto do Documento 6', file: documents.photo6?.file, type: 'image' },
      { name: 'Vídeo de Identificação 1', file: documents.video1?.file, type: 'video' },
      { name: 'Vídeo de Identificação 2', file: documents.video2?.file, type: 'video' },
    ];

    allFiles.forEach(({ name, file, type }) => {
      if (file) {
        const maxSize = type === 'video' ? maxVideoSizeBytes : maxImageSizeBytes;
        const maxSizeMB = type === 'video' ? maxVideoSizeMB : maxImageSizeMB;
        if (file.size > maxSize) {
          oversizedFiles.push(`${name} (${(file.size / 1024 / 1024).toFixed(2)} MB > ${maxSizeMB}MB)`);
        }
      }
    });

    if (oversizedFiles.length > 0) {
      toast.error('Arquivos muito grandes!', {
        description: `Os seguintes arquivos excedem o limite (imagens: ${maxImageSizeMB}MB, vídeos: ${maxVideoSizeMB}MB):\n${oversizedFiles.join('\n')}`,
      });
      console.error('[SUBMIT] Oversized files:', oversizedFiles);
      return;
    }

    setLoading(true);

    try {
      console.log('[SUBMIT] Starting form submission with documents...');

      // Calculate total size
      const totalSizeMB = allFiles.reduce((sum, { file }) => {
        return sum + (file ? file.size / 1024 / 1024 : 0);
      }, 0);

      console.log('[SUBMIT] File sizes:');
      allFiles.forEach(({ name, file }) => {
        if (file) {
          console.log(`  ${name}: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
        }
      });
      console.log(`[SUBMIT] Total size: ${totalSizeMB.toFixed(2)} MB`);
      
      // Create FormData
      const formData = new FormData();
      
      // Add text fields - ensure lgpdConsent is sent as 'true' string
      console.log('[SUBMIT] Form fields to send:');
      Object.keys(data).forEach((key) => {
        const value = data[key as keyof ClientFormData];
        if (value !== undefined && value !== null) {
          // Convert boolean to string 'true' or 'false'
          const stringValue = typeof value === 'boolean' ? (value ? 'true' : 'false') : String(value);
          formData.append(key, stringValue);
          console.log(`  ${key}: ${stringValue}`);
        } else {
          console.warn(`  ${key}: EMPTY/NULL`);
        }
      });
      
      console.log('[SUBMIT] lgpdConsent being sent:', formData.get('lgpdConsent'));
      
      // Add profile photo
      if (profilePhoto?.file) {
        formData.append('profilePhoto', profilePhoto.file);
        console.log('[SUBMIT] ✅ Added profilePhoto:', profilePhoto.file.name, `(${(profilePhoto.file.size / 1024 / 1024).toFixed(2)} MB)`);
      } else {
        console.error('[SUBMIT] ❌ Missing profilePhoto');
      }

      // Add document files with detailed logging - 4 fotos obrigatórias + 2 opcionais + 1 vídeo obrigatório + 1 opcional
      if (documents.photo1?.file) {
        formData.append('documentPhoto1', documents.photo1.file);
        console.log('[SUBMIT] ✅ Added documentPhoto1:', documents.photo1.file.name, `(${(documents.photo1.file.size / 1024 / 1024).toFixed(2)} MB)`);
      } else {
        console.error('[SUBMIT] ❌ Missing documentPhoto1');
      }

      if (documents.photo2?.file) {
        formData.append('documentPhoto2', documents.photo2.file);
        console.log('[SUBMIT] ✅ Added documentPhoto2:', documents.photo2.file.name, `(${(documents.photo2.file.size / 1024 / 1024).toFixed(2)} MB)`);
      } else {
        console.error('[SUBMIT] ❌ Missing documentPhoto2');
      }

      if (documents.photo3?.file) {
        formData.append('documentPhoto3', documents.photo3.file);
        console.log('[SUBMIT] ✅ Added documentPhoto3:', documents.photo3.file.name, `(${(documents.photo3.file.size / 1024 / 1024).toFixed(2)} MB)`);
      } else {
        console.error('[SUBMIT] ❌ Missing documentPhoto3');
      }

      if (documents.photo4?.file) {
        formData.append('documentPhoto4', documents.photo4.file);
        console.log('[SUBMIT] ✅ Added documentPhoto4:', documents.photo4.file.name, `(${(documents.photo4.file.size / 1024 / 1024).toFixed(2)} MB)`);
      } else {
        console.error('[SUBMIT] ❌ Missing documentPhoto4');
      }

      // photo5 é OPCIONAL
      if (documents.photo5?.file) {
        formData.append('documentPhoto5', documents.photo5.file);
        console.log('[SUBMIT] ✅ Added documentPhoto5 (opcional):', documents.photo5.file.name, `(${(documents.photo5.file.size / 1024 / 1024).toFixed(2)} MB)`);
      } else {
        console.log('[SUBMIT] ℹ️ No documentPhoto5 (opcional - OK)');
      }

      // photo6 é OPCIONAL
      if (documents.photo6?.file) {
        formData.append('documentPhoto6', documents.photo6.file);
        console.log('[SUBMIT] ✅ Added documentPhoto6 (opcional):', documents.photo6.file.name, `(${(documents.photo6.file.size / 1024 / 1024).toFixed(2)} MB)`);
      } else {
        console.log('[SUBMIT] ℹ️ No documentPhoto6 (opcional - OK)');
      }

      // video1 é OBRIGATÓRIO
      if (documents.video1?.file) {
        formData.append('documentVideo1', documents.video1.file);
        console.log('[SUBMIT] ✅ Added documentVideo1:', documents.video1.file.name, `(${(documents.video1.file.size / 1024 / 1024).toFixed(2)} MB)`);
      } else {
        console.error('[SUBMIT] ❌ Missing documentVideo1');
      }

      // video2 é OPCIONAL
      if (documents.video2?.file) {
        formData.append('documentVideo2', documents.video2.file);
        console.log('[SUBMIT] ✅ Added documentVideo2 (opcional):', documents.video2.file.name, `(${(documents.video2.file.size / 1024 / 1024).toFixed(2)} MB)`);
      } else {
        console.log('[SUBMIT] ℹ️ No documentVideo2 (opcional - OK)');
      }

      console.log('[SUBMIT] FormData prepared, sending to server...');
      console.log('[SUBMIT] Total files in FormData:', Array.from(formData.entries()).filter(([key]) => key.includes('Photo') || key.includes('Video')).length);

      // Get token for authentication
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      if (!token) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      // Send FormData to server
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-bd42bc02/client-portal/complete-registration`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'X-User-Token': token,
          // DO NOT set Content-Type - browser will set it automatically with boundary for multipart/form-data
        },
        body: formData,
      });

      console.log('[SUBMIT] Response status:', response.status);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Erro ao enviar dados' }));
        console.error('[SUBMIT] Error response:', error);
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('[SUBMIT] Success:', result);

      toast.success('Cadastro concluído com sucesso!');
      setRegistrationComplete(true);
      setClientName(data.fullName);
    } catch (error: any) {
      console.error('[SUBMIT] Error submitting form:', error);
      toast.error(error.message || 'Erro ao salvar dados');
    } finally {
      setLoading(false);
    }
  };

  const formatCPFCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    
    if (numbers.length <= 11) {
      // CPF: 000.000.000-00
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
    } else {
      // CNPJ: 00.000.000/0000-00
      return numbers
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
    }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    } else {
      return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
    }
  };

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const amount = Number(numbers) / 100;
    return amount.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show success screen with location sharing option
  if (registrationComplete) {
    const handleSendLocation = () => {
      // Open WhatsApp and instruct user to share location
      const whatsappNumber = '5581985828087';
      const message = encodeURIComponent(`Olá! Sou ${clientName} e acabei de completar meu cadastro. Vou compartilhar minha localização agora.`);
      
      // Detect if mobile or desktop
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      if (isMobile) {
        // On mobile, use app:// protocol
        window.location.href = `whatsapp://send?phone=${whatsappNumber}&text=${message}`;
      } else {
        // On desktop, use web.whatsapp.com
        window.open(`https://web.whatsapp.com/send?phone=${whatsappNumber}&text=${message}`, '_blank');
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-8 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Success Header */}
          <div className="bg-white p-8 rounded-lg shadow-lg mb-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Cadastro Concluído com Sucesso!
              </h1>
              <p className="text-lg text-gray-600">
                Parabéns, {clientName}! Seus dados foram salvos.
              </p>
            </div>
          </div>

          {/* Location Sharing Card */}
          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900 text-2xl">
                <Navigation className="h-6 w-6" />
                Última Etapa: Compartilhar Localização
              </CardTitle>
              <CardDescription className="text-lg">
                Para finalizar seu cadastro, compartilhe sua localização GPS via WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="border-blue-200 bg-blue-50">
                <AlertDescription className="text-blue-900">
                  <strong>📍 Importante:</strong> Clique no botão abaixo para abrir o WhatsApp.
                  Uma vez aberto, você precisará compartilhar sua localização em tempo real.
                </AlertDescription>
              </Alert>

              {/* Instructions */}
              <div className="bg-white p-6 rounded-lg border border-green-200">
                <h3 className="font-semibold text-lg text-gray-900 mb-4">
                  📋 Como Compartilhar sua Localização:
                </h3>
                <ol className="space-y-3 text-gray-700">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-green-600 text-white text-sm font-bold">
                      1
                    </span>
                    <span>Clique no botão <strong>\"Enviar Localização pelo WhatsApp\"</strong> abaixo</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-green-600 text-white text-sm font-bold">
                      2
                    </span>
                    <span>O WhatsApp abrirá automaticamente com uma conversa para o número <strong>(81) 98582-8087</strong></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-green-600 text-white text-sm font-bold">
                      3
                    </span>
                    <span>No WhatsApp, clique no ícone de <strong>anexo (📎)</strong> ou <strong>+</strong></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-green-600 text-white text-sm font-bold">
                      4
                    </span>
                    <span>Selecione a opção <strong>\"Localização\"</strong> ou <strong>\"📍 Localização\"</strong></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-green-600 text-white text-sm font-bold">
                      5
                    </span>
                    <span>Escolha <strong>\"Localização em tempo real\"</strong> ou <strong>\"Enviar sua localização atual\"</strong></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-green-600 text-white text-sm font-bold">
                      6
                    </span>
                    <span>Envie a localização e pronto! ✅</span>
                  </li>
                </ol>
              </div>

              {/* Send Button */}
              <div className="flex flex-col items-center gap-4 py-6">
                <Button
                  onClick={handleSendLocation}
                  size="lg"
                  className="gap-3 bg-green-600 hover:bg-green-700 text-lg py-6 px-8"
                >
                  <Navigation className="h-6 w-6" />
                  Enviar Localização pelo WhatsApp
                </Button>
                <p className="text-sm text-gray-600 text-center">
                  Ao clicar, você será redirecionado para o WhatsApp
                </p>
              </div>

              {/* Skip option */}
              <div className="border-t pt-6 text-center">
                <p className="text-gray-600 mb-4">
                  Prefere enviar sua localização mais tarde?
                </p>
                <Button
                  onClick={() => navigate('/client-portal')}
                  variant="outline"
                  className="gap-2"
                >
                  Pular e Acessar Portal do Cliente
                </Button>
              </div>

              {/* Privacy Note */}
              <Alert className="border-green-200 bg-green-50">
                <Shield className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-900 text-sm">
                  🔒 <strong>Privacidade:</strong> Sua localização será usada apenas para validação de cadastro
                  conforme os termos da LGPD que você aceitou.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Complete seu Cadastro
              </h1>
              <p className="text-gray-600 mt-1">
                Bem-vindo(a)! Para acessar o sistema, complete seus dados abaixo.
              </p>
            </div>
            <Button onClick={handleLogout} variant="outline" size="sm" className="gap-2">
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>

        {/* Alert */}
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <Shield className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <strong>Importante:</strong> Preencha todos os campos obrigatórios. Após o cadastro, você não poderá mais editar estas informações.
            Caso precise alterar algo, entre em contato com a administração.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Dados Pessoais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Dados Pessoais
              </CardTitle>
              <CardDescription>
                Informações básicas de identificação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Profile Photo Upload */}
                <div className="md:col-span-2">
                  <Label htmlFor="profilePhoto" className="block text-center mb-3">
                    Foto de Perfil <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-40">
                      <FileUploadPreview
                        id="profilePhoto"
                        type="image"
                        onUpload={(file, preview) => setProfilePhoto({ file, preview, type: 'image' })}
                        onRemove={() => setProfilePhoto(null)}
                        file={profilePhoto?.file}
                        preview={profilePhoto?.preview}
                      />
                    </div>
                    {profilePhoto && (
                      <div className="flex-shrink-0">
                        <div className="w-20 h-20 rounded-full overflow-hidden border-3 border-blue-500 shadow-lg">
                          <img
                            src={profilePhoto.preview}
                            alt="Foto de Perfil"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 text-center">
                      Escolha uma imagem clara do seu rosto
                    </p>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="fullName">
                    Nome Completo <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    {...register('fullName', { required: 'Nome completo é obrigatório' })}
                    placeholder="Digite seu nome completo"
                    className={errors.fullName ? 'border-red-500' : ''}
                  />
                  {errors.fullName && (
                    <p className="text-sm text-red-500 mt-1">{errors.fullName.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="cpfCnpj">
                    CPF/CNPJ <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="cpfCnpj"
                    {...register('cpfCnpj', { required: 'CPF/CNPJ é obrigatório' })}
                    placeholder="000.000.000-00"
                    onChange={(e) => {
                      const formatted = formatCPFCNPJ(e.target.value);
                      setValue('cpfCnpj', formatted);
                    }}
                    maxLength={18}
                    className={errors.cpfCnpj ? 'border-red-500' : ''}
                  />
                  {errors.cpfCnpj && (
                    <p className="text-sm text-red-500 mt-1">{errors.cpfCnpj.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="rg">
                    RG <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="rg"
                    {...register('rg', { required: 'RG é obrigatório' })}
                    placeholder="00.000.000-0"
                    className={errors.rg ? 'border-red-500' : ''}
                  />
                  {errors.rg && (
                    <p className="text-sm text-red-500 mt-1">{errors.rg.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="birthDate">
                    Data de Nascimento <span className="text-red-500">*</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !birthDate && 'text-muted-foreground',
                          errors.birthDate && 'border-red-500'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {birthDate ? format(birthDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione a data'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={birthDate}
                        onSelect={(date) => {
                          if (date) {
                            setValue('birthDate', format(date, 'yyyy-MM-dd'));
                            setBirthDate(date);
                          }
                        }}
                        disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                        initialFocus
                        captionLayout="dropdown-buttons"
                        fromYear={1900}
                        toYear={new Date().getFullYear()}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                  <input type="hidden" {...register('birthDate', { required: 'Data de nascimento é obrigatória' })} />
                  {errors.birthDate && (
                    <p className="text-sm text-red-500 mt-1">{errors.birthDate.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contato */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Contato
              </CardTitle>
              <CardDescription>
                Telefones e e-mail para comunicação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">
                    Telefone <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    {...register('phone', { required: 'Telefone é obrigatório' })}
                    placeholder="(00) 00000-0000"
                    onChange={(e) => {
                      const formatted = formatPhone(e.target.value);
                      setValue('phone', formatted);
                    }}
                    maxLength={15}
                    className={errors.phone ? 'border-red-500' : ''}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    {...register('whatsapp')}
                    placeholder="(00) 00000-0000"
                    onChange={(e) => {
                      const formatted = formatPhone(e.target.value);
                      setValue('whatsapp', formatted);
                    }}
                    maxLength={15}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Deixe em branco para usar o mesmo número do telefone
                  </p>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="email">
                    E-mail <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email', { 
                      required: 'E-mail é obrigatório',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'E-mail inválido'
                      }
                    })}
                    placeholder="seu@email.com"
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Endereço */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Endereço
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="address">
                  Endereço Completo <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="address"
                  {...register('address', { required: 'Endereço é obrigatório' })}
                  placeholder="Rua, número, complemento, bairro, cidade, estado, CEP"
                  rows={3}
                  className={errors.address ? 'border-red-500' : ''}
                />
                {errors.address && (
                  <p className="text-sm text-red-500 mt-1">{errors.address.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Dados Profissionais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Dados Profissionais
              </CardTitle>
              <CardDescription>
                Informações sobre sua atividade profissional
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="occupation">
                    Profissão/Ocupação <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="occupation"
                    {...register('occupation', { required: 'Profissão é obrigatória' })}
                    placeholder="Ex: Comerciante, Autônomo, CLT"
                    className={errors.occupation ? 'border-red-500' : ''}
                  />
                  {errors.occupation && (
                    <p className="text-sm text-red-500 mt-1">{errors.occupation.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="company">
                    Empresa <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="company"
                    {...register('company', { required: 'Empresa é obrigatória' })}
                    placeholder="Nome da empresa ou 'Autônomo'"
                    className={errors.company ? 'border-red-500' : ''}
                  />
                  {errors.company && (
                    <p className="text-sm text-red-500 mt-1">{errors.company.message}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="monthlyIncome">
                    Renda Mensal <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      R$
                    </span>
                    <Input
                      id="monthlyIncome"
                      {...register('monthlyIncome', { required: 'Renda mensal é obrigatória' })}
                      placeholder="0,00"
                      onChange={(e) => {
                        const formatted = formatCurrency(e.target.value);
                        setValue('monthlyIncome', formatted);
                      }}
                      className={cn(
                        'pl-10',
                        errors.monthlyIncome ? 'border-red-500' : ''
                      )}
                    />
                  </div>
                  {errors.monthlyIncome && (
                    <p className="text-sm text-red-500 mt-1">{errors.monthlyIncome.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documentos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documentos
              </CardTitle>
              <CardDescription>
                Faça o upload dos documentos solicitados (imagens: máx 5MB, vídeos: máx 10MB)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-blue-200 bg-blue-50">
                <FileText className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-900 text-sm">
                  📸 <strong>4 fotos obrigatórias</strong> + 2 fotos opcionais de documentos (RG, CNH, comprovantes, etc.)<br />
                  🎥 <strong>1 vídeo obrigatório</strong> + 1 vídeo opcional de identificação<br />
                  <span className="text-red-600 font-semibold">⚠️ Limites: Imagens até 5MB, Vídeos até 10MB</span>
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Foto 1 - Obrigatória */}
                <div>
                  <Label htmlFor="photo1">
                    Foto do Documento 1 <span className="text-red-500">*</span>
                  </Label>
                  <FileUploadPreview
                    id="photo1"
                    type="image"
                    onUpload={(file, preview) => setDocuments({ ...documents, photo1: { file, preview, type: 'image' } })}
                    onRemove={() => setDocuments({ ...documents, photo1: null })}
                    file={documents.photo1?.file}
                    preview={documents.photo1?.preview}
                  />
                </div>

                {/* Foto 2 - Obrigatória */}
                <div>
                  <Label htmlFor="photo2">
                    Foto do Documento 2 <span className="text-red-500">*</span>
                  </Label>
                  <FileUploadPreview
                    id="photo2"
                    type="image"
                    onUpload={(file, preview) => setDocuments({ ...documents, photo2: { file, preview, type: 'image' } })}
                    onRemove={() => setDocuments({ ...documents, photo2: null })}
                    file={documents.photo2?.file}
                    preview={documents.photo2?.preview}
                  />
                </div>

                {/* Foto 3 - Obrigatória */}
                <div>
                  <Label htmlFor="photo3">
                    Foto do Documento 3 <span className="text-red-500">*</span>
                  </Label>
                  <FileUploadPreview
                    id="photo3"
                    type="image"
                    onUpload={(file, preview) => setDocuments({ ...documents, photo3: { file, preview, type: 'image' } })}
                    onRemove={() => setDocuments({ ...documents, photo3: null })}
                    file={documents.photo3?.file}
                    preview={documents.photo3?.preview}
                  />
                </div>

                {/* Foto 4 - Obrigatória */}
                <div>
                  <Label htmlFor="photo4">
                    Foto do Documento 4 <span className="text-red-500">*</span>
                  </Label>
                  <FileUploadPreview
                    id="photo4"
                    type="image"
                    onUpload={(file, preview) => setDocuments({ ...documents, photo4: { file, preview, type: 'image' } })}
                    onRemove={() => setDocuments({ ...documents, photo4: null })}
                    file={documents.photo4?.file}
                    preview={documents.photo4?.preview}
                  />
                </div>

                {/* Foto 5 - Opcional */}
                <div>
                  <Label htmlFor="photo5">
                    Foto do Documento 5 <span className="text-gray-500 text-xs">(Opcional)</span>
                  </Label>
                  <FileUploadPreview
                    id="photo5"
                    type="image"
                    onUpload={(file, preview) => setDocuments({ ...documents, photo5: { file, preview, type: 'image' } })}
                    onRemove={() => setDocuments({ ...documents, photo5: null })}
                    file={documents.photo5?.file}
                    preview={documents.photo5?.preview}
                  />
                </div>

                {/* Foto 6 - Opcional */}
                <div>
                  <Label htmlFor="photo6">
                    Foto do Documento 6 <span className="text-gray-500 text-xs">(Opcional)</span>
                  </Label>
                  <FileUploadPreview
                    id="photo6"
                    type="image"
                    onUpload={(file, preview) => setDocuments({ ...documents, photo6: { file, preview, type: 'image' } })}
                    onRemove={() => setDocuments({ ...documents, photo6: null })}
                    file={documents.photo6?.file}
                    preview={documents.photo6?.preview}
                  />
                </div>

                {/* Vídeo 1 - Obrigatório */}
                <div>
                  <Label htmlFor="video1">
                    Vídeo de Identificação 1 <span className="text-red-500">*</span>
                  </Label>
                  <FileUploadPreview
                    id="video1"
                    type="video"
                    onUpload={(file, preview) => setDocuments({ ...documents, video1: { file, preview, type: 'video' } })}
                    onRemove={() => setDocuments({ ...documents, video1: null })}
                    file={documents.video1?.file}
                    preview={documents.video1?.preview}
                  />
                </div>

                {/* Vídeo 2 - Opcional */}
                <div>
                  <Label htmlFor="video2">
                    Vídeo de Identificação 2 <span className="text-gray-500 text-xs">(Opcional)</span>
                  </Label>
                  <FileUploadPreview
                    id="video2"
                    type="video"
                    onUpload={(file, preview) => setDocuments({ ...documents, video2: { file, preview, type: 'video' } })}
                    onRemove={() => setDocuments({ ...documents, video2: null })}
                    file={documents.video2?.file}
                    preview={documents.video2?.preview}
                  />
                </div>
              </div>
              
              {/* Upload Progress Indicator */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">Documentos Obrigatórios:</span>
                  <span className={`font-semibold ${allDocumentsUploaded ? 'text-green-600' : 'text-orange-600'}`}>
                    {[profilePhoto, documents.photo1, documents.photo2, documents.photo3, documents.photo4, documents.video1].filter(d => d !== null).length}/6
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                  <div className={`flex items-center gap-1 ${profilePhoto ? 'text-green-600' : 'text-gray-400'}`}>
                    {profilePhoto ? '✅' : '⬜'} Foto de Perfil
                  </div>
                  <div className={`flex items-center gap-1 ${documents.photo1 ? 'text-green-600' : 'text-gray-400'}`}>
                    {documents.photo1 ? '✅' : '⬜'} Documento 1
                  </div>
                  <div className={`flex items-center gap-1 ${documents.photo2 ? 'text-green-600' : 'text-gray-400'}`}>
                    {documents.photo2 ? '✅' : '⬜'} Documento 2
                  </div>
                  <div className={`flex items-center gap-1 ${documents.photo3 ? 'text-green-600' : 'text-gray-400'}`}>
                    {documents.photo3 ? '✅' : '⬜'} Documento 3
                  </div>
                  <div className={`flex items-center gap-1 ${documents.photo4 ? 'text-green-600' : 'text-gray-400'}`}>
                    {documents.photo4 ? '✅' : '⬜'} Documento 4
                  </div>
                  <div className={`flex items-center gap-1 ${documents.video1 ? 'text-green-600' : 'text-gray-400'}`}>
                    {documents.video1 ? '✅' : '⬜'} Vídeo 1
                  </div>
                </div>

                {(documents.photo5 || documents.photo6 || documents.video2) && (
                  <>
                    <div className="flex items-center justify-between text-sm mt-3">
                      <span className="font-medium text-gray-600">Documentos Opcionais:</span>
                      <span className="font-semibold text-blue-600">
                        {[documents.photo5, documents.photo6, documents.video2].filter(d => d !== null).length}/3
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className={`flex items-center gap-1 ${documents.photo5 ? 'text-blue-600' : 'text-gray-300'}`}>
                        {documents.photo5 ? '✅' : '⬜'} Documento 5
                      </div>
                      <div className={`flex items-center gap-1 ${documents.photo6 ? 'text-blue-600' : 'text-gray-300'}`}>
                        {documents.photo6 ? '✅' : '⬜'} Documento 6
                      </div>
                      <div className={`flex items-center gap-1 ${documents.video2 ? 'text-blue-600' : 'text-gray-300'}`}>
                        {documents.video2 ? '✅' : '⬜'} Vídeo 2
                      </div>
                    </div>
                  </>
                )}
              </div>

              {allDocumentsUploaded && (
                <Alert className="border-green-200 bg-green-50 mt-4">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-900 text-sm">
                    ✅ Todos os documentos obrigatórios foram enviados! Você pode prosseguir com o cadastro.
                  </AlertDescription>
                </Alert>
              )}

              {!allDocumentsUploaded && (
                <Alert className="border-orange-200 bg-orange-50 mt-4">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-900 text-sm">
                    ⚠️ Envie todos os 6 documentos obrigatórios para continuar.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* LGPD Consent */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Shield className="h-5 w-5" />
                Termo de Consentimento LGPD
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-700 space-y-2 max-h-64 overflow-y-auto p-4 bg-white rounded border">
                <p className="font-semibold">
                  Lei Geral de Proteção de Dados Pessoais (LGPD)
                </p>
                <p>
                  Declaro que estou ciente e concordo com a coleta e processamento dos meus dados pessoais para fins de:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Cadastro e identificação no sistema</li>
                  <li>Gestão de contratos e cobranças</li>
                  <li>Comunicação via WhatsApp, e-mail e telefone</li>
                  <li>Cumprimento de obrigações legais e contratuais</li>
                  <li>Análise de crédito e verificação de dados</li>
                </ul>
                <p>
                  Estou ciente de que meus dados serão armazenados de forma segura e não serão compartilhados
                  com terceiros sem meu consentimento, exceto quando exigido por lei.
                </p>
                <p>
                  Tenho conhecimento dos meus direitos de acesso, correço, exclusão e portabilidade
                  dos meus dados pessoais, conforme previsto na Lei nº 13.709/2018.
                </p>
              </div>

              <div className="flex items-start gap-3 p-4 bg-white rounded border">
                <Checkbox
                  id="lgpdConsent"
                  checked={lgpdConsent === true}
                  onCheckedChange={(checked) => {
                    // Ensure we set a boolean value, not 'indeterminate'
                    const boolValue = checked === true;
                    setValue('lgpdConsent', boolValue, { shouldValidate: true });
                  }}
                  className="mt-1"
                />
                <label
                  htmlFor="lgpdConsent"
                  className="text-sm font-medium leading-relaxed cursor-pointer"
                >
                  Li e aceito os termos da LGPD e autorizo o processamento dos meus dados pessoais
                  conforme descrito acima. <span className="text-red-500">*</span>
                </label>
              </div>
              {!lgpdConsent && (
                <p className="text-sm text-amber-600">
                  ⚠️ Você precisa aceitar os termos da LGPD para completar o cadastro
                </p>
              )}
              {errors.lgpdConsent && (
                <p className="text-sm text-red-500 mt-1">{errors.lgpdConsent.message}</p>
              )}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="space-y-3">
            {(!lgpdConsent || !allDocumentsUploaded) && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-900 text-sm">
                  <strong>Não é possível salvar ainda:</strong>
                  <ul className="mt-2 ml-4 list-disc space-y-1">
                    {!allDocumentsUploaded && <li>Envie todos os 6 documentos obrigatórios</li>}
                    {!lgpdConsent && <li>Aceite os termos da LGPD</li>}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                onClick={handleSubmitClick}
                disabled={loading || !lgpdConsent || !allDocumentsUploaded}
                size="lg"
                className="gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Shield className="h-5 w-5" />
                    Completar Cadastro
                  </>
                )}
              </Button>
            </div>
          </div>

          <Alert className="border-amber-200 bg-amber-50">
            <AlertDescription className="text-amber-900 text-sm">
              ⚠️ <strong>Atenção:</strong> Após confirmar, você não poderá mais editar estes dados.
              Revise todas as informações antes de prosseguir.
            </AlertDescription>
          </Alert>
        </form>

        {/* Error Overlay */}
        {showErrorOverlay && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 animate-in zoom-in-95 duration-200">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                      <AlertCircle className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        Cadastro Incompleto
                      </h3>
                      <p className="text-sm text-gray-600">
                        Complete os requisitos abaixo
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowErrorOverlay(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Error Messages */}
                <div className="space-y-3 mb-6">
                  {errorMessages.map((error, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg"
                    >
                      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-900 flex-1">{error}</p>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowErrorOverlay(false)}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    Entendi, vou completar
                  </Button>
                </div>

                {/* Helper Text */}
                <p className="text-xs text-center text-gray-500 mt-4">
                  Role a página para cima e complete os itens marcados em vermelho
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}