/// <reference types="vite/client" />
import { jsPDF } from 'jspdf';
import { Hotspot } from '../types';

export const reportService = {
  exportSafetyAuditReport: async (hotspots: Hotspot[]) => {
    // 1. Initialize jsPDF (A4 Portrait, measurements in mm)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });


    
    // Sort hotspots to get Top 10
    const topHotspots = [...hotspots]
      .sort((a, b) => b.predictedRiskScore - a.predictedRiskScore)
      .slice(0, 10);

    // Group counts
    const totalSpots = hotspots.length;
    const highRiskCount = hotspots.filter(h => h.predictedRiskScore >= 80).length;
    const mediumRiskCount = hotspots.filter(h => h.predictedRiskScore >= 60 && h.predictedRiskScore < 80).length;
    const lowRiskCount = hotspots.filter(h => h.predictedRiskScore < 60).length;

    // Cause counts
    const causeCounts: Record<string, number> = {};
    hotspots.forEach(h => {
      causeCounts[h.predictedCause] = (causeCounts[h.predictedCause] || 0) + 1;
    });

    // ==========================================
    // PAGE 1: EXECUTIVE SUMMARY & RISK DISTRIBUTIONS
    // ==========================================
    
    // Outer Border
    doc.setDrawColor(229, 231, 235);
    doc.rect(10, 10, 190, 277);

    // Header Band
    doc.setFillColor(30, 58, 138); // Dark Blue
    doc.rect(10, 10, 190, 30, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(18);
    doc.text("ROADWATCH SAFETY INTELLIGENCE REPORT", 20, 20);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`District: Tiruchirappalli, Tamil Nadu  |  Generated: ${new Date().toLocaleDateString('en-IN')}`, 20, 26);
    doc.text("ADMINISTRATIVE DECISION DOCUMENT", 132, 26);

    // 1. Executive Summary Section
    doc.setTextColor(30, 58, 138);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.text("1. EXECUTIVE SUMMARY", 20, 55);
    
    // Line under title
    doc.setDrawColor(30, 58, 138);
    doc.setLineWidth(0.5);
    doc.line(20, 57, 190, 57);

    doc.setTextColor(31, 41, 55);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    const summaryText = `This safety audit report evaluates road accident hotspots and black spots identified within the Tiruchirappalli administrative district. Integrating citizen-reported hazards with historical accident data, traffic volume loads, and environmental indicators, the system maps critical collision clusters. Over the audited cycle, a total of ${totalSpots} active hotspots were logged, with ${highRiskCount} categorized under High-Risk index status (Risk Score ≥ 80.0). Administrative planning requires immediate engineering interventions and traffic management mitigations at these nodes.`;
    const summaryLines = doc.splitTextToSize(summaryText, 170);
    doc.text(summaryLines, 20, 63);

    // KPI Summary boxes
    doc.setFillColor(243, 244, 246);
    doc.rect(20, 95, 50, 20, 'F');
    doc.rect(80, 95, 50, 20, 'F');
    doc.rect(140, 95, 50, 20, 'F');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text("TOTAL HOTSPOTS", 25, 101);
    doc.text("HIGH RISK BLOCKS", 85, 101);
    doc.text("MED RISK BLOCKS", 145, 101);

    doc.setFontSize(14);
    doc.setTextColor(30, 58, 138);
    doc.text(`${totalSpots}`, 25, 110);
    doc.setTextColor(185, 28, 28); // Red
    doc.text(`${highRiskCount}`, 85, 110);
    doc.setTextColor(217, 119, 6); // Amber
    doc.text(`${mediumRiskCount}`, 145, 110);

    // 2. Risk Distribution Section
    doc.setTextColor(30, 58, 138);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.text("2. RISK CATEGORY DISTRIBUTION", 20, 130);
    doc.line(20, 132, 190, 132);

    // Drawing a simple simulated chart layout with text representing data
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(31, 41, 55);
    
    // Draw Bar Chart representing Risk Categories
    const chartY = 145;
    const maxBarWidth = 100;
    const totalRiskCount = totalSpots || 1;
    
    // High Risk bar
    doc.text("High Risk (Score >= 80)", 20, chartY);
    doc.setFillColor(220, 38, 38);
    const highWidth = (highRiskCount / totalRiskCount) * maxBarWidth;
    doc.rect(70, chartY - 4, Math.max(2, highWidth), 5, 'F');
    doc.text(`${highRiskCount} spots (${((highRiskCount/totalRiskCount)*100).toFixed(0)}%)`, 175, chartY);

    // Medium Risk bar
    doc.text("Med Risk (60 - 79)", 20, chartY + 10);
    doc.setFillColor(245, 158, 11);
    const medWidth = (mediumRiskCount / totalRiskCount) * maxBarWidth;
    doc.rect(70, chartY + 6, Math.max(2, medWidth), 5, 'F');
    doc.text(`${mediumRiskCount} spots (${((mediumRiskCount/totalRiskCount)*100).toFixed(0)}%)`, 175, chartY + 10);

    // Low Risk bar
    doc.text("Low Risk (Score < 60)", 20, chartY + 20);
    doc.setFillColor(16, 185, 129);

    const lowWidth = (lowRiskCount / totalRiskCount) * maxBarWidth;
    doc.rect(70, chartY + 16, Math.max(2, lowWidth), 5, 'F');
    doc.text(`${lowRiskCount} spots (${((lowRiskCount/totalRiskCount)*100).toFixed(0)}%)`, 175, chartY + 20);

    // 3. Cause Distribution Section
    doc.setTextColor(30, 58, 138);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.text("3. PRIMARY ACCIDENT CAUSE ANALYSIS", 20, 190);
    doc.line(20, 192, 190, 192);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(31, 41, 55);
    
    let causeY = 202;
    Object.entries(causeCounts).slice(0, 5).forEach(([cause, count]) => {
      doc.text(cause, 20, causeY);
      doc.setFillColor(79, 70, 229);
      const causeWidth = (count / totalRiskCount) * maxBarWidth;
      doc.rect(70, causeY - 4, Math.max(2, causeWidth), 5, 'F');
      doc.text(`${count} spots`, 175, causeY);
      causeY += 10;
    });

    // Page number
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text("Page 1 of 2  |  RoadWatch AI Safety Audit", 20, 282);

    // ==========================================
    // PAGE 2: TOP-10 HOTSPOTS & ENGINEERING SOLUTIONS
    // ==========================================
    doc.addPage();
    
    // Outer Border Page 2
    doc.setDrawColor(229, 231, 235);
    doc.rect(10, 10, 190, 277);

    // Header Band Page 2
    doc.setFillColor(30, 58, 138);
    doc.rect(10, 10, 190, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.text("ROADWATCH SAFETY INTELLIGENCE REPORT  |  HOTSPOTS & AUDITS", 20, 19);

    // Title Section
    doc.setTextColor(30, 58, 138);
    doc.setFontSize(12);
    doc.text("4. TOP-10 COLLISION HOTSPOTS (PRIORITIZED)", 20, 38);
    doc.line(20, 40, 190, 40);

    // Top 10 Hotspots Table
    doc.setFontSize(8);
    doc.setFont('Helvetica', 'bold');
    doc.setFillColor(243, 244, 246);
    doc.rect(20, 45, 170, 7, 'F');
    doc.setTextColor(31, 41, 55);
    
    // Table Headers
    doc.text("RISK", 22, 50);
    doc.text("LOCATION NAME", 38, 50);
    doc.text("ACCIDENTS", 95, 50);
    doc.text("PREDICTED CAUSE", 118, 50);
    doc.text("CONFIDENCE", 172, 50);

    doc.setFont('Helvetica', 'normal');
    let rowY = 57;
    topHotspots.forEach((h, idx) => {
      // Row highlighting
      if (idx % 2 === 1) {
        doc.setFillColor(249, 250, 251);
        doc.rect(20, rowY - 4, 170, 6.5, 'F');
      }

      // Draw Row Data
      doc.setTextColor(185, 28, 28);
      doc.setFont('Helvetica', 'bold');
      doc.text(`${h.predictedRiskScore.toFixed(1)}`, 22, rowY);
      
      doc.setTextColor(31, 41, 55);
      doc.setFont('Helvetica', 'normal');
      doc.text(h.locationName.substring(0, 30), 38, rowY);
      doc.text(`${h.historicalAccidents}`, 102, rowY, { align: 'right' });
      doc.text(h.predictedCause, 118, rowY);
      doc.text(`${(h.confidenceScore * 100).toFixed(0)}%`, 175, rowY);

      rowY += 6.5;
    });

    // 5. Engineering Countermeasures Section
    doc.setTextColor(30, 58, 138);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.text("5. RECOMMENDED INFRASTRUCTURE ENGINEERING MEASURES", 20, 132);
    doc.line(20, 134, 190, 134);

    doc.setFontSize(9);
    doc.setTextColor(31, 41, 55);
    
    let measureY = 142;
    const uniqFixes = Array.from(new Set(topHotspots.map(h => JSON.stringify({fix: h.suggestedFix, irc: h.ircReference}))))
      .map(str => JSON.parse(str))
      .slice(0, 3);

    uniqFixes.forEach((item, idx) => {
      doc.setFont('Helvetica', 'bold');
      doc.text(`Measure #${idx + 1}: ${item.irc}`, 20, measureY);
      doc.setFont('Helvetica', 'normal');
      const lines = doc.splitTextToSize(item.fix, 170);
      doc.text(lines, 20, measureY + 4.5);
      measureY += 15;
    });

    // 6. Implementation Strategy Section
    doc.setTextColor(30, 58, 138);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.text("6. IMPLEMENTATION STRATEGY & BUDGET SCHEDULING", 20, 192);
    doc.line(20, 194, 190, 194);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(31, 41, 55);
    const strategyText = "Highways administrators are directed to proceed with physical verification and civil tenders following the IRC codes detailed above. Priority 3 (High Risk) spots must initiate structural modifications within 30 days. Weekly status updates must be logged into the Construction Tracker panel.";
    const strategyLines = doc.splitTextToSize(strategyText, 170);
    doc.text(strategyLines, 20, 200);

    // Sign off boxes
    doc.setDrawColor(209, 213, 219);
    doc.line(20, 245, 75, 245);
    doc.line(135, 245, 190, 245);
    
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text("Divisional Engineer (Road Safety)\nHighways & Infrastructure Dept", 20, 249);
    doc.text("District Traffic Inspector / Admin\nTiruchirappalli District Command", 135, 249);

    // Page number Page 2
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text("Page 2 of 2  |  RoadWatch AI Safety Audit", 20, 282);

    // Save/Download PDF document
    doc.save(`RoadWatch_Safety_Audit_Trichy_${Date.now()}.pdf`);
  }
};
export default reportService;
