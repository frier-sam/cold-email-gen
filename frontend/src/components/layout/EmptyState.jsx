import { Link } from 'react-router-dom';
import { Button } from '../ui/button';

export function EmptyState({ 
  title = "No data found", 
  description = "Get started by creating your first item.",
  buttonText = "Create",
  buttonLink = "#",
  icon: Icon
}) {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
      {Icon && <Icon className="h-10 w-10 text-gray-400" />}
      <div className="space-y-2">
        <h3 className="text-lg font-medium">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <Button asChild>
        <Link to={buttonLink}>{buttonText}</Link>
      </Button>
    </div>
  );
}