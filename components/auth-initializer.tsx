"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuthStore } from "@/lib/store";

export default function AuthInitializer({
  children,
}: {
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    axios
      .post("/api/auth/refresh", {}, { withCredentials: true })
      .then((res) => {
        // Also fetch user info
        return axios
          .get("/api/auth/me", {
            headers: { Authorization: `Bearer ${res.data.accessToken}` },
            withCredentials: true,
          })
          .then((userRes) => {
            setAuth(res.data.accessToken, userRes.data.user);
          });
      })
      .catch(() => {
        // No valid session, stay logged out
      })
      .finally(() => {
        setReady(true);
      });
  }, []);

  if (!ready) return null;

  return <>{children}</>;
}
