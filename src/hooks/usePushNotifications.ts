"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return new Uint8Array([...rawData].map((c) => c.charCodeAt(0)));
}

export function usePushNotifications() {
  const { adminUser } = useAuth();
  const registered = useRef(false);

  useEffect(() => {
    if (!adminUser || registered.current) return;
    registered.current = true;

    const init = async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

      if (Notification.permission === "denied") return;

      if (Notification.permission === "default") {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;
      }

      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        await navigator.serviceWorker.ready;

        const existingSubscription = await registration.pushManager.getSubscription();
        if (existingSubscription) {
          await existingSubscription.unsubscribe();
        }

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });

        const { data: adminRecord } = await supabase
          .from("admins")
          .select("id")
          .eq("user_id", adminUser.user_id)
          .maybeSingle();

        if (adminRecord) {
          await supabase.from("admin_device_tokens").upsert(
            {
              admin_id: adminRecord.id,
              subscription: subscription.toJSON(),
              user_agent: navigator.userAgent,
            },
            { onConflict: "admin_id" },
          );
        }
      } catch {
        // silent
      }
    };

    init();
  }, [adminUser]);
}
