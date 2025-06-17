
import { ProfileForm } from "@/components/profile/ProfileForm";
import { DocumentManagement } from "@/components/profile/DocumentManagement";
import { PerformanceMetrics } from "@/components/profile/PerformanceMetrics";
import type { Profile } from "@/types";
import { Separator } from "@/components/ui/separator";

const mockProfile: Profile = {
  fullName: "John Driver",
  email: "john.driver@example.com",
  phone: "555-123-4567",
  vehicleDetails: "Honda Activa - MH01AB1234",
  bankAccountNumber: "**** **** **** 1234", // Masked
  profilePictureUrl: "https://placehold.co/150x150.png?text=JD",
  averageDeliveryTime: 28,
  onTimeDeliveryRate: 92,
  totalDeliveries: 356,
  overallRating: 4.7 // Added for PerformanceMetrics
};

export default function ProfilePage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <ProfileForm profile={mockProfile} />
      <Separator />
      <PerformanceMetrics profile={mockProfile} />
      <Separator />
      <DocumentManagement />
    </div>
  );
}
