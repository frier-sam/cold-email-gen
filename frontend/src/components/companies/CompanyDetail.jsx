// frontend/src/components/companies/CompanyDetail.jsx (complete implementation)
import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { companies as companiesApi, emails as emailsApi } from '../../lib/api';
import { formatDate, truncateText } from '../../lib/utils';
import { Mail, ArrowLeft, Plus, ExternalLink } from 'lucide-react';

import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Skeleton } from '../ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

export function CompanyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [emails, setEmails] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEmail, setSelectedEmail] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const companyData = await companiesApi.getById(id);
        setCompany(companyData);
        
        const emailsData = await emailsApi.getByCompany(id);
        setEmails(emailsData);
        setError('');
      } catch (err) {
        setError('Failed to load company data. Please try again.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  const handleViewEmail = async (emailId) => {
    try {
      const email = await emailsApi.getById(emailId);
      setSelectedEmail(email);
    } catch (err) {
      setError('Failed to load email details. Please try again.');
      console.error(err);
    }
  };

  if (isLoading) {
    return <CompanyDetailSkeleton />;
  }

  if (!company) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Company not found</h2>
        <Button asChild>
          <Link to="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-3xl font-bold tracking-tight ml-2">{company.name}</h2>
        </div>
        <Button asChild>
          <Link to={`/companies/${id}/generate`}>
            <Mail className="mr-2 h-4 w-4" /> Generate New Email
          </Link>
        </Button>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="text-lg font-medium mb-2">Company Details</h3>
          <div className="border rounded-md p-4 space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Description</h4>
              <p>{company.description || "No description provided"}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Services</h4>
              {company.services && company.services.length > 0 ? (
                <ul className="list-disc list-inside">
                  {company.services.map((service, index) => (
                    <li key={index}>
                      <span className="font-medium">{service.name}</span>
                      {service.description && `: ${service.description}`}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No services defined</p>
              )}
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Created</h4>
              <p>{formatDate(company.created_at)}</p>
            </div>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-medium">Generated Emails</h3>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/companies/${id}/generate`}>
                <Plus className="mr-2 h-4 w-4" /> Create New
              </Link>
            </Button>
          </div>
          
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Target Company</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emails.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6">
                      <p className="text-gray-500">No emails generated yet</p>
                      <Button variant="outline" className="mt-2" asChild>
                        <Link to={`/companies/${id}/generate`}>
                          Generate your first email
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  emails.map(email => (
                    <TableRow key={email.id}>
                      <TableCell className="font-medium">{email.target_company_name}</TableCell>
                      <TableCell>{truncateText(email.subject, 30)}</TableCell>
                      <TableCell>{formatDate(email.created_at)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewEmail(email.id)}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
      
      {/* Email View Dialog */}
      <Dialog open={!!selectedEmail} onOpenChange={(open) => !open && setSelectedEmail(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedEmail?.subject}</DialogTitle>
            <DialogDescription>
              Generated for {selectedEmail?.target_company_name} ({formatDate(selectedEmail?.created_at)})
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 max-h-96 overflow-y-auto">
            <div className="whitespace-pre-wrap bg-gray-50 p-4 rounded-md border">
              {selectedEmail?.content}
            </div>
          </div>
          
          {selectedEmail?.contact_info && (
            <div className="mt-4 border rounded-md p-3 bg-gray-50">
              <h4 className="font-medium mb-1">Contact Information</h4>
              <div className="text-sm">
                {selectedEmail.contact_info.name && (
                  <p><span className="font-medium">Name:</span> {selectedEmail.contact_info.name}</p>
                )}
                {selectedEmail.contact_info.position && (
                  <p><span className="font-medium">Position:</span> {selectedEmail.contact_info.position}</p>
                )}
                {selectedEmail.contact_info.email && (
                  <p><span className="font-medium">Email:</span> {selectedEmail.contact_info.email}</p>
                )}
                {selectedEmail.contact_info.phone && (
                  <p><span className="font-medium">Phone:</span> {selectedEmail.contact_info.phone}</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CompanyDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-40" />
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Skeleton className="h-6 w-32 mb-2" />
          <div className="border rounded-md p-4 space-y-4">
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full mt-1" />
            </div>
            
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4 mt-1" />
            </div>
            
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-9 w-24" />
          </div>
          
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                  <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                  <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3].map(i => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}