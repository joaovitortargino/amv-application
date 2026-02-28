import { Long_Cang } from "next/font/google";
import { SVGProps } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  enterprise: Enterprise;
}

export interface Enterprise {
  id: string;
  corporateReason: string;
  fantasyName: string;
  cnpj: string;
  contact: Contact;
  address: Address;
}

export interface Contact {
  email: string;
  telephone?: string;
  cellPhone?: string;
}

export interface Address {
  cep: string;
  publicPlace: string;
  number: string;
  complement?: string;
  district: string;
  city: string;
  state: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  corporateReason: string;
  fantasyName: string;
  cnpj: string;
  contact: Contact;
  address: Address;
}

export interface Client {
  id: string;
  name: string;
  document: string;
  type: "PF" | "PJ";
  contact: Contact;
  address: Address;
  active: boolean;
}

export interface FinancialTitle {
  id: string;
  description: string;
  type: "INCOME" | "EXPENSE";
  category: string;
  originalValue: number;
  paidValue?: number;
  dueDate: string;
  paymentDate?: string;
  paymentMethod: string;
  status: "OPEN" | "PAID" | "OVERDUE" | "CANCELED";
  clientId?: string;
  osId?: string;
}

export interface ServiceOrder {
  id: string;
  osNumber: string;
  clientId: string;
  client?: Client;
  vehicle: Vehicle;
  status: "OPEN" | "IN_PROGRESS" | "FINISHED" | "CANCELED";
  forecastDate: string;
  observations?: string;
  totalValue: number;
  items: ServiceOrderItem[];
}

export interface Vehicle {
  plate: string;
  model: string;
  mark: string;
  year: number;
}

export interface ServiceOrderItem {
  id?: string;
  productServiceId: string;
  type: "PRODUCT" | "SERVICE";
  name: string;
  amount: number;
  unitValue: number;
  discount: number;
  totalValue?: number;
  mechanicId: string;
  mechanic?: MechanicDTO;
}

export interface MechanicDTO {
  id: string;
  mechanicCode: number;
  name: string;
  document: string;
  contact: Contact;
  active: boolean;
  standardCommissionPercentage: number;
}

type CommissionStatus = "PENDING" | "PAID" | "CANCELLED";

export interface Comissions {
  id: string;
  osId: string;
  serviceName: string;
  valueBaseService: number;
  valueCommission: number;
  percentageApplied: number;
  dateCalculation: string;
  status: CommissionStatus
}

export interface ProductServiceDTO {
  id: string;
  name: string;
  description: string;
  type: "PRODUCT" | "SERVICE";
  price: number;
  salePrice: number;
  priceCost: number;
  active: boolean;
}

export interface DashboardSnapshot {
  date: string;
  totalIncome: number;
  totalExpense: number;
  delayedOsCount: number;
  openedOsCount: number;
  pendingTitles: number;
}

export interface DashboardTotals {
  totalIncome: number;
  totalExpense: number;
  totalRevenue: number;
  openedOsCount: number;
  delayedOsCount: number;
  pendingTitles: number;
}

export interface AlertNotification {
  type: "warning";
  message: string;
  link: string;
}

export type FinancialStatus = "OPEN" | "PAID" | "CANCELED" | "DELAYED";

export interface FinancialTitleDTO {
  id: string;
  description: string;
  type: "INCOME" | "EXPENSE";
  category: string;
  originalValue: number;
  paidValue: number;
  dueDate: string;
  paymentDate?: string;
  status: FinancialStatus;
}

export interface FinancialFilterDTO {
  text?: string;
  status?: FinancialStatus;
  type?: "INCOME" | "EXPENSE";
  from?: string;
  to?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
}

export type SlipStatus = "PENDING" | "PAID" | "CANCELED" | "OVERDUE";

export interface SlipDTO {
  id: string;
  payerName: string;
  payerDocument: string;
  value: number;
  dueDate: string;
  dateIssuance: string;
  status: SlipStatus;
  barCode?: string;
  digitableLine?: string;
  idBoletoIndividual?: string;
  ourNumber: string;
}

export interface ClientDTO {
  id: string;
  name: string;
  document: string;
  type: "PF" | "PJ";
  address?: {
    cep: string;
    publicPlace: string;
    number: string;
    complement?: string;
    district: string;
    city: string;
    state: string;
  };
  contact: {
    email: string;
    telephone?: string;
    cellPhone?: string;
  };
  notes?: string;
  active: boolean;
  createdAt: string;
  lastUpdate?: string;
}

export interface ServiceOrderDTO {
  id: string;
  osNumber?: string;
  clientId: string;
  client?: ClientDTO;
  vehicle: Vehicle;
  status: "OPEN" | "IN_PROGRESS" | "FINISHED" | "CANCELED";
  totals: {
    subtotal: number;
    descont: number;
    taxes: number;
    total: number;
  }; 
  createdAt: string;
  forecastDate?: string;
  completionDate?: string;
  observations?: string;
  items?: ServiceOrderItem[];
  itemOS?: ServiceOrderItem[];
  financialTitle?: FinancialTitleDTO | null; 
}

export interface ServiceOrderRequestDTO {
  clientId: string;
  vehicle: Vehicle;
  forecastDate?: string;
  observations?: string;
  items: ServiceOrderItem[];
}

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};
