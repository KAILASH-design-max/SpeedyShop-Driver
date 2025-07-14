
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { FileText, UploadCloud, CheckCircle, AlertTriangle, LinkIcon, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Profile, ProfileDocuments, DocumentMetadata } from "@/types";
import { storage } from "@/lib/firebase";
import { ref as storageRef, uploadBytesResumable, getDownloadURL, UploadTaskSnapshot } from "firebase/storage";
import { Badge } from "@/components/ui/badge";
import imageCompression from 'browser-image-compression';

type DocumentTypeKey = keyof ProfileDocuments;

interface DocumentUploadItemProps {
  docName: string;
  docKey: DocumentTypeKey;
  document?: DocumentMetadata;
  profileUid: string;
  onUpdate: (data: Record<string, any>) => Promise<void>; 
}

function DocumentUploadItem({ docName, docKey, document, profileUid, onUpdate }: DocumentUploadItemProps) {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setUploadProgress(0); 
    } else {
      setFile(null);
      setFileName(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({ variant: "destructive", title: "No File", description: `Please select a file for ${docName} first.` });
      return;
    }
    if (!profileUid) {
      toast({ variant: "destructive", title: "Error", description: "User ID not found. Cannot upload document."});
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    let fileToUpload = file;

    if (file.type.startsWith('image/')) {
        try {
            const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
                useWebWorker: true,
            }
            fileToUpload = await imageCompression(file, options);
            toast({ title: "Image Compressed", description: `Original size: ${(file.size / 1024 / 1024).toFixed(2)} MB, New size: ${(fileToUpload.size / 1024 / 1024).toFixed(2)} MB`});
        } catch (error) {
            console.error('Image compression error:', error);
            toast({ variant: "destructive", title: "Compression Failed", description: "Could not compress image, uploading original." });
        }
    }
    
    const documentPath = `deliveryDocs/${profileUid}/${docKey}.${fileToUpload.name.split('.').pop()}`;
    const fileStorageRef = storageRef(storage, documentPath);
    
    const uploadTask = uploadBytesResumable(fileStorageRef, fileToUpload);

    uploadTask.on('state_changed', 
      (snapshot: UploadTaskSnapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      }, 
      (error) => {
        console.error(`Error uploading ${docName}:`, error);
        toast({ variant: "destructive", title: "Upload Failed", description: `Could not upload ${docName}. ${error.message}` });
        setIsUploading(false);
        setUploadProgress(0);
      }, 
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          const documentData: DocumentMetadata = {
            fileName: fileToUpload.name,
            url: downloadURL,
            uploadedAt: true, // Placeholder for serverTimestamp
          };

          const updatePayload = { 
            documents: {
              [docKey]: documentData,
            }
          };

          await onUpdate(updatePayload);

          toast({ title: "Document Uploaded", description: `${docName} has been successfully uploaded.`, className: "bg-green-500 text-white" });
          setFile(null); 
          setFileName(null);
        } catch (error) {
            console.error(`Error getting download URL or updating profile for ${docName}:`, error);
            toast({ variant: "destructive", title: "Upload Post-Processing Failed", description: `Could not finalize ${docName} upload.` });
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
      }
    );
  };
  
  const getStatusIcon = () => {
    if (isUploading) return <Loader2 className="h-5 w-5 text-yellow-500 animate-spin" />;
    if (document?.url) return <CheckCircle className="h-5 w-5 text-green-500" />;
    return <AlertTriangle className="h-5 w-5 text-orange-400" />;
  };
  
  const getStatusText = () => {
    if (isUploading) return `Uploading... ${Math.round(uploadProgress)}%`;
    if (document?.url) return "Uploaded";
    return "Not Uploaded";
  }

  const getBadgeVariant = (isUploaded?: boolean) => {
    return isUploaded ? 'default' : 'outline';
  }

  return (
    <div className="p-4 border rounded-lg bg-muted/30">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h3 className="font-semibold text-lg">{docName}</h3>
          <div className="flex items-center text-sm gap-2 mt-1">
             <Badge variant={getBadgeVariant(!!document?.url)} className="capitalize">
                {getStatusIcon()}
                <span className="ml-2">{getStatusText()}</span>
             </Badge>
          </div>
          {document?.url && !isUploading && (
            <a href={document.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center mt-1">
              <LinkIcon className="mr-1 h-3 w-3" /> View {document.fileName}
            </a>
          )}
        </div>
        <div className="flex items-center gap-2 mt-2 sm:mt-0 w-full sm:w-auto">
          <Label htmlFor={`doc-upload-${docKey}`} className="flex-grow">
            <Input 
              id={`doc-upload-${docKey}`} 
              type="file" 
              accept="image/*,application/pdf"
              className="hidden" 
              onChange={handleFileChange}
              disabled={isUploading}
            />
            <Button variant="outline" asChild className="w-full sm:w-auto cursor-pointer">
              <span>{fileName || 'Choose File'}</span>
            </Button>
          </Label>
          {file && (
            <Button onClick={handleUpload} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isUploading}>
              {isUploading ? <Loader2 className="mr-1 h-4 w-4 animate-spin"/> : <UploadCloud className="mr-1 h-4 w-4"/>}
              Upload
            </Button>
          )}
        </div>
      </div>
      {isUploading && uploadProgress > 0 && (
        <Progress value={uploadProgress} className="w-full h-2 mt-2" />
      )}
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
    { name: "Vehicle Registration", key: "vehicleRegistration" },
    { name: "Proof of Insurance", key: "proofOfInsurance" },
  ];

  if (!profile || !profile.uid) {
      return (
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl font-bold text-primary"><FileText className="mr-2 h-6 w-6"/>Document Management</CardTitle>
            <CardDescription>Upload and manage your required documents for verification.</CardDescription>
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
        <CardTitle className="flex items-center text-2xl font-bold text-primary"><FileText className="mr-2 h-6 w-6"/>Document Management</CardTitle>
        <CardDescription>Upload and manage your required documents for verification. Images will be compressed if possible.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {documentsToManage.map((doc) => (
          <DocumentUploadItem
            key={doc.key}
            docName={doc.name}
            docKey={doc.key}
            document={profile.documents?.[doc.key]}
            profileUid={profile.uid}
            onUpdate={onUpdate}
          />
        ))}
      </CardContent>
    </Card>
  );
}
