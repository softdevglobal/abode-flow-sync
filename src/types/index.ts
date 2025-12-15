export type UserRole = 'agent' | 'customer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  createdAt: Date;
}

export interface Agent extends User {
  role: 'agent';
  company?: string;
  license?: string;
  bio?: string;
}

export interface Customer extends User {
  role: 'customer';
  savedListings: string[];
}

export type PropertyType = 'house' | 'apartment' | 'townhouse' | 'land' | 'commercial' | 'rural';
export type PropertyStatus = 'available' | 'under_offer' | 'sold' | 'leased' | 'off_market' | 'active' | 'pending';
export type ListingType = 'sale' | 'rent';

export interface Property {
  id: string;
  agentId: string;
  title: string;
  address: string;
  suburb: string;
  state: string;
  postcode: string;
  propertyType: PropertyType;
  listingType: ListingType;
  status: PropertyStatus;
  price?: number;
  priceFrom?: number;
  priceTo?: number;
  priceDisplay?: string;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  landSize?: number;
  buildingSize?: number;
  description: string;
  features: string[];
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type ViewingRequestStatus = 
  | 'pending' 
  | 'accepted' 
  | 'declined' 
  | 'counter_proposed' 
  | 'confirmed';

export interface ViewingRequest {
  id: string;
  propertyId: string;
  customerId: string;
  agentId: string;
  requestedDate: Date;
  requestedTime: string;
  proposedDate?: Date;
  proposedTime?: string;
  status: ViewingRequestStatus;
  message?: string;
  agentNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Inspection {
  id: string;
  propertyId: string;
  agentId: string;
  date: Date;
  startTime: string;
  endTime: string;
  isPrivate: boolean;
  qrCode?: string;
  notes?: string;
  createdAt: Date;
}

export interface Lead {
  id: string;
  agentId: string;
  customerId: string;
  propertyId?: string;
  inspectionId?: string;
  source: 'viewing_request' | 'inspection_checkin' | 'inquiry';
  notes?: string;
  createdAt: Date;
}

export interface Appraisal {
  id: string;
  agentId: string;
  propertyAddress: string;
  estimatedPriceFrom: number;
  estimatedPriceTo: number;
  notes?: string;
  confidenceLevel: 'low' | 'medium' | 'high';
  createdAt: Date;
}

export interface AffordabilityResult {
  monthlyRepayment: number;
  totalInterest: number;
  totalAmountPaid: number;
  loanToValueRatio: number;
}
