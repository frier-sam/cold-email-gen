// frontend/src/components/emails/EnhancedEmailGenerator.jsx (complete implementation)
import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { companies as companiesApi, tasks as tasksApi } from '../../lib/api';
import { ArrowLeft, Send } from 'lucide-react';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';
import { Skeleton } from '../ui/skeleton';
import { Checkbox } from '../ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

import { EmailGenerationProgress } from './EmailGenerationProgress';
import { EmailGenerationResults } from './EmailGenerationResults';

export function EnhancedEmailGenerator() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [tasks, setTasks] = useState([]);
  const [showResults, setShowResults] = useState(false);
  
  const [formData, setFormData] = useState({
    company_id: id,
    target_urls: '',
    custom_instructions: '',
    tone: 'professional',
    personalization_level: 'medium',
    find_contact: false,
  });

  useEffect(() => {
    const fetchCompany = async () => {
      setIsLoading(true);
      try {
        const companyData = await companiesApi.getById(id);
        setCompany(companyData);
        setFormData(prev => ({ ...prev, company_id: companyData.id }));
      } catch (err) {
        setError('Failed to load company data. Please try again.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCompany();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.target_urls.trim()) {
      setError('Please enter at least one target URL');
      return false;
    }
    
    // Simple URL validation
    const urls = formData.target_urls.split(',').map(url => url.trim());
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
    
    for (const url of urls) {
      if (!url) continue;
      if (!urlPattern.test(url)) {
        setError(`Invalid URL format: ${url}`);
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const response = await tasksApi.generateEmails({
        company_id: parseInt(formData.company_id),
        target_urls: formData.target_urls,
        find_contact: formData.find_contact,
        tone: formData.tone,
        personalization_level: formData.personalization_level,
        custom_instructions: formData.custom_instructions
      });
      
      setTasks(response.tasks);
      setShowResults(true);
    } catch (err) {
      setError(err.message || 'Failed to start email generation. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return <EmailGeneratorSkeleton />;
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
      <div className="flex items-center">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-3xl font-bold tracking-tight ml-2">Generate Emails</h2>
      </div>
      
      <p className="text-gray-500">
        Generate personalized cold emails from <span className="font-medium">{company.name}</span> to potential clients.
      </p>
      
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {showResults ? (
        <div className="space-y-8">
          <EmailGenerationProgress tasks={tasks} />
          <EmailGenerationResults 
            tasks={tasks} 
            companyId={company.id} 
            onBack={() => setShowResults(false)}
          />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8 border rounded-lg p-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="target_urls">Target Website URLs*</Label>
              <Textarea
                id="target_urls"
                name="target_urls"
                value={formData.target_urls}
                onChange={handleChange}
                placeholder="https://example.com, https://another-company.com"
                className="min-h-[100px]"
                required
              />
              <p className="text-sm text-gray-500">
                Enter target website URLs, separated by commas. Each URL will generate a separate email.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Email Style</Label>
              <Select
                value={formData.tone}
                onValueChange={(value) => handleSelectChange('tone', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="direct">Direct</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Personalization Level</Label>
              <Select
                value={formData.personalization_level}
                onValueChange={(value) => handleSelectChange('personalization_level', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select personalization level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low (General value propositions)</SelectItem>
                  <SelectItem value="medium">Medium (Industry-specific insights)</SelectItem>
                  <SelectItem value="high">High (Deep company research)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="find_contact"
                name="find_contact"
                checked={formData.find_contact}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, find_contact: checked }))
                }
              />
              <Label htmlFor="find_contact" className="cursor-pointer">
                Find contact information if available
              </Label>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="custom_instructions">Custom Instructions (Optional)</Label>
              <Textarea
                id="custom_instructions"
                name="custom_instructions"
                value={formData.custom_instructions}
                onChange={handleChange}
                placeholder="Add any specific instructions for email generation (e.g., mention specific pain points, focus on particular services)"
                rows={3}
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button type="submit" disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  Generating...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Generate Emails
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

function EmailGeneratorSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-10 w-64 ml-2" />
      </div>
      
      <Skeleton className="h-5 w-full max-w-md" />
      
      <div className="border rounded-lg p-6 space-y-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-[100px] w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          
          <div className="space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
          
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-10 w-full" />
          </div>
          
          <div className="flex items-center space-x-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-5 w-64" />
          </div>
          
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
        
        <div className="flex justify-end">
          <Skeleton className="h-10 w-36" />
        </div>
      </div>
    </div>
  );
}