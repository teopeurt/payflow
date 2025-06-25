
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Save, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Spinner } from "@/components/shared/Spinner";
import { createQuote } from "@/services/quotesService";

type LineItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
};

type ClientData = {
  id: string;
  name: string;
};

const NewQuote = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Extract fromEstimate parameter from URL if present
  const queryParams = new URLSearchParams(location.search);
  const fromEstimateId = queryParams.get("from");
  
  // State
  const [client, setClient] = useState("");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [quoteDate, setQuoteDate] = useState(new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState(
    new Date(new Date().setDate(new Date().getDate() + 14)).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("This quote is valid for 14 days. Payment terms: 50% deposit required to begin work.");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: "1", description: "", quantity: 1, unitPrice: 0, amount: 0 }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Fetch clients from Supabase
  const { data: clients, isLoading: isLoadingClients } = useQuery({
    queryKey: ["clients"],
    queryFn: async (): Promise<ClientData[]> => {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name")
        .order("name");

      if (error) {
        throw error;
      }
      
      return data.map(org => ({
        id: org.id,
        name: org.name
      }));
    }
  });

  // If we're converting from an estimate, load the estimate data
  useEffect(() => {
    if (!fromEstimateId) return;
    
    const fetchEstimateData = async () => {
      setIsLoading(true);
      try {
        // Fetch the estimate
        const { data: estimate, error: estimateError } = await supabase
          .from("estimates")
          .select(`
            *,
            organization:organizations(id, name, default_currency)
          `)
          .eq("reference_number", fromEstimateId)
          .single();
          
        if (estimateError) throw estimateError;
        
        if (estimate) {
          // Set client from estimate
          setClient(estimate.organization_id);
          setNotes(estimate.notes || "");
          setTerms("This quote is valid for 14 days from the date shown above. " + (estimate.terms || ""));
          
          // Set project ID if available
          if (estimate.project_id) {
            setProjectId(estimate.project_id);
          }
          
          // Fetch estimate items
          const { data: items, error: itemsError } = await supabase
            .from("estimate_items")
            .select("*")
            .eq("estimate_id", estimate.id);
            
          if (itemsError) throw itemsError;
          
          if (items && items.length > 0) {
            const formattedItems = items.map(item => ({
              id: item.id,
              description: item.description,
              quantity: Number(item.quantity),
              unitPrice: Number(item.unit_price),
              amount: Number(item.amount)
            }));
            
            setLineItems(formattedItems);
          }
          
          toast({
            title: "Estimate converted",
            description: `Loaded data from estimate ${fromEstimateId}`,
          });
        }
      } catch (error) {
        console.error("Error loading estimate:", error);
        toast({
          variant: "destructive",
          title: "Error loading estimate",
          description: "Could not load the estimate data.",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEstimateData();
  }, [fromEstimateId, toast]);

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + tax;

  // Add new line item
  const addLineItem = () => {
    const newId = (lineItems.length + 1).toString();
    setLineItems([...lineItems, { id: newId, description: "", quantity: 1, unitPrice: 0, amount: 0 }]);
  };

  // Remove line item
  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter(item => item.id !== id));
  };

  // Update line item
  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems(lineItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // Recalculate amount whenever quantity or unitPrice changes
        if (field === "quantity" || field === "unitPrice") {
          updatedItem.amount = updatedItem.quantity * updatedItem.unitPrice;
        }
        
        return updatedItem;
      }
      return item;
    }));
  };

  // Generate a reference number for the quote
  const generateReferenceNumber = () => {
    const year = new Date().getFullYear();
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `QUO-${year}${month}-${random}`;
  };

  // Save quote
  const saveQuote = async (status: 'draft' | 'submit') => {
    // Validation
    if (!client) {
      toast({
        title: "Client required",
        description: "Please select a client for this quote",
        variant: "destructive",
      });
      return;
    }

    if (lineItems.some(item => !item.description || item.quantity <= 0)) {
      toast({
        title: "Invalid line items",
        description: "All line items must have a description and quantity greater than zero",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const referenceNumber = generateReferenceNumber();
      
      // Create quote in database
      const quoteData = {
        reference_number: referenceNumber,
        organization_id: client,
        project_id: projectId,
        amount: total,
        issue_date: quoteDate,
        expiry_date: validUntil,
        status: status === 'draft' ? 'draft' : 'pending',
        notes: notes,
        terms: terms,
        estimate_id: fromEstimateId ? await getEstimateIdFromReferenceNumber(fromEstimateId) : undefined
      };
      
      // Format line items for API
      const formattedItems = lineItems.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        amount: item.amount
      }));
      
      const result = await createQuote(quoteData, formattedItems);
      
      if (result) {
        toast({
          title: status === 'draft' ? "Quote saved as draft" : "Quote submitted to client",
          description: status === 'draft' 
            ? "You can edit this quote later" 
            : "The client will receive this quote shortly",
        });
        
        // Navigate back to quotes list
        navigate("/quotes");
      } else {
        throw new Error("Failed to save quote");
      }
    } catch (error) {
      console.error("Error saving quote:", error);
      toast({
        variant: "destructive",
        title: "Error saving quote",
        description: "An error occurred while saving the quote. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get estimate ID from reference number
  const getEstimateIdFromReferenceNumber = async (referenceNumber: string): Promise<string | undefined> => {
    try {
      const { data, error } = await supabase
        .from("estimates")
        .select("id")
        .eq("reference_number", referenceNumber)
        .single();
        
      if (error) {
        console.error("Error fetching estimate ID:", error);
        return undefined;
      }
      
      return data?.id;
    } catch (error) {
      console.error("Error in getEstimateIdFromReferenceNumber:", error);
      return undefined;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title={fromEstimateId ? "Convert Estimate to Quote" : "Create New Quote"} 
        description={fromEstimateId 
          ? `Creating a formal quote based on estimate ${fromEstimateId}` 
          : "Generate a new binding quote for your client"
        }
      />

      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <Label htmlFor="client">Client</Label>
              {isLoadingClients ? (
                <div className="flex items-center space-x-2 h-10 px-3 border rounded-md">
                  <Spinner size="sm" />
                  <span className="text-muted-foreground">Loading clients...</span>
                </div>
              ) : (
                <Select value={client} onValueChange={setClient}>
                  <SelectTrigger id="client">
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients && clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div>
              <Label htmlFor="quote-number">Quote Number</Label>
              <Input 
                id="quote-number" 
                value="Auto-generated" 
                disabled 
                className="bg-muted"
              />
            </div>
            <div>
              <Label htmlFor="quote-date">Quote Date</Label>
              <Input 
                id="quote-date" 
                type="date" 
                value={quoteDate}
                onChange={(e) => setQuoteDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="valid-until">Valid Until</Label>
              <Input 
                id="valid-until" 
                type="date" 
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
            </div>
          </div>

          {fromEstimateId && (
            <div className="mb-6 p-4 bg-primary/5 rounded-md border flex items-center">
              <FileText size={20} className="text-primary mr-2" />
              <span>
                This quote is based on estimate <span className="font-medium">{fromEstimateId}</span>. 
                Any changes you make will only apply to this quote.
              </span>
            </div>
          )}

          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium">Line Items</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={addLineItem}
                className="flex items-center gap-1"
              >
                <Plus size={16} />
                Add Item
              </Button>
            </div>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Description</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Input 
                          placeholder="Item description" 
                          value={item.description}
                          onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(item.id, "quantity", parseInt(e.target.value) || 0)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          min="0" 
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateLineItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                          className="price-input"
                        />
                      </TableCell>
                      <TableCell>
                        ${item.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {lineItems.length > 1 && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => removeLineItem(item.id)}
                          >
                            <Trash2 size={16} className="text-destructive" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <div className="mt-4 flex justify-end">
              <div className="w-full md:w-72">
                <div className="flex justify-between py-2">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span>Tax (10%):</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 font-bold border-t">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea 
                id="notes" 
                placeholder="Additional information for the client"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="terms">Terms and Conditions</Label>
              <Textarea 
                id="terms" 
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <Button 
              variant="outline" 
              onClick={() => navigate("/quotes")}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => saveQuote('draft')}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  Save as Draft
                </>
              )}
            </Button>
            <Button 
              onClick={() => saveQuote('submit')}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Submitting...
                </>
              ) : (
                "Submit Quote"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewQuote;
