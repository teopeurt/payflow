
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
import { useQuotesData } from "@/hooks/useQuotesData";
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

const ITEMS_PER_PAGE = 10;

const Quotes = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const { 
    quotes, 
    isLoading, 
    searchTerm, 
    setSearchTerm, 
    statusFilter, 
    setStatusFilter, 
    sortOrder, 
    setSortOrder,
    formatDate,
    formatCurrency,
    getQuoteUrl
  } = useQuotesData();

  // Pagination
  const totalPages = Math.ceil(quotes.length / ITEMS_PER_PAGE);
  const paginatedQuotes = quotes.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Quotes" 
        description="Create and manage binding price quotes for your clients"
        action={{
          label: "New Quote",
          href: "/quotes/new",
          icon: <Plus size={16} />,
        }}
      />

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
              <Input 
                placeholder="Search quotes..." 
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
                    <TableHead>Valid Until</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>From Estimate</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedQuotes.length > 0 ? (
                    paginatedQuotes.map((quote) => (
                      <TableRow key={quote.reference_number}>
                        <TableCell className="font-medium">
                          <Link to={getQuoteUrl(quote.reference_number)} className="text-primary hover:underline">
                            {quote.reference_number}
                          </Link>
                        </TableCell>
                        <TableCell>{quote.organization?.name || "Unknown Client"}</TableCell>
                        <TableCell>{formatCurrency(quote.amount, quote.organization?.default_currency)}</TableCell>
                        <TableCell>{formatDate(quote.issue_date)}</TableCell>
                        <TableCell>{formatDate(quote.expiry_date)}</TableCell>
                        <TableCell>
                          <StatusBadge status={quote.status} />
                        </TableCell>
                        <TableCell>
                          {quote.estimate_id && (
                            <Link to={`/estimates/${quote.estimate_id}`} className="text-primary hover:underline">
                              {quote.estimate_id}
                            </Link>
                          )}
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
                                <Link to={getQuoteUrl(quote.reference_number)} className="w-full">View Details</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Link to={`${getQuoteUrl(quote.reference_number)}/edit`} className="w-full">Edit</Link>
                              </DropdownMenuItem>
                              {quote.status === "approved" && (
                                <DropdownMenuItem>
                                  <Link to={`/purchase-orders/new?from=${quote.reference_number}`} className="w-full">Create Purchase Order</Link>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem className="text-destructive">
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                        No quotes found matching your filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

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
    </div>
  );
};

export default Quotes;
