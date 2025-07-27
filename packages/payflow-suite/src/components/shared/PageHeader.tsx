
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import React from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    href: string;
    icon?: React.ReactNode;
    onClick?: () => void; // Optional onClick handler
  } | React.ReactNode; // Allow direct React element as alternative
  className?: string;
}

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  // Function to handle click
  const handleClick = (e: React.MouseEvent) => {
    if (action && typeof action === 'object' && 'href' in action && action.href === "#" && action.onClick) {
      e.preventDefault();
      action.onClick();
    }
  };

  return (
    <div className={cn("flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6", className)}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-muted-foreground mt-1">{description}</p>}
      </div>
      {action && (
        typeof action === 'object' && 'href' in action ? (
          <Link to={action.href} onClick={handleClick}>
            <Button className="mt-3 sm:mt-0" size="sm">
              {action.icon && <span className="mr-2">{action.icon}</span>}
              {action.label}
            </Button>
          </Link>
        ) : (
          // Render the action directly if it's a React element
          <div className="mt-3 sm:mt-0">{action}</div>
        )
      )}
    </div>
  );
}
