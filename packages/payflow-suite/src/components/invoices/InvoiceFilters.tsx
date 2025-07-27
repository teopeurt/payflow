
import { Search, Filter, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface InvoiceFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  sortOrder: "asc" | "desc";
  setSortOrder: (order: "asc" | "desc") => void;
}

export const InvoiceFilters = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  sortOrder,
  setSortOrder
}: InvoiceFiltersProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
        <Input 
          placeholder="Search invoices..." 
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex gap-2">
              <Filter size={16} />
              <span>Filter</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setStatusFilter("all")}>
              All Statuses
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("draft")}>
              Draft
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("sent")}>
              Sent
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("paid")}>
              Paid
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("partially-paid")}>
              Partially Paid
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("overdue")}>
              Overdue
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("cancelled")}>
              Cancelled
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button 
          variant="outline" 
          className="flex gap-2"
          onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
        >
          <ArrowUpDown size={16} />
          <span>Sort</span>
        </Button>
      </div>
    </div>
  );
};
