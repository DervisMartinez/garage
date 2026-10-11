import { MotoRepositoryImpl } from '../data/repositories/MotoRepositoryImpl';
import { GetMotosUseCase } from '../domain/usecases/GetMotosUseCase';

// Singletons
const motoRepository = new MotoRepositoryImpl();

export const diContainer = {
  getMotosUseCase: new GetMotosUseCase(motoRepository),
};
