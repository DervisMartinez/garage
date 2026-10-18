import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useMyMoto } from '../context/MotoContext';
import { Moto, isCar } from '../../domain/entities/Moto';
import { MotoSpecs, getMotoSpecs } from '../../data/specs';
import {
  calculateWearPercentage,
  COMPONENT_NAMES,
  getVehicleComponents,
  getComponentLifespan,
  ComponentType,
} from '../../constants/telemetry';
import { VEHICLE_CATALOG } from '../../data/catalog';
import { supabase } from '../../data/supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface VehicleReportModalProps {
  visible: boolean;
  onClose: () => void;
  myMoto: Moto | null;
  specs?: MotoSpecs | null;
}

export const VehicleReportModal: React.FC<VehicleReportModalProps> = ({
  visible,
  onClose,
  myMoto,
  specs: passedSpecs,
}) => {
  const { colors, mode, isDark } = useTheme();
  const { records } = useMyMoto();

  const [ownerData, setOwnerData] = useState<{
    firstName: string;
    lastName: string;
    dni: string;
    phone: string;
    bloodType: string;
    emergencyContact: string;
    emergencyPhone: string;
  }>({
    firstName: '',
    lastName: '',
    dni: '',
    phone: '',
    bloodType: 'O+',
    emergencyContact: '',
    emergencyPhone: '',
  });

  const [generating, setGenerating] = useState(false);

  const isVehicleCar = myMoto ? isCar(myMoto) : false;

  const specs = useMemo(() => {
    if (passedSpecs) return passedSpecs;
    if (!myMoto) return null;
    return getMotoSpecs(myMoto.brand, myMoto.model);
  }, [passedSpecs, myMoto]);

  // Load cached and auth user metadata for owner details
  useEffect(() => {
    if (!visible) return;
    AsyncStorage.getItem('@user_profile_data').then((cached) => {
      if (cached) {
        try {
          const p = JSON.parse(cached);
          setOwnerData((prev) => ({
            ...prev,
            firstName: p.first_name || prev.firstName,
            lastName: p.last_name || prev.lastName,
            dni: p.document_id || prev.dni,
            phone: p.phone || prev.phone,
            bloodType: p.blood_type || prev.bloodType,
            emergencyContact: p.emergency_contact_name || prev.emergencyContact,
            emergencyPhone: p.emergency_contact_phone || prev.emergencyPhone,
          }));
        } catch (e) {}
      }
    });

    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.user_metadata) {
        const m = data.user.user_metadata;
        setOwnerData((prev) => ({
          ...prev,
          firstName: m.first_name || prev.firstName,
          lastName: m.last_name || prev.lastName,
          dni: m.document_id || m.dni || prev.dni,
          phone: m.phone || prev.phone,
          bloodType: m.blood_type || prev.bloodType,
          emergencyContact: m.emergency_contact_name || prev.emergencyContact,
          emergencyPhone: m.emergency_contact_phone || prev.emergencyPhone,
        }));
      }
    });
  }, [visible]);

  // Find vehicle image
  const catMoto = useMemo(() => {
    if (!myMoto) return null;
    return (
      VEHICLE_CATALOG.find(
        (m) =>
          m.brand.toLowerCase() === myMoto.brand.toLowerCase() &&
          m.model.toLowerCase() === myMoto.model.toLowerCase()
      ) ||
      VEHICLE_CATALOG.find(
        (m) => m.brand.toLowerCase() === myMoto.brand.toLowerCase()
      )
    );
  }, [myMoto]);

  // Formatted Report Metadata
  const reportDate = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  const reportTime = useMemo(() => {
    const now = new Date();
    return now.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }, []);

  const reportFolio = useMemo(() => {
    if (!myMoto) return 'GAR-000000';
    const dateNum = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const cleanId = myMoto.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();
    return `GAR-${dateNum}-${cleanId || '7721'}`;
  }, [myMoto]);

  // Telemetry Calculations for all parts
  const componentsAnalysis = useMemo(() => {
    if (!myMoto) return [];
    const components = getVehicleComponents(isVehicleCar).filter(
      (c) => c !== 'fuel' && c !== 'other'
    ) as Exclude<ComponentType, 'fuel' | 'other'>[];

    return components.map((comp) => {
      const typeRecords = records.filter((r) => r.type === comp);
      const isConfigured = typeRecords.length > 0 || !!myMoto.isFromAgency;
      const nominalLife = getComponentLifespan(comp, isVehicleCar);

      let wear = 0;
      let lastOdo = 0;
      let kmSince = 0;
      let kmRemaining = nominalLife;
      let status: 'ÓPTIMO' | 'PREVENTIVO' | 'CRÍTICO' | 'SIN CALIBRAR' = 'SIN CALIBRAR';
      let statusColor = '#ff9500';

      if (isConfigured) {
        lastOdo =
          typeRecords.length > 0
            ? Math.max(...typeRecords.map((r) => r.odometer))
            : 0;
        kmSince = Math.max(0, myMoto.currentOdometer - lastOdo);
        wear = calculateWearPercentage(
          myMoto.currentOdometer,
          lastOdo,
          comp,
          nominalLife,
          isVehicleCar
        );
        kmRemaining = Math.max(0, nominalLife - kmSince);

        if (wear >= 60) {
          status = 'ÓPTIMO';
          statusColor = '#00ae78';
        } else if (wear >= 30) {
          status = 'PREVENTIVO';
          statusColor = '#ffb703';
        } else {
          status = 'CRÍTICO';
          statusColor = '#ba1a1a';
        }
      }

      return {
        id: comp,
        name: COMPONENT_NAMES[comp] || comp,
        wear,
        isConfigured,
        nominalLife,
        lastOdo,
        kmSince,
        kmRemaining,
        status,
        statusColor,
        totalServices: typeRecords.length,
      };
    });
  }, [myMoto, records, isVehicleCar]);

  // Overall vehicle health score
  const generalHealth = useMemo(() => {
    const configured = componentsAnalysis.filter((c) => c.isConfigured);
    if (configured.length === 0) return 0;
    const sum = configured.reduce((acc, c) => acc + c.wear, 0);
    return Math.round(sum / configured.length);
  }, [componentsAnalysis]);

  // Financial & Fuel Statistics
  const financialStats = useMemo(() => {
    const fuelRecords = records.filter((r) => r.type === 'fuel');
    const serviceRecords = records.filter((r) => r.type !== 'fuel');

    const totalFuelUSD = fuelRecords.reduce((sum, r) => sum + (r.costUSD || 0), 0);
    const totalServicesUSD = serviceRecords.reduce((sum, r) => sum + (r.costUSD || 0), 0);
    const totalCostUSD = totalFuelUSD + totalServicesUSD;

    // Monthly breakdown for charts
    const monthlyMap: Record<string, { fuel: number; services: number; total: number }> = {};
    records.forEach((r) => {
      const monthKey = r.date ? r.date.slice(0, 7) : '2026-00';
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { fuel: 0, services: 0, total: 0 };
      }
      const cost = r.costUSD || 0;
      if (r.type === 'fuel') {
        monthlyMap[monthKey].fuel += cost;
      } else {
        monthlyMap[monthKey].services += cost;
      }
      monthlyMap[monthKey].total += cost;
    });

    const monthlyData = Object.entries(monthlyMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6); // last 6 months

    return {
      totalFuelUSD,
      totalServicesUSD,
      totalCostUSD,
      fuelRecordsCount: fuelRecords.length,
      serviceRecordsCount: serviceRecords.length,
      monthlyData,
    };
  }, [records]);

  // HTML Report Generator for Print and Download
  const generateReportHTML = () => {
    if (!myMoto) return '';

    const maxMonthly = Math.max(
      ...financialStats.monthlyData.map((d) => d[1].total),
      100
    );

    const monthlyChartBars = financialStats.monthlyData
      .map(([month, data]) => {
        const fuelH = Math.round((data.fuel / maxMonthly) * 80);
        const servH = Math.round((data.services / maxMonthly) * 80);
        const monthLabel = month.slice(5) + '/' + month.slice(2, 4);
        return `
          <div style="display:flex; flex-direction:column; align-items:center; width:52px; font-size:11px;">
            <div style="height:90px; display:flex; align-items:flex-end; gap:3px;">
              <div title="Combustible: $${data.fuel.toFixed(2)}" style="width:18px; height:${fuelH}px; background:#00e3fd; border-radius:3px 3px 0 0;"></div>
              <div title="Mantenimiento: $${data.services.toFixed(2)}" style="width:18px; height:${servH}px; background:#4169E1; border-radius:3px 3px 0 0;"></div>
            </div>
            <div style="margin-top:6px; font-weight:bold; color:#4a5568;">${monthLabel}</div>
            <div style="font-size:10px; color:#718096;">$${data.total.toFixed(0)}</div>
          </div>
        `;
      })
      .join('');

    const componentRows = componentsAnalysis
      .map(
        (c) => `
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:10px 8px; font-weight:600; font-size:12px; color:#1a202c;">${c.name}</td>
          <td style="padding:10px 8px; text-align:center;">
            <span style="display:inline-block; padding:3px 8px; border-radius:12px; font-size:10px; font-weight:bold; color:#ffffff; background:${c.statusColor};">
              ${c.status}
            </span>
          </td>
          <td style="padding:10px 8px; width:140px;">
            <div style="background:#edf2f7; border-radius:4px; height:8px; width:100%; overflow:hidden;">
              <div style="background:${c.statusColor}; height:100%; width:${c.isConfigured ? c.wear : 0}%;"></div>
            </div>
          </td>
          <td style="padding:10px 8px; text-align:center; font-weight:bold; font-size:12px; color:#2d3748;">
            ${c.isConfigured ? `${c.wear}%` : 'N/D'}
          </td>
          <td style="padding:10px 8px; text-align:right; font-size:11.5px; color:#4a5568;">
            ${c.isConfigured ? `${c.kmSince.toLocaleString()} km` : 'Sin datos'}
          </td>
          <td style="padding:10px 8px; text-align:right; font-size:11.5px; font-weight:600; color:${c.kmRemaining < 1000 ? '#e53e3e' : '#2b6cb0'};">
            ${c.isConfigured ? `${c.kmRemaining.toLocaleString()} km` : `Ciclo: ${c.nominalLife.toLocaleString()} km`}
          </td>
        </tr>
      `
      )
      .join('');

    const logsRows =
      records.length > 0
        ? records
            .slice(0, 35)
            .map(
              (r) => `
          <tr style="border-bottom:1px solid #edf2f7; font-size:11px;">
            <td style="padding:8px 6px; color:#4a5568;">${r.date || 'S/F'}</td>
            <td style="padding:8px 6px; font-weight:bold; color:#2d3748;">${COMPONENT_NAMES[r.type] || r.type}</td>
            <td style="padding:8px 6px; text-align:right; color:#2d3748;">${r.odometer ? `${r.odometer.toLocaleString()} km` : 'N/D'}</td>
            <td style="padding:8px 6px; text-align:right; font-weight:bold; color:#2b6cb0;">$${(r.costUSD || 0).toFixed(2)}</td>
            <td style="padding:8px 6px; color:#718096;">${r.notes || '—'}</td>
          </tr>
        `
            )
            .join('')
        : `<tr><td colspan="5" style="padding:20px; text-align:center; color:#718096;">No hay registros históricos almacenados en este vehículo.</td></tr>`;

    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Reporte Técnico GARAGE - ${myMoto.brand} ${myMoto.model} (${myMoto.plate || 'Sin Placa'})</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #f7fafc;
      color: #2d3748;
      padding: 24px;
      line-height: 1.5;
    }
    .report-container {
      max-width: 900px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.06);
      padding: 32px;
    }
    .header-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #2b6cb0;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .app-brand {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #1a202c;
    }
    .app-brand span { color: #00b4d8; }
    .badge-pill {
      display: inline-block;
      background: #edf2f7;
      color: #2b6cb0;
      font-weight: 700;
      font-size: 11px;
      padding: 4px 10px;
      border-radius: 14px;
      letter-spacing: 0.5px;
    }
    .section-title {
      font-size: 14px;
      font-weight: 800;
      color: #1a365d;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      border-left: 4px solid #2b6cb0;
      padding-left: 10px;
      margin-top: 26px;
      margin-bottom: 14px;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .grid-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 14px;
    }
    .card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px 16px;
    }
    .card-label {
      font-size: 10px;
      font-weight: 700;
      color: #718096;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 3px;
    }
    .card-value {
      font-size: 15px;
      font-weight: 700;
      color: #1a202c;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
    }
    th {
      background: #f1f5f9;
      color: #475569;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 8px;
      text-align: left;
    }
    .print-btn-bar {
      position: sticky;
      top: 12px;
      z-index: 1000;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-bottom: 16px;
    }
    .btn {
      background: #2b6cb0;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      padding: 10px 18px;
      font-weight: bold;
      font-size: 13px;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(0,0,0,0.15);
    }
    .btn:hover { background: #2c5282; }
    .btn-outline {
      background: #ffffff;
      color: #2b6cb0;
      border: 1.5px solid #2b6cb0;
    }
    @media print {
      body { background:#ffffff; padding:0; }
      .print-btn-bar { display:none !important; }
      .report-container { border:none; box-shadow:none; padding:0; max-width:100%; }
      @page { size: A4 portrait; margin: 12mm; }
      .page-break { page-break-before: always; }
      tr { page-break-inside: avoid; }
    }
  </style>
</head>
<body>

  <div class="print-btn-bar">
    <button class="btn btn-outline" onclick="window.close()">Cerrar Ventana</button>
    <button class="btn" onclick="window.print()">🖨️ Imprimir / Guardar como PDF</button>
  </div>

  <div class="report-container">
    
    <!-- HEADER -->
    <div class="header-banner">
      <div>
        <div class="app-brand">GARAGE<span>.</span> <span style="font-size:14px; font-weight:600; color:#718096; margin-left:8px;">EXPEDIENTE TÉCNICO OFICIAL</span></div>
        <div style="font-size:11.5px; color:#718096; margin-top:4px;">
          Emisión: <b>${reportDate}</b> a las <b>${reportTime}</b> | Folio: <b>${reportFolio}</b>
        </div>
      </div>
      <div style="text-align:right;">
        <div class="badge-pill">${isVehicleCar ? 'AUTOMÓVIL / CAMIONETA' : 'MOTOCICLETA'}</div>
        <div style="font-size:18px; font-weight:800; color:#2b6cb0; margin-top:6px;">
          SALUD: ${generalHealth}%
        </div>
      </div>
    </div>

    <!-- OWNER & VEHICLE SUMMARY -->
    <div class="grid-2">
      <!-- VEHICLE IDENTIFICATION -->
      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <div class="card-label">IDENTIFICACIÓN DEL VEHÍCULO</div>
          <span style="font-size:10px; font-weight:bold; background:#e2e8f0; padding:2px 6px; border-radius:4px;">
            ${myMoto.isFromAgency ? 'De Agencia (0 km)' : 'Registrado'}
          </span>
        </div>
        <div style="font-size:20px; font-weight:800; color:#1a202c;">
          ${myMoto.brand} ${myMoto.model}
        </div>
        <div style="margin-top:8px; display:flex; gap:16px; font-size:12px; color:#4a5568;">
          <div>Año: <b style="color:#1a202c;">${myMoto.year}</b></div>
          <div>Placa: <b style="color:#2b6cb0;">${myMoto.plate || 'Sin Placa'}</b></div>
          <div>Odómetro: <b style="color:#1a202c;">${myMoto.currentOdometer.toLocaleString()} km</b></div>
        </div>
      </div>

      <!-- OWNER & EMERGENCY -->
      <div class="card">
        <div class="card-label">CONDUCTOR / PROPIETARIO REGISTRADO</div>
        <div style="font-size:16px; font-weight:700; color:#1a202c;">
          ${ownerData.firstName || ownerData.lastName ? `${ownerData.firstName} ${ownerData.lastName}` : 'Usuario GARAGE'}
        </div>
        <div style="margin-top:8px; font-size:12px; color:#4a5568; line-height:1.6;">
          <div>Cédula / DNI: <b>${ownerData.dni || 'No registrado'}</b> | Tel: <b>${ownerData.phone || 'No registrado'}</b></div>
          <div>Grupo Sanguíneo: <b style="color:#e53e3e;">${ownerData.bloodType}</b> | Contacto SOS: <b>${ownerData.emergencyContact || 'Designado'} (${ownerData.emergencyPhone || 'N/D'})</b></div>
        </div>
      </div>
    </div>

    <!-- FACTORY SPECIFICATIONS (OEM) -->
    <div class="section-title">Especificaciones Técnicas OEM de Fábrica</div>
    <div class="grid-3">
      <div class="card">
        <div class="card-label">Motor & Desplazamiento</div>
        <div class="card-value">${specs?.engineType || 'Gasolina 4 Tiempos'}</div>
        <div style="font-size:11px; color:#718096; margin-top:4px;">Cilindrada: ${specs?.displacement || 'N/D'} | ${specs?.hp || 'N/D'}</div>
      </div>
      <div class="card">
        <div class="card-label">Lubricación & Aceite</div>
        <div class="card-value">${specs?.oilCapacity || '4.0 L'}</div>
        <div style="font-size:11px; color:#718096; margin-top:4px;">Recomendado: ${specs?.oilTypeRecommended || '10W-30 Semi-Sintético'}</div>
      </div>
      <div class="card">
        <div class="card-label">Tanque & Transmisión</div>
        <div class="card-value">${specs?.fuelCapacity || 'N/D'}</div>
        <div style="font-size:11px; color:#718096; margin-top:4px;">Caja: ${specs?.transmission || 'Manual / Sincrónico'}</div>
      </div>
    </div>

    <!-- TELEMETRY WEAR TABLE -->
    <div class="section-title">Telemetría de Desgaste y Estado de Cada Componente</div>
    <table>
      <thead>
        <tr>
          <th>Componente / Sistema</th>
          <th style="text-align:center;">Estado</th>
          <th>Nivel de Vida</th>
          <th style="text-align:center;">% Salud</th>
          <th style="text-align:right;">Recorrido</th>
          <th style="text-align:right;">Restante Sugerido</th>
        </tr>
      </thead>
      <tbody>
        ${componentRows}
      </tbody>
    </table>

    <!-- FINANCIAL & CONSUMPTION ANALYSIS -->
    <div class="section-title">Estadísticas de Consumo y Análisis Financiero</div>
    <div class="grid-3" style="margin-bottom:14px;">
      <div class="card" style="border-left:4px solid #00e3fd;">
        <div class="card-label">Gasto en Gasolina</div>
        <div class="card-value" style="color:#008da8;">$${financialStats.totalFuelUSD.toFixed(2)} USD</div>
        <div style="font-size:11px; color:#718096; margin-top:3px;">${financialStats.fuelRecordsCount} cargas registradas</div>
      </div>
      <div class="card" style="border-left:4px solid #4169E1;">
        <div class="card-label">Gasto en Mantenimiento</div>
        <div class="card-value" style="color:#2b6cb0;">$${financialStats.totalServicesUSD.toFixed(2)} USD</div>
        <div style="font-size:11px; color:#718096; margin-top:3px;">${financialStats.serviceRecordsCount} servicios realizados</div>
      </div>
      <div class="card" style="border-left:4px solid #00ae78;">
        <div class="card-label">Costo Operativo Total</div>
        <div class="card-value" style="color:#00ae78;">$${financialStats.totalCostUSD.toFixed(2)} USD</div>
        <div style="font-size:11px; color:#718096; margin-top:3px;">${myMoto.currentOdometer > 0 ? `$${(financialStats.totalCostUSD / myMoto.currentOdometer).toFixed(3)}/km` : '0.00/km'}</div>
      </div>
    </div>

    <!-- BAR CHART OF EXPENSES -->
    ${
      financialStats.monthlyData.length > 0
        ? `
      <div class="card" style="margin-bottom:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <div class="card-label">Gráfica Histórica de Consumo y Gastos Mensuales ($ USD)</div>
          <div style="display:flex; gap:12px; font-size:10.5px; font-weight:bold;">
            <span style="color:#008da8;">■ Combustible</span>
            <span style="color:#4169E1;">■ Mantenimiento</span>
          </div>
        </div>
        <div style="display:flex; justify-content:space-around; align-items:flex-end; padding:10px 0 0 0;">
          ${monthlyChartBars}
        </div>
      </div>
    `
        : ''
    }

    <!-- SERVICE LOGS / BITÁCORA -->
    <div class="section-title page-break">Bitácora y Log Histórico de Servicios Realizados</div>
    <table>
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Tipo de Servicio</th>
          <th style="text-align:right;">Odómetro</th>
          <th style="text-align:right;">Costo</th>
          <th>Notas Técnicas del Servicio</th>
        </tr>
      </thead>
      <tbody>
        ${logsRows}
      </tbody>
    </table>

    <!-- CERTIFICATION FOOTER -->
    <div style="margin-top:36px; padding-top:16px; border-top:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center; font-size:10px; color:#718096;">
      <div>
        Certificado Digital GARAGE Telemetry | Documento generado el ${reportDate} ${reportTime}<br>
        Hash de Integridad: SHA256-${reportFolio.replace(/-/g, '')}-OK
      </div>
      <div style="text-align:right; font-weight:bold; color:#4a5568;">
        GARAGE v1.0 • Piattaforma di Diagnostica Automotriz
      </div>
    </div>

  </div>

  <script>
    // Auto-trigger print dialog after load when printed from window
    window.addEventListener('DOMContentLoaded', () => {
      // Intentionally manual via button to allow preview
    });
  </script>
</body>
</html>
    `;
  };

  const handlePrint = () => {
    setGenerating(true);
    const htmlContent = generateReportHTML();

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => {
            printWindow.print();
            setGenerating(false);
          }, 400);
        } else {
          // Fallback if popup blocked: use hidden iframe
          const iframe = document.createElement('iframe');
          iframe.style.position = 'fixed';
          iframe.style.right = '0';
          iframe.style.bottom = '0';
          iframe.style.width = '0';
          iframe.style.height = '0';
          iframe.style.border = '0';
          document.body.appendChild(iframe);
          iframe.contentWindow?.document.write(htmlContent);
          iframe.contentWindow?.document.close();
          setTimeout(() => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            document.body.removeChild(iframe);
            setGenerating(false);
          }, 500);
        }
      } catch (e) {
        console.error('Error al imprimir:', e);
        setGenerating(false);
      }
    } else {
      setGenerating(false);
      alert('Reporte generado exitosamente. Abre desde el navegador web para exportar a PDF directo.');
    }
  };

  const handleDownloadHTML = () => {
    if (!myMoto) return;
    const htmlContent = generateReportHTML();
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte-garage-${myMoto.brand}-${myMoto.model}-${myMoto.plate || 'sin-placa'}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const F = {
    bold: 'Montserrat_700Bold',
    semibold: 'Montserrat_600SemiBold',
    medium: 'Montserrat_500Medium',
    regular: 'Montserrat_400Regular',
    extrabold: 'Montserrat_800ExtraBold',
  };

  if (!myMoto) return null;

  return (
    <Modal visible={visible} transparent={false} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.modalRoot, { backgroundColor: isDark ? '#0c0e14' : '#f0f3f8' }]}>
        
        {/* TOP BAR / CONTROLS */}
        <View style={[styles.topBar, { backgroundColor: isDark ? '#14171f' : '#ffffff', borderBottomColor: colors.outlineVariant }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={[styles.pdfIconBadge, { backgroundColor: '#e53e3e' }]}>
              <MaterialIcons name="picture-as-pdf" size={20} color="#ffffff" />
            </View>
            <View>
              <Text style={{ fontFamily: F.bold, color: colors.onSurface, fontSize: 16 }}>
                Reporte Ejecutivo del Vehículo
              </Text>
              <Text style={{ fontFamily: F.medium, color: colors.onSurfaceVariant, fontSize: 11 }}>
                Folio: {reportFolio} • {reportDate}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity
              onPress={handleDownloadHTML}
              style={[styles.actionBtn, { borderColor: colors.outlineVariant, backgroundColor: colors.surfaceContainer }]}
              activeOpacity={0.8}
            >
              <MaterialIcons name="download" size={16} color={colors.primary} />
              <Text style={[styles.actionBtnText, { color: colors.primary }]}>Descargar HTML</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handlePrint}
              disabled={generating}
              style={[styles.primaryActionBtn, { backgroundColor: '#2b6cb0' }]}
              activeOpacity={0.8}
            >
              {generating ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <MaterialIcons name="print" size={17} color="#ffffff" />
                  <Text style={styles.primaryActionBtnText}>Guardar como PDF</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeIconBtn, { backgroundColor: colors.surfaceContainerHigh }]}
              activeOpacity={0.8}
            >
              <MaterialIcons name="close" size={20} color={colors.onSurface} />
            </TouchableOpacity>
          </View>
        </View>

        {/* REPORT LIVE PREVIEW CONTAINER */}
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={[styles.previewPaper, { backgroundColor: isDark ? '#161922' : '#ffffff', borderColor: colors.outlineVariant }]}>
            
            {/* DOCUMENT HEADER */}
            <View style={[styles.docHeader, { borderBottomColor: colors.primary }]}>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <MaterialCommunityIcons name="engine" size={28} color={colors.primary} />
                  <Text style={{ fontFamily: F.extrabold, fontSize: 24, color: colors.onSurface }}>
                    GARAGE<Text style={{ color: '#00e3fd' }}>.</Text>
                  </Text>
                </View>
                <Text style={{ fontFamily: F.bold, fontSize: 13, color: colors.primary, marginTop: 4 }}>
                  EXPEDIENTE TÉCNICO Y AUDITORÍA VEHICULAR
                </Text>
                <Text style={{ fontFamily: F.medium, fontSize: 11, color: colors.onSurfaceVariant, marginTop: 2 }}>
                  Generado: {reportDate} a las {reportTime}
                </Text>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <View style={[styles.typeBadge, { backgroundColor: colors.surfaceContainerHigh }]}>
                  <Text style={{ fontFamily: F.bold, fontSize: 10, color: colors.primary, letterSpacing: 0.5 }}>
                    {isVehicleCar ? 'AUTOMÓVIL / CAMIONETA' : 'MOTOCICLETA'}
                  </Text>
                </View>
                <Text style={{ fontFamily: F.extrabold, fontSize: 22, color: colors.tertiary, marginTop: 6 }}>
                  {generalHealth}% SALUD
                </Text>
              </View>
            </View>

            {/* VEHICLE & OWNER OVERVIEW */}
            <View style={styles.twoColGrid}>
              <View style={[styles.infoCard, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
                <Text style={[styles.cardTag, { color: colors.onSurfaceVariant }]}>DATOS DEL VEHÍCULO</Text>
                <Text style={{ fontFamily: F.extrabold, color: colors.onSurface, fontSize: 18, marginTop: 4 }}>
                  {myMoto.brand} {myMoto.model}
                </Text>
                <View style={{ marginTop: 8, gap: 4 }}>
                  <Text style={{ fontFamily: F.medium, color: colors.onSurface, fontSize: 12 }}>
                    Año: <Text style={{ fontFamily: F.bold }}>{myMoto.year}</Text>
                  </Text>
                  <Text style={{ fontFamily: F.medium, color: colors.onSurface, fontSize: 12 }}>
                    Placa: <Text style={{ fontFamily: F.bold, color: colors.primary }}>{myMoto.plate || 'Sin Placa'}</Text>
                  </Text>
                  <Text style={{ fontFamily: F.medium, color: colors.onSurface, fontSize: 12 }}>
                    Odómetro actual: <Text style={{ fontFamily: F.extrabold }}>{myMoto.currentOdometer.toLocaleString()} km</Text>
                  </Text>
                </View>
              </View>

              <View style={[styles.infoCard, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
                <Text style={[styles.cardTag, { color: colors.onSurfaceVariant }]}>PROPIETARIO / PILOTO</Text>
                <Text style={{ fontFamily: F.bold, color: colors.onSurface, fontSize: 16, marginTop: 4 }}>
                  {ownerData.firstName || ownerData.lastName ? `${ownerData.firstName} ${ownerData.lastName}` : 'Conductor GARAGE'}
                </Text>
                <View style={{ marginTop: 8, gap: 4 }}>
                  <Text style={{ fontFamily: F.medium, color: colors.onSurface, fontSize: 12 }}>
                    Cédula / DNI: <Text style={{ fontFamily: F.bold }}>{ownerData.dni || 'Sin registrar'}</Text>
                  </Text>
                  <Text style={{ fontFamily: F.medium, color: colors.onSurface, fontSize: 12 }}>
                    Teléfono: <Text style={{ fontFamily: F.bold }}>{ownerData.phone || 'Sin registrar'}</Text>
                  </Text>
                  <Text style={{ fontFamily: F.medium, color: colors.onSurface, fontSize: 12 }}>
                    Grupo Sanguíneo: <Text style={{ fontFamily: F.bold, color: '#e53e3e' }}>{ownerData.bloodType}</Text>
                  </Text>
                </View>
              </View>
            </View>

            {/* FACTORY SPECS */}
            <Text style={[styles.sectionHeading, { color: colors.onSurface }]}>
              ESPECIFICACIONES TÉCNICAS OEM
            </Text>
            <View style={styles.threeColGrid}>
              <View style={[styles.miniSpecCard, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
                <Text style={[styles.cardTag, { color: colors.onSurfaceVariant }]}>MOTOR & CILINDRADA</Text>
                <Text style={{ fontFamily: F.bold, color: colors.onSurface, fontSize: 13, marginTop: 2 }}>
                  {specs?.engineType || '4 Tiempos'}
                </Text>
                <Text style={{ fontFamily: F.medium, color: colors.onSurfaceVariant, fontSize: 11, marginTop: 2 }}>
                  {specs?.displacement || 'N/D'} • {specs?.hp || 'N/D'}
                </Text>
              </View>

              <View style={[styles.miniSpecCard, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
                <Text style={[styles.cardTag, { color: colors.onSurfaceVariant }]}>ACEITE RECOMENDADO</Text>
                <Text style={{ fontFamily: F.bold, color: colors.onSurface, fontSize: 13, marginTop: 2 }}>
                  {specs?.oilTypeRecommended || '10W-30 Semi-Sintético'}
                </Text>
                <Text style={{ fontFamily: F.medium, color: colors.onSurfaceVariant, fontSize: 11, marginTop: 2 }}>
                  Capacidad: {specs?.oilCapacity || '4.0 L'}
                </Text>
              </View>

              <View style={[styles.miniSpecCard, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
                <Text style={[styles.cardTag, { color: colors.onSurfaceVariant }]}>TANQUE & PRESIÓN</Text>
                <Text style={{ fontFamily: F.bold, color: colors.onSurface, fontSize: 13, marginTop: 2 }}>
                  Tanque: {specs?.fuelCapacity || 'N/D'}
                </Text>
                <Text style={{ fontFamily: F.medium, color: colors.onSurfaceVariant, fontSize: 11, marginTop: 2 }}>
                  Presión: {specs?.frontTirePressure || '30 PSI'} / {specs?.rearTirePressure || '32 PSI'}
                </Text>
              </View>
            </View>

            {/* TELEMETRY WEAR ITEMS */}
            <Text style={[styles.sectionHeading, { color: colors.onSurface, marginTop: 24 }]}>
              ESTADO DETALLADO DE COMPONENTES
            </Text>
            <View style={[styles.tableContainer, { borderColor: colors.outlineVariant }]}>
              <View style={[styles.tableHeader, { backgroundColor: colors.surfaceContainerHigh }]}>
                <Text style={[styles.colHeader, { flex: 2, color: colors.onSurfaceVariant }]}>COMPONENTE</Text>
                <Text style={[styles.colHeader, { flex: 1, textAlign: 'center', color: colors.onSurfaceVariant }]}>ESTADO</Text>
                <Text style={[styles.colHeader, { flex: 1.5, textAlign: 'center', color: colors.onSurfaceVariant }]}>SALUD (%)</Text>
                <Text style={[styles.colHeader, { flex: 1.2, textAlign: 'right', color: colors.onSurfaceVariant }]}>RECORRIDO</Text>
                <Text style={[styles.colHeader, { flex: 1.5, textAlign: 'right', color: colors.onSurfaceVariant }]}>REMANENTE</Text>
              </View>

              {componentsAnalysis.map((comp) => (
                <View key={comp.id} style={[styles.tableRow, { borderBottomColor: colors.outlineVariant }]}>
                  <Text style={[styles.colCell, { flex: 2, fontFamily: F.bold, color: colors.onSurface }]}>
                    {comp.name}
                  </Text>

                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <View style={[styles.statusBadge, { backgroundColor: comp.statusColor }]}>
                      <Text style={styles.statusBadgeText}>{comp.status}</Text>
                    </View>
                  </View>

                  <View style={{ flex: 1.5, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 6 }}>
                    <View style={[styles.progressBarBase, { backgroundColor: colors.surfaceContainerHighest }]}>
                      <View style={[styles.progressBarFill, { width: `${comp.isConfigured ? comp.wear : 0}%`, backgroundColor: comp.statusColor }]} />
                    </View>
                    <Text style={{ fontFamily: F.bold, fontSize: 11, color: comp.statusColor, width: 34 }}>
                      {comp.isConfigured ? `${comp.wear}%` : 'N/D'}
                    </Text>
                  </View>

                  <Text style={[styles.colCell, { flex: 1.2, textAlign: 'right', color: colors.onSurfaceVariant, fontSize: 11 }]}>
                    {comp.isConfigured ? `${comp.kmSince.toLocaleString()} km` : '—'}
                  </Text>

                  <Text style={[styles.colCell, { flex: 1.5, textAlign: 'right', fontFamily: F.semibold, color: comp.kmRemaining < 1000 ? '#ba1a1a' : colors.primary, fontSize: 11 }]}>
                    {comp.isConfigured ? `${comp.kmRemaining.toLocaleString()} km` : `Nominal: ${comp.nominalLife.toLocaleString()} km`}
                  </Text>
                </View>
              ))}
            </View>

            {/* FINANCIAL OVERVIEW */}
            <Text style={[styles.sectionHeading, { color: colors.onSurface, marginTop: 24 }]}>
              CONSUMO Y RESUMEN FINANCIERO
            </Text>
            <View style={styles.threeColGrid}>
              <View style={[styles.financialCard, { backgroundColor: colors.surfaceContainerLow, borderColor: '#00e3fd' }]}>
                <Text style={[styles.cardTag, { color: colors.onSurfaceVariant }]}>GASTO COMBUSTIBLE</Text>
                <Text style={{ fontFamily: F.extrabold, fontSize: 18, color: '#00e3fd', marginTop: 4 }}>
                  ${financialStats.totalFuelUSD.toFixed(2)} USD
                </Text>
                <Text style={{ fontFamily: F.medium, fontSize: 11, color: colors.onSurfaceVariant, marginTop: 2 }}>
                  {financialStats.fuelRecordsCount} cargas registradas
                </Text>
              </View>

              <View style={[styles.financialCard, { backgroundColor: colors.surfaceContainerLow, borderColor: '#4169E1' }]}>
                <Text style={[styles.cardTag, { color: colors.onSurfaceVariant }]}>GASTO MANTENIMIENTO</Text>
                <Text style={{ fontFamily: F.extrabold, fontSize: 18, color: '#4169E1', marginTop: 4 }}>
                  ${financialStats.totalServicesUSD.toFixed(2)} USD
                </Text>
                <Text style={{ fontFamily: F.medium, fontSize: 11, color: colors.onSurfaceVariant, marginTop: 2 }}>
                  {financialStats.serviceRecordsCount} servicios realizados
                </Text>
              </View>

              <View style={[styles.financialCard, { backgroundColor: colors.surfaceContainerLow, borderColor: '#00ae78' }]}>
                <Text style={[styles.cardTag, { color: colors.onSurfaceVariant }]}>INVERSIÓN TOTAL OPERATIVA</Text>
                <Text style={{ fontFamily: F.extrabold, fontSize: 18, color: '#00ae78', marginTop: 4 }}>
                  ${financialStats.totalCostUSD.toFixed(2)} USD
                </Text>
                <Text style={{ fontFamily: F.medium, fontSize: 11, color: colors.onSurfaceVariant, marginTop: 2 }}>
                  {myMoto.currentOdometer > 0 ? `$${(financialStats.totalCostUSD / myMoto.currentOdometer).toFixed(3)}/km` : '0.00/km'}
                </Text>
              </View>
            </View>

            {/* HISTORICAL SERVICE LOG TABLE */}
            <Text style={[styles.sectionHeading, { color: colors.onSurface, marginTop: 24 }]}>
              BITÁCORA Y LOG HISTÓRICO DE SERVICIOS
            </Text>
            <View style={[styles.tableContainer, { borderColor: colors.outlineVariant }]}>
              <View style={[styles.tableHeader, { backgroundColor: colors.surfaceContainerHigh }]}>
                <Text style={[styles.colHeader, { flex: 1.2, color: colors.onSurfaceVariant }]}>FECHA</Text>
                <Text style={[styles.colHeader, { flex: 2, color: colors.onSurfaceVariant }]}>SERVICIO</Text>
                <Text style={[styles.colHeader, { flex: 1.3, textAlign: 'right', color: colors.onSurfaceVariant }]}>ODÓMETRO</Text>
                <Text style={[styles.colHeader, { flex: 1.2, textAlign: 'right', color: colors.onSurfaceVariant }]}>COSTO</Text>
                <Text style={[styles.colHeader, { flex: 3, color: colors.onSurfaceVariant, paddingLeft: 10 }]}>NOTAS / DETALLES</Text>
              </View>

              {records.length > 0 ? (
                records.map((r) => (
                  <View key={r.id} style={[styles.tableRow, { borderBottomColor: colors.outlineVariant }]}>
                    <Text style={[styles.colCell, { flex: 1.2, color: colors.onSurfaceVariant, fontSize: 11 }]}>
                      {r.date || 'S/F'}
                    </Text>
                    <Text style={[styles.colCell, { flex: 2, fontFamily: F.bold, color: colors.onSurface, fontSize: 11.5 }]}>
                      {COMPONENT_NAMES[r.type] || r.type}
                    </Text>
                    <Text style={[styles.colCell, { flex: 1.3, textAlign: 'right', color: colors.onSurface, fontSize: 11 }]}>
                      {r.odometer ? `${r.odometer.toLocaleString()} km` : '—'}
                    </Text>
                    <Text style={[styles.colCell, { flex: 1.2, textAlign: 'right', fontFamily: F.bold, color: colors.primary, fontSize: 11 }]}>
                      ${(r.costUSD || 0).toFixed(2)}
                    </Text>
                    <Text style={[styles.colCell, { flex: 3, color: colors.onSurfaceVariant, fontSize: 11, paddingLeft: 10 }]} numberOfLines={2}>
                      {r.notes || '—'}
                    </Text>
                  </View>
                ))
              ) : (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ fontFamily: F.medium, color: colors.onSurfaceVariant, fontSize: 12 }}>
                    No se han registrado servicios en la bitácora aún.
                  </Text>
                </View>
              )}
            </View>

            {/* FOOTER */}
            <View style={[styles.docFooter, { borderTopColor: colors.outlineVariant }]}>
              <Text style={{ fontFamily: F.medium, fontSize: 10, color: colors.onSurfaceVariant }}>
                Expediente generado automáticamente por GARAGE Automotive Telemetry System • Folio: {reportFolio}
              </Text>
              <Text style={{ fontFamily: F.bold, fontSize: 10, color: colors.primary, marginTop: 4 }}>
                Documento de consulta técnica e informe de mantenimiento preventivo
              </Text>
            </View>

          </View>
        </ScrollView>

      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    zIndex: 10,
  },
  pdfIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 12,
    fontFamily: 'Montserrat_700Bold',
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  primaryActionBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontFamily: 'Montserrat_700Bold',
  },
  closeIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
  },
  previewPaper: {
    maxWidth: 920,
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  docHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 2,
    paddingBottom: 16,
    marginBottom: 20,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  twoColGrid: {
    flexDirection: 'row',
    gap: 14,
    flexWrap: 'wrap',
  },
  infoCard: {
    flex: 1,
    minWidth: 280,
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
  },
  cardTag: {
    fontSize: 9.5,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 0.8,
  },
  sectionHeading: {
    fontFamily: 'Montserrat_800ExtraBold',
    fontSize: 13,
    letterSpacing: 0.8,
    marginTop: 20,
    marginBottom: 10,
  },
  threeColGrid: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  miniSpecCard: {
    flex: 1,
    minWidth: 200,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  tableContainer: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  colHeader: {
    fontSize: 10,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  colCell: {
    fontSize: 11.5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 0.4,
  },
  progressBarBase: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  financialCard: {
    flex: 1,
    minWidth: 220,
    padding: 14,
    borderRadius: 8,
    borderLeftWidth: 3.5,
    borderWidth: 1,
  },
  docFooter: {
    marginTop: 32,
    paddingTop: 16,
    borderTopWidth: 1,
    alignItems: 'center',
  },
});
