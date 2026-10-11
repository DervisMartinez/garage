import { Moto } from '../../domain/entities/Moto';
import { MotoRepository } from '../../domain/repositories/MotoRepository';

// Dummy data for testing the architecture
const MOCK_MOTOS: Moto[] = [
  { id: '1', brand: 'Yamaha', model: 'MT-07', year: 2023, currentOdometer: 0 },
  { id: '2', brand: 'Kawasaki', model: 'Ninja 400', year: 2022, currentOdometer: 0 },
  { id: '3', brand: 'Honda', model: 'CBR600RR', year: 2024, currentOdometer: 0 },
];

export class MotoRepositoryImpl implements MotoRepository {
  async getMotos(): Promise<Moto[]> {
    // Simulate network delay
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(MOCK_MOTOS);
      }, 1000);
    });
  }

  async getMotoById(id: string): Promise<Moto | null> {
    const moto = MOCK_MOTOS.find(m => m.id === id);
    return moto || null;
  }
}
