export enum Role {
  foreman = "foreman",
  worker = "worker",
}
export interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  surname: string;
  emailconfirmed: boolean;
  role: Role;
}

export type ObjectItem = {
  id: number;
  title: string;
  address: string;
};
type WorkDeletedMessage = { workId: number };
type ObjectDeletedMessage = { objectId: number };
export type WSMessage =
  | { type: "assigned_to_object"; object: ObjectItemData }
  | { type: "work"; object: WorkItem }
  | { type: "work-update"; object: WorkItem }
  | { type: "work-deleted"; object: WorkDeletedMessage }
  | { type: "object-deleted"; object: ObjectDeletedMessage };
export interface ObjectItemData {
  address: string;
  author_id: number;
  created_at: string;
  id: number;
  title: string;
}
export interface WorkItem {
  id: number;
  objectId: number;
  object_title: string;
  title: string;
  unit: string;
  quantity: number;
  accepted: boolean;
  createdBy: number;
  status: "sent" | "accepted";
}
export interface ReceivedWirkItem {
  created_at: string;
  id: number;
  object_id: number;
  object_title: string;
  quantity: string;
  recipient_id: number;
  sender_name: string;
  sender_surname: string;
  title: string;
  unit: string;
  updated_at: string;
  worker_id: number;
}
export type FinishedWork = {
  id: number;
  object_id: number;
  worker_id: number;
  title: string;
  unit: string;
  quantity: number;
  status: string;
  created_at: string;
  updated_at: string;
  name: string;
  surname: string;
  username: string;
};
