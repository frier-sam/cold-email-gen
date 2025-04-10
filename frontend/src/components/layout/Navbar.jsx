import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../../lib/api';
import { authUtils } from '../../lib/utils';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";

export function Navbar() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      if (authUtils.isAuthenticated()) {
        try {
          const userData = await auth.getCurrentUser();
          setUser(userData);
        } catch (err) {
          console.error('Failed to fetch user data:', err);
        }
      }
    };
    
    fetchUser();
  }, []);

  const handleLogout = () => {
    authUtils.removeToken();
    setUser(null);
    navigate('/login');
  };

  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl font-bold">Cold Email Generator</span>
        </Link>
        
        <nav className="hidden md:flex gap-6">
          {user && (
            <>
              <Link
                to="/dashboard"
                className="text-sm font-medium hover:underline underline-offset-4"
              >
                Dashboard
              </Link>
              <Link
                to="/companies"
                className="text-sm font-medium hover:underline underline-offset-4"
              >
                My Companies
              </Link>
              <Link
                to="/email-generator"
                className="text-sm font-medium hover:underline underline-offset-4"
              >
                Generate Email
              </Link>
            </>
          )}
        </nav>
        
        <div className="flex items-center gap-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative rounded-full">
                  <span className="sr-only">User menu</span>
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground">
                    {user.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/dashboard">Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/companies">My Companies</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/email-generator">Generate Email</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" asChild>
                <Link to="/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link to="/register">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}