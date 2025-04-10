import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../lib/api';
import { authUtils } from '../../lib/utils';

export function AuthGuard({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const verifyAuth = async () => {
      if (!authUtils.isAuthenticated()) {
        navigate('/login');
        return;
      }
      
      try {
        // Verify token by fetching user data
        await auth.getCurrentUser();
        setIsAuthenticated(true);
      } catch (err) {
        // Token is invalid
        authUtils.removeToken();
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };
    
    verifyAuth();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return isAuthenticated ? children : null;
}