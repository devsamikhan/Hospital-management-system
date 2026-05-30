// File: src/server/routes/dashboard.routes.ts
import { Router, Request, Response } from 'express';
import { dbService, db } from '../db';
import { authenticateToken } from './auth.routes';

export const dashboardRouter = Router();

// Retrieve all clinical/financial analytical stats for interactive dashboard charts
dashboardRouter.get('/stats', authenticateToken, async (req: Request, res: Response) => {
  try {
    const [patients, appts, beds, labOrders, invoices] = await Promise.all([
      dbService.getPatients(),
      dbService.getAppointments(),
      dbService.getBeds(),
      dbService.getLabOrders(),
      dbService.getInvoices()
    ]);

    const opdCount = appts.length;
    const admissionsSnapshot = await db.collection('admissions').where('status', '==', 'Admitted').get();
    const ipdActiveCount = admissionsSnapshot.size;

    // Bed occupancy
    const totalBeds = beds.length;
    const occupiedBedsCount = beds.filter(b => b.status === 'Occupied').length;
    const bedOccupancyRate = totalBeds > 0 ? Number(((occupiedBedsCount / totalBeds) * 100).toFixed(1)) : 0;

    // Revenue calculations in PKR
    let totalRevenue = 0;
    let outstandingBalance = 0;
    invoices.forEach(inv => {
      totalRevenue += inv.paidAmount;
      outstandingBalance += Math.max(0, inv.total - inv.paidAmount);
    });

    // Department statistics distribution
    const deptDist: Record<string, number> = {};
    const doctors = await dbService.getDoctors();

    appts.forEach(app => {
      const doc = doctors.find(u => u.id === app.doctorId);
      const deptName = doc?.department || 'General Medicine';
      deptDist[deptName] = (deptDist[deptName] || 0) + 1;
    });

    const departmentRevenue = Object.entries(deptDist).map(([name, value]) => ({ name, value }));

    // Chronological patient registrations trend
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const registrationsByMonth: Record<string, number> = { "Jan": 0, "Feb": 0, "Mar": 0, "Apr": 0, "May": 0, "Jun": 0 };

    patients.forEach(p => {
      const regDate = new Date(p.createdAt);
      if (regDate.getFullYear() === 2026) {
        const monthLabel = monthNames[regDate.getMonth()];
        if (registrationsByMonth[monthLabel] !== undefined) {
          registrationsByMonth[monthLabel]++;
        }
      }
    });

    const registrationChart = Object.entries(registrationsByMonth).map(([month, count]) => ({ month, count }));
    const lowStockItemsCount = (await dbService.getInventory()).filter(i => i.stockQuantity <= i.minStockLevel).length;
    const labOrdersCount = labOrders.length;

    // 1. Financial Performance Line/Area Chart: group invoices by month in 2026
    const financialPerformanceMap: Record<string, { month: string, billed: number, paid: number }> = {
      "Jan": { month: "Jan", billed: 0, paid: 0 },
      "Feb": { month: "Feb", billed: 0, paid: 0 },
      "Mar": { month: "Mar", billed: 0, paid: 0 },
      "Apr": { month: "Apr", billed: 0, paid: 0 },
      "May": { month: "May", billed: 0, paid: 0 },
      "Jun": { month: "Jun", billed: 0, paid: 0 },
      "Jul": { month: "Jul", billed: 0, paid: 0 },
      "Aug": { month: "Aug", billed: 0, paid: 0 },
      "Sep": { month: "Sep", billed: 0, paid: 0 },
      "Oct": { month: "Oct", billed: 0, paid: 0 },
      "Nov": { month: "Nov", billed: 0, paid: 0 },
      "Dec": { month: "Dec", billed: 0, paid: 0 },
    };

    invoices.forEach(inv => {
      const invDate = new Date(inv.createdAt);
      if (invDate.getFullYear() === 2026) {
        const mLabel = monthNames[invDate.getMonth()];
        if (financialPerformanceMap[mLabel]) {
          financialPerformanceMap[mLabel].billed += inv.total;
          financialPerformanceMap[mLabel].paid += inv.paidAmount;
        }
      }
    });
    const financialPerformance = Object.values(financialPerformanceMap);

    // 2. Bed Occupancy Vectors by ward type
    const bedOccupancyMap: Record<string, { ward: string, occupied: number, vacant: number }> = {
      "General Ward": { ward: "General Ward", occupied: 0, vacant: 0 },
      "Semi-Private": { ward: "Semi-Private", occupied: 0, vacant: 0 },
      "Private": { ward: "Private", occupied: 0, vacant: 0 },
      "ICU": { ward: "ICU", occupied: 0, vacant: 0 },
    };

    beds.forEach(b => {
      const type = b.type || 'General Ward';
      if (bedOccupancyMap[type]) {
        if (b.status === 'Occupied') {
          bedOccupancyMap[type].occupied++;
        } else {
          bedOccupancyMap[type].vacant++;
        }
      }
    });
    const bedOccupancy = Object.values(bedOccupancyMap);

    // 3. Active patients in ER queue by ESI Level
    const esiQueueLoadMap: Record<number, { level: string, count: number }> = {
      1: { level: "ESI-1", count: 0 },
      2: { level: "ESI-2", count: 0 },
      3: { level: "ESI-3", count: 0 },
      4: { level: "ESI-4", count: 0 },
      5: { level: "ESI-5", count: 0 },
    };

    patients.forEach(p => {
      if (!p.isArchived && p.triageStatus === 'ER Queue') {
        const level = Number(p.esiLevel || 5);
        if (esiQueueLoadMap[level]) {
          esiQueueLoadMap[level].count++;
        }
      }
    });
    const esiQueueLoad = Object.values(esiQueueLoadMap);

    // 4. Weekly Outpatient Department (OPD) Analytics Column Chart
    const opdWeeklyAnalytics = departmentRevenue;

    // Daily revenue financial collections trend chart
    const dailyCollection = invoices.reduce((acc, inv) => {
      const dateStr = inv.createdAt.substring(0, 10);
      acc[dateStr] = (acc[dateStr] || 0) + inv.paidAmount;
      return acc;
    }, {} as Record<string, number>);

    const financialTrendChart = Object.entries(dailyCollection).map(([date, amount]) => ({ date, amount }));

    res.json({
      opdCount,
      ipdActiveCount,
      bedOccupancyRate,
      totalRevenue,
      outstandingBalance,
      departmentRevenue,
      registrationChart,
      lowStockItemsCount,
      expiredItemsCount: 0,
      labOrdersCount,
      financialTrendChart,
      financialPerformance,
      bedOccupancy,
      esiQueueLoad,
      opdWeeklyAnalytics
    });
  } catch (err: any) {
    res.status(500).json({ message: "Dashboard stats calculation failed", error: err.message });
  }
});
