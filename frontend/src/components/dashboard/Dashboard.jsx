// frontend/src/components/dashboard/Dashboard.jsx (complete implementation)
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { companies as companiesApi, users as usersApi } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import { Building, Plus } from 'lucide-react';

import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Progress } from '../ui/progress';
import { Skeleton } from '../ui/skeleton';

export function Dashboard() {
  const [companies, setCompanies] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [companiesData, statsData] = await Promise.all([
          companiesApi.getAll(),
          usersApi.getStats()
        ]);
        setCompanies(companiesData);
        setStats(statsData);
        setError('');
      } catch (err) {
        setError('Failed to load dashboard data. Please try again.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <Button asChild>
          <Link to="/companies/new">
            <Plus className="mr-2 h-4 w-4" /> Add Company
          </Link>
        </Button>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stats && (
          <>
            <StatsCard
              title="Companies"
              current={stats.companies.used}
              max={stats.companies.total}
              description={`${stats.companies.remaining} companies remaining`}
            />
            
            <StatsCard
              title="Daily Emails"
              current={stats.emails.used_today}
              max={stats.emails.total_per_day}
              description={`${stats.emails.remaining_today} emails remaining today`}
            />
          </>
        )}
      </div>
      
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company Name</TableHead>
              <TableHead>Services</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <div className="flex flex-col items-center justify-center">
                    <Building className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-gray-500 mb-4">No companies yet</p>
                    <Button asChild>
                      <Link to="/companies/new">
                        <Plus className="mr-2 h-4 w-4" /> Add Company
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              companies.map(company => (
                <TableRow key={company.id} className="cursor-pointer hover:bg-gray-50">
                  <TableCell className="font-medium">
                    <Link to={`/companies/${company.id}`} className="hover:underline">
                      {company.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {company.services && company.services.length > 0 ? (
                      <span>
                        {company.services.map(service => service.name).join(', ')}
                      </span>
                    ) : (
                      <span className="text-gray-500">No services defined</span>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(company.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" asChild>
                        <Link to={`/companies/${company.id}/generate`}>
                          Generate Emails
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/companies/${company.id}/edit`}>
                          Edit
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function StatsCard({ title, current, max, description }) {
  const percentage = Math.round((current / max) * 100);
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {current} / {max}
        </div>
        <Progress 
          value={percentage} 
          className="h-2 mt-2 mb-1" 
        />
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-32" />
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2].map(i => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-2 w-full mb-1" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><Skeleton className="h-4 w-24" /></TableHead>
              <TableHead><Skeleton className="h-4 w-24" /></TableHead>
              <TableHead><Skeleton className="h-4 w-24" /></TableHead>
              <TableHead className="text-right"><Skeleton className="h-4 w-24 ml-auto" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3].map(i => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Skeleton className="h-9 w-28" />
                    <Skeleton className="h-9 w-16" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}