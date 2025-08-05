

export interface OrderItem {
  name: string;
  quantity: number;
  // Include other item properties if needed for other parts of the app
  price?: number;
  productId?: string;
  imageUrl?: string;
}

export interface DeliveryPartnerFeedback {
    pickupRating: number; // 1-5 stars
    reportReason?: string;
    comments?: string;
    reportedAt?: any; // Firestore Timestamp
}

export interface Order {
  id: string;
  customerName: string; 
  userId?: string; // The customer's ID
  pickupLocation: string; 
  dropOffLocation: string; 
  items: OrderItem[]; 
  orderStatus: "Placed" | "accepted" | "picked-up" | "out-for-delivery" | "arrived" | "delivered" | "cancelled"; 
  estimatedEarnings: number; 
  deliveryCharge?: number;
  total?: number;
  estimatedTime: number; 
  deliveryInstructions?: string;
  customerContact?: string; 
  deliveryPartnerId?: string | null;
  completedAt?: any;
  noContactDelivery?: boolean; // Flag for no-contact delivery
  proofImageURL?: string; // URL for the proof of delivery image
  accessibleTo: string[]; // Array of UIDs that can access this order
  deliveryPartnerFeedback?: DeliveryPartnerFeedback;
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

// Simplified Document Metadata Type
export interface DocumentMetadata {
  fileName: string;
  url: string;
  uploadedAt?: any; // Should be Firestore ServerTimestamp on write
}

export type ProfileDocuments = {
  driverLicense?: DocumentMetadata;
  vehicleRegistration?: DocumentMetadata;
  proofOfInsurance?: DocumentMetadata;
}


export interface BankDetails {
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;
}

export interface DeliveryRating {
  orderId: string;
  ratedAt: any; // Firestore Timestamp
  rating: number;
  comment?: string;
  tip?: number;
}

export interface MaintenanceLogEntry {
    id: string;
    serviceType: string;
    date: any; // Firestore Timestamp
    cost: number;
    notes?: string;
}

export interface LeaveRequest {
  id: string;
  startDate: any; // Firestore Timestamp
  endDate: any; // Firestore Timestamp
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any; // Firestore Timestamp
  adminComment?: string;
}


export interface Profile {
  uid: string;
  name: string;
  email: string; // Non-editable after creation
  phoneNumber: string;
  role?: string;
  
  // Vehicle Details
  vehicleDetails: string; // Kept for backward compatibility, but new fields are preferred
  vehicleType?: 'bike' | 'scooter' | 'car';
  vehicleRegistrationNumber?: string;
  drivingLicenseNumber?: string;

  // Profile status and details
  profilePictureUrl?: string;
  verificationStatus?: 'pending' | 'approved' | 'rejected';
  availabilityStatus?: 'online' | 'offline' | 'on_break';
  
  // Documents & Financials
  documents: ProfileDocuments;
  bankDetails?: BankDetails;

  // Timestamps
  createdAt?: string; // ISO string
  updatedAt?: string; // ISO string for last update

  // Performance metrics (populated by another system, read-only here)
  averageDeliveryTime?: number; // in minutes
  onTimeDeliveryRate?: number; // percentage 0-100
  totalDeliveries?: number;
  overallRating?: number;
  deliveryRatings?: DeliveryRating[];
  maintenanceLog?: MaintenanceLogEntry[];
  leaveRequests?: LeaveRequest[];
}


export interface CommunicationMessage {
  id: string;
  senderId: string;
  message: string; 
  senderRole?: 'user' | 'agent' | 'driver';
  timestamp: any; // Firestore ServerTimestamp
}

export interface ChatThread {
  id: string; // document ID, usually orderId
  participantIds: string[];
  participantNames: { [key: string]: string }; // Maps UID to name
  participantAvatars: { [key:string]: string }; // Maps UID to avatar URL
  lastMessage: string;
  lastMessageTimestamp: any; // Firestore ServerTimestamp
  orderId?: string;
  lastUpdated?: any;
  userName?: string; // Adding for consistency
}

export interface Session {
  id: string;
  userId: string;
  loginTimestamp: any; // Firestore Timestamp
  logoutTimestamp?: any | null;
  date: string; // YYYY-MM-DD
}

export interface MonthlyEarning {
  id: string; // "YYYY-MM"
  month: string; // "YYYY-MM"
  total: number;
  breakdown: {
    [key: string]: number; // e.g., week1, week2, tips, bonuses
  };
  createdAt?: any;
}

export interface ChatMessage {
    id?: string;
    message: string;
    senderId: string;
    senderName?: string; // Name of the sender (e.g., "Admin", "Velocity Support")
    senderRole: 'user' | 'agent' | 'driver' | 'system';
    timestamp: any;
}

export interface SupportChatSession {
  id: string;
  userId: string; 
  userName?: string;
  createdAt: any; // Firestore Timestamp
  lastUpdated: any; // Firestore Timestamp
  status: 'active' | 'waiting' | 'resolved';
  lastMessage?: string;
  lastMessageTimestamp?: any; // To align with ChatThread
  orderId?: string; 
}

export interface DriverLocation {
  driverId: string;
  lastKnownLocation: any; // Firestore GeoPoint
  updatedAt: any; // Firestore Timestamp
}

export interface DeliveryLocation {
    latitude: number;
    longitude: number;
    timestamp: any; // Firestore Timestamp
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: any; // Firestore Timestamp
  link?: string; // Optional link to navigate to
}
