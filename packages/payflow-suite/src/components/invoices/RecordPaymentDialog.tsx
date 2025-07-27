
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface RecordPaymentDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  invoiceId: string;
  invoiceAmount: number;
  remainingBalance: number;
  onRecordPayment: (paymentData: any) => void; // Updated to accept payment data
}

export const RecordPaymentDialog = ({
  isOpen,
  setIsOpen,
  invoiceId,
  invoiceAmount,
  remainingBalance,
  onRecordPayment,
}: RecordPaymentDialogProps) => {
  const [amount, setAmount] = useState(remainingBalance);
  const [method, setMethod] = useState("Credit Card");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState("");

  const handleSubmit = () => {
    const paymentData = {
      amount,
      method,
      date,
      reference: reference || undefined
    };
    
    onRecordPayment(paymentData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Record a payment for invoice {invoiceId}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium mb-1">Invoice Total</p>
              <p className="text-lg font-semibold">${invoiceAmount.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Balance Due</p>
              <p className="text-lg font-semibold">${remainingBalance.toFixed(2)}</p>
            </div>
          </div>
          
          <div>
            <p className="text-sm font-medium mb-1">Payment Amount</p>
            <input 
              type="number" 
              className="w-full p-2 border rounded-md" 
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </div>
          
          <div>
            <p className="text-sm font-medium mb-1">Payment Method</p>
            <select 
              className="w-full p-2 border rounded-md"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              <option>Credit Card</option>
              <option>Bank Transfer</option>
              <option>Cash</option>
              <option>Check</option>
              <option>PayPal</option>
              <option>Other</option>
            </select>
          </div>
          
          <div>
            <p className="text-sm font-medium mb-1">Payment Date</p>
            <input 
              type="date" 
              className="w-full p-2 border rounded-md"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          
          <div>
            <p className="text-sm font-medium mb-1">Reference (Optional)</p>
            <input 
              type="text" 
              className="w-full p-2 border rounded-md" 
              placeholder="Transaction reference or ID"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>Record Payment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
