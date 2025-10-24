import { Navigation } from '@/components/Navigation';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Actual, Resource, Project, Forecast } from '@/types';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { addMonths, format, parse } from 'date-fns';

const Actuals = () => {
  const [actuals, setActuals] = useLocalStorage<Actual[]>('actuals', []);
  const [forecasts] = useLocalStorage<Forecast[]>('forecasts', []);
  const [resources] = useLocalStorage<Resource[]>('resources', []);
  const [projects] = useLocalStorage<Project[]>('projects', []);
  const [selectedYear] = useLocalStorage<number>('selectedYear', new Date().getFullYear());

  const getResourceName = (id: string) => resources.find(r => r.id === id)?.fullName || 'Unknown';
  const getProjectName = (pvNumber: string) => projects.find(p => p.pvNumber === pvNumber)?.name || 'Unknown';

  // Generate all 12 months for the selected year
  const months = Array.from({ length: 12 }, (_, i) => {
    const month = (i + 1).toString().padStart(2, '0');
    return `${selectedYear}-${month}`;
  });

  // Get the previous month for a given month string (YYYY-MM)
  const getPreviousMonth = (monthStr: string): string => {
    const date = parse(monthStr, 'yyyy-MM', new Date());
    const prevDate = addMonths(date, -1);
    return format(prevDate, 'yyyy-MM');
  };

  // Get actual value for a specific resource/project/month combination
  const getActualValue = (resourceId: string, projectPvNumber: string, month: string): number | undefined => {
    const actual = actuals.find(
      a => a.resourceId === resourceId && a.projectPvNumber === projectPvNumber && a.month === month
    );
    return actual?.capitalCost;
  };

  // Update or create an actual entry, or delete if value is null
  const handleActualChange = (resourceId: string, projectPvNumber: string, month: string, value: number | null) => {
    const existingActual = actuals.find(
      a => a.resourceId === resourceId && a.projectPvNumber === projectPvNumber && a.month === month
    );

    // If value is null or empty, delete the actual entry
    if (value === null) {
      if (existingActual) {
        setActuals(actuals.filter(a => a.id !== existingActual.id));
      }
      return;
    }

    // Otherwise, update or create the actual entry
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
  };

  // Get all unique resource-project combinations from forecasts
  const getUniqueResourceProjectCombos = () => {
    const combos = new Map<string, { resourceId: string; projectPvNumber: string }>();
    
    forecasts.forEach(forecast => {
      const key = `${forecast.resourceId}-${forecast.projectPvNumber}`;
      combos.set(key, {
        resourceId: forecast.resourceId,
        projectPvNumber: forecast.projectPvNumber,
      });
    });
    
    return Array.from(combos.values());
  };

  // Check if a forecast has allocation for a given month
  const hasForecastForMonth = (resourceId: string, projectPvNumber: string, forecastMonth: string): boolean => {
    const forecast = forecasts.find(
      f => f.resourceId === resourceId && f.projectPvNumber === projectPvNumber
    );
    
    if (!forecast) return false;
    
    const allocation = forecast.allocations[forecastMonth];
    return allocation !== undefined && allocation > 0;
  };

  const uniqueCombos = getUniqueResourceProjectCombos();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
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
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-card z-10">Resource</TableHead>
                  <TableHead className="sticky left-0 bg-card z-10">Project</TableHead>
                  {months.map((month) => {
                    const prevMonth = getPreviousMonth(month);
                    return (
                      <TableHead key={month} className="text-center min-w-[150px]">
                        {new Date(month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        <div className="text-xs font-normal text-muted-foreground">
                          (Forecast: {new Date(prevMonth).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })})
                        </div>
                      </TableHead>
                    );
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {uniqueCombos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={months.length + 2} className="text-center text-muted-foreground">
                      No forecast allocations found. Actuals will appear when forecasts are added.
                    </TableCell>
                  </TableRow>
                ) : (
                  uniqueCombos.map((combo) => (
                    <TableRow key={`${combo.resourceId}-${combo.projectPvNumber}`}>
                      <TableCell className="sticky left-0 bg-card font-medium">
                        {getResourceName(combo.resourceId)}
                      </TableCell>
                      <TableCell className="sticky left-0 bg-card">
                        {getProjectName(combo.projectPvNumber)}
                      </TableCell>
                      {months.map((actualMonth) => {
                        const forecastMonth = getPreviousMonth(actualMonth);
                        const hasForecast = hasForecastForMonth(combo.resourceId, combo.projectPvNumber, forecastMonth);

                        if (!hasForecast) {
                          return <TableCell key={actualMonth} className="text-center bg-muted/30" />;
                        }

                        const actualValue = getActualValue(combo.resourceId, combo.projectPvNumber, actualMonth);

                        return (
                          <TableCell key={actualMonth} className="text-center">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={actualValue ?? ''}
                              onChange={(e) => {
                                const inputValue = e.target.value;
                                // If empty, set to null to delete the actual
                                if (inputValue === '' || inputValue === null) {
                                  handleActualChange(combo.resourceId, combo.projectPvNumber, actualMonth, null);
                                } else {
                                  const value = parseFloat(inputValue);
                                  if (!isNaN(value) && value >= 0) {
                                    handleActualChange(combo.resourceId, combo.projectPvNumber, actualMonth, value);
                                  }
                                }
                              }}
                              className="w-full text-center"
                              placeholder="0.00"
                            />
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
    </div>
  );
};

export default Actuals;
