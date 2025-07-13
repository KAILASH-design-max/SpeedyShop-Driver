
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Edit3, CheckCircle, UploadCloud, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Order } from "@/types";
import { storage } from "@/lib/firebase";
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Checkbox } from "@/components/ui/checkbox";
import imageCompression from 'browser-image-compression';

interface DeliveryConfirmationProps {
  order: Order;
  onConfirm: (proof?: { type: 'photo' | 'signature', value: string }) => void;
  isUpdating: boolean;
}

export function DeliveryConfirmation({ order, onConfirm, isUpdating }: DeliveryConfirmationProps) {
  const [photo, setPhoto] = useState<File | null>(null);
  const [signature, setSignature] = useState<string>("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [leftAtDoor, setLeftAtDoor] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setPhoto(file);
      setSignature(""); // Clear signature if photo is chosen
      setLeftAtDoor(false);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setSignature(e.target.value);
      setPhoto(null); // Clear photo if signature is chosen
      setPhotoPreview(null);
      setLeftAtDoor(false);
  }
  
  const handleLeftAtDoorChange = (checked: boolean | 'indeterminate') => {
      if(typeof checked === 'boolean') {
        setLeftAtDoor(checked);
        if (checked) {
            setSignature(""); // Clear other fields
            setPhoto(null);
            setPhotoPreview(null);
        }
      }
  }

  const handleSubmit = async () => {
    if (order.noContactDelivery) {
        if (!leftAtDoor && !photo) {
             toast({
                variant: "destructive",
                title: "Confirmation Incomplete",
                description: "For no-contact delivery, please check the box or upload a photo.",
            });
            return;
        }
        if (photo) { // Photo is priority proof for no-contact
            setIsUploading(true);
            try {
                const photoURL = await uploadProofPhoto(photo);
                onConfirm({ type: 'photo', value: photoURL });
            } catch (error) {
                toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not upload proof photo.' });
            } finally {
                setIsUploading(false);
            }
        } else { // Left at door is secondary proof
            onConfirm();
        }

    } else { // Standard delivery
        if (!photo && !signature) {
            toast({
                variant: "destructive",
                title: "Confirmation Incomplete",
                description: "Please provide a photo or a signature for proof of delivery.",
            });
            return;
        }
        if (photo) {
            setIsUploading(true);
            try {
                const photoURL = await uploadProofPhoto(photo);
                onConfirm({ type: 'photo', value: photoURL });
            } catch (error) {
                toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not upload proof photo.' });
            } finally {
                setIsUploading(false);
            }
        } else if (signature) {
            onConfirm({ type: 'signature', value: signature });
        }
    }
  };

  const uploadProofPhoto = (file: File): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      let fileToUpload = file;
      if (file.type.startsWith('image/')) {
        try {
          const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
          }
          fileToUpload = await imageCompression(file, options);
          toast({ title: "Image Compressed", description: `Original: ${(file.size / 1024 / 1024).toFixed(2)} MB, New: ${(fileToUpload.size / 1024 / 1024).toFixed(2)} MB` });
        } catch (error) {
          console.error('Image compression error:', error);
          toast({ variant: "destructive", title: "Compression Failed", description: "Could not compress image, uploading original." });
        }
      }

      const filePath = `deliveryProofs/${order.id}/${fileToUpload.name}`;
      const fileRef = storageRef(storage, filePath);
      const uploadTask = uploadBytesResumable(fileRef, fileToUpload);

      uploadTask.on('state_changed',
        () => {}, // We can add progress indicator logic here if needed
        (error) => {
          console.error("Upload failed:", error);
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  };

  const isConfirmDisabled = isUpdating || isUploading;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-xl"><CheckCircle className="mr-2 text-primary"/>Proof of Delivery</CardTitle>
        <CardDescription>Capture proof to confirm the delivery.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {order.noContactDelivery ? (
             <div className="space-y-4">
                 <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
                    <Checkbox id="left-at-door" checked={leftAtDoor} onCheckedChange={handleLeftAtDoorChange} />
                    <Label htmlFor="left-at-door" className="font-medium text-base">Item(s) left at safe location</Label>
                 </div>

                <div className="text-center text-muted-foreground my-2">OR (Optional)</div>
                
                <div>
                  <Label htmlFor="photo-upload" className="flex items-center mb-2 font-medium"><Camera className="mr-2 h-5 w-5"/>Upload Photo Proof</Label>
                  <Input id="photo-upload" type="file" accept="image/*" capture onChange={handlePhotoChange} className="cursor-pointer file:text-primary file:font-semibold file:bg-primary/10 file:hover:bg-primary/20 file:border-none file:rounded-md file:px-3 file:py-1.5"/>
                  {photoPreview && (
                    <div className="mt-4">
                      <img src={photoPreview} alt="Delivery proof" className="rounded-md max-h-48 w-auto object-contain border" />
                    </div>
                  )}
                </div>
            </div>
        ) : (
            <>
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
                    onChange={handleSignatureChange}
                    className="min-h-[80px]"
                  />
                  <p className="text-xs text-muted-foreground mt-1">For a quick confirmation, ask the customer to type their name.</p>
                </div>
            </>
        )}

        <Button onClick={handleSubmit} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isConfirmDisabled}>
         {isConfirmDisabled ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <UploadCloud className="mr-2 h-5 w-5" />}
         {isUploading ? 'Uploading...' : 'Confirm Delivery'}
        </Button>
      </CardContent>
    </Card>
  );
}
