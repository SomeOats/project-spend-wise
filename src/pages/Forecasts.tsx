import { useState, useMemo, useCallback } from 'react';
import { Navigation } from '@/components/Navigation';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Forecast, Resource, Project } from '@/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Trash2, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';

const Forecasts = () => {
  const [forecasts, setForecasts] = useLocalStorage<Forecast[]>('forecasts', []);
  const [resources] = useLocalStorage<Resource[]>('resources', []);
  const [projects] = useLocalStorage<Project[]>('projects', []);
  const [selectedYear, setSelectedYear] = useLocalStorage<number>('selectedYear', new Date().getFullYear());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState('');
  const [selectedProject, setSelectedProject] = useState('');

  const handleDownload = useCallback(() => {
    const blob = new Blob([JSON.stringify(forecasts, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'forecasts-export.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [forecasts]);

  const activeResources = resources.filter(r => {
    if (!r.endDate) return true;
    const endYear = new Date(r.endDate).getFullYear();
    return endYear >= selectedYear;
  });

  const handleAddForecast = () => {
    if (!selectedResource || !selectedProject) {
      toast({ title: 'Error', description: 'Please select a resource and project', variant: 'destructive' });
      return;
    }

    const existingForecast = forecasts.find(
      f => f.resourceId === selectedResource && f.projectPvNumber === selectedProject
    );

    if (existingForecast) {
      toast({ title: 'Error', description: 'This resource is already assigned to this project', variant: 'destructive' });
      return;
    }

    const newForecast: Forecast = {
      id: crypto.randomUUID(),
      resourceId: selectedResource,
      projectPvNumber: selectedProject,
      allocations: {},
    };

    setForecasts([...forecasts, newForecast]);
    setIsDialogOpen(false);
    setSelectedResource('');
    setSelectedProject('');
    toast({ title: 'Success', description: 'Forecast added successfully' });
  };

  const handleDelete = useCallback((id: string) => {
    setForecasts(forecasts.filter(f => f.id !== id));
    toast({ title: 'Success', description: 'Forecast deleted successfully' });
  }, [forecasts, setForecasts]);

  const handleAllocationChange = useCallback((forecastId: string, month: string, allocation: number) => {
    setForecasts(forecasts.map(f => {
      if (f.id === forecastId) {
        return {
          ...f,
          allocations: {
            ...f.allocations,
            [month]: Math.min(100, Math.max(0, allocation)),
          },
        };
      }
      return f;
    }));
  }, [forecasts, setForecasts]);

  const calculateMonthlyCost = (forecast: Forecast, month: string): number => {
    const resource = resources.find(r => r.id === forecast.resourceId);
    const allocation = forecast.allocations[month] || 0;
    if (!resource) return 0;
    return (resource.rate * allocation) / 100;
  };

  const getResourceName = (id: string) => resources.find(r => r.id === id)?.fullName || 'Unknown';
  const getProjectName = (pvNumber: string) => projects.find(p => p.pvNumber === pvNumber)?.name || 'Unknown';

  const months = Array.from({ length: 12 }, (_, i) => {
    const month = (i + 1).toString().padStart(2, '0');
    return `${selectedYear}-${month}`;
  });

  const columns: ColumnDef<Forecast>[] = useMemo(() => [
    {
      accessorKey: 'resourceId',
      header: 'Resource',
      cell: ({ row }) => <span className="font-medium">{getResourceName(row.original.resourceId)}</span>,
    },
    {
      accessorKey: 'projectPvNumber',
      header: 'Project',
      cell: ({ row }) => getProjectName(row.original.projectPvNumber),
    },
    ...months.map((month): ColumnDef<Forecast> => ({
      id: month,
      header: () => (
        <div className="text-center min-w-[100px]">
          <div>{new Date(month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
          <div className="text-xs font-normal text-muted-foreground">% / Cost</div>
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-center">
          <Input
            type="number"
            min="0"
            max="100"
            value={row.original.allocations[month] || ''}
            onChange={(e) =>
              handleAllocationChange(row.original.id, month, parseFloat(e.target.value) || 0)
            }
            className="h-7 w-full text-center border-0 bg-transparent p-0 text-sm focus-visible:ring-1"
            placeholder="0"
          />
          <div className="text-xs text-muted-foreground">
            ${calculateMonthlyCost(row.original, month).toFixed(2)}
          </div>
        </div>
      ),
    })),
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(row.original.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ], [months, resources, projects, handleAllocationChange, handleDelete]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation selectedYear={selectedYear} onYearChange={setSelectedYear} onDownload={handleDownload} />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-foreground">Forecasts</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Forecast
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Forecast</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Resource</Label>
                  <Select value={selectedResource} onValueChange={setSelectedResource}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select resource" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeResources.map((resource) => (
                        <SelectItem key={resource.id} value={resource.id}>
                          {resource.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Project</Label>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.pvNumber} value={project.pvNumber}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddForecast}>Add</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {activeResources.length === 0 || projects.length === 0 ? (
          <div className="rounded-md border p-8 text-center text-muted-foreground">
            {activeResources.length === 0 
              ? `No active resources available for ${selectedYear}. Resources must have an end date in or after ${selectedYear}.`
              : 'Please add resources and projects before creating forecasts.'}
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={forecasts}
            emptyMessage="No forecasts found. Add your first forecast to get started."
            stickyHeader
            maxHeight="calc(100vh - 200px)"
          />
        )}
      </main>
    </div>
  );
};

export default Forecasts;
