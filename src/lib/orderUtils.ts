
import { doc, getDoc, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Order, OrderItem } from '@/types';

export const mapFirestoreDocToOrder = async (docSnap: DocumentData): Promise<Order> => {
  const data = docSnap.data();
  // New structure uses deliveryAddress map
  const address = data.deliveryAddress || {};
  
  let items: OrderItem[] = [];
  if (Array.isArray(data.items)) {
    items = data.items.map((item: any) => ({
      name: item.name || "Unknown Item",
      quantity: item.quantity || 0,
      price: item.price,
      productId: item.productId,
      imageUrl: item.imageUrl,
    }));
  }

  const dropOffStreet = address.street || '';
  const dropOffCity = address.city || '';
  const dropOffPostalCode = address.postalCode || '';
  let dropOffLocationString = `${dropOffStreet}, ${dropOffCity} ${dropOffPostalCode}`.trim();
  if (dropOffLocationString.startsWith(',')) dropOffLocationString = dropOffLocationString.substring(1).trim();
  if (dropOffLocationString.endsWith(',')) dropOffLocationString = dropOffLocationString.slice(0, -1).trim();
  if (dropOffLocationString === ',' || !dropOffLocationString) dropOffLocationString = "N/A";

  // Use top-level 'name' from the order document as the primary source for customer name.
  let customerName = data.name || "Customer";

  // Use deliveryCharge for earnings.
  const estimatedEarnings = data.deliveryCharge ?? 0;
  
  // Map the new status field to orderStatus
  const orderStatus = data.orderStatus || "Placed";

  // Fetch store details if storeId is present
  let pickupLocation = "GrocerMart"; // Default fallback
  if (data.storeId) {
    try {
        const storeRef = doc(db, "stores", data.storeId);
        const storeSnap = await getDoc(storeRef);
        if (storeSnap.exists()) {
            const storeData = storeSnap.data();
            // Use the store's location field, fallback to its name, then to a default
            pickupLocation = storeData.location || storeData.name || "Unknown Store";
        }
    } catch (error) {
        console.error(`Error fetching store details for order ${docSnap.id}:`, error);
        // Keep the default pickupLocation if the fetch fails
    }
  }


  return {
    id: docSnap.id,
    customerName: customerName,
    pickupLocation: pickupLocation,
    dropOffLocation: dropOffLocationString,
    items: items,
    orderStatus: orderStatus.toLowerCase() as Order['orderStatus'],
    estimatedEarnings: estimatedEarnings,
    deliveryCharge: data.deliveryCharge,
    total: data.totalAmount, // Use totalAmount from the provided structure
    estimatedTime: 30, // Default estimated time
    deliveryInstructions: data.deliveryInstructions,
    customerContact: data.phoneNumber,
    deliveryPartnerId: data.deliveryPartnerId,
    completedAt: data.completedAt || data.orderDate, // Fallback to orderDate if completedAt is missing
    noContactDelivery: data.noContactDelivery ?? false,
    proofImageURL: data.proofImageURL,
    userId: data.userId,
    accessibleTo: [], // Kept for type consistency, but may not be used by rules
  };
};
