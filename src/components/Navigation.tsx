import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const tabs = [
  { name: 'Forecasts', path: '/forecasts' },
  { name: 'Resources', path: '/resources' },
  { name: 'Projects', path: '/projects' },
  { name: 'Actuals', path: '/actuals' },
  { name: 'Summary', path: '/summary' },
];

export const Navigation = () => {
  const location = useLocation();
  const [selectedYear, setSelectedYear] = useLocalStorage<number>('selectedYear', new Date().getFullYear());

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <h1 className="text-xl font-semibold text-foreground">Capital Forecast Tracker</h1>
          <div className="flex items-center gap-4">
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
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </nav>
  );
};
