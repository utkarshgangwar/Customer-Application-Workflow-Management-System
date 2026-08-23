// ==========================================
// 1. Core Models & Entities
// ==========================================

export type UserRole = "admin" | "manager" | "executive";

export interface UserStats {
  totalItems: number;
  pendingItems: number;
  completedItems: number;
  activeDockets: number;
}

export interface Team {
  _id: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  teamId?: Team | string | null;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
  stats?: UserStats;
}

export interface MobileInfo {
  code: string;
  num: string;
}

export interface Customer {
  _id: string;
  name: string;
  email: string;
  mobile?: MobileInfo;
  age?: number;
  gender?: "male" | "female" | "other";
  dob?: string;
  country?: string;
  city?: string;
  address?: string;
  pincode?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ==========================================
// 2. Workflow & Application Schema
// ==========================================

export interface StageWorkRequired {
  workType: string;
  title: string;
}

export interface WorkflowStage {
  name: string;
  orderNumber: number;
  workRequired: StageWorkRequired[];
  allowedTransitions: string[];
}

export interface Workflow {
  _id: string;
  name: string;
  code?: string;
  description?: string;
  createdBy?: User | string;
  stages: WorkflowStage[];
  createdAt?: string;
  updatedAt?: string;
}

export type ApplicationStatus =
  | "ACTIVE"
  | "ON_HOLD"
  | "COMPLETED"
  | "CANCELLED";

export interface CustomerApplication {
  _id: string;
  customerId: Customer;
  workflowId: Workflow;
  title: string;
  priority: number;
  currentStage: string;
  status: ApplicationStatus;
  assignedTo?: User | null;
  managerId?: User | null;
  version: number;
  workItems?: WorkItem[];
  createdAt?: string;
  updatedAt?: string;
}

// ==========================================
// 3. Work Items, Tasks & Attachments
// ==========================================

export type WorkItemStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "BLOCKED";

// in src/types/index.ts

export interface DocumentAttachment {
  _id: string;
  name: string;
  fileUrl: string;
  fileType: string;
  status: string;
  customerId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkItem {
  _id: string;
  applicationId: string;
  stageName: string;
  stageOrderNumber: number;
  title: string;
  description?: string;
  assignedTo?: User | string | null;
  status: WorkItemStatus;
  dueDate?: string;
  completedAt?: string;
  attachmentId?: DocumentAttachment | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Activity {
  _id: string;
  applicationId: string;
  performedBy: User;
  actionType:
    | "APPLICATION_CREATED"
    | "STAGE_UPDATED"
    | "STATUS_UPDATED"
    | "ASSIGNED"
    | "WORK_ITEM_COMPLETED"
    | "WORK_ITEM_STATUS_CHANGED"
    | "DOCUMENT_UPLOADED"
    | string;
  message: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt?: string;
}

// ==========================================
// 4. API Responses & Pagination Wrappers
// ==========================================

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  results?: number;
  pagination?: PaginationMeta;
}

export interface TeamWorkloadData {
  users: User[];
  teams: Team[];
}

export interface CustomerDossierData {
  customer: Customer;
  applications: CustomerApplication[];
  documents: DocumentAttachment[];
}
