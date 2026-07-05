"use client";

import { usePushNotifications } from "@/hooks/usePushNotifications";

export function PwaSetup() {
  usePushNotifications();
  return null;
}
