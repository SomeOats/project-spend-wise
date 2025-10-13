import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Actual, Resource, Project } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Actuals = () => {
  const [actuals, setActuals] = useLocalStorage<Actual[]>('actuals', []);
  const [resources] = useLocalStorage<Resource[]>('resources', []);
  const [projects] = useLocalStorage<Project[]>('projects', []);
  const [selectedYear] = useLocalStorage<number>('selectedYear', new Date().getFullYear());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Actual>>({});

  // Filter resources to only show those with end date >= selected year or no end date
  const activeResources = resources.filter(r => {
    if (!r.endDate) return true;
    const endYear = new Date(r.endDate).getFullYear();
    return endYear >= selectedYear;
  });

  // Filter actuals to only show those in the selected year
  const filteredActuals = actuals.filter(a => {
    const actualYear = new Date(a.month).getFullYear();
    return actualYear === selectedYear;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.resourceId || !formData.projectPvNumber || !formData.month || formData.capitalCost === undefined) {
      toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }

    const newActual: Actual = {
      ...formData as Actual,
      id: crypto.randomUUID(),
    };

    setActuals([...actuals, newActual]);
    setIsDialogOpen(false);
    setFormData({});
    toast({ title: 'Success', description: 'Actual added successfully' });
  };

  const handleDelete = (id: string) => {
    setActuals(actuals.filter(a => a.id !== id));
    toast({ title: 'Success', description: 'Actual deleted successfully' });
  };

  const getResourceName = (id: string) => resources.find(r => r.id === id)?.fullName || 'Unknown';
  const getProjectName = (pvNumber: string) => projects.find(p => p.pvNumber === pvNumber)?.name || 'Unknown';

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-foreground">Actuals</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Actual
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Actual</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Resource</Label>
                  <Select
                    value={formData.resourceId}
                    onValueChange={(value) => setFormData({ ...formData, resourceId: value })}
                  >
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
                  <Select
                    value={formData.projectPvNumber}
                    onValueChange={(value) => setFormData({ ...formData, projectPvNumber: value })}
                  >
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
                <div>
                  <Label htmlFor="month">Month</Label>
                  <Input
                    id="month"
                    type="month"
                    value={formData.month || ''}
                    onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="capitalCost">Capital Cost</Label>
                  <Input
                    id="capitalCost"
                    type="number"
                    step="0.01"
                    value={formData.capitalCost || ''}
                    onChange={(e) => setFormData({ ...formData, capitalCost: parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {activeResources.length === 0 || projects.length === 0 ? (
          <div className="rounded-md border p-8 text-center text-muted-foreground">
            {activeResources.length === 0 
              ? `No active resources available for ${selectedYear}. Resources must have an end date in or after ${selectedYear}.`
              : 'Please add resources and projects before entering actuals.'}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resource</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Capital Cost</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActuals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No actuals found for {selectedYear}. Add your first actual to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredActuals.map((actual) => (
                    <TableRow key={actual.id}>
                      <TableCell className="font-medium">{getResourceName(actual.resourceId)}</TableCell>
                      <TableCell>{getProjectName(actual.projectPvNumber)}</TableCell>
                      <TableCell>
                        {new Date(actual.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </TableCell>
                      <TableCell>${actual.capitalCost.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(actual.id)}>
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

export default Actuals;
