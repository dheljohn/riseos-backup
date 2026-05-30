import prisma from "@/lib/prisma";
import { differenceInCalendarDays, startOfDay } from "date-fns";

export async function updateUserStreak(userId: string, logDay: Date | string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) return;

  // Normalize incoming logDay (NOW DATE TIME SAFE)
  const today = startOfDay(new Date(logDay));

  // First log ever
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

  const lastDate = startOfDay(new Date(user.lastActiveDate));

  const diff = differenceInCalendarDays(today, lastDate);

  // Same day → do nothing
  if (diff === 0) return;

  // Consecutive day → increment streak
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

  // Missed days → reset streak
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
