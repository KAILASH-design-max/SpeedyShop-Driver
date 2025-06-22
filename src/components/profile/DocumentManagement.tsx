
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { FileText, UploadCloud, CheckCircle, AlertTriangle, LinkIcon, Loader2, ShieldQuestion } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Profile, ProfileDocuments, DocumentMetadata, DriverLicenseDocument, VehicleRegistrationDocument, ProofOfInsuranceDocument } from "@/types";
import { storage } from "@/lib/firebase";
import { ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject, UploadTaskSnapshot } from "firebase/storage";
import { Badge } from "@/components/ui/badge";

type DocumentObject = DriverLicenseDocument | VehicleRegistrationDocument | ProofOfInsuranceDocument;
type DocumentTypeKey = keyof ProfileDocuments;

interface DocumentUploadItemProps {
  docName: string;
  docKey: DocumentTypeKey;
  document?: DocumentObject;
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
    
    const documentPath = `partnerDocuments/${profileUid}/${docKey}/${file.name}`;
    const fileStorageRef = storageRef(storage, documentPath);
    
    const uploadTask = uploadBytesResumable(fileStorageRef, file);

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
            fileName: file.name,
            fileUrl: downloadURL,
            storagePath: documentPath,
            uploadedAt: new Date().toISOString(), // This will be converted to server timestamp by the parent
            verificationStatus: 'pending',
          };

          const updatePayload = { 
            [`documents.${docKey}`]: documentData,
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
    if (document?.verificationStatus === 'approved') return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (document?.verificationStatus === 'rejected') return <AlertTriangle className="h-5 w-5 text-red-500" />;
    if (document?.verificationStatus === 'pending') return <ShieldQuestion className="h-5 w-5 text-yellow-500" />;
    return <AlertTriangle className="h-5 w-5 text-orange-400" />;
  };
  
  const getStatusText = () => {
    if (isUploading) return `Uploading... ${Math.round(uploadProgress)}%`;
    if (document?.verificationStatus) return `Verification: ${document.verificationStatus.charAt(0).toUpperCase() + document.verificationStatus.slice(1)}`;
    return "Not Uploaded";
  }

  const getBadgeVariant = (status?: string) => {
    switch(status) {
        case 'approved': return 'default';
        case 'pending': return 'secondary';
        case 'rejected': return 'destructive';
        default: return 'outline';
    }
  }

  return (
    <div className="p-4 border rounded-lg bg-muted/30">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h3 className="font-semibold text-lg">{docName}</h3>
          <div className="flex items-center text-sm gap-2 mt-1">
             {document ? (
                <Badge variant={getBadgeVariant(document.verificationStatus)} className="capitalize">
                    {getStatusIcon()}
                    <span className="ml-2">{getStatusText()}</span>
                </Badge>
             ) : (
                <Badge variant="outline">
                    <AlertTriangle className="h-4 w-4 mr-1"/> Not Uploaded
                </Badge>
             )}
          </div>
          {document?.fileUrl && !isUploading && (
            <a href={document.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center mt-1">
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
