import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Moto, ServiceRecord, isCar, VehicleType } from '../../domain/entities/Moto';
import { supabase } from '../../data/supabaseClient';

interface MotoContextType {
  myMoto: Moto | null;
  motos: Moto[];
  records: ServiceRecord[];
  saveMoto: (moto: Moto) => void;
  updateMoto: (updates: Partial<Moto>) => void;
  addRecord: (record: ServiceRecord) => void;
  deleteRecord: (id: string) => void;
  selectMoto: (id: string) => void;
  deleteMoto: (id: string) => void;
  isLoaded: boolean;
  logout: () => void;
  isAddingMoto: boolean;
  setIsAddingMoto: (val: boolean) => void;
}

const MotoContext = createContext<MotoContextType | undefined>(undefined);

export const MotoProvider = ({ children }: { children: ReactNode }) => {
  const [motos, setMotos] = useState<Moto[]>([]);
  const [myMoto, setMyMoto] = useState<Moto | null>(null);
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAddingMoto, setIsAddingMoto] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        loadDataFromCloud();
      } else {
        setIsLoaded(true);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        loadDataFromCloud();
      } else {
        setMotos([]);
        setMyMoto(null);
        setRecords([]);
        setIsLoaded(true);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const loadDataFromCloud = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: motosData } = await supabase
        .from('motos')
        .select('*')
        .eq('user_id', user.id);
      
      if (motosData && motosData.length > 0) {
        const parsedMotos: Moto[] = motosData.map(motoData => {
          const brand = motoData.brand || '';
          const model = motoData.model || '';
          const vehicleType: VehicleType = isCar({ brand, model, vehicleType: (motoData as any).vehicle_type }) ? 'car' : 'moto';
          return {
            id: motoData.id,
            brand,
            model,
            year: motoData.year,
            imageUrl: motoData.image_url,
            catalogImageRes: undefined,
            plate: motoData.plate,
            currentOdometer: motoData.current_odometer,
            isFromAgency: motoData.is_from_agency,
            vehicleType,
          };
        });
        setMotos(parsedMotos);
        
        // Set myMoto if not set, or keep the existing one if it still exists
        setMyMoto((prev) => {
          if (prev) {
            const found = parsedMotos.find(m => m.id === prev.id);
            if (found) return found;
          }
          return parsedMotos[0];
        });
      } else {
        setMotos([]);
        setMyMoto(null);
      }
    } catch (e) {
      console.error('Error cargando de Supabase', e);
    } finally {
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    const loadRecords = async () => {
      if (!myMoto) {
        setRecords([]);
        return;
      }
      try {
        const { data: recordsData } = await supabase
          .from('service_records')
          .select('*')
          .eq('moto_id', myMoto.id)
          .order('created_at', { ascending: false });

        if (recordsData) {
          const parsedRecords: ServiceRecord[] = recordsData.map(r => ({
            id: r.id,
            type: r.type as any,
            date: r.date,
            odometer: r.odometer,
            costUSD: r.cost_usd,
            notes: r.notes
          }));
          setRecords(parsedRecords);
        }
      } catch (e) {
        console.error('Error cargando records', e);
      }
    };
    loadRecords();
  }, [myMoto?.id]);

  const saveMoto = async (moto: Moto) => {
    setMotos(prev => [...prev.filter(m => m.id !== moto.id), moto]);
    setMyMoto(moto);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('motos').insert({
        id: moto.id.length > 20 ? moto.id : undefined,
        user_id: user.id,
        brand: moto.brand,
        model: moto.model,
        year: moto.year,
        image_url: moto.imageUrl,
        catalog_id: null,
        current_odometer: moto.currentOdometer,
        is_from_agency: moto.isFromAgency
      });
      await loadDataFromCloud();
    }
  };

  const updateMoto = async (updates: Partial<Moto>) => {
    if (!myMoto) return;
    setMyMoto(prev => prev ? { ...prev, ...updates } : null);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const dbUpdates: any = {};
      if (updates.plate !== undefined) dbUpdates.plate = updates.plate;
      if (updates.currentOdometer !== undefined) dbUpdates.current_odometer = updates.currentOdometer;
      if (updates.isFromAgency !== undefined) dbUpdates.is_from_agency = updates.isFromAgency;
      if (updates.year !== undefined) dbUpdates.year = updates.year;
      if (updates.brand !== undefined) dbUpdates.brand = updates.brand;
      if (updates.model !== undefined) dbUpdates.model = updates.model;
      if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
      
      if (Object.keys(dbUpdates).length > 0) {
        await supabase.from('motos').update(dbUpdates).eq('id', myMoto.id);
        await loadDataFromCloud();
      }
    }
  };

  const selectMoto = (id: string) => {
    const moto = motos.find(m => m.id === id);
    if (moto) {
      setMyMoto(moto);
    }
  };

  const deleteMoto = async (id: string) => {
    await supabase.from('motos').delete().eq('id', id);
    if (myMoto?.id === id) {
      setMyMoto(null);
    }
    await loadDataFromCloud();
  };

  const addRecord = async (record: ServiceRecord) => {
    setRecords(prev => [record, ...prev]);
    const { data: { user } } = await supabase.auth.getUser();
    if (user && myMoto) {
      await supabase.from('service_records').insert({
        moto_id: myMoto.id,
        user_id: user.id,
        type: record.type,
        date: record.date,
        odometer: record.odometer,
        cost_usd: record.costUSD,
        notes: record.notes
      });
    }
  };

  const deleteRecord = async (id: string) => {
    setRecords(prev => prev.filter(r => r.id !== id));
    await supabase.from('service_records').delete().eq('id', id);
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <MotoContext.Provider value={{ myMoto, motos, records, saveMoto, updateMoto, addRecord, deleteRecord, selectMoto, deleteMoto, isLoaded, logout, isAddingMoto, setIsAddingMoto }}>
      {children}
    </MotoContext.Provider>
  );
};

export const useMyMoto = () => {
  const context = useContext(MotoContext);
  if (!context) throw new Error('useMyMoto must be used within MotoProvider');
  return context;
};
