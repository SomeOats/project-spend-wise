import { useState } from 'react';
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

const Forecasts = () => {
  const [forecasts, setForecasts] = useLocalStorage<Forecast[]>('forecasts', []);
  const [resources] = useLocalStorage<Resource[]>('resources', []);
  const [projects] = useLocalStorage<Project[]>('projects', []);
  const [selectedYear] = useLocalStorage<number>('selectedYear', new Date().getFullYear());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [monthInput, setMonthInput] = useState('');
  const [allocationInput, setAllocationInput] = useState('');

  // Filter resources to only show those with end date >= selected year or no end date
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

  const handleDelete = (id: string) => {
    setForecasts(forecasts.filter(f => f.id !== id));
    toast({ title: 'Success', description: 'Forecast deleted successfully' });
  };

  const handleAllocationChange = (forecastId: string, month: string, allocation: number) => {
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
  };

  const calculateMonthlyCost = (forecast: Forecast, month: string): number => {
    const resource = resources.find(r => r.id === forecast.resourceId);
    const allocation = forecast.allocations[month] || 0;
    if (!resource) return 0;
    return (resource.rate * allocation) / 100;
  };

  const getResourceName = (id: string) => resources.find(r => r.id === id)?.fullName || 'Unknown';
  const getProjectName = (pvNumber: string) => projects.find(p => p.pvNumber === pvNumber)?.name || 'Unknown';

  // Generate all 12 months for the selected year
  const months = Array.from({ length: 12 }, (_, i) => {
    const month = (i + 1).toString().padStart(2, '0');
    return `${selectedYear}-${month}`;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
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
          <div className="border rounded overflow-auto max-h-[calc(100vh-200px)]">
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 z-20 bg-muted">
                <tr>
                  <th className="sticky left-0 z-30 bg-muted border border-border px-2 py-1 text-left font-medium min-w-[150px]">
                    Resource
                  </th>
                  <th className="sticky left-[150px] z-30 bg-muted border border-border px-2 py-1 text-left font-medium min-w-[150px]">
                    Project
                  </th>
                  {months.map((month) => (
                    <th key={month} className="border border-border px-2 py-1 text-center font-medium min-w-[100px]">
                      <div>{new Date(month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
                      <div className="text-xs font-normal text-muted-foreground">% / Cost</div>
                    </th>
                  ))}
                  <th className="border border-border px-2 py-1 text-center font-medium w-[60px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {forecasts.length === 0 ? (
                  <tr>
                    <td colSpan={months.length + 3} className="border border-border px-2 py-4 text-center text-muted-foreground">
                      No forecasts found. Add your first forecast to get started.
                    </td>
                  </tr>
                ) : (
                  forecasts.map((forecast) => (
                    <tr key={forecast.id} className="hover:bg-muted/50">
                      <td className="sticky left-0 z-10 bg-background border border-border px-2 py-1 font-medium">
                        {getResourceName(forecast.resourceId)}
                      </td>
                      <td className="sticky left-[150px] z-10 bg-background border border-border px-2 py-1">
                        {getProjectName(forecast.projectPvNumber)}
                      </td>
                      {months.map((month) => (
                        <td key={month} className="border border-border px-1 py-0.5 text-center">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={forecast.allocations[month] || ''}
                            onChange={(e) =>
                              handleAllocationChange(forecast.id, month, parseFloat(e.target.value) || 0)
                            }
                            className="h-7 w-full text-center border-0 bg-transparent p-0 text-sm focus-visible:ring-1"
                            placeholder="0"
                          />
                          <div className="text-xs text-muted-foreground">
                            ${calculateMonthlyCost(forecast, month).toFixed(2)}
                          </div>
                        </td>
                      ))}
                      <td className="border border-border px-1 py-0.5 text-center">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(forecast.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default Forecasts;
