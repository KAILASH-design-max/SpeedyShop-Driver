
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { FileText, UploadCloud, CheckCircle, AlertTriangle, LinkIcon, Loader2, PlusCircle, ExternalLink } from "lucide-react";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Profile, ProfileDocuments, DocumentMetadata } from "@/types";
import { storage } from "@/lib/firebase";
import { ref as storageRef, uploadBytesResumable, getDownloadURL, UploadTaskSnapshot } from "firebase/storage";
import { Badge } from "@/components/ui/badge";
import imageCompression from 'browser-image-compression';

type DocumentTypeKey = keyof ProfileDocuments;

interface DocumentItemProps {
  docName: string;
  docKey: DocumentTypeKey;
  document?: DocumentMetadata;
  profileUid: string;
  onUpdate: (data: Record<string, any>) => Promise<void>; 
}


const getStatusInfo = (docKey: DocumentTypeKey, document?: DocumentMetadata) => {
    if (!document?.url) {
        return { text: 'Missing', variant: 'destructive', actionText: 'Upload', hasAction: true, hasView: false };
    }
    
    // This is a placeholder for real verification logic which would come from the backend.
    switch(docKey) {
        case 'proofOfInsurance':
             return { text: 'Expires in 2 weeks', variant: 'secondary', actionText: 'Update Now', hasAction: true, hasView: true };
        default:
             return { text: 'Verified', variant: 'default', actionText: 'View', hasAction: false, hasView: true };
    }
}


function DocumentItem({ docName, docKey, document, profileUid, onUpdate }: DocumentItemProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const statusInfo = getStatusInfo(docKey, document);

  const handleFileChangeAndUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      // Trigger upload immediately after file selection
      await handleUpload(file);
    }
  };
  
  const handleUpload = async (file: File) => {
    if (!profileUid) {
      toast({ variant: "destructive", title: "Error", description: "User ID not found. Cannot upload document."});
      return;
    }
    
     toast({
          title: "Starting Upload...",
          description: `Uploading ${docName}. Please wait.`,
      });

    let fileToUpload = file;

    if (file.type.startsWith('image/')) {
        try {
            const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
                useWebWorker: true,
            }
            fileToUpload = await imageCompression(file, options);
        } catch (error) {
            console.error('Image compression error:', error);
        }
    }
    
    const documentPath = `deliveryDocs/${profileUid}/${docKey}.${fileToUpload.name.split('.').pop()}`;
    const fileStorageRef = storageRef(storage, documentPath);
    
    const uploadTask = uploadBytesResumable(fileStorageRef, fileToUpload);

    uploadTask.on('state_changed', 
      () => {}, // Progress (optional)
      (error) => { // Error
        console.error(`Error uploading ${docName}:`, error);
        toast({ variant: "destructive", title: "Upload Failed", description: `Could not upload ${docName}. ${error.message}` });
      }, 
      async () => { // Complete
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          const documentData: DocumentMetadata = {
            fileName: fileToUpload.name,
            url: downloadURL,
            uploadedAt: true, 
          };
          const updatePayload = { documents: { [docKey]: documentData } };
          await onUpdate(updatePayload);
          toast({ title: "Document Uploaded", description: `${docName} has been successfully uploaded.`, className: "bg-green-500 text-white" });
        } catch (error) {
            console.error(`Error getting download URL or updating profile for ${docName}:`, error);
            toast({ variant: "destructive", title: "Upload Post-Processing Failed", description: `Could not finalize ${docName} upload.` });
        }
      }
    );
  };
  

  return (
    <div className="p-4 border rounded-lg bg-muted/30 flex justify-between items-center">
      <h3 className="font-semibold text-[15px]">{docName}</h3>
      <div className="flex items-center gap-2">
         <Badge variant={statusInfo.variant as any}>{statusInfo.text}</Badge>
         {statusInfo.hasView && (
             <a href={document?.url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">View</Button>
            </a>
         )}
         {statusInfo.hasAction && (
             <Button size="sm" onClick={() => fileInputRef.current?.click()}>
                {statusInfo.actionText}
             </Button>
         )}
         <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChangeAndUpload}
            className="hidden" 
            accept="image/*,application/pdf"
          />
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

  if (!profile || !profile.uid) {
      return (
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl font-bold text-primary"><FileText className="mr-2 h-6 w-6"/>KYC Documents</CardTitle>
            <CardDescription>Manage your verification documents.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Loading profile information or user not fully authenticated...</p>
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
            profileUid={profile.uid}
            onUpdate={onUpdate}
          />
        ))}
         <Button variant="outline" className="w-full mt-4">
          <PlusCircle className="mr-2 h-4 w-4" />
          Upload New Document
        </Button>
      </CardContent>
    </Card>
  );
}
