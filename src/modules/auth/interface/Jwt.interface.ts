import { Role } from '@/common/enums/roles.enum';

export interface JwtPayload {
  id: string | number;
  email: string;
  role?: Role;
  createdAt?: Date;
  updatedAt?: Date;
}
