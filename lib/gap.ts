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

export function calcFocusGaps(log: {
  intendedStart: Date;
  actualStart: Date;
  intendedDurationMins: number;
  actualDurationMins: number;
}) {
  return {
    startGap: calcGap(log.intendedStart, log.actualStart),
    durationGap: {
      diffMinutes: log.actualDurationMins - log.intendedDurationMins,
      diffLabel:
        Math.abs(log.actualDurationMins - log.intendedDurationMins) < 5
          ? "on time"
          : log.actualDurationMins > log.intendedDurationMins
            ? `${log.actualDurationMins - log.intendedDurationMins} min over`
            : `${log.intendedDurationMins - log.actualDurationMins} min under`,
    },
    intendedDurationMins: log.intendedDurationMins,
    actualDurationMins: log.actualDurationMins,
  };
}
