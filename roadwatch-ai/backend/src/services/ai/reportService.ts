import { db } from '../../src/database/db';
import { evaluateRisk } from '../services/ai/riskEngine';

/**
 * Run AI risk analysis for a complaint and store the result as an AiReport.
 * This is called automatically when a complaint reaches the threshold.
 */
export async function runAiAnalysis(complaintId: string) {
  // Fetch complaint details
  const complaint = await db.complaint.findUnique({ where: { id: complaintId } });
  if (!complaint) throw new Error('Complaint not found');

  // For this demo we use placeholder risk inputs – in a real app the analyst would fill them.
  const dummyInputs = {
    historicalAccidents: 5,
    roadClass: 'State Highway',
    junctionType: '4-Way Junction',
    pcuPerHour: 3000,
    envLighting: 'Poor',
    roadSurface: 'Potholes',
  };

  const riskResults = evaluateRisk(dummyInputs);

  // Create the AI report linked to the complaint
  const aiReport = await db.aiReport.create({
    data: {
      complaintId: complaint.id,
      riskScore: riskResults.predictedRiskScore,
      riskCause: riskResults.predictedCause,
      recommendation: riskResults.suggestedFix,
      confidenceScore: riskResults.confidenceScore,
    },
  });

  // Update complaint to point to the new report
  await db.complaint.update({
    where: { id: complaint.id },
    data: { aiReportId: aiReport.id, status: 'ANALYZED', isRiskAnalyzed: true },
  });

  return aiReport;
}
