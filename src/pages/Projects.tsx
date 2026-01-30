import { useState, useMemo, useCallback } from 'react';
import { Navigation } from '@/components/Navigation';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Project } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';

const Projects = () => {
  const [projects, setProjects] = useLocalStorage<Project[]>('projects', []);
  const [selectedYear, setSelectedYear] = useLocalStorage<number>('selectedYear', new Date().getFullYear());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<Partial<Project>>({});

  const handleDownload = useCallback(() => {
    const blob = new Blob([JSON.stringify(projects, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'projects-export.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [projects]);

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

  const handleEdit = useCallback((project: Project) => {
    setEditingProject(project);
    setFormData(project);
    setIsDialogOpen(true);
  }, []);

  const handleDelete = useCallback((pvNumber: string) => {
    setProjects(projects.filter(p => p.pvNumber !== pvNumber));
    toast({ title: 'Success', description: 'Project deleted successfully' });
  }, [projects, setProjects]);

  const openAddDialog = () => {
    setEditingProject(null);
    setFormData({});
    setIsDialogOpen(true);
  };

  const columns: ColumnDef<Project>[] = useMemo(() => [
    {
      accessorKey: 'pvNumber',
      header: 'PV Number',
      cell: ({ row }) => <span className="font-medium">{row.original.pvNumber}</span>,
    },
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'oracleAccount',
      header: 'Oracle Account',
    },
    {
      accessorKey: 'budget',
      header: 'Budget',
      cell: ({ row }) => row.original.budget ? `$${row.original.budget.toFixed(2)}` : '-',
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <Button variant="ghost" size="icon" onClick={() => handleEdit(row.original)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(row.original.pvNumber)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ], [handleEdit, handleDelete]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation selectedYear={selectedYear} onYearChange={setSelectedYear} onDownload={handleDownload} />
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

        <DataTable
          columns={columns}
          data={projects}
          emptyMessage="No projects found. Add your first project to get started."
        />
      </main>
    </div>
  );
};

export default Projects;
