import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const KEY = "sienna_admin_enabled";

export function useAdminEnabled() {
  const location = useLocation();
  const navigate = useNavigate();

  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );

  const [enabled, setEnabled] = useState(() => {
    return localStorage.getItem(KEY) === "true";
  });

  useEffect(() => {
    if (searchParams.get("admin") !== "1") return;
    localStorage.setItem(KEY, "true");
    setEnabled(true);
    searchParams.delete("admin");
    const qs = searchParams.toString();
    navigate({ pathname: location.pathname, search: qs ? `?${qs}` : "" }, { replace: true });
  }, [location.pathname, navigate, searchParams]);

  return {
    enabled,
    disable: () => {
      localStorage.removeItem(KEY);
      setEnabled(false);
    },
  };
}

