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
