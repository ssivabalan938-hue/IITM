import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const fallbackPath = path.join(__dirname, 'fallback_db.json');

// For MVP, disable PostgreSQL connection and always use fallback JSON database
let usePostgres = false;

// Fallback JSON DB helper functions
function getFallbackData() {
  try {
    if (!fs.existsSync(fallbackPath)) {
      // Create default mock data if not exists
      const defaultData = {
        hotspots: [],
        complaints: [],
        citizens: [],
        government_users: [
          {
            id: "gov-admin-1",
            employeeId: "GOV-TRICHY-001",
            department: "Highways & Infrastructure Development",
            officialEmail: "officer@trichy.gov.in",
            designation: "Divisional Engineer (Road Safety)",
            password: "admin123",
            approvalStatus: "APPROVED"
          },
          {
            id: "engineer-1",
            employeeId: "ENG001",
            department: "Engineering",
            officialEmail: "eng1@roadwatch.ai",
            designation: "Field Engineer",
            password: "engineer123",
            approvalStatus: "APPROVED"
          },
          {
            id: "engineer-2",
            employeeId: "ENG002",
            department: "Engineering",
            officialEmail: "eng2@roadwatch.ai",
            designation: "Field Engineer",
            password: "engineer123",
            approvalStatus: "APPROVED"
          }
        ]
      };
      fs.writeFileSync(fallbackPath, JSON.stringify(defaultData, null, 2), 'utf8');
      return defaultData;
    }
    const content = fs.readFileSync(fallbackPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error("Error reading fallback JSON database:", error);
    return { hotspots: [], complaints: [], citizens: [], government_users: [] };
  }
}

function saveFallbackData(data: any) {
  try {
    fs.writeFileSync(fallbackPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error("Error writing to fallback JSON database:", error);
  }
}

export const db = {
  // Check connection state
  isPostgres: () => usePostgres,

  // Citizen Services
  citizen: {
    findUnique: async ({ where }: { where: { id?: string; email?: string; aadharNo?: string } }) => {
      if (usePostgres) {
        return prisma.citizen.findUnique({ where: where as any });
      }
      const data = getFallbackData();
      return data.citizens.find((c: any) => 
        (where.id && c.id === where.id) || 
        (where.email && c.email === where.email) ||
        (where.aadharNo && c.aadharNo === where.aadharNo)
      ) || null;
    },
    create: async ({ data }: { data: any }) => {
      if (usePostgres) {
        return prisma.citizen.create({ data });
      }
      const fileData = getFallbackData();
      const newCitizen = {
        id: `citizen-${Date.now()}`,
        ...data,
        createdAt: new Date().toISOString()
      };
      fileData.citizens.push(newCitizen);
      saveFallbackData(fileData);
      return newCitizen;
    }
  },

  // Government User Services
  governmentUser: {
    findUnique: async ({ where }: { where: { id?: string; employeeId?: string; officialEmail?: string } }) => {
      if (usePostgres) {
        return prisma.governmentUser.findUnique({ where: where as any });
      }
      const data = getFallbackData();
      return data.government_users.find((u: any) => 
        (where.id && u.id === where.id) || 
        (where.employeeId && u.employeeId === where.employeeId) ||
        (where.officialEmail && u.officialEmail === where.officialEmail)
      ) || null;
    },
    findMany: async (args?: any) => {
      if (usePostgres) {
        return prisma.governmentUser.findMany(args);
      }
      const data = getFallbackData();
      if (args && args.where && args.where.approvalStatus) {
        return data.government_users.filter((u: any) => u.approvalStatus === args.where.approvalStatus);
      }
      return data.government_users;
    },
  create: async ({ data }: { data: any }) => {
    // Always use fallback JSON database to avoid Prisma schema mismatches.
    const fileData = getFallbackData();
    const newUser = {
      id: `gov-${Date.now()}`,
      name: data.name || data.employeeId || "Unnamed",
      ...data,
      approvalStatus: data.approvalStatus || "PENDING",
      createdAt: new Date().toISOString()
    };
    fileData.government_users.push(newUser);
    saveFallbackData(fileData);
    return newUser;
  },
    update: async ({ where, data }: { where: { id: string }, data: any }) => {
      if (usePostgres) {
        return prisma.governmentUser.update({ where, data });
      }
      const fileData = getFallbackData();
      const index = fileData.government_users.findIndex((u: any) => u.id === where.id);
      if (index !== -1) {
        fileData.government_users[index] = { ...fileData.government_users[index], ...data };
        saveFallbackData(fileData);
        return fileData.government_users[index];
      }
      throw new Error("Government user not found");
    }
  },

  // Complaint Services
  complaint: {
    findMany: async (args?: any) => {
      if (usePostgres) {
        return prisma.complaint.findMany({
          ...args,
          include: { citizen: { select: { fullName: true, email: true } } }
        });
      }
      const data = getFallbackData();
      let list = [...data.complaints];
      if (args && args.where) {
        if (args.where.citizenId) {
          list = list.filter((c: any) => c.citizenId === args.where.citizenId);
        }
        if (args.where.status) {
          list = list.filter((c: any) => c.status === args.where.status);
        }
      }
      // Populate citizen info
      return list.map((c: any) => {
        const citizen = data.citizens.find((cit: any) => cit.id === c.citizenId);
        return {
          ...c,
          citizen: citizen ? { fullName: citizen.fullName, email: citizen.email } : { fullName: "Anonymous", email: "" }
        };
      });
    },
    findUnique: async ({ where }: { where: { id: string } }) => {
      if (usePostgres) {
        return prisma.complaint.findUnique({ where });
      }
      const data = getFallbackData();
      return data.complaints.find((c: any) => c.id === where.id) || null;
    },
    create: async ({ data }: { data: any }) => {
      if (usePostgres) {
        return prisma.complaint.create({ data });
      }
      const fileData = getFallbackData();
      const newComplaint = {
        id: `complaint-${Date.now()}`,
        ...data,
        status: data.status || "SUBMITTED",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        thresholdCount: data.thresholdCount || 1,
        isRiskAnalyzed: data.isRiskAnalyzed || false
      };
      fileData.complaints.push(newComplaint);
      saveFallbackData(fileData);
      return newComplaint;
    },
    update: async ({ where, data }: { where: { id: string }, data: any }) => {
      if (usePostgres) {
        return prisma.complaint.update({ where, data });
      }
      const fileData = getFallbackData();
      const index = fileData.complaints.findIndex((c: any) => c.id === where.id);
      if (index !== -1) {
        fileData.complaints[index] = { 
          ...fileData.complaints[index], 
          ...data,
          updatedAt: new Date().toISOString()
        };
        saveFallbackData(fileData);
        return fileData.complaints[index];
      }
      throw new Error("Complaint not found");
    }
  },

  // Hotspot Services (AI predictions)
  hotspot: {
    findMany: async (args?: any) => {
      if (usePostgres) {
        return prisma.hotspot.findMany({
          ...args,
          include: { construction: true }
        });
      }
      const data = getFallbackData();
      let list = [...data.hotspots];
      if (args && args.where) {
        if (args.where.isTop10 !== undefined) {
          list = list.filter((h: any) => h.isTop10 === args.where.isTop10);
        }
      }
      return list;
    },
    findUnique: async ({ where }: { where: { id: string } }) => {
      if (usePostgres) {
        return prisma.hotspot.findUnique({ where, include: { construction: true } });
      }
      const data = getFallbackData();
      return data.hotspots.find((h: any) => h.id === where.id) || null;
    },
    create: async ({ data }: { data: any }) => {
      if (usePostgres) {
        return prisma.hotspot.create({ data });
      }
      const fileData = getFallbackData();
      const newHotspot = {
        id: `hotspot-${Date.now()}`,
        ...data,
        lastAudited: new Date().toISOString(),
        construction: {
          status: data.isTop10 ? "APPROVED" : "PENDING",
          notes: data.isTop10 ? "Approved for speed calming / lighting measures" : "Under initial inspection",
          updatedAt: new Date().toISOString()
        }
      };
      fileData.hotspots.push(newHotspot);
      saveFallbackData(fileData);
      return newHotspot;
    },
    update: async ({ where, data }: { where: { id: string }, data: any }) => {
      if (usePostgres) {
        return prisma.hotspot.update({ where, data, include: { construction: true } });
      }
      const fileData = getFallbackData();
      const index = fileData.hotspots.findIndex((h: any) => h.id === where.id);
      if (index !== -1) {
        fileData.hotspots[index] = { 
          ...fileData.hotspots[index], 
          ...data,
          lastAudited: new Date().toISOString()
        };
        saveFallbackData(fileData);
        return fileData.hotspots[index];
      }
      throw new Error("Hotspot not found");
    }
  },

  // Construction Status Services
  constructionStatus: {
    findMany: async (args?: any) => {
      if (usePostgres) {
        return prisma.constructionStatus.findMany({
          ...args,
          include: { hotspot: true }
        });
      }
      const data = getFallbackData();
      return data.hotspots.map((h: any) => ({
        id: `construction-${h.id}`,
        hotspotId: h.id,
        status: h.construction?.status || "PENDING",
        notes: h.construction?.notes || "Initial check",
        progress: h.construction?.progress || 0,
        beforePhotoUrl: h.construction?.beforePhotoUrl || null,
        constructionPhotoUrl: h.construction?.constructionPhotoUrl || null,
        completionPhotoUrl: h.construction?.completionPhotoUrl || null,
        engineeringNotes: h.construction?.engineeringNotes || null,
        governmentNotes: h.construction?.governmentNotes || null,
        budgetDetails: h.construction?.budgetDetails || null,
        internalRecommendations: h.construction?.internalRecommendations || null,
        assignedTeam: h.construction?.assignedTeam || null,
        assignedEngineerId: h.construction?.assignedEngineerId || null,
        assignedEngineerName: h.construction?.assignedEngineerName || null,
        severityScore: h.construction?.severityScore || null,
        priorityRank: h.construction?.priorityRank || null,
        targetDate: h.construction?.targetDate || null,
        startDate: h.construction?.startDate || null,
        updatedAt: h.construction?.updatedAt || new Date().toISOString(),
        hotspot: h
      }));
    },
    update: async ({ where, data }: { where: { hotspotId: string }, data: any }) => {
      if (usePostgres) {
        return prisma.constructionStatus.update({ where, data });
      }
      const fileData = getFallbackData();
      const index = fileData.hotspots.findIndex((h: any) => h.id === where.hotspotId);
      if (index !== -1) {
        fileData.hotspots[index].construction = {
          ...fileData.hotspots[index].construction,
          ...data,
          updatedAt: new Date().toISOString()
        };
        saveFallbackData(fileData);
        return fileData.hotspots[index].construction;
      }
      throw new Error("Construction status not found");
    }
  }
};
