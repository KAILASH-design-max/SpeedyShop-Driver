
export interface OrderItem {
  name: string;
  quantity: number;
  // Include other item properties if needed for other parts of the app
  price?: number;
  productId?: string;
  imageUrl?: string;
}

export interface Order {
  id: string;
  customerName: string; // Ensure this field exists in your Firestore 'orders' doc or is mapped
  pickupLocation: string; // Ensure this field exists or is mapped (e.g., from a store associated with the order)
  dropOffLocation: string; // Mapped from Firestore address object
  items: OrderItem[]; // Changed from string[]
  orderStatus: "Placed" | "accepted" | "picked-up" | "out-for-delivery" | "delivered" | "cancelled"; // Renamed from status
  estimatedEarnings: number; // Ensure this is calculated or present for the driver
  estimatedTime: number; // in minutes, ensure this is calculated or present
  deliveryInstructions?: string;
  customerContact?: string; // Mapped from Firestore phoneNumber
}

export interface EarningSummary {
  currentWeekEarnings: number;
  completedDeliveriesToday: number;
  activeBonuses: number;
  overallRating: number; // e.g. 4.5
}

export interface Payout {
  id: string;
  date: string; // ISO string
  amount: number;
  status: "completed" | "pending" | "failed";
  transactionId?: string;
}

export interface ProfileDocumentUrls {
  driverLicenseUrl?: string;
  vehicleRegistrationUrl?: string;
  proofOfInsuranceUrl?: string;
}

export interface Profile {
  uid: string;
  name: string;
  email: string; // Non-editable after creation
  phoneNumber: string;
  role?: string;
  vehicleDetails: string; // e.g., "Honda Activa - MH01AB1234"
  profilePictureUrl?: string;
  documents: ProfileDocumentUrls;
  createdAt?: string; // ISO string
  availabilityStatus?: 'online' | 'offline' | 'on_break';

  // Performance metrics (populated by another system, read-only here)
  averageDeliveryTime?: number; // in minutes
  onTimeDeliveryRate?: number; // percentage 0-100
  totalDeliveries?: number;
  overallRating?: number;
}


export interface CommunicationMessage {
  id: string;
  sender: 'driver' | 'customer' | 'support';
  content: string;
  timestamp: string; // ISO string
  isRead?: boolean;
}

export interface ChatThread {
  id: string; // e.g., orderId
  participantName: string; // Customer Name or Support
  lastMessage: string;
  lastMessageTimestamp: string; // ISO string
  unreadCount: number;
  avatarUrl?: string;
}

