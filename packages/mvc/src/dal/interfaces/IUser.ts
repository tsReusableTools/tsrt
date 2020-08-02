/** App user interface */
export interface IUser {
  id: number;
  email: string;
  password: string;
  name?: string;

  roles?: IRole[] | number[];
}

/** App user role interface */
export interface IRole {
  id: number;
  title: string;

  permissions?: IPermission[] | number[];
  users?: IUser[] | number[];
}

/** App permission interface */
export interface IPermission {
  id: number;
  title: string;

  roles?: IRole[] | number[];
}

/** App user role association interface */
export interface IUserRole {
  id: number;
  userId: number;
  roleId: number;
}

/** App role permission association interface */
export interface IRolePermission {
  id: number;
  roleId: number;
  permissionId: number;
}
