
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Building, Loader2 } from "lucide-react";

interface AddPaymentMethodDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddPaymentMethodDialog = ({ isOpen, onClose }: AddPaymentMethodDialogProps) => {
  const [activeTab, setActiveTab] = useState<string>("creditCard");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      onClose();
    }, 1500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Payment Method</DialogTitle>
          <DialogDescription>
            Add a new payment method to your account
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="creditCard">
              <CreditCard className="h-4 w-4 mr-2" />
              Credit Card
            </TabsTrigger>
            <TabsTrigger value="directDebit">
              <Building className="h-4 w-4 mr-2" />
              Direct Debit
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="creditCard">
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input id="cardNumber" placeholder="1234 5678 9012 3456" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input id="expiryDate" placeholder="MM/YY" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvc">CVC</Label>
                  <Input id="cvc" placeholder="123" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cardholderName">Cardholder Name</Label>
                <Input id="cardholderName" placeholder="John Doe" />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing
                    </>
                  ) : (
                    "Add Card"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
          
          <TabsContent value="directDebit">
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="accountName">Account Name</Label>
                <Input id="accountName" placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input id="accountNumber" placeholder="12345678" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sortCode">Sort Code / Routing Number</Label>
                <Input id="sortCode" placeholder="01-23-45" />
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>By adding a direct debit, you authorize us to debit your account for future payments.</p>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing
                    </>
                  ) : (
                    "Set Up Direct Debit"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
