
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, UploadCloud, CheckCircle, AlertTriangle, LinkIcon, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Profile, ProfileDocumentUrls } from "@/types";
import { storage } from "@/lib/firebase";
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

interface DocumentItemProps {
  docName: string;
  docKey: keyof ProfileDocumentUrls;
  currentUrl?: string;
  profileUid: string;
  onUpdate: (data: Partial<Profile>) => Promise<void>;
}

function DocumentUploadItem({ docName, docKey, currentUrl, profileUid, onUpdate }: DocumentItemProps) {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      setFile(selectedFile);
      setFileName(selectedFile.name);
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
    const documentPath = `partnerDocuments/${profileUid}/${docKey}/${file.name}`;
    const fileStorageRef = storageRef(storage, documentPath);

    try {
      // If a file already exists, delete it first (optional, depends on desired behavior)
      if (currentUrl) {
        try {
          // Attempt to derive path from URL - this is non-trivial and brittle.
          // For simplicity, we're not deleting old files here.
          // A more robust solution would store the full storage path in Firestore.
        } catch (e) { console.warn("Could not delete old file, proceeding with upload.", e); }
      }

      const snapshot = await uploadBytes(fileStorageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      await onUpdate({ documents: { [docKey]: downloadURL } });
      toast({ title: "Document Uploaded", description: `${docName} has been successfully uploaded.`, className: "bg-green-500 text-white" });
      setFile(null); // Clear file input after successful upload
      setFileName(null);
    } catch (error) {
      console.error(`Error uploading ${docName}:`, error);
      toast({ variant: "destructive", title: "Upload Failed", description: `Could not upload ${docName}.` });
    } finally {
      setIsUploading(false);
    }
  };
  
  const getStatusIcon = () => {
    if (isUploading) return <Loader2 className="h-5 w-5 text-yellow-500 animate-spin" />;
    if (currentUrl) return <CheckCircle className="h-5 w-5 text-green-500" />;
    return <AlertTriangle className="h-5 w-5 text-orange-400" />;
  };
  
  const getStatusText = () => {
    if (isUploading) return "Uploading...";
    if (currentUrl) return "Document Uploaded";
    return "Not Uploaded";
  }

  return (
    <div className="p-4 border rounded-lg bg-muted/30">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h3 className="font-semibold text-lg">{docName}</h3>
          <div className="flex items-center text-sm">
            {getStatusIcon()}
            <span className="ml-2">{getStatusText()}</span>
          </div>
          {currentUrl && !isUploading && (
            <a href={currentUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center mt-1">
              <LinkIcon className="mr-1 h-3 w-3" /> View Uploaded Document
            </a>
          )}
        </div>
        <div className="flex items-center gap-2 mt-2 sm:mt-0 w-full sm:w-auto">
          <Label htmlFor={`doc-upload-${docKey}`} className="flex-grow">
            <Input 
              id={`doc-upload-${docKey}`} 
              type="file" 
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
    </div>
  );
}


interface DocumentManagementProps {
  profile: Profile;
  onUpdate: (data: Partial<Profile>) => Promise<void>;
}

export function DocumentManagement({ profile, onUpdate }: DocumentManagementProps) {
  const documentsToManage: Array<{ name: string; key: keyof ProfileDocumentUrls }> = [
    { name: "Driver's License", key: "driverLicenseUrl" },
    { name: "Vehicle Registration", key: "vehicleRegistrationUrl" },
    { name: "Proof of Insurance", key: "proofOfInsuranceUrl" },
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
        <CardDescription>Upload and manage your required documents for verification.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {documentsToManage.map((doc) => (
          <DocumentUploadItem
            key={doc.key}
            docName={doc.name}
            docKey={doc.key}
            currentUrl={profile.documents?.[doc.key]}
            profileUid={profile.uid}
            onUpdate={onUpdate}
          />
        ))}
      </CardContent>
    </Card>
  );
}
