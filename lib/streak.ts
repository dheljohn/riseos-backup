import prisma from "@/lib/prisma";
import { differenceInCalendarDays } from "date-fns";

export async function updateUserStreak(userId: string, logDay: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) return;

  const today = new Date(logDay);

  // First ever log
  if (!user.lastActiveDate) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        currentStreak: 1,
        longestStreak: 1,
        lastActiveDate: today,
      },
    });

    return;
  }

  const lastDate = new Date(user.lastActiveDate);

  const diff = differenceInCalendarDays(today, lastDate);

  // Already counted today
  if (diff === 0) {
    return;
  }

  // Consecutive day
  if (diff === 1) {
    const newStreak = user.currentStreak + 1;

    await prisma.user.update({
      where: { id: userId },
      data: {
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, user.longestStreak),
        lastActiveDate: today,
      },
    });

    return;
  }

  // Missed day(s)
  if (diff > 1) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        currentStreak: 1,
        lastActiveDate: today,
      },
    });
  }
}
