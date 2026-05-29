export interface RiskInput {
  historicalAccidents: number;
  roadClass: string;
  junctionType: string;
  pcuPerHour: number;
  envLighting: string;
  roadSurface: string;
}

export interface RiskOutput {
  predictedRiskScore: number;
  predictedCause: string;
  suggestedFix: string;
  ircReference: string;
  confidenceScore: number;
  expertRelevanceRating: number;
}

export function evaluateRisk(input: RiskInput): RiskOutput {
  const {
    historicalAccidents,
    roadClass,
    junctionType,
    pcuPerHour,
    envLighting,
    roadSurface
  } = input;

  // 1. Calculate individual weights for Risk Score (Scale: 0-100)
  let accidentWeight = historicalAccidents * 1.6; // High accident frequency has largest impact
  
  let lightingWeight = 0;
  if (envLighting === "No Lighting") lightingWeight = 25;
  else if (envLighting === "Poor") lightingWeight = 15;
  
  let surfaceWeight = 0;
  if (roadSurface === "Potholes") surfaceWeight = 20;
  else if (roadSurface === "Wet/Slippery") surfaceWeight = 15;
  else if (roadSurface === "Gravel") surfaceWeight = 10;
  
  let junctionWeight = 0;
  if (junctionType === "4-Way Junction") junctionWeight = 18;
  else if (junctionType === "T-Junction") junctionWeight = 12;
  else if (junctionType === "Y-Junction") junctionWeight = 10;
  else if (junctionType === "Roundabout") junctionWeight = 5;

  let trafficWeight = Math.min(20, (pcuPerHour / 1000) * 4); // Traffic congestion multiplier

  let rawRisk = accidentWeight + lightingWeight + surfaceWeight + junctionWeight + trafficWeight;
  const predictedRiskScore = Math.min(100, Math.max(10, parseFloat(rawRisk.toFixed(1))));

  // 2. Identify the Primary Cause, Suggested Fix and IRC Reference
  let predictedCause = "General Infrastructure Gap";
  let suggestedFix = "Improve warning signage and repaint lane boundaries";
  let ircReference = "IRC:67-2012 (Code of Practice for Road Signs)";
  let expertRelevanceRating = 4.0;

  // Order of priority for cause classification
  if (historicalAccidents >= 25 && junctionType !== "Straight" && junctionType !== "Straight Road") {
    predictedCause = "Junction Conflict";
    suggestedFix = "Install high-mast flashing solar lights, expand lane approaches, and introduce traffic separation islands";
    ircReference = "IRC:SP:108-2015 (Junction Redesign)";
    expertRelevanceRating = 4.8;
  } else if (envLighting === "No Lighting" || (envLighting === "Poor" && historicalAccidents > 15)) {
    predictedCause = "Poor Visibility";
    suggestedFix = "Install modern LED solar streetlights, retroreflective delineators (cat-eyes), and high-visibility direction arrows";
    ircReference = "IRC:35-2015 (Road Markings)";
    expertRelevanceRating = 4.6;
  } else if (pcuPerHour > 3000 || (roadClass.includes("National") && historicalAccidents > 20)) {
    predictedCause = "High Traffic Speed";
    suggestedFix = "Implement raised speed-table crossings, paint warning rumble strips, and mount speed detection radar displays";
    ircReference = "IRC:99-2018 (Traffic Calming)";
    expertRelevanceRating = 4.7;
  } else if (roadSurface === "Potholes" || roadSurface === "Wet/Slippery") {
    predictedCause = "Road Surface Deterioration";
    suggestedFix = "Reconstruct worn-out road base course, fill potholes using cold-mix asphalt, and grade side drains to prevent pooling";
    ircReference = "IRC:SP:48-1998 (Road Surface & Drainage)";
    expertRelevanceRating = 4.4;
  } else if (junctionType === "Roundabout" && pcuPerHour > 2500) {
    predictedCause = "Junction Conflict";
    suggestedFix = "Re-align roundabout entries, expand perimeter lane widths, and paint clear merge markings";
    ircReference = "IRC:65-2017 (Design of Roundabouts)";
    expertRelevanceRating = 4.3;
  } else if (pcuPerHour > 2000 && roadSurface === "Potholes") {
    predictedCause = "Traffic Congestion & Surface Failure";
    suggestedFix = "Widen the road carriage lanes, clear encroachments, and re-pave surface with high-durability bituminous concrete";
    ircReference = "IRC:103-2012 (Pedestrian & Carriage Facilities)";
    expertRelevanceRating = 4.2;
  }

  // 3. Define Confidence Score based on data consistency
  // High accidents + high traffic = high confidence in predictive hazard score
  let baseConfidence = 0.75;
  if (historicalAccidents > 30) baseConfidence += 0.10;
  if (pcuPerHour > 2500) baseConfidence += 0.07;
  if (envLighting === "No Lighting" && roadSurface === "Potholes") baseConfidence += 0.05;
  
  const confidenceScore = parseFloat(Math.min(0.99, baseConfidence).toFixed(2));

  return {
    predictedRiskScore,
    predictedCause,
    suggestedFix,
    ircReference,
    confidenceScore,
    expertRelevanceRating
  };
}
