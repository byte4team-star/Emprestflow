import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Copy, Check, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface ShareRegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const maskPhone = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits.replace(/(\d{0,2})/, '($1');
  if (digits.length <= 6) return digits.replace(/(\d{2})(\d{0,4})/, '($1) $2');
  if (digits.length <= 10) return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
  return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
};

export default function ShareRegistrationDialog({ open, onOpenChange }: ShareRegistrationDialogProps) {
  const [phone, setPhone] = useState('');
  const [copied, setCopied] = useState(false);

  const registrationUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/cadastro` : '/cadastro';

  const message =
    `Olá! 👋 Para iniciar seu cadastro na *ALEMÃO.CREFISA*, é só preencher seus dados e enviar seus documentos neste link:\n\n${registrationUrl}\n\nÉ rápido e seguro. Qualquer dúvida, estamos à disposição!`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(registrationUrl);
      setCopied(true);
      toast.success('Link copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Não foi possível copiar. Copie manualmente.');
    }
  };

  const sendWhatsApp = () => {
    const digits = phone.replace(/\D/g, '');
    const num = digits ? (digits.startsWith('55') ? digits : `55${digits}`) : '';
    const url = num
      ? `https://wa.me/${num}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar formulário de cadastro</DialogTitle>
          <DialogDescription>
            Compartilhe o link público para o cliente preencher o próprio cadastro e enviar os documentos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Link do formulário</Label>
            <div className="flex gap-2">
              <Input readOnly value={registrationUrl} className="text-sm" />
              <Button type="button" variant="outline" onClick={copyLink} className="gap-2 shrink-0">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copiado' : 'Copiar'}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              É o mesmo link para todos os clientes. Eles não precisam de login.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="share-phone">WhatsApp do cliente (opcional)</Label>
            <Input
              id="share-phone"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(maskPhone(e.target.value))}
              placeholder="(00) 00000-0000"
            />
            <p className="text-xs text-gray-500">
              Se informado, abre a conversa direto com esse número. Caso contrário, você escolhe o contato no WhatsApp.
            </p>
          </div>

          <Button onClick={sendWhatsApp} className="w-full gap-2 bg-emerald-700 hover:bg-emerald-800">
            <MessageSquare className="h-4 w-4" />
            Enviar pelo WhatsApp
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
