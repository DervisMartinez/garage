import { Moto } from '../entities/Moto';
import { MotoRepository } from '../repositories/MotoRepository';

export class GetMotosUseCase {
  constructor(private motoRepository: MotoRepository) {}

  async execute(): Promise<Moto[]> {
    return this.motoRepository.getMotos();
  }
}
