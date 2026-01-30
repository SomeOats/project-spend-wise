import { useMemo, useCallback } from 'react';
import { Navigation } from '@/components/Navigation';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Actual, Resource, Project, Forecast } from '@/types';
import { Input } from '@/components/ui/input';
import { addMonths, format, parse } from 'date-fns';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';

interface ActualRow {
  resourceId: string;
  projectPvNumber: string;
  resourceName: string;
  projectName: string;
}

const Actuals = () => {
  const [actuals, setActuals] = useLocalStorage<Actual[]>('actuals', []);
  const [forecasts] = useLocalStorage<Forecast[]>('forecasts', []);
  const [resources] = useLocalStorage<Resource[]>('resources', []);
  const [projects] = useLocalStorage<Project[]>('projects', []);
  const [selectedYear, setSelectedYear] = useLocalStorage<number>('selectedYear', new Date().getFullYear());

  const handleDownload = useCallback(() => {
    const blob = new Blob([JSON.stringify(actuals, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'actuals-export.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [actuals]);

  const getResourceName = (id: string) => resources.find(r => r.id === id)?.fullName || 'Unknown';
  const getProjectName = (pvNumber: string) => projects.find(p => p.pvNumber === pvNumber)?.name || 'Unknown';

  const months = Array.from({ length: 12 }, (_, i) => {
    const month = (i + 1).toString().padStart(2, '0');
    return `${selectedYear}-${month}`;
  });

  const getPreviousMonth = (monthStr: string): string => {
    const date = parse(monthStr, 'yyyy-MM', new Date());
    const prevDate = addMonths(date, -1);
    return format(prevDate, 'yyyy-MM');
  };

  const getActualValue = (resourceId: string, projectPvNumber: string, month: string): number | undefined => {
    const actual = actuals.find(
      a => a.resourceId === resourceId && a.projectPvNumber === projectPvNumber && a.month === month
    );
    return actual?.capitalCost;
  };

  const handleActualChange = useCallback((resourceId: string, projectPvNumber: string, month: string, value: number | null) => {
    const existingActual = actuals.find(
      a => a.resourceId === resourceId && a.projectPvNumber === projectPvNumber && a.month === month
    );

    if (value === null) {
      if (existingActual) {
        setActuals(actuals.filter(a => a.id !== existingActual.id));
      }
      return;
    }

    if (existingActual) {
      setActuals(actuals.map(a => 
        a.id === existingActual.id ? { ...a, capitalCost: value } : a
      ));
    } else {
      const newActual: Actual = {
        id: crypto.randomUUID(),
        resourceId,
        projectPvNumber,
        month,
        capitalCost: value,
      };
      setActuals([...actuals, newActual]);
    }
  }, [actuals, setActuals]);

  const hasForecastForMonth = (resourceId: string, projectPvNumber: string, forecastMonth: string): boolean => {
    const forecast = forecasts.find(
      f => f.resourceId === resourceId && f.projectPvNumber === projectPvNumber
    );
    
    if (!forecast) return false;
    
    const allocation = forecast.allocations[forecastMonth];
    return allocation !== undefined && allocation > 0;
  };

  const uniqueCombos: ActualRow[] = useMemo(() => {
    const combos = new Map<string, ActualRow>();
    
    forecasts.forEach(forecast => {
      const key = `${forecast.resourceId}-${forecast.projectPvNumber}`;
      combos.set(key, {
        resourceId: forecast.resourceId,
        projectPvNumber: forecast.projectPvNumber,
        resourceName: getResourceName(forecast.resourceId),
        projectName: getProjectName(forecast.projectPvNumber),
      });
    });
    
    return Array.from(combos.values());
  }, [forecasts, resources, projects]);

  const columns: ColumnDef<ActualRow>[] = useMemo(() => [
    {
      accessorKey: 'resourceName',
      header: 'Resource',
      cell: ({ row }) => <span className="font-medium">{row.original.resourceName}</span>,
    },
    {
      accessorKey: 'projectName',
      header: 'Project',
    },
    ...months.map((actualMonth): ColumnDef<ActualRow> => {
      const prevMonth = getPreviousMonth(actualMonth);
      return {
        id: actualMonth,
        header: () => (
          <div className="text-center min-w-[150px]">
            {new Date(actualMonth).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            <div className="text-xs font-normal text-muted-foreground">
              (Forecast: {new Date(prevMonth).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })})
            </div>
          </div>
        ),
        cell: ({ row }) => {
          const forecastMonth = getPreviousMonth(actualMonth);
          const hasForecast = hasForecastForMonth(row.original.resourceId, row.original.projectPvNumber, forecastMonth);

          if (!hasForecast) {
            return <div className="bg-muted/30 h-full" />;
          }

          const actualValue = getActualValue(row.original.resourceId, row.original.projectPvNumber, actualMonth);

          return (
            <Input
              type="number"
              step="0.01"
              min="0"
              value={actualValue ?? ''}
              onChange={(e) => {
                const inputValue = e.target.value;
                if (inputValue === '' || inputValue === null) {
                  handleActualChange(row.original.resourceId, row.original.projectPvNumber, actualMonth, null);
                } else {
                  const value = parseFloat(inputValue);
                  if (!isNaN(value) && value >= 0) {
                    handleActualChange(row.original.resourceId, row.original.projectPvNumber, actualMonth, value);
                  }
                }
              }}
              className="w-full text-center"
              placeholder="0.00"
            />
          );
        },
      };
    }),
  ], [months, actuals, forecasts, handleActualChange]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation selectedYear={selectedYear} onYearChange={setSelectedYear} onDownload={handleDownload} />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-foreground">Actuals</h2>
          <p className="text-sm text-muted-foreground">
            Actuals for each month correspond to forecasts from the previous month
          </p>
        </div>

        {forecasts.length === 0 ? (
          <div className="rounded-md border p-8 text-center text-muted-foreground">
            No forecasts available. Please create forecasts before entering actuals.
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={uniqueCombos}
            emptyMessage="No forecast allocations found. Actuals will appear when forecasts are added."
          />
        )}
      </main>
    </div>
  );
};

export default Actuals;
