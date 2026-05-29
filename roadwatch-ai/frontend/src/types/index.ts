export interface User {
  id: string;
  fullName?: string;
  employeeId?: string;
  officialEmail?: string;
  email?: string;
  department?: string;
  designation?: string;
  role: 'citizen' | 'government';
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface Complaint {
  id: string;
  issueType: string;
  locationName: string;
  latitude: number;
  longitude: number;
  description: string;
  imageUrl?: string;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'ANALYZED' | 'RESOLVED';
  citizenId: string;
  createdAt: string;
  updatedAt: string;
  thresholdCount: number;
  isRiskAnalyzed: boolean;
  citizen?: {
    fullName: string;
    email: string;
  };
}

export interface Hotspot {
  id: string;
  locationName: string;
  latitude: number;
  longitude: number;
  
  // Inputs
  historicalAccidents: number;
  roadClass: string;
  junctionType: string;
  pcuPerHour: number;
  envLighting: string;
  roadSurface: string;
  
  // Predictions
  predictedRiskScore: number;
  predictedCause: string;
  actualHistoricalCause: string;
  isHeldOut: boolean;
  confidenceScore: number;
  
  // Interventions
  isTop10: boolean;
  suggestedFix: string;
  ircReference: string;
  expertRelevanceRating: number;
  
  // Metadata
  lastAudited: string;
  futureTrend: 'Increasing' | 'Stable' | 'Decreasing';
  renderPriority: number;
  
  construction?: {
    status: 'PENDING' | 'APPROVED' | 'UNDER_CONSTRUCTION' | 'COMPLETED';
    notes: string;
    updatedAt: string;
  };
}

export interface ConstructionStatus {
  id: string;
  hotspotId: string;
  status: 'PENDING' | 'APPROVED' | 'UNDER_CONSTRUCTION' | 'COMPLETED';
  notes: string;               // Public progress notes / latest update
  progress: number;            // 0-100%
  beforePhotoUrl?: string;     // Photo before work starts
  constructionPhotoUrl?: string; // Photo during construction
  completionPhotoUrl?: string; // Photo after completion
  engineeringNotes?: string;   // Internal engineering notes
  governmentNotes?: string;
  budgetDetails?: string;
  internalRecommendations?: string;
  assignedTeam?: string;
  assignedEngineerId?: string;
  assignedEngineerName?: string;
  severityScore?: number;
  priorityRank?: number;
  targetDate?: string;         // Expected completion date
  startDate?: string;
  updatedAt: string;
  hotspot: Hotspot;
}
