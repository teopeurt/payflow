import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter, ArrowUpDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Link } from "react-router-dom";
import { useEstimatesData } from "@/hooks/useEstimatesData";
import { Spinner } from "@/components/shared/Spinner";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious
} from "@/components/ui/pagination";
import { useState } from "react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

const ITEMS_PER_PAGE = 10;

const Estimates = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { 
    estimates, 
    isLoading, 
    searchTerm, 
    setSearchTerm, 
    statusFilter, 
    setStatusFilter, 
    sortOrder, 
    setSortOrder,
    formatDate,
    formatCurrency,
    getEstimateUrl,
    deleteEstimate
  } = useEstimatesData();

  // Pagination
  const totalPages = Math.ceil(estimates.length / ITEMS_PER_PAGE);
  const paginatedEstimates = estimates.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await deleteEstimate(deleteId);
      setDeleteId(null);
    } catch (error) {
      console.error("Error deleting estimate:", error);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Estimates" 
        description="Create and manage estimates for your clients"
        action={{
          label: "New Estimate",
          href: "/estimates/new",
          icon: <Plus size={16} />,
        }}
      />

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
              <Input 
                placeholder="Search estimates..." 
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
                  <DropdownMenuItem onClick={() => setStatusFilter("pending")}>
                    Pending Approval
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("approved")}>
                    Approved
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("rejected")}>
                    Rejected
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("completed")}>
                    Completed
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

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Created Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedEstimates.length > 0 ? (
                    paginatedEstimates.map((estimate) => (
                      <TableRow key={estimate.id}>
                        <TableCell className="font-medium">
                          <Link to={getEstimateUrl(estimate.reference_number)} className="text-primary hover:underline">
                            {estimate.reference_number}
                          </Link>
                        </TableCell>
                        <TableCell>{estimate.organization?.name || "Unknown Client"}</TableCell>
                        <TableCell>{formatCurrency(estimate.amount)}</TableCell>
                        <TableCell>{formatDate(estimate.issue_date)}</TableCell>
                        <TableCell>{formatDate(estimate.expiry_date)}</TableCell>
                        <TableCell>
                          <StatusBadge status={estimate.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                Actions
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Link to={getEstimateUrl(estimate.reference_number)} className="w-full">View Details</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Link to={`${getEstimateUrl(estimate.reference_number)}/edit`} className="w-full">Edit</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Link to={`/quotes/new?from=${estimate.reference_number}`} className="w-full">Convert to Quote</Link>
                              </DropdownMenuItem>
                              {estimate.status === "approved" && (
                                <DropdownMenuItem>
                                  <Link to={`/invoices/new?from=${estimate.reference_number}`} className="w-full">Create Invoice</Link>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => setDeleteId(estimate.id)}
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                        No estimates found matching your filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Add pagination if needed */}
          {totalPages > 1 && (
            <Pagination className="mt-6">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                
                {[...Array(totalPages)].map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink 
                      isActive={currentPage === i + 1} 
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </CardContent>
      </Card>
      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Estimate"
        description="Are you sure you want to delete this estimate? This action cannot be undone."
      />
    </div>
  );
};

export default Estimates;
