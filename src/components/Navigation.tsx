import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const tabs = [
  { name: 'Forecasts', path: '/forecasts' },
  { name: 'Resources', path: '/resources' },
  { name: 'Projects', path: '/projects' },
  { name: 'Actuals', path: '/actuals' },
  { name: 'Summary', path: '/summary' },
];

export const Navigation = () => {
  const location = useLocation();

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <h1 className="text-xl font-semibold text-foreground">Capital Forecast Tracker</h1>
          <div className="flex space-x-1">
            {tabs.map((tab) => (
              <Link
                key={tab.path}
                to={tab.path}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                  location.pathname === tab.path
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                {tab.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};
