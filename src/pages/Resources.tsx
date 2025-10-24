import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Resource } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Resources = () => {
  const [resources, setResources] = useLocalStorage<Resource[]>('resources', []);
  const [selectedYear] = useLocalStorage<number>('selectedYear', new Date().getFullYear());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [formData, setFormData] = useState<Partial<Resource>>({});

  // Filter resources to only show those with end date >= selected year or no end date
  const displayedResources = resources.filter(r => {
    if (!r.endDate) return true;
    const endYear = new Date(r.endDate).getFullYear();
    return endYear >= selectedYear;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.id || !formData.fullName || !formData.rate || !formData.company) {
      toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    // Check for unique ID when adding new resource
    if (!editingResource) {
      const idExists = resources.some(r => r.id === formData.id);
      if (idExists) {
        toast({ title: 'Error', description: 'This ID already exists. Please use a unique ID.', variant: 'destructive' });
        return;
      }
    }

    if (editingResource) {
      setResources(resources.map(r => r.id === editingResource.id ? { ...formData as Resource, id: editingResource.id } : r));
      toast({ title: 'Success', description: 'Resource updated successfully' });
    } else {
      const newResource: Resource = {
        ...formData as Resource,
      };
      setResources([...resources, newResource]);
      toast({ title: 'Success', description: 'Resource added successfully' });
    }

    setIsDialogOpen(false);
    setEditingResource(null);
    setFormData({});
  };

  const handleEdit = (resource: Resource) => {
    setEditingResource(resource);
    setFormData(resource);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setResources(resources.filter(r => r.id !== id));
    toast({ title: 'Success', description: 'Resource deleted successfully' });
  };

  const openAddDialog = () => {
    setEditingResource(null);
    setFormData({ location: 'Onshore' });
    setIsDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-foreground">Resources</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog}>
                <Plus className="mr-2 h-4 w-4" /> Add Resource
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingResource ? 'Edit Resource' : 'Add Resource'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="id">ID *</Label>
                    <Input
                      id="id"
                      value={formData.id || ''}
                      onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                      disabled={!!editingResource}
                      required
                      placeholder="Enter unique ID"
                    />
                  </div>
                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName || ''}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="rate">Rate *</Label>
                    <Input
                      id="rate"
                      type="number"
                      step="0.01"
                      value={formData.rate || ''}
                      onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Select
                      value={formData.location}
                      onValueChange={(value: 'Onshore' | 'Offshore') => setFormData({ ...formData, location: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Onshore">Onshore</SelectItem>
                        <SelectItem value="Offshore">Offshore</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="company">Company *</Label>
                    <Input
                      id="company"
                      value={formData.company || ''}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate || ''}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate || ''}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">{editingResource ? 'Update' : 'Add'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedResources.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No active resources found for {selectedYear}. Resources must have an end date in or after {selectedYear}.
                  </TableCell>
                </TableRow>
              ) : (
                displayedResources.map((resource) => (
                  <TableRow key={resource.id}>
                    <TableCell className="font-medium">{resource.id}</TableCell>
                    <TableCell>{resource.fullName}</TableCell>
                    <TableCell>${resource.rate.toFixed(2)}</TableCell>
                    <TableCell>{resource.location}</TableCell>
                    <TableCell>{resource.company}</TableCell>
                    <TableCell>{resource.startDate || '-'}</TableCell>
                    <TableCell>{resource.endDate || '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(resource)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(resource.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
};

export default Resources;
