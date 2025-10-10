import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Forecast, Resource, Project } from '@/types';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [monthInput, setMonthInput] = useState('');
  const [allocationInput, setAllocationInput] = useState('');

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

  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() + i);
    return date.toISOString().slice(0, 7);
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
                      {resources.map((resource) => (
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

        {resources.length === 0 || projects.length === 0 ? (
          <div className="rounded-md border p-8 text-center text-muted-foreground">
            Please add resources and projects before creating forecasts.
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-card z-10">Resource</TableHead>
                  <TableHead className="sticky left-0 bg-card z-10">Project</TableHead>
                  {months.map((month) => (
                    <TableHead key={month} className="text-center min-w-[150px]">
                      {new Date(month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      <div className="text-xs font-normal text-muted-foreground">% / Cost</div>
                    </TableHead>
                  ))}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forecasts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={months.length + 3} className="text-center text-muted-foreground">
                      No forecasts found. Add your first forecast to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  forecasts.map((forecast) => (
                    <TableRow key={forecast.id}>
                      <TableCell className="sticky left-0 bg-card font-medium">
                        {getResourceName(forecast.resourceId)}
                      </TableCell>
                      <TableCell className="sticky left-0 bg-card">
                        {getProjectName(forecast.projectPvNumber)}
                      </TableCell>
                      {months.map((month) => (
                        <TableCell key={month} className="text-center">
                          <div className="flex flex-col gap-1">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={forecast.allocations[month] || ''}
                              onChange={(e) =>
                                handleAllocationChange(forecast.id, month, parseFloat(e.target.value) || 0)
                              }
                              className="w-full text-center"
                              placeholder="0"
                            />
                            <div className="text-xs text-muted-foreground">
                              ${calculateMonthlyCost(forecast, month).toFixed(2)}
                            </div>
                          </div>
                        </TableCell>
                      ))}
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(forecast.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
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

export default Forecasts;
