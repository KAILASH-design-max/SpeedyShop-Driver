
import { doc, getDoc, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Order, OrderItem } from '@/types';

export const mapFirestoreDocToOrder = async (docSnap: DocumentData): Promise<Order> => {
  const data = docSnap.data();
  const address = data.address || {};
  
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

  let customerName = data.customerName || "Customer";
  if (!data.customerName && data.userId) {
    try {
      const userDoc = await getDoc(doc(db, "users", data.userId));
      if (userDoc.exists()) {
        customerName = userDoc.data().name || "Customer";
      }
    } catch (e) {
      console.error(`Failed to fetch user ${data.userId}`, e);
    }
  }

  const estimatedEarnings = data.estimatedEarnings ?? data.deliveryCharge ?? 0;

  return {
    id: docSnap.id,
    customerName: customerName,
    pickupLocation: data.pickupLocation || "Restaurant/Store Address", 
    dropOffLocation: dropOffLocationString,
    items: items,
    orderStatus: data.orderStatus || "Placed",
    estimatedEarnings: estimatedEarnings,
    deliveryCharge: data.deliveryCharge,
    total: data.total,
    estimatedTime: data.estimatedTime || 30, 
    deliveryInstructions: data.deliveryInstructions,
    customerContact: data.phoneNumber || address.phoneNumber,
    deliveryPartnerId: data.deliveryPartnerId,
    userId: data.userId,
    completedAt: data.completedAt,
  };
};
