// Clinical Decision Support System (CDSS) Utilities
// Color-coded vital alerts based on medical standards

export interface VitalStatus {
  level: "normal" | "warning" | "critical";
  label: string;
  colorClass: string;
  bgClass: string;
}

// Temperature assessment (in Celsius)
export function getTemperatureStatus(temp: number | null): VitalStatus | null {
  if (temp === null || temp === undefined) return null;
  
  if (temp > 38.5) {
    return {
      level: "critical",
      label: "High Fever",
      colorClass: "text-red-600 dark:text-red-400",
      bgClass: "bg-red-500/10 border-red-500/30",
    };
  } else if (temp > 37.5) {
    return {
      level: "warning",
      label: "Mild Fever",
      colorClass: "text-orange-600 dark:text-orange-400",
      bgClass: "bg-orange-500/10 border-orange-500/30",
    };
  }
  return {
    level: "normal",
    label: "Normal",
    colorClass: "text-green-600 dark:text-green-400",
    bgClass: "bg-green-500/10 border-green-500/30",
  };
}

// Blood Pressure assessment
export function getBPStatus(systolic: number | null, diastolic: number | null): VitalStatus | null {
  if (systolic === null || systolic === undefined) return null;

  // Hypertensive Crisis
  if (systolic > 180 || (diastolic && diastolic > 120)) {
    return {
      level: "critical",
      label: "Hypertensive Crisis",
      colorClass: "text-red-600 dark:text-red-400",
      bgClass: "bg-red-500/10 border-red-500/30",
    };
  }
  // Hypertensive Urgency
  if (systolic > 160 || (diastolic && diastolic > 100)) {
    return {
      level: "critical",
      label: "Hypertensive Urgency",
      colorClass: "text-red-600 dark:text-red-400",
      bgClass: "bg-red-500/10 border-red-500/30",
    };
  }
  // Stage 1 Hypertension
  if (systolic > 140 || (diastolic && diastolic > 90)) {
    return {
      level: "warning",
      label: "High BP",
      colorClass: "text-orange-600 dark:text-orange-400",
      bgClass: "bg-orange-500/10 border-orange-500/30",
    };
  }
  // Low BP
  if (systolic < 90 || (diastolic && diastolic < 60)) {
    return {
      level: "critical",
      label: "Low BP",
      colorClass: "text-red-600 dark:text-red-400",
      bgClass: "bg-red-500/10 border-red-500/30",
    };
  }
  return {
    level: "normal",
    label: "Normal",
    colorClass: "text-green-600 dark:text-green-400",
    bgClass: "bg-green-500/10 border-green-500/30",
  };
}

// Heart Rate assessment
export function getHeartRateStatus(hr: number | null): VitalStatus | null {
  if (hr === null || hr === undefined) return null;

  if (hr > 120) {
    return {
      level: "critical",
      label: "Tachycardia",
      colorClass: "text-red-600 dark:text-red-400",
      bgClass: "bg-red-500/10 border-red-500/30",
    };
  }
  if (hr > 100) {
    return {
      level: "warning",
      label: "Elevated HR",
      colorClass: "text-orange-600 dark:text-orange-400",
      bgClass: "bg-orange-500/10 border-orange-500/30",
    };
  }
  if (hr < 60) {
    return {
      level: "warning",
      label: "Bradycardia",
      colorClass: "text-orange-600 dark:text-orange-400",
      bgClass: "bg-orange-500/10 border-orange-500/30",
    };
  }
  return {
    level: "normal",
    label: "Normal",
    colorClass: "text-green-600 dark:text-green-400",
    bgClass: "bg-green-500/10 border-green-500/30",
  };
}

// BMI Calculation and Classification (WHO standards)
export interface BMIResult {
  value: number;
  category: string;
  level: "normal" | "warning" | "critical";
  colorClass: string;
}

export function calculateBMI(weightKg: number | null, heightCm: number | null): BMIResult | null {
  if (!weightKg || !heightCm || heightCm === 0) return null;
  
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  
  let category: string;
  let level: "normal" | "warning" | "critical";
  let colorClass: string;
  
  if (bmi < 16) {
    category = "Severe Underweight";
    level = "critical";
    colorClass = "text-red-600 dark:text-red-400";
  } else if (bmi < 18.5) {
    category = "Underweight";
    level = "warning";
    colorClass = "text-orange-600 dark:text-orange-400";
  } else if (bmi < 25) {
    category = "Normal";
    level = "normal";
    colorClass = "text-green-600 dark:text-green-400";
  } else if (bmi < 30) {
    category = "Overweight";
    level = "warning";
    colorClass = "text-orange-600 dark:text-orange-400";
  } else if (bmi < 35) {
    category = "Obese Class I";
    level = "warning";
    colorClass = "text-orange-600 dark:text-orange-400";
  } else if (bmi < 40) {
    category = "Obese Class II";
    level = "critical";
    colorClass = "text-red-600 dark:text-red-400";
  } else {
    category = "Obese Class III";
    level = "critical";
    colorClass = "text-red-600 dark:text-red-400";
  }
  
  return {
    value: parseFloat(bmi.toFixed(1)),
    category,
    level,
    colorClass,
  };
}

// Aggregate alert count
export function getVitalAlertCount(
  temp: number | null,
  systolic: number | null,
  diastolic: number | null,
  heartRate: number | null
): number {
  let count = 0;
  
  const tempStatus = getTemperatureStatus(temp);
  if (tempStatus && tempStatus.level !== "normal") count++;
  
  const bpStatus = getBPStatus(systolic, diastolic);
  if (bpStatus && bpStatus.level !== "normal") count++;
  
  const hrStatus = getHeartRateStatus(heartRate);
  if (hrStatus && hrStatus.level !== "normal") count++;
  
  return count;
}
