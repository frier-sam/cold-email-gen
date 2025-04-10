import { useState, useEffect } from 'react';
import { companies, emails } from '../../lib/api';
import { isValidUrl } from '../../lib/utils';
import { Mail, Link as LinkIcon, Cog, Plus, X } from 'lucide-react';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card';

export function EmailGenerator() {
  const [companyList, setCompanyList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [generatedEmail, setGeneratedEmail] = useState(null);
  
  const [formData, setFormData] = useState({
    company_id: '',
    target_company_website: '',
    additional_websites: [''],
    custom_instructions: '',
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const data = await companies.getAll();
      setCompanyList(data);
      
      // Set default company if available
      if (data.length > 0) {
        setFormData(prev => ({ ...prev, company_id: data[0].id.toString() }));
      }
    } catch (err) {
      setError('Failed to load companies. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleWebsiteChange = (index, value) => {
    const updatedWebsites = [...formData.additional_websites];
    updatedWebsites[index] = value;
    setFormData(prev => ({ ...prev, additional_websites: updatedWebsites }));
  };

  const addWebsiteField = () => {
    setFormData(prev => ({
      ...prev,
      additional_websites: [...prev.additional_websites, '']
    }));
  };

  const removeWebsiteField = (index) => {
    const updatedWebsites = formData.additional_websites.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, additional_websites: updatedWebsites }));
  };

  const validateForm = () => {
    // Reset messages
    setError('');
    setSuccess('');
    
    // Validate main website URL
    if (!formData.target_company_website) {
      setError('Target company website is required');
      return false;
    }
    
    if (!isValidUrl(formData.target_company_website)) {
      setError('Please enter a valid URL for the target company website');
      return false;
    }
    
    // Validate additional URLs
    const validAdditionalUrls = formData.additional_websites.filter(url => url.trim() !== '');
    for (const url of validAdditionalUrls) {
      if (!isValidUrl(url)) {
        setError(`Please enter a valid URL: ${url}`);
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Filter out empty website URLs
    const validAdditionalUrls = formData.additional_websites.filter(url => url.trim() !== '');
    
    const submitData = {
      ...formData,
      company_id: parseInt(formData.company_id),
      additional_websites: validAdditionalUrls
    };
    
    setIsGenerating(true);
    setGeneratedEmail(null);
    
    try {
      const response = await emails.generate(submitData);
      setGeneratedEmail(response);
      setSuccess('Email generated successfully!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message || 'Failed to generate email. Please try again.');
    } finally {
      setIsGenerating(false);
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

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Generate Cold Email</h2>
        <p className="text-gray-500 mt-2">
          Create personalized cold emails based on the target company's website
        </p>
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
      
      {generatedEmail && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>{generatedEmail.subject}</CardTitle>
            <CardDescription>
              Generated for {generatedEmail.target_company_name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap bg-white p-4 rounded-md border">
              {generatedEmail.content}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => copyToClipboard(generatedEmail.content)}
            >
              Copy Content
            </Button>
            <Button
              variant="outline"
              onClick={() => copyToClipboard(generatedEmail.subject)}
            >
              Copy Subject
            </Button>
            <Button
              onClick={() => copyToClipboard(`Subject: ${generatedEmail.subject}\n\n${generatedEmail.content}`)}
            >
              Copy All
            </Button>
          </CardFooter>
        </Card>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-8 border rounded-lg p-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="company_id">Your Company</Label>
            <Select
              value={formData.company_id}
              onValueChange={(value) => handleSelectChange('company_id', value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your company" />
              </SelectTrigger>
              <SelectContent>
                {companyList.length > 0 ? (
                  companyList.map(company => (
                    <SelectItem key={company.id} value={company.id.toString()}>
                      {company.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    No companies available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {companyList.length === 0 && (
              <p className="text-sm text-red-500">
                You need to create a company first. <a href="/companies/new" className="underline">Create one now</a>
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="target_company_website">
              Target Company Website URL*
            </Label>
            <div className="flex">
              <div className="relative flex-1">
                <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  id="target_company_website"
                  name="target_company_website"
                  value={formData.target_company_website}
                  onChange={handleChange}
                  placeholder="https://example.com"
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Enter the main website URL of the company you want to target
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label>Additional Website URLs (Optional)</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={addWebsiteField}
              >
                <Plus className="h-4 w-4 mr-2" /> Add URL
              </Button>
            </div>
            
            {formData.additional_websites.map((url, index) => (
              <div key={index} className="flex gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <Input
                    value={url}
                    onChange={(e) => handleWebsiteChange(index, e.target.value)}
                    placeholder="https://example.com/about"
                    className="pl-10"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeWebsiteField(index)}
                  disabled={index === 0 && formData.additional_websites.length === 1}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <p className="text-sm text-gray-500">
              Add additional pages from the target company for better email personalization
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="custom_instructions">Custom Instructions (Optional)</Label>
            <div className="relative">
              <Cog className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <Textarea
                id="custom_instructions"
                name="custom_instructions"
                value={formData.custom_instructions}
                onChange={handleChange}
                placeholder="E.g., Keep it casual, focus on marketing benefits, mention specific pain points..."
                rows={4}
                className="pl-10"
              />
            </div>
            <p className="text-sm text-gray-500">
              Provide any specific instructions for the tone, style, or content of your email
            </p>
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button type="submit" disabled={isGenerating || companyList.length === 0}>
            {isGenerating ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                Generating...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Generate Email
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}