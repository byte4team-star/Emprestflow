import { Link } from 'react-router';
import { Button } from '../components/ui/button';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900">404</h1>
        <p className="text-xl text-gray-600 mt-4">Página não encontrada</p>
        <Link to="/">
          <Button className="mt-6 gap-2">
            <Home className="h-4 w-4" />
            Voltar ao Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
