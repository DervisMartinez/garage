import { Moto } from '../entities/Moto';

export interface MotoRepository {
  getMotos(): Promise<Moto[]>;
  getMotoById(id: string): Promise<Moto | null>;
}
