import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { emails } from '../../lib/api';
import { formatDate, truncateText, extractDomain } from '../../lib/utils';
import { EmptyState } from '../layout/EmptyState';
import { Mail, ExternalLink, Trash, Copy } from 'lucide-react';

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

export function EmailList() {
  const [emailList, setEmailList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [emailToDelete, setEmailToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchEmails();
  }, []);

  const fetchEmails = async () => {
    setIsLoading(true);
    try {
      const data = await emails.getAll();
      setEmailList(data);
      setError('');
    } catch (err) {
      setError('Failed to load emails. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewEmail = async (id) => {
    try {
      const email = await emails.getById(id);
      setSelectedEmail(email);
    } catch (err) {
      setError('Failed to load email details. Please try again.');
      console.error(err);
    }
  };

  const handleDeleteEmail = async () => {
    if (!emailToDelete) return;
    
    setIsDeleting(true);
    try {
      await emails.delete(emailToDelete.id);
      setEmailList(prevList => 
        prevList.filter(email => email.id !== emailToDelete.id)
      );
      setEmailToDelete(null);
      
      if (selectedEmail && selectedEmail.id === emailToDelete.id) {
        setSelectedEmail(null);
      }
    } catch (err) {
      setError('Failed to delete email. Please try again.');
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard!');
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccess('');
    }, 3000);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (emailList.length === 0 && !isLoading) {
    return (
      <EmptyState
        title="No emails generated yet"
        description="Generate your first cold email to see it here."
        buttonText="Generate Email"
        buttonLink="/email-generator"
        icon={Mail}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Generated Emails</h2>
        <Button asChild>
          <Link to="/email-generator">
            <Mail className="mr-2 h-4 w-4" /> Generate New Email
          </Link>
        </Button>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}
      
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Target Company</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {emailList.map(email => (
              <TableRow key={email.id}>
                <TableCell className="font-medium">
                  {email.target_company_name}
                  <div className="text-xs text-gray-500">
                    {extractDomain(email.target_company_website)}
                  </div>
                </TableCell>
                <TableCell>{truncateText(email.subject, 50)}</TableCell>
                <TableCell>{formatDate(email.created_at)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleViewEmail(email.id)}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEmailToDelete(email)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Email View Dialog */}
      <Dialog open={!!selectedEmail} onOpenChange={(open) => !open && setSelectedEmail(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedEmail?.subject}</DialogTitle>
            <DialogDescription>
              Generated for {selectedEmail?.target_company_name} ({selectedEmail?.created_at})
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 max-h-96 overflow-y-auto">
            <div className="whitespace-pre-wrap bg-gray-50 p-4 rounded-md border">
              {selectedEmail?.content}
            </div>
          </div>
          
          <DialogFooter className="flex justify-between sm:justify-between gap-2">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(selectedEmail?.content)}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy Content
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(selectedEmail?.subject)}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy Subject
              </Button>
            </div>
            <Button
              size="sm"
              onClick={() => copyToClipboard(`Subject: ${selectedEmail?.subject}\n\n${selectedEmail?.content}`)}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={!!emailToDelete} onOpenChange={() => setEmailToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this email for "{emailToDelete?.target_company_name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEmailToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteEmail}
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