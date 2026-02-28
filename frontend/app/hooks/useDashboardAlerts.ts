import { useEffect, useState } from "react";
import { apiService } from "@/services/api";

export function useDashboardAlerts() {
  const [pendingTitles, setPendingTitles] = useState(0);

  useEffect(() => {
    apiService.get<any>("dashboard/history").then((res) => {
      const last = res[res.length - 1];
      setPendingTitles(last?.pendingTitles || 0);
    });
  }, []);

  return {
    pendingTitles,
    hasAlerts: pendingTitles > 0,
    alerts: pendingTitles > 0
      ? [{
          type: "warning",
          message: `Você possui ${pendingTitles} títulos vencidos.`,
          link: "/financial"
        }]
      : []
  };
}
