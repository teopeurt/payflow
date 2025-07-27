
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Trash2, AlertCircle, CheckCircle2, PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PaymentMethod {
  id: string;
  type: 'stripe' | 'gocardless';
  name: string;
  last4: string;
  expiry?: string;
  isDefault: boolean;
}

interface PaymentMethodsProps {
  onAddPaymentMethod: () => void;
}

export const PaymentMethods = ({ onAddPaymentMethod }: PaymentMethodsProps) => {
  // This would typically come from an API
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: "pm_1",
      type: "stripe",
      name: "Visa ending in 4242",
      last4: "4242",
      expiry: "12/25",
      isDefault: true
    },
    {
      id: "pm_2",
      type: "stripe",
      name: "Mastercard ending in 5555",
      last4: "5555",
      expiry: "09/26",
      isDefault: false
    },
    {
      id: "pm_3",
      type: "gocardless",
      name: "Direct Debit - Acme Bank",
      last4: "6789",
      isDefault: false
    }
  ]);

  const handleSetDefault = (id: string) => {
    setPaymentMethods(methods => methods.map(method => ({
      ...method,
      isDefault: method.id === id
    })));
  };

  const handleDelete = (id: string) => {
    setPaymentMethods(methods => methods.filter(method => method.id !== id));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Methods</CardTitle>
        <CardDescription>Manage your saved payment methods</CardDescription>
      </CardHeader>
      <CardContent>
        {paymentMethods.length > 0 ? (
          <div className="space-y-4">
            {paymentMethods.map((method) => (
              <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-full ${method.type === 'stripe' ? 'bg-indigo-50 text-indigo-600' : 'bg-green-50 text-green-600'}`}>
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{method.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {method.type === 'stripe' ? `Expires ${method.expiry}` : 'Direct Debit'}
                    </p>
                  </div>
                  {method.isDefault && (
                    <Badge variant="outline" className="ml-2 bg-primary/10 text-primary border-primary/20">
                      Default
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!method.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(method.id)}
                      className="text-xs"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Set Default
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(method.id)}
                    className="text-destructive text-xs"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-muted p-3 mb-3">
              <AlertCircle className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-lg mb-1">No payment methods</h3>
            <p className="text-muted-foreground text-sm max-w-sm mb-4">
              You don't have any payment methods saved yet. Add a payment method to use for future transactions.
            </p>
            <Button onClick={onAddPaymentMethod}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Payment Method
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
