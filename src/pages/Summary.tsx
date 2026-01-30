import { useMemo, useCallback } from 'react';
import { Navigation } from '@/components/Navigation';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Forecast, Resource, Project, Actual } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';

interface ResourceSummary {
  id: string;
  fullName: string;
  totalCost: number;
}

interface ProjectSummary {
  pvNumber: string;
  name: string;
  totalCost: number;
  budget: number | undefined;
  isOverBudget: boolean;
}

const Summary = () => {
  const [forecasts] = useLocalStorage<Forecast[]>('forecasts', []);
  const [resources] = useLocalStorage<Resource[]>('resources', []);
  const [projects] = useLocalStorage<Project[]>('projects', []);
  const [actuals] = useLocalStorage<Actual[]>('actuals', []);
  const [selectedYear, setSelectedYear] = useLocalStorage<number>('selectedYear', new Date().getFullYear());

  const handleDownload = useCallback(() => {
    const data = { forecasts, resources, projects, actuals };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'summary-export.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [forecasts, resources, projects, actuals]);

  const activeResources = resources.filter(r => {
    if (!r.endDate) return true;
    const endYear = new Date(r.endDate).getFullYear();
    return endYear >= selectedYear;
  });

  const calculateTotalByResource = (resourceId: string): number => {
    return forecasts
      .filter(f => f.resourceId === resourceId)
      .reduce((total, forecast) => {
        const resource = resources.find(r => r.id === resourceId);
        if (!resource) return total;
        
        const allocationTotal = Object.entries(forecast.allocations)
          .filter(([month]) => new Date(month).getFullYear() === selectedYear)
          .reduce((sum, [_, allocation]) => sum + (resource.rate * allocation) / 100, 0);
        
        return total + allocationTotal;
      }, 0);
  };

  const calculateTotalByProject = (projectPvNumber: string): number => {
    return forecasts
      .filter(f => f.projectPvNumber === projectPvNumber)
      .reduce((total, forecast) => {
        const resource = resources.find(r => r.id === forecast.resourceId);
        if (!resource) return total;
        
        const allocationTotal = Object.entries(forecast.allocations)
          .filter(([month]) => new Date(month).getFullYear() === selectedYear)
          .reduce((sum, [_, allocation]) => sum + (resource.rate * allocation) / 100, 0);
        
        return total + allocationTotal;
      }, 0);
  };

  const overallTotal = activeResources.reduce((total, resource) => 
    total + calculateTotalByResource(resource.id), 0
  );

  const resourceSummaryData: ResourceSummary[] = useMemo(() => 
    activeResources.map(resource => ({
      id: resource.id,
      fullName: resource.fullName,
      totalCost: calculateTotalByResource(resource.id),
    })), [activeResources, forecasts, selectedYear]);

  const projectSummaryData: ProjectSummary[] = useMemo(() => 
    projects.map(project => {
      const totalCost = calculateTotalByProject(project.pvNumber);
      return {
        pvNumber: project.pvNumber,
        name: project.name,
        totalCost,
        budget: project.budget,
        isOverBudget: project.budget ? totalCost > project.budget : false,
      };
    }), [projects, forecasts, resources, selectedYear]);

  const resourceColumns: ColumnDef<ResourceSummary>[] = useMemo(() => [
    {
      accessorKey: 'fullName',
      header: 'Resource',
      cell: ({ row }) => <span className="font-medium">{row.original.fullName}</span>,
    },
    {
      accessorKey: 'totalCost',
      header: () => <div className="text-right">Total Cost</div>,
      cell: ({ row }) => <div className="text-right">${row.original.totalCost.toFixed(2)}</div>,
    },
  ], []);

  const projectColumns: ColumnDef<ProjectSummary>[] = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Project',
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: 'totalCost',
      header: () => <div className="text-right">Total Cost</div>,
      cell: ({ row }) => (
        <div className={`text-right ${row.original.isOverBudget ? 'text-destructive font-semibold' : ''}`}>
          ${row.original.totalCost.toFixed(2)}
        </div>
      ),
    },
    {
      accessorKey: 'budget',
      header: () => <div className="text-right">Budget</div>,
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.budget ? `$${row.original.budget.toFixed(2)}` : '-'}
        </div>
      ),
    },
  ], []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation selectedYear={selectedYear} onYearChange={setSelectedYear} onDownload={handleDownload} />
      <main className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-foreground mb-6">Summary</h2>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Total Forecasted</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">${overallTotal.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Active Resources ({selectedYear})</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{activeResources.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Active Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{projects.length}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Forecast by Resource</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={resourceColumns}
                data={resourceSummaryData}
                emptyMessage={`No active resources available for ${selectedYear}`}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Forecast by Project</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={projectColumns}
                data={projectSummaryData}
                emptyMessage="No projects available"
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Summary;
