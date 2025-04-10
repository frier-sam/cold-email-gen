import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { companies } from '../../lib/api';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';
import { X, Plus } from 'lucide-react';

export function CompanyForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    services: [{ name: '', description: '' }]
  });
  
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditMode) {
      fetchCompany();
    }
  }, [id]);

  const fetchCompany = async () => {
    try {
      const data = await companies.getById(id);
      setFormData({
        name: data.name,
        description: data.description || '',
        services: data.services && data.services.length > 0 
          ? data.services 
          : [{ name: '', description: '' }]
      });
    } catch (err) {
      setError('Failed to load company data. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleServiceChange = (index, field, value) => {
    const updatedServices = [...formData.services];
    updatedServices[index] = { 
      ...updatedServices[index], 
      [field]: value 
    };
    
    setFormData(prev => ({ ...prev, services: updatedServices }));
  };

  const addService = () => {
    setFormData(prev => ({
      ...prev,
      services: [...prev.services, { name: '', description: '' }]
    }));
  };

  const removeService = (index) => {
    const updatedServices = formData.services.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, services: updatedServices }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate form
    if (!formData.name.trim()) {
      setError('Company name is required');
      return;
    }
    
    // Filter out empty services
    const filteredServices = formData.services.filter(
      service => service.name.trim() !== ''
    );
    
    const submitData = {
      ...formData,
      services: filteredServices
    };
    
    setIsSaving(true);
    
    try {
      if (isEditMode) {
        await companies.update(id, submitData);
      } else {
        await companies.create(submitData);
      }
      
      navigate('/companies');
    } catch (err) {
      setError(err.message || 'Failed to save company. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          {isEditMode ? 'Edit Company' : 'Add Company'}
        </h2>
        <p className="text-gray-500 mt-2">
          {isEditMode 
            ? 'Update your company details to improve your cold emails.' 
            : 'Add your company details to generate personalized cold emails.'}
        </p>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Company Name *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter company name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Brief description of your company"
              rows={4}
            />
            <p className="text-sm text-gray-500">
              Describe what your company does. This will be used to create personalized cold emails.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label>Services Offered</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={addService}
              >
                <Plus className="h-4 w-4 mr-2" /> Add Service
              </Button>
            </div>
            
            {formData.services.map((service, index) => (
              <div key={index} className="space-y-3 p-4 border rounded-md relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={() => removeService(index)}
                  disabled={formData.services.length === 1}
                >
                  <X className="h-4 w-4" />
                </Button>
                
                <div className="space-y-2">
                  <Label htmlFor={`service-name-${index}`}>Service Name</Label>
                  <Input
                    id={`service-name-${index}`}
                    value={service.name}
                    onChange={(e) => handleServiceChange(index, 'name', e.target.value)}
                    placeholder="E.g., Web Development, Marketing, Consulting"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`service-desc-${index}`}>Service Description</Label>
                  <Textarea
                    id={`service-desc-${index}`}
                    value={service.description}
                    onChange={(e) => handleServiceChange(index, 'description', e.target.value)}
                    placeholder="Brief description of this service"
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex gap-4">
          <Button 
            type="button" 
            variant="outline"
            onClick={() => navigate('/companies')}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving 
              ? (isEditMode ? 'Updating...' : 'Creating...') 
              : (isEditMode ? 'Update Company' : 'Create Company')}
          </Button>
        </div>
      </form>
    </div>
  );
}