import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { companies } from '../../lib/api';
import { formatDate, truncateText } from '../../lib/utils';
import { EmptyState } from '../layout/EmptyState';
import { Building, Plus, Edit, Trash } from 'lucide-react';

import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

export function CompanyList() {
  const [companyList, setCompanyList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [companyToDelete, setCompanyToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setIsLoading(true);
    try {
      const data = await companies.getAll();
      setCompanyList(data);
      setError('');
    } catch (err) {
      setError('Failed to load companies. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCompany = async () => {
    if (!companyToDelete) return;
    
    setIsDeleting(true);
    try {
      await companies.delete(companyToDelete.id);
      setCompanyList(prevList => 
        prevList.filter(company => company.id !== companyToDelete.id)
      );
      setCompanyToDelete(null);
    } catch (err) {
      setError('Failed to delete company. Please try again.');
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (companyList.length === 0 && !isLoading) {
    return (
      <EmptyState
        title="No companies yet"
        description="Create your first company to start generating cold emails."
        buttonText="Add Company"
        buttonLink="/companies/new"
        icon={Building}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">My Companies</h2>
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
      
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {companyList.map(company => (
          <Card key={company.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle>{company.name}</CardTitle>
              <CardDescription>
                Added on {formatDate(company.created_at)}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-3">
              <p className="text-sm">
                {truncateText(company.description || 'No description provided', 120)}
              </p>
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Services:</h4>
                {company.services && company.services.length > 0 ? (
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    {company.services.map((service, index) => (
                      <li key={index}>{service.name}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No services defined</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between pt-0">
              <Button variant="ghost" size="sm" asChild>
                <Link to={`/companies/${company.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </Link>
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setCompanyToDelete(company)}
              >
                <Trash className="mr-2 h-4 w-4" /> Delete
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={!!companyToDelete} onOpenChange={() => setCompanyToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{companyToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCompanyToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCompany}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}