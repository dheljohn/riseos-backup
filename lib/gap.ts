export interface GapResult {
  intendedMinutes: number;
  actualMinutes: number;
  diffMinutes: number; // negative = early, positive = late
  diffLabel: string; // "25 min late", "10 min early", "on time"
}

export function calcGap(intended: Date, actual: Date): GapResult {
  const intendedMinutes = intended.getTime() / 60000;
  const actualMinutes = actual.getTime() / 60000;
  const diffMinutes = Math.round(actualMinutes - intendedMinutes);

  let diffLabel: string;
  if (Math.abs(diffMinutes) < 5) {
    diffLabel = "on time";
  } else if (diffMinutes > 0) {
    diffLabel = `${diffMinutes} min late`;
  } else {
    diffLabel = `${Math.abs(diffMinutes)} min early`;
  }

  return { intendedMinutes, actualMinutes, diffMinutes, diffLabel };
}

export function calcSleepGaps(log: {
  intendedBed: Date;
  actualBed: Date;
  intendedWake: Date;
  actualWake: Date;
}) {
  return {
    bedGap: calcGap(log.intendedBed, log.actualBed),
    wakeGap: calcGap(log.intendedWake, log.actualWake),
    intendedDurationMins: Math.round(
      (log.intendedWake.getTime() - log.intendedBed.getTime()) / 60000,
    ),
    actualDurationMins: Math.round(
      (log.actualWake.getTime() - log.actualBed.getTime()) / 60000,
    ),
  };
}

export function calcMealGap(log: { intendedTime: Date; actualTime: Date }) {
  return {
    timeGap: calcGap(log.intendedTime, log.actualTime),
  };
}

export function calcFocusGaps(log: {
  intendedStart: Date;
  actualStart: Date;
  intendedEnd: Date;
  actualEnd: Date;
}) {
  return {
    startGap: calcGap(log.intendedStart, log.actualStart),
    endGap: calcGap(log.intendedEnd, log.actualEnd),
    intendedDurationMins: Math.round(
      (log.intendedEnd.getTime() - log.intendedStart.getTime()) / 60000,
    ),
    actualDurationMins: Math.round(
      (log.actualEnd.getTime() - log.actualStart.getTime()) / 60000,
    ),
  };
}
