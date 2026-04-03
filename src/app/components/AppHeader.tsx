import { Link } from 'react-router';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  backTo?: string;
  actions?: React.ReactNode;
}

export default function AppHeader({ title, subtitle, showBackButton, backTo = '/', actions }: AppHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 border-b-4 border-amber-500 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity flex-shrink-0">
            <img src="/logo.png" alt="ALEMÃO.CREFISA" className="h-12 w-12 sm:h-14 sm:w-14 object-contain drop-shadow-md rounded-full" />
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-amber-400">ALEMÃO.CREFISA</h1>
              <p className="text-xs text-emerald-100">Sistema de Gestão</p>
            </div>
          </Link>

          {/* Title and Actions */}
          {title && (
            <div className="flex items-center gap-4 flex-1 justify-end">
              <div className="text-right">
                <h2 className="text-lg sm:text-xl font-bold text-white">{title}</h2>
                {subtitle && <p className="text-sm text-emerald-100 hidden sm:block">{subtitle}</p>}
              </div>
              {actions && <div className="flex gap-2">{actions}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}