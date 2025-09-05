
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Edit, User, FileText, Banknote, ShieldCheck, Download, MapPin, Bike, Crown, Star } from "lucide-react";
import type { Profile } from "@/types";
import { cn } from "@/lib/utils";
import { ProfileForm } from "./ProfileForm";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { app } from "@/lib/firebase";

interface ProfileDetailsProps {
    profile: Profile;
    onUpdate: (data: Partial<Profile>) => Promise<void>;
}

const getVerificationBadgeVariant = (status?: string) => {
    switch(status) {
      case 'approved': return 'default';
      case 'pending': return 'secondary';
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
}

const getStatusBadgeClass = (isVerified?: boolean) => {
    return isVerified ? "bg-green-100 text-green-800 border-green-200" : "bg-yellow-100 text-yellow-800 border-yellow-200";
}

export function ProfileDetails({ profile, onUpdate }: ProfileDetailsProps) {
    const { toast } = useToast();

    const handleTaxStatementClick = () => {
        toast({
            title: "Feature Coming Soon",
            description: "Downloading tax statements will be available in a future update.",
        });
    };

    const vehicleString = `${profile.vehicleType.charAt(0).toUpperCase() + profile.vehicleType.slice(1)} - ${profile.vehicleRegistrationNumber}`;
    const bankAccountNumberCensored = profile.bankDetails?.accountNumber ? `********${profile.bankDetails.accountNumber.slice(-4)}` : 'N/A';
    const addressString = profile.address ? `${profile.address.street}, ${profile.address.city}` : '456 Delivery Ave, Bangalore';

    // Placeholder for gamification level
    const level = "Gold"; 

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative">
                    <Avatar className="h-24 w-24 border-4 border-primary">
                        <AvatarImage src={profile.profilePictureUrl || undefined} alt={profile.name} data-ai-hint="person face" />
                        <AvatarFallback>{profile.name?.substring(0,2).toUpperCase() || "JD"}</AvatarFallback>
                    </Avatar>
                     <div className="absolute -bottom-2 -right-2 flex items-center justify-center p-1 bg-yellow-400 border-2 border-background rounded-full">
                        <Crown className="h-5 w-5 text-white" />
                    </div>
                </div>
                <div className="flex-grow text-center sm:text-left">
                    <div className="flex items-center gap-3 justify-center sm:justify-start">
                        <h1 className="text-3xl font-bold text-primary">{profile.name}</h1>
                        <Badge className="text-base bg-yellow-400 text-white hover:bg-yellow-500">{level} Tier</Badge>
                    </div>
                    <p className="text-muted-foreground">{profile.email}</p>
                </div>
                <ProfileForm profile={profile} onUpdate={onUpdate}>
                    <Button variant="outline">
                        <Edit className="mr-2 h-4 w-4"/> Edit Profile
                    </Button>
                </ProfileForm>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center text-lg"><User className="mr-2 text-primary"/>Profile Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground flex items-center gap-2"><MapPin size={16}/>Current Address</span>
                            <span className="font-medium text-right">{addressString}</span>
                        </div>
                         <div className="flex justify-between items-center">
                            <span className="text-muted-foreground flex items-center gap-2"><Bike size={16}/>Vehicle</span>
                            <span className="font-medium">{vehicleString}</span>
                        </div>
                         <div className="flex justify-between items-center">
                            <span className="text-muted-foreground flex items-center gap-2"><ShieldCheck size={16}/>Gov ID Status</span>
                             <Badge variant={getVerificationBadgeVariant(profile.verificationStatus)} className="capitalize">
                                {profile.verificationStatus || 'N/A'}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center text-lg"><Banknote className="mr-2 text-primary"/>Bank & Payment</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-muted-foreground">Bank Account</p>
                                <p className="font-medium">{bankAccountNumberCensored} ({profile.bankDetails?.ifscCode})</p>
                            </div>
                            <Badge variant="outline" className={cn(getStatusBadgeClass(profile.bankDetails?.isVerified))}>
                                {profile.bankDetails?.isVerified ? 'Verified' : 'Pending'}
                            </Badge>
                        </div>
                         <div className="flex justify-between items-center">
                             <div>
                                <p className="text-muted-foreground">UPI ID</p>
                                <p className="font-medium">{profile.bankDetails?.upiId || 'Not provided'}</p>
                            </div>
                            {profile.bankDetails?.upiId && <Badge variant="outline" className={cn(getStatusBadgeClass(profile.bankDetails?.isVerified))}>
                                {profile.bankDetails?.isVerified ? 'Verified' : 'Pending'}
                            </Badge>}
                        </div>
                         <Button variant="outline" className="w-full" onClick={handleTaxStatementClick}>
                            <Download className="mr-2 h-4 w-4"/> Tax Statements (Form 16)
                         </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
