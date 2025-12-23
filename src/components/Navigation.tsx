import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Forecast, Resource, Project, Actual } from '@/types';

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
  const [forecasts] = useLocalStorage<Forecast[]>('forecasts', []);
  const [resources] = useLocalStorage<Resource[]>('resources', []);
  const [projects] = useLocalStorage<Project[]>('projects', []);
  const [actuals] = useLocalStorage<Actual[]>('actuals', []);

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);

  const getTabName = () => {
    const tab = tabs.find(t => t.path === location.pathname);
    return tab?.name.toLowerCase() || 'data';
  };

  const handleDownload = () => {
    let data: unknown;
    const tabName = getTabName();

    switch (location.pathname) {
      case '/forecasts':
        data = forecasts;
        break;
      case '/resources':
        data = resources;
        break;
      case '/projects':
        data = projects;
        break;
      case '/actuals':
        data = actuals;
        break;
      case '/summary':
        data = { forecasts, resources, projects, actuals };
        break;
      default:
        data = { forecasts, resources, projects, actuals };
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${tabName}-export.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };


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
            <Button variant="ghost" size="icon" onClick={handleDownload} title="Download data as JSON">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
