// frontend/src/components/emails/EmailGenerationResults.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tasks as tasksApi } from '../../lib/api';
import { Check, Copy, Save, ArrowRight, ArrowLeft, Mail } from 'lucide-react';

import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card';

export function EmailGenerationResults({ tasks, companyId, onBack }) {
  const navigate = useNavigate();
  const [results, setResults] = useState({});
  const [activeTask, setActiveTask] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState({});
  
  // Update the EmailGenerationResults component
useEffect(() => {
    const fetchResults = async () => {
      // Only fetch results for tasks that haven't been completed yet
      const tasksToFetch = tasks.filter(task => 
        !results[task.task_id] || 
        (results[task.task_id] && !results[task.task_id].body)
      );
      
      if (tasksToFetch.length === 0) {
        return; // Skip if nothing to fetch
      }
      
      const newResults = { ...results };
      let fetchedAny = false;
      
      // Use Promise.all for parallel requests
      const statusPromises = tasksToFetch.map(task => 
        tasksApi.getStatus(task.task_id)
          .then(status => {
            if (status.status === 'completed' && status.result) {
              newResults[task.task_id] = status.result;
              fetchedAny = true;
            }
            return status;
          })
          .catch(err => {
            console.error(`Error fetching results for task ${task.task_id}:`, err);
            return null;
          })
      );
      
      await Promise.all(statusPromises);
      
      if (fetchedAny) {
        setResults(newResults);
        
        // Set first completed task as active if none is selected
        if (!activeTask && Object.keys(newResults).length > 0) {
          setActiveTask(Object.keys(newResults)[0]);
        }
      }
    };
    
    fetchResults();
    
    // Poll for results less frequently (every 8 seconds)
    const intervalId = setInterval(fetchResults, 8000);
    
    return () => clearInterval(intervalId);
  }, [tasks, activeTask]);
  
  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard!');
    
    setTimeout(() => {
      setSuccess('');
    }, 3000);
  };
  
  const handleSaveEmail = async (taskId) => {
    if (saving[taskId]) return;
    
    const result = results[taskId];
    if (!result) return;
    
    setSaving(prev => ({ ...prev, [taskId]: true }));
    
    try {
      console.log("Saving email with data:", {
        company_id: parseInt(companyId),
        target_company_name: result.target_company_name,
        target_url: result.target_url,
        subject: result.subject,
        body: result.body,
        contact_info: result.contact_info
      });
      
      await tasksApi.saveEmail({
        company_id: parseInt(companyId),
        target_company_name: result.target_company_name,
        target_url: result.target_url,
        subject: result.subject,
        body: result.body,
        contact_info: result.contact_info
      });
      
      setSuccess(`Email saved successfully!`);
      
      // Mark as saved in the results
      setResults(prev => ({
        ...prev,
        [taskId]: { ...prev[taskId], saved: true }
      }));
    } catch (err) {
      console.error("Error saving email:", err);
      setError('Failed to save email. Please try again.');
    } finally {
      setSaving(prev => ({ ...prev, [taskId]: false }));
    }
  };
  
  const completedTasksCount = Object.keys(results).length;
  const totalTasksCount = tasks.length;
  
  if (completedTasksCount === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <h3 className="text-xl font-medium">Waiting for results...</h3>
        <p className="text-gray-500">No emails have been generated yet. Please wait while the system processes your request.</p>
        <Button onClick={onBack}>Go Back to Form</Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-medium">
          Generated Emails ({completedTasksCount}/{totalTasksCount})
        </h3>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={() => navigate(`/companies/${companyId}`)}>
            View All Emails
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          <h4 className="font-medium">Target Companies</h4>
          <div className="space-y-2">
            {Object.entries(results).map(([taskId, result]) => (
              <Button
                key={taskId}
                variant={activeTask === taskId ? "default" : "outline"}
                className="w-full justify-start overflow-hidden"
                onClick={() => setActiveTask(taskId)}
              >
                <div className="truncate">
                  <span className="mr-2">{result.saved ? "✓" : "•"}</span>
                  {result.target_company_name || "Unknown Company"}
                </div>
              </Button>
            ))}
          </div>
        </div>
        
        <div className="md:col-span-2">
          {activeTask && results[activeTask] && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {results[activeTask].subject}
                </CardTitle>
                <CardDescription>
                  For {results[activeTask].target_company_name} ({results[activeTask].target_url})
                </CardDescription>
              </CardHeader>
              
              <Tabs defaultValue="email">
                <div className="px-6">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="email">Email Content</TabsTrigger>
                    <TabsTrigger value="contact">Contact Info</TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="email" className="m-0">
                  <CardContent className="pt-6">
                    <div className="whitespace-pre-wrap bg-gray-50 p-4 rounded-md border overflow-auto max-h-[400px]">
                      {results[activeTask].body}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyToClipboard(results[activeTask].body)}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Body
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyToClipboard(results[activeTask].subject)}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Subject
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleSaveEmail(activeTask)}
                      disabled={results[activeTask].saved || saving[activeTask]}
                    >
                      {saving[activeTask] ? (
                        <>Saving...</>
                      ) : results[activeTask].saved ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Saved
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Email
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </TabsContent>
                
                <TabsContent value="contact" className="m-0">
                  <CardContent className="pt-6">
                    {results[activeTask].contact_info && results[activeTask].contact_info.found ? (
                      <div className="space-y-4">
                        {results[activeTask].contact_info.name && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Contact Name</h4>
                            <p>{results[activeTask].contact_info.name}</p>
                          </div>
                        )}
                        
                        {results[activeTask].contact_info.position && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Position</h4>
                            <p>{results[activeTask].contact_info.position}</p>
                          </div>
                        )}
                        
                        {results[activeTask].contact_info.email && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Email</h4>
                            <p>
                              <a
                                href={`mailto:${results[activeTask].contact_info.email}`}
                                className="text-primary hover:underline"
                              >
                                {results[activeTask].contact_info.email}
                              </a>
                            </p>
                          </div>
                        )}
                        
                        {results[activeTask].contact_info.phone && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Phone</h4>
                            <p>
                              <a
                                href={`tel:${results[activeTask].contact_info.phone}`}
                                className="text-primary hover:underline"
                              >
                                {results[activeTask].contact_info.phone}
                              </a>
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Mail className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h4 className="text-lg font-medium">No contact information found</h4>
                        <p className="text-gray-500">
                          We couldn't find specific contact details for this company.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </TabsContent>
              </Tabs>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}