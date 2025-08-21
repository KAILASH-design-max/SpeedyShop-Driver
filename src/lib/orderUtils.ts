
import { doc, getDoc, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Order, OrderItem } from '@/types';

export const mapFirestoreDocToOrder = async (docSnap: DocumentData): Promise<Order> => {
  const data = docSnap.data();
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

  let customerName = data.name || "Customer";
  const estimatedEarnings = data.deliveryCharge ?? 0;
  
  // Clean up the status string: trim whitespace and convert to lowercase.
  const rawStatus = data.status || data.orderStatus || "Placed";
  const orderStatus = rawStatus.trim().toLowerCase();

  let pickupLocation = "GrocerMart";
  if (data.storeId) {
    try {
        const storeRef = doc(db, "stores", data.storeId);
        const storeSnap = await getDoc(storeRef);
        if (storeSnap.exists()) {
            const storeData = storeSnap.data();
            pickupLocation = storeData.location || storeData.name || "Unknown Store";
        }
    } catch (error) {
        console.error(`Error fetching store details for order ${docSnap.id}:`, error);
    }
  }

  return {
    id: docSnap.id,
    customerName: customerName,
    pickupLocation: pickupLocation,
    dropOffLocation: dropOffLocationString,
    items: items,
    orderStatus: orderStatus as Order['orderStatus'],
    estimatedEarnings: estimatedEarnings,
    deliveryCharge: data.deliveryCharge,
    total: data.totalAmount,
    estimatedTime: 30, // Default estimated time
    deliveryInstructions: data.deliveryInstructions,
    customerContact: data.phoneNumber,
    deliveryPartnerId: data.deliveryPartnerId,
    completedAt: data.completedAt || data.orderDate,
    noContactDelivery: data.noContactDelivery ?? false,
    proofImageURL: data.proofImageURL,
    userId: data.userId,
    accessibleTo: [],
  };
};
