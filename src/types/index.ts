export type Location = 'Onshore' | 'Offshore';

export interface Resource {
  id: string;
  fullName: string;
  rate: number;
  location: Location;
  company: string;
  startDate: string;
  endDate: string;
}

export interface Project {
  pvNumber: string;
  name: string;
  oracleAccount: string;
  budget: number;
}

export interface MonthlyAllocation {
  [month: string]: number; // month in format 'YYYY-MM', value is percentage (0-100)
}

export interface Forecast {
  id: string;
  resourceId: string;
  projectPvNumber: string;
  allocations: MonthlyAllocation;
}

export interface Actual {
  id: string;
  resourceId: string;
  projectPvNumber: string;
  month: string; // format 'YYYY-MM'
  capitalCost: number;
}
