
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, UploadCloud, CheckCircle, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface DocumentItem {
  name: string;
  status: "verified" | "pending" | "rejected" | "not_uploaded";
  file?: File | null;
  fileName?: string;
}

const initialDocuments: DocumentItem[] = [
  { name: "Driver's License", status: "not_uploaded" },
  { name: "Vehicle Registration", status: "not_uploaded" },
  { name: "Proof of Insurance", status: "not_uploaded" },
];

export function DocumentManagement() {
  const [documents, setDocuments] = useState<DocumentItem[]>(initialDocuments);
  const { toast } = useToast();

  const handleFileChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const newDocuments = [...documents];
      newDocuments[index].file = file;
      newDocuments[index].fileName = file.name;
      newDocuments[index].status = "pending"; // Assume pending after new upload
      setDocuments(newDocuments);
    }
  };

  const handleUpload = (index: number) => {
    const doc = documents[index];
    if (doc.file) {
      // Mock upload logic
      console.log(`Uploading ${doc.name}:`, doc.file);
      // Simulate API call and update status
      setTimeout(() => {
        const newDocuments = [...documents];
        newDocuments[index].status = Math.random() > 0.3 ? "pending" : "rejected"; // Randomly set to pending or rejected for demo
        if(newDocuments[index].status === "pending") {
             toast({ title: "Document Submitted", description: `${doc.name} sent for verification.`, className: "bg-blue-500 text-white" });
        } else {
             toast({ variant: "destructive", title: "Document Issue", description: `${doc.name} could not be verified. Please re-upload.` });
        }
        setDocuments(newDocuments);
      }, 1500);
    } else {
      toast({ variant: "destructive", title: "No File", description: `Please select a file for ${doc.name} first.` });
    }
  };
  
  const getStatusIcon = (status: DocumentItem["status"]) => {
    switch (status) {
      case "verified": return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "pending": return <UploadCloud className="h-5 w-5 text-yellow-500 animate-pulse" />;
      case "rejected": return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default: return <FileText className="h-5 w-5 text-muted-foreground" />;
    }
  };
  
  const getStatusText = (status: DocumentItem["status"]) => {
     switch (status) {
      case "verified": return "Verified";
      case "pending": return "Pending Verification";
      case "rejected": return "Rejected - Re-upload";
      default: return "Not Uploaded";
    }
  }

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl font-bold text-primary"><FileText className="mr-2 h-6 w-6"/>Document Management</CardTitle>
        <CardDescription>Upload and manage your required documents for verification.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {documents.map((doc, index) => (
          <div key={index} className="p-4 border rounded-lg bg-muted/30">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                    <h3 className="font-semibold text-lg">{doc.name}</h3>
                    <div className="flex items-center text-sm">
                        {getStatusIcon(doc.status)}
                        <span className="ml-2">{getStatusText(doc.status)}</span>
                    </div>
                </div>
                 <div className="flex items-center gap-2 mt-2 sm:mt-0 w-full sm:w-auto">
                    <Label htmlFor={`doc-upload-${index}`} className="flex-grow">
                        <Input 
                            id={`doc-upload-${index}`} 
                            type="file" 
                            className="hidden" 
                            onChange={(e) => handleFileChange(index, e)} 
                        />
                         <Button variant="outline" asChild className="w-full sm:w-auto cursor-pointer">
                            <span>{doc.fileName ? doc.fileName.substring(0,20) + (doc.fileName.length > 20 ? '...' : '') : 'Choose File'}</span>
                        </Button>
                    </Label>
                    {(doc.status === "not_uploaded" || doc.status === "rejected" || doc.file) && doc.status !== "verified" && (
                         <Button onClick={() => handleUpload(index)} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                            <UploadCloud className="mr-1 h-4 w-4"/> Upload
                        </Button>
                    )}
                </div>
            </div>
            {doc.status === "rejected" && <p className="text-xs text-red-500 mt-1">There was an issue with your document. Please check requirements and upload again.</p>}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
