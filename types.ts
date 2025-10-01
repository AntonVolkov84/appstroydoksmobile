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
type WebSocketMessage = {
  type: "assigned_to_object";
  object: ObjectItemData;
};
export interface ObjectItemData {
  address: string;
  author_id: number;
  created_at: string;
  id: number;
  title: string;
}
