
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, UploadCloud, CheckCircle, AlertTriangle, Loader2, PlusCircle, ExternalLink, Camera, VideoOff } from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Profile, ProfileDocuments, DocumentMetadata } from "@/types";
import { storage } from "@/lib/firebase";
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Badge } from "@/components/ui/badge";
import imageCompression from 'browser-image-compression';
import { differenceInDays, parseISO } from 'date-fns';
import { Alert, AlertTitle } from "@/components/ui/alert";

type DocumentTypeKey = keyof ProfileDocuments;

interface DocumentUploadDialogProps {
  docName: string;
  docKey: DocumentTypeKey;
  profileUid: string;
  onUpdate: (data: Record<string, any>) => Promise<void>;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

function DocumentUploadDialog({ docName, docKey, profileUid, onUpdate, children, onOpenChange }: DocumentUploadDialogProps) {
    const { toast } = useToast();
    const [isUploading, setIsUploading] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [capturedFile, setCapturedFile] = useState<File | null>(null);
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }, []);

    const startCamera = useCallback(async () => {
        stopCamera();
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
                setHasCameraPermission(true);
            } catch (error) {
                console.error('Error accessing camera:', error);
                setHasCameraPermission(false);
            }
        } else {
            setHasCameraPermission(false);
        }
    }, [stopCamera]);
    
    useEffect(() => {
        // Cleanup camera on component unmount
        return () => stopCamera();
    }, [stopCamera]);

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
                    const file = new File([blob], `${docKey}-${Date.now()}.jpg`, { type: 'image/jpeg' });
                    setCapturedFile(file);
                    setPhotoPreview(canvas.toDataURL('image/jpeg'));
                    stopCamera();
                }
            }, 'image/jpeg', 0.95);
        }
    };
    
    const handleUpload = async () => {
        if (!capturedFile) return;
        
        setIsUploading(true);
        toast({ title: "Starting Upload...", description: `Uploading ${docName}. Please wait.` });

        try {
            const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
            const compressedFile = await imageCompression(capturedFile, options);
            
            const documentPath = `deliveryDocs/${profileUid}/${docKey}.${compressedFile.name.split('.').pop()}`;
            const fileStorageRef = storageRef(storage, documentPath);
            const uploadTask = uploadBytesResumable(fileStorageRef, compressedFile);

            uploadTask.on('state_changed', 
                () => {}, 
                (error) => {
                    throw error;
                }, 
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    const updatePayload = {
                        documents: { [docKey]: { fileName: compressedFile.name, url: downloadURL, uploadedAt: true } }
                    };
                    await onUpdate(updatePayload);
                    toast({ title: "Document Uploaded", description: `${docName} has been successfully uploaded.`, className: "bg-green-500 text-white" });
                    setIsUploading(false);
                    onOpenChange(false);
                }
            );

        } catch (error) {
            console.error(`Error uploading ${docName}:`, error);
            toast({ variant: "destructive", title: "Upload Failed", description: `Could not upload ${docName}.` });
            setIsUploading(false);
        }
    };
    
    const handleRetake = () => {
        setPhotoPreview(null);
        setCapturedFile(null);
        startCamera();
    };

    return (
        <Dialog onOpenChange={(isOpen) => {
            onOpenChange(isOpen);
            if(isOpen) startCamera();
            else stopCamera();
        }}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center"><Camera className="mr-2 h-5 w-5"/>Capture {docName}</DialogTitle>
                    <DialogDescription>Position your document in the frame and capture a clear photo.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {!photoPreview ? (
                        <>
                            {hasCameraPermission === null && (
                                <div className="flex justify-center items-center h-48 bg-muted rounded-md"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                            )}
                            {hasCameraPermission === false && (
                                <Alert variant="destructive">
                                    <VideoOff className="h-4 w-4" />
                                    <AlertTitle>Camera Access Denied</AlertTitle>
                                    <p>Please enable camera permissions in your browser settings to use this feature.</p>
                                </Alert>
                            )}
                            {hasCameraPermission && <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay muted playsInline />}
                            <Button onClick={handleCaptureFromCamera} className="w-full" disabled={!hasCameraPermission}>
                                <Camera className="mr-2 h-5 w-5" /> Capture Photo
                            </Button>
                        </>
                    ) : (
                         <>
                            <p className="text-sm font-medium">Photo Preview:</p>
                            <img src={photoPreview} alt="Document preview" className="rounded-md max-h-64 w-auto object-contain border mx-auto" />
                            <div className="flex gap-2">
                                <Button onClick={handleRetake} variant="outline" className="w-full" disabled={isUploading}>Retake</Button>
                                <Button onClick={handleUpload} className="w-full" disabled={isUploading}>
                                    {isUploading ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <UploadCloud className="mr-2 h-5 w-5" />}
                                    Upload
                                </Button>
                            </div>
                        </>
                    )}
                </div>
                 <canvas ref={canvasRef} className="hidden" />
            </DialogContent>
        </Dialog>
    );
}

interface DocumentItemProps {
  docName: string;
  docKey: DocumentTypeKey;
  document?: DocumentMetadata;
  profile: Profile;
  onUpdate: (data: Record<string, any>) => Promise<void>; 
}

const getStatusInfo = (docKey: DocumentTypeKey, document?: DocumentMetadata) => {
    if (!document?.url) {
        return { text: 'Missing', variant: 'destructive', actionText: 'Upload', hasAction: true, hasView: false };
    }
    if (document.expiryDate) {
        const daysUntilExpiry = differenceInDays(parseISO(document.expiryDate), new Date());
        if (daysUntilExpiry <= 0) return { text: 'Expired', variant: 'destructive', actionText: 'Update', hasAction: true, hasView: true };
        if (daysUntilExpiry <= 30) return { text: `Expires in ${daysUntilExpiry} days`, variant: 'secondary', actionText: 'Update', hasAction: true, hasView: true };
    }
    return { text: 'Verified', variant: 'default', actionText: 'View', hasAction: false, hasView: true };
}

function DocumentItem({ docName, docKey, document, profile, onUpdate }: DocumentItemProps) {
  const [isDialogOpen, setDialogOpen] = useState(false);
  const statusInfo = getStatusInfo(docKey, document);

  return (
    <div className="p-4 border rounded-lg bg-muted/30 flex justify-between items-center">
      <h3 className="font-semibold text-[15px]">{docName}</h3>
      <div className="flex items-center gap-2">
         <Badge variant={statusInfo.variant as any}>{statusInfo.text}</Badge>
         {statusInfo.hasView && document?.url && (
             <a href={document.url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">View</Button>
            </a>
         )}
         {statusInfo.hasAction && (
             <DocumentUploadDialog 
                docName={docName} 
                docKey={docKey}
                profileUid={profile.uid}
                onUpdate={onUpdate}
                onOpenChange={setDialogOpen}
             >
                <Button size="sm">{statusInfo.actionText}</Button>
             </DocumentUploadDialog>
         )}
      </div>
    </div>
  );
}

interface DocumentManagementProps {
  profile: Profile;
  onUpdate: (data: Partial<Profile> | Record<string, any>) => Promise<void>;
}

export function DocumentManagement({ profile, onUpdate }: DocumentManagementProps) {
  const documentsToManage: Array<{ name: string; key: keyof ProfileDocuments }> = [
    { name: "Driver's License", key: "driverLicense" },
    { name: "Vehicle Insurance", key: "proofOfInsurance" },
    { name: "PAN Card", key: "pan" },
  ];

  if (!profile?.uid) {
      return (
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl font-bold text-primary"><FileText className="mr-2 h-6 w-6"/>KYC Documents</CardTitle>
            <CardDescription>Manage your verification documents.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Loading profile information...</p>
          </CardContent>
        </Card>
      );
  }

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center text-lg"><FileText className="mr-2 h-6 w-6 text-primary"/>KYC Documents</CardTitle>
        <CardDescription>Manage your verification documents.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {documentsToManage.map((doc) => (
          <DocumentItem
            key={doc.key}
            docName={doc.name}
            docKey={doc.key}
            document={profile.documents?.[doc.key]}
            profile={profile}
            onUpdate={onUpdate}
          />
        ))}
      </CardContent>
    </Card>
  );
}
