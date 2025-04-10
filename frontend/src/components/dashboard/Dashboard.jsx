import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth, companies, emails } from '../../lib/api';
import { formatDate, truncateText } from '../../lib/utils';
import { Building, Mail, Plus, ArrowUpRight } from 'lucide-react';

import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Skeleton } from '../ui/skeleton';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card';

export function Dashboard() {
  const [user, setUser] = useState(null);
  const [recentCompanies, setRecentCompanies] = useState([]);
  const [recentEmails, setRecentEmails] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch all data in parallel
      const [userData, companiesData, emailsData] = await Promise.all([
        auth.getCurrentUser(),
        companies.getAll(),
        emails.getAll()
      ]);
      
      setUser(userData);
      setRecentCompanies(companiesData.slice(0, 3)); // Get 3 most recent
      setRecentEmails(emailsData.slice(0, 3)); // Get 3 most recent
      
    } catch (err) {
      setError('Failed to load dashboard data. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.username}!
        </h2>
        <p className="text-gray-500 mt-2">
          Manage your companies and generate personalized cold emails
        </p>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Companies"
          value={recentCompanies.length}
          description={`Out of ${user?.max_companies} allowed`}
          link="/companies"
          linkText="View All"
        />
        
        <StatsCard
          title="Generated Emails"
          value={recentEmails.length}
          description={`${user?.max_emails_per_day} emails per day limit`}
          link="/emails"
          linkText="View All"
        />
        
        <StatsCard
          title="Website Limit"
          value={user?.max_websites_per_email || 0}
          description="URLs per email generation"
          link="/email-generator"
          linkText="Generate Email"
        />
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-xl">Recent Companies</CardTitle>
              <CardDescription>
                Your recently added companies
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/companies">
                View All <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentCompanies.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <Building className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-gray-500">No companies yet</p>
                <Button className="mt-4" asChild>
                  <Link to="/companies/new">
                    <Plus className="mr-2 h-4 w-4" /> Add Company
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentCompanies.map(company => (
                  <div key={company.id} className="flex items-center p-3 border rounded-md">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{company.name}</p>
                      <p className="text-sm text-gray-500">
                        Added on {formatDate(company.created_at)}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/companies/${company.id}/edit`}>
                        Edit
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-xl">Recent Emails</CardTitle>
              <CardDescription>
                Your recently generated emails
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/emails">
                View All <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentEmails.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <Mail className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-gray-500">No emails generated yet</p>
                <Button className="mt-4" asChild>
                  <Link to="/email-generator">
                    <Plus className="mr-2 h-4 w-4" /> Generate Email
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentEmails.map(email => (
                  <div key={email.id} className="p-3 border rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">{email.target_company_name}</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(email.created_at)}
                      </p>
                    </div>
                    <p className="text-sm text-gray-700">
                      {truncateText(email.subject, 80)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Stats Card Component
function StatsCard({ title, value, description, link, linkText }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link to={link}>{linkText}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

// Loading Skeleton
function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-10 w-3/4 max-w-md" />
        <Skeleton className="h-4 w-1/2 max-w-sm mt-2" />
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-24" />
            </CardHeader>
            <CardContent className="pb-6">
              <Skeleton className="h-8 w-12 mb-1" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-9 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2].map(i => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-40 mt-1" />
              </div>
              <Skeleton className="h-8 w-24" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map(j => (
                  <Skeleton key={j} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}