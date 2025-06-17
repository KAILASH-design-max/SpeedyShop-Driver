
"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Edit3, CheckCircle, UploadCloud } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DeliveryConfirmationProps {
  orderId: string;
  onConfirm: () => void; // Callback after confirmation
}

export function DeliveryConfirmation({ orderId, onConfirm }: DeliveryConfirmationProps) {
  const [photo, setPhoto] = useState<File | null>(null);
  const [signature, setSignature] = useState<string>(""); // For text-based signature
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!photo && !signature) {
      toast({
        variant: "destructive",
        title: "Confirmation Incomplete",
        description: "Please provide a photo or a signature for proof of delivery.",
      });
      return;
    }
    // Mock confirmation logic
    console.log("Delivery confirmed for order:", orderId, { photo, signature });
    toast({
      title: "Delivery Confirmed!",
      description: `Order ${orderId.substring(0,8)} marked as delivered.`,
      className: "bg-green-500 text-white",
      duration: 3000,
    });
    onConfirm();
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-xl"><CheckCircle className="mr-2 text-primary"/>Proof of Delivery</CardTitle>
        <CardDescription>Capture photo or signature to confirm delivery.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="photo-upload" className="flex items-center mb-2 font-medium"><Camera className="mr-2 h-5 w-5"/>Capture Photo</Label>
          <Input id="photo-upload" type="file" accept="image/*" capture onChange={handlePhotoChange} className="cursor-pointer file:text-primary file:font-semibold file:bg-primary/10 file:hover:bg-primary/20 file:border-none file:rounded-md file:px-3 file:py-1.5"/>
          {photoPreview && (
            <div className="mt-4">
              <img src={photoPreview} alt="Delivery proof" className="rounded-md max-h-48 w-auto object-contain border" />
            </div>
          )}
        </div>

        <div className="text-center text-muted-foreground my-2">OR</div>
        
        <div>
          <Label htmlFor="signature" className="flex items-center mb-2 font-medium"><Edit3 className="mr-2 h-5 w-5"/>Customer Signature (Type Name)</Label>
          <Textarea 
            id="signature" 
            placeholder="Customer types their name here" 
            value={signature} 
            onChange={(e) => setSignature(e.target.value)} 
            className="min-h-[80px]"
          />
          <p className="text-xs text-muted-foreground mt-1">For a quick confirmation, ask the customer to type their name.</p>
        </div>

        <Button onClick={handleSubmit} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
         <UploadCloud className="mr-2 h-5 w-5" /> Confirm Delivery
        </Button>
      </CardContent>
    </Card>
  );
}
