
"use client";

import type { Profile } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Bike, ShieldCheck } from "lucide-react";

interface DeliveryPartnerInfoCardProps {
  deliveryPartner: Profile;
}

const getVerificationBadgeVariant = (status?: string) => {
    switch(status) {
      case 'approved': return 'default';
      case 'pending': return 'secondary';
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
}

export function DeliveryPartnerInfoCard({ deliveryPartner }: DeliveryPartnerInfoCardProps) {

  if (!deliveryPartner) {
    return null;
  }

  return (
    <div className="p-4 border rounded-lg bg-muted/30 flex items-center gap-4">
        <Avatar className="h-12 w-12 border-2 border-primary">
            <AvatarImage src={deliveryPartner.profilePictureUrl || undefined} alt={deliveryPartner.name} />
            <AvatarFallback>{deliveryPartner.name?.substring(0, 2).toUpperCase() || "DP"}</AvatarFallback>
        </Avatar>
        <div className="flex-grow">
            <p className="text-xs text-muted-foreground">Assigned Delivery Partner</p>
            <p className="font-bold text-lg">{deliveryPartner.name}</p>
        </div>
        <div className="flex flex-col items-end gap-1 text-sm">
             <Badge variant={getVerificationBadgeVariant(deliveryPartner.verificationStatus)} className="capitalize">
                <ShieldCheck className="mr-1.5 h-3 w-3"/>
                {deliveryPartner.verificationStatus || 'N/A'}
            </Badge>
             <Badge variant="outline" className="capitalize">
                <Bike className="mr-1.5 h-3 w-3"/>
                {deliveryPartner.vehicleType}
            </Badge>
        </div>
    </div>
  );
}
