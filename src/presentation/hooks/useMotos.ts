import { useState, useEffect } from 'react';
import { Moto } from '../../domain/entities/Moto';
import { diContainer } from '../../di/container';

export const useMotos = () => {
  const [motos, setMotos] = useState<Moto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMotos = async () => {
      try {
        setLoading(true);
        const data = await diContainer.getMotosUseCase.execute();
        setMotos(data);
      } catch (err: any) {
        setError(err.message || 'Error fetching motos');
      } finally {
        setLoading(false);
      }
    };

    fetchMotos();
  }, []);

  return { motos, loading, error };
};
