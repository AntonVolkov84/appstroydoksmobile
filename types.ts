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
  name: string;
  address: string;
};
export type WSMessage =
  | { type: "assigned_to_object"; object: ObjectItemData }
  | { type: "work"; object: WorkItem }
  | { type: "work-update"; object: WorkItem };
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
  title: string;
  unit: string;
  quantity: number;
  accepted: boolean;
  createdBy: number;
}
