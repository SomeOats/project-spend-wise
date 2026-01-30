import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

const tabs = [
  { name: 'Forecasts', path: '/forecasts' },
  { name: 'Resources', path: '/resources' },
  { name: 'Projects', path: '/projects' },
  { name: 'Actuals', path: '/actuals' },
  { name: 'Summary', path: '/summary' },
];

interface NavigationProps {
  selectedYear: number;
  onYearChange: (year: number) => void;
  onDownload: () => void;
}

export const Navigation = ({ selectedYear, onYearChange, onDownload }: NavigationProps) => {
  const location = useLocation();

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
            <Select value={selectedYear.toString()} onValueChange={(value) => onYearChange(parseInt(value))}>
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
            <Button variant="ghost" size="icon" onClick={onDownload} title="Download data as JSON">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
