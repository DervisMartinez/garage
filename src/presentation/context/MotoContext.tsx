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

  // In-memory cache for service records by moto_id to make vehicle pagination instant
  const recordsCacheRef = React.useRef<Map<string, ServiceRecord[]>>(new Map());
  const recordsFetchTimeRef = React.useRef<Map<string, number>>(new Map());
  const initialLoadDoneRef = React.useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        if (!initialLoadDoneRef.current) {
          initialLoadDoneRef.current = true;
          loadDataFromCloud();
        }
      } else {
        setIsLoaded(true);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        if (!initialLoadDoneRef.current) {
          initialLoadDoneRef.current = true;
          loadDataFromCloud();
        }
      } else {
        setMotos([]);
        setMyMoto(null);
        setRecords([]);
        recordsCacheRef.current.clear();
        recordsFetchTimeRef.current.clear();
        initialLoadDoneRef.current = false;
        setIsLoaded(true);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const loadDataFromCloud = async (preferredMotoId?: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user || (await supabase.auth.getUser()).data?.user;
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

        // Deduplicate any accidental duplicate entries in Supabase (by brand, model, year, plate)
        const uniqueMotos: Moto[] = [];
        const seenKeys = new Set<string>();
        for (const m of parsedMotos) {
          const key = `${m.brand.trim().toLowerCase()}-${m.model.trim().toLowerCase()}-${m.year}-${(m.plate || '').trim().toLowerCase()}`;
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            uniqueMotos.push(m);
          }
        }

        setMotos(uniqueMotos);
        
        // Set myMoto if not set, or keep the existing one if it still exists
        setMyMoto((prev) => {
          const targetId = preferredMotoId || prev?.id;
          if (targetId) {
            const found = uniqueMotos.find(m => m.id === targetId);
            if (found) return found;
          }
          if (prev) {
            const foundByDetails = uniqueMotos.find(
              m => m.brand.trim().toLowerCase() === prev.brand.trim().toLowerCase() && 
                   m.model.trim().toLowerCase() === prev.model.trim().toLowerCase()
            );
            if (foundByDetails) return foundByDetails;
          }
          return uniqueMotos[0] || null;
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
    if (!myMoto) {
      setRecords([]);
      return;
    }

    const motoId = myMoto.id;
    // 1. Instant cache hit: render immediately with zero network delay
    const cached = recordsCacheRef.current.get(motoId);
    if (cached) {
      setRecords(cached);
    }

    // 2. Throttle network revalidation (don't query Supabase if fetched within last 20s)
    const lastFetch = recordsFetchTimeRef.current.get(motoId) || 0;
    const now = Date.now();
    if (cached && now - lastFetch < 20000) {
      return;
    }

    let isMounted = true;
    const loadRecords = async () => {
      try {
        const { data: recordsData } = await supabase
          .from('service_records')
          .select('*')
          .eq('moto_id', motoId)
          .order('created_at', { ascending: false });

        if (isMounted && recordsData) {
          const parsedRecords: ServiceRecord[] = recordsData.map(r => ({
            id: r.id,
            type: r.type as any,
            date: r.date,
            odometer: r.odometer,
            costUSD: r.cost_usd,
            notes: r.notes
          }));
          recordsCacheRef.current.set(motoId, parsedRecords);
          recordsFetchTimeRef.current.set(motoId, Date.now());
          setRecords(parsedRecords);
        }
      } catch (e) {
        console.error('Error cargando records', e);
      }
    };

    loadRecords();
    return () => {
      isMounted = false;
    };
  }, [myMoto?.id]);

  const saveMoto = async (moto: Moto) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      try {
        const { data: insertedData, error } = await supabase.from('motos').insert({
          user_id: user.id,
          brand: moto.brand,
          model: moto.model,
          year: moto.year,
          image_url: moto.imageUrl,
          catalog_id: null,
          current_odometer: moto.currentOdometer,
          is_from_agency: moto.isFromAgency
        }).select().single();

        if (error) throw error;

        if (insertedData) {
          const vehicleType: VehicleType = isCar({ brand: insertedData.brand, model: insertedData.model }) ? 'car' : 'moto';
          const createdMoto: Moto = {
            id: insertedData.id,
            brand: insertedData.brand || moto.brand,
            model: insertedData.model || moto.model,
            year: insertedData.year || moto.year,
            imageUrl: insertedData.image_url || moto.imageUrl,
            catalogImageRes: moto.catalogImageRes,
            plate: insertedData.plate || moto.plate,
            currentOdometer: insertedData.current_odometer ?? moto.currentOdometer,
            isFromAgency: insertedData.is_from_agency ?? moto.isFromAgency,
            vehicleType,
          };
          setMotos(prev => [...prev.filter(m => m.id !== createdMoto.id), createdMoto]);
          setMyMoto(createdMoto);
          await loadDataFromCloud(createdMoto.id);
          return;
        }
      } catch (err) {
        console.warn('Error guardando en Supabase, aplicando guardado local:', err);
      }
    }
    setMotos(prev => [...prev.filter(m => m.id !== moto.id), moto]);
    setMyMoto(moto);
  };

  const updateMoto = async (updates: Partial<Moto>) => {
    if (!myMoto) return;
    setMyMoto(prev => prev ? { ...prev, ...updates } : null);
    setMotos(prev => prev.map(m => m.id === myMoto.id ? { ...m, ...updates } : m));
    
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user || (await supabase.auth.getUser()).data?.user;
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
      }
    }
  };

  const selectMoto = (id: string) => {
    const moto = motos.find(m => m.id === id);
    if (moto) {
      // 1. Immediately apply cached records for this vehicle with 0ms delay
      const cached = recordsCacheRef.current.get(moto.id);
      if (cached) {
        setRecords(cached);
      }
      setMyMoto(moto);
    }
  };

  const deleteMoto = async (id: string) => {
    // 1. Optimistic local state update so UI updates immediately
    const remaining = motos.filter(m => m.id !== id);
    setMotos(remaining);
    recordsCacheRef.current.delete(id);
    recordsFetchTimeRef.current.delete(id);
    if (myMoto?.id === id) {
      setMyMoto(remaining.length > 0 ? remaining[0] : null);
    }

    // 2. Cascade delete records and vehicle from Supabase
    try {
      await supabase.from('service_records').delete().eq('moto_id', id);
      const { error } = await supabase.from('motos').delete().eq('id', id);
      if (error) {
        console.warn('Aviso al eliminar moto en Supabase:', error);
      }
    } catch (e) {
      console.error('Error eliminando moto:', e);
    }
    await loadDataFromCloud();
  };

  const addRecord = async (record: ServiceRecord) => {
    setRecords(prev => {
      const updated = [record, ...prev];
      if (myMoto) {
        recordsCacheRef.current.set(myMoto.id, updated);
      }
      return updated;
    });
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user || (await supabase.auth.getUser()).data?.user;
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
    setRecords(prev => {
      const updated = prev.filter(r => r.id !== id);
      if (myMoto) {
        recordsCacheRef.current.set(myMoto.id, updated);
      }
      return updated;
    });
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
