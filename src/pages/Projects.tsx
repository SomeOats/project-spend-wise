import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Project } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Projects = () => {
  const [projects, setProjects] = useLocalStorage<Project[]>('projects', []);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<Partial<Project>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.pvNumber || !formData.name || !formData.oracleAccount) {
      toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    if (editingProject) {
      setProjects(projects.map(p => p.pvNumber === editingProject.pvNumber ? formData as Project : p));
      toast({ title: 'Success', description: 'Project updated successfully' });
    } else {
      if (projects.some(p => p.pvNumber === formData.pvNumber)) {
        toast({ title: 'Error', description: 'A project with this PV Number already exists', variant: 'destructive' });
        return;
      }
      setProjects([...projects, formData as Project]);
      toast({ title: 'Success', description: 'Project added successfully' });
    }

    setIsDialogOpen(false);
    setEditingProject(null);
    setFormData({});
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData(project);
    setIsDialogOpen(true);
  };

  const handleDelete = (pvNumber: string) => {
    setProjects(projects.filter(p => p.pvNumber !== pvNumber));
    toast({ title: 'Success', description: 'Project deleted successfully' });
  };

  const openAddDialog = () => {
    setEditingProject(null);
    setFormData({});
    setIsDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-foreground">Projects</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog}>
                <Plus className="mr-2 h-4 w-4" /> Add Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingProject ? 'Edit Project' : 'Add Project'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="pvNumber">PV Number *</Label>
                  <Input
                    id="pvNumber"
                    value={formData.pvNumber || ''}
                    onChange={(e) => setFormData({ ...formData, pvNumber: e.target.value })}
                    disabled={!!editingProject}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="oracleAccount">Oracle Account *</Label>
                  <Input
                    id="oracleAccount"
                    value={formData.oracleAccount || ''}
                    onChange={(e) => setFormData({ ...formData, oracleAccount: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="budget">Budget</Label>
                  <Input
                    id="budget"
                    type="number"
                    step="0.01"
                    value={formData.budget || ''}
                    onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">{editingProject ? 'Update' : 'Add'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PV Number</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Oracle Account</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No projects found. Add your first project to get started.
                  </TableCell>
                </TableRow>
              ) : (
                projects.map((project) => (
                  <TableRow key={project.pvNumber}>
                    <TableCell className="font-medium">{project.pvNumber}</TableCell>
                    <TableCell>{project.name}</TableCell>
                    <TableCell>{project.oracleAccount}</TableCell>
                    <TableCell>${project.budget?.toFixed(2) || '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(project)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(project.pvNumber)}>
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

export default Projects;
