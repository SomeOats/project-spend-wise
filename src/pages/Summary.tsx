import { Navigation } from '@/components/Navigation';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Forecast, Resource, Project } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const Summary = () => {
  const [forecasts] = useLocalStorage<Forecast[]>('forecasts', []);
  const [resources] = useLocalStorage<Resource[]>('resources', []);
  const [projects] = useLocalStorage<Project[]>('projects', []);
  const [selectedYear] = useLocalStorage<number>('selectedYear', new Date().getFullYear());

  // Filter resources to only show those with end date >= selected year or no end date
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
        
        // Only sum allocations for the selected year
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
        
        // Only sum allocations for the selected year
        const allocationTotal = Object.entries(forecast.allocations)
          .filter(([month]) => new Date(month).getFullYear() === selectedYear)
          .reduce((sum, [_, allocation]) => sum + (resource.rate * allocation) / 100, 0);
        
        return total + allocationTotal;
      }, 0);
  };

  const overallTotal = activeResources.reduce((total, resource) => 
    total + calculateTotalByResource(resource.id), 0
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Resource</TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeResources.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground">
                        No active resources available for {selectedYear}
                      </TableCell>
                    </TableRow>
                  ) : (
                    activeResources.map((resource) => {
                      const total = calculateTotalByResource(resource.id);
                      return (
                        <TableRow key={resource.id}>
                          <TableCell className="font-medium">{resource.fullName}</TableCell>
                          <TableCell className="text-right">${total.toFixed(2)}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Forecast by Project</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
                    <TableHead className="text-right">Budget</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        No projects available
                      </TableCell>
                    </TableRow>
                  ) : (
                    projects.map((project) => {
                      const total = calculateTotalByProject(project.pvNumber);
                      const isOverBudget = project.budget && total > project.budget;
                      return (
                        <TableRow key={project.pvNumber}>
                          <TableCell className="font-medium">{project.name}</TableCell>
                          <TableCell className={`text-right ${isOverBudget ? 'text-destructive font-semibold' : ''}`}>
                            ${total.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            {project.budget ? `$${project.budget.toFixed(2)}` : '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Summary;
