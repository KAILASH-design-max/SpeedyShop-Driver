
"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Edit3, CheckCircle, UploadCloud, Loader2, VideoOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Order } from "@/types";
import { storage } from "@/lib/firebase";
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Checkbox } from "@/components/ui/checkbox";
import imageCompression from 'browser-image-compression';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  useEffect(() => {
    // Stop any existing streams before starting a new one
    if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
    }

    // Only request camera if needed
    if (
        !photo && // no photo taken yet
        (!order.noContactDelivery || // standard delivery
        (order.noContactDelivery && !leftAtDoor)) // no-contact but not left-at-door yet
    ) {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(stream => {
                    setHasCameraPermission(true);
                    setIsCameraActive(true);
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                })
                .catch(error => {
                    console.error('Error accessing camera:', error);
                    setHasCameraPermission(false);
                    setIsCameraActive(false);
                });
        } else {
            setHasCameraPermission(false);
            setIsCameraActive(false);
        }
    } else {
        setIsCameraActive(false);
    }
    
    // Cleanup function to stop video stream
    return () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    };
  }, [leftAtDoor, photo, order.noContactDelivery]);

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setPhoto(file);
      setSignature(""); // Clear signature
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setIsCameraActive(false); // Turn off camera if a file is uploaded
    }
  };

  const handleCaptureFromCamera = () => {
    if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        
        canvas.toBlob(blob => {
            if (blob) {
                const capturedFile = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
                setPhoto(capturedFile);
                setPhotoPreview(canvas.toDataURL('image/jpeg'));
                setSignature(""); // Clear signature
                setIsCameraActive(false); // Stop camera feed after capture
            }
        }, 'image/jpeg', 0.95);
    }
  };
  
  const handleSignatureChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setSignature(e.target.value);
      setPhoto(null); // Clear photo
      setPhotoPreview(null);
      setIsCameraActive(false);
  }
  
  const handleLeftAtDoorChange = (checked: boolean | 'indeterminate') => {
      if(typeof checked === 'boolean') {
        setLeftAtDoor(checked);
        if (checked) {
            setSignature("");
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
                description: "For no-contact delivery, check 'left at door' or upload a photo.",
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
        } else {
            onConfirm();
        }

    } else {
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
        () => {}, 
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
        
        {isCameraActive && hasCameraPermission && (
            <div className="space-y-2">
                <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay muted playsInline />
                <Button onClick={handleCaptureFromCamera} className="w-full" variant="outline">
                    <Camera className="mr-2 h-5 w-5" /> Capture from Camera
                </Button>
            </div>
        )}
        <canvas ref={canvasRef} className="hidden" />

        {photoPreview && (
            <div className="mt-4">
                <p className="text-sm font-medium mb-2">Photo Preview:</p>
                <img src={photoPreview} alt="Delivery proof" className="rounded-md max-h-48 w-auto object-contain border" />
            </div>
        )}

        {hasCameraPermission === false && (
             <Alert>
                <VideoOff className="h-4 w-4" />
                <AlertTitle>Camera Not Available</AlertTitle>
                <AlertDescription>
                    In-app camera is not available or permission was denied. Please use the file upload option below.
                </AlertDescription>
            </Alert>
        )}
        
        {(!isCameraActive || hasCameraPermission === false) && (
            <>
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                    Or
                    </span>
                </div>
            </div>

            <div>
              <Label htmlFor="photo-upload" className="flex items-center mb-2 font-medium"><UploadCloud className="mr-2 h-5 w-5"/>Upload Photo Proof</Label>
              <Input id="photo-upload" type="file" accept="image/*" onChange={handlePhotoChange} className="cursor-pointer file:text-primary file:font-semibold file:bg-primary/10 file:hover:bg-primary/20 file:border-none file:rounded-md file:px-3 file:py-1.5"/>
            </div>
            </>
        )}


        {order.noContactDelivery ? (
             <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
                <Checkbox id="left-at-door" checked={leftAtDoor} onCheckedChange={handleLeftAtDoorChange} />
                <Label htmlFor="left-at-door" className="font-medium text-base">Item(s) left at safe location</Label>
             </div>
        ) : (
             <>
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">
                        Or
                        </span>
                    </div>
                </div>
                
                <div>
                  <Label htmlFor="signature" className="flex items-center mb-2 font-medium"><Edit3 className="mr-2 h-5 w-5"/>Customer Signature (Type Name)</Label>
                  <Textarea 
                    id="signature" 
                    placeholder="Customer types their name here" 
                    value={signature} 
                    onChange={handleSignatureChange}
                    className="min-h-[80px]"
                    disabled={!!photoPreview || isCameraActive}
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
