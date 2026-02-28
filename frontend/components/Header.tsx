"use client";
import { useDashboardAlerts } from "@/app/hooks/useDashboardAlerts";
import { useAuth } from "@/context/AuthContext";
import { AlertTriangle, Bell, User } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export function Header() {
  const { user } = useAuth();
  const { hasAlerts, alerts, pendingTitles } = useDashboardAlerts();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full bg-black/80 backdrop-blur border-b border-white/10">
      <div className="flex w-full items-center justify-between px-4 sm:px-6 py-3">
        <div className="flex flex-col">
          <p className="text-lg sm:text-2xl text-white leading-tight ">
            Olá, <span className="font-semibold">{user?.name}</span>
          </p>
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOpen(!open)}
              className={`relative rounded-full p-2 transition 
            ${hasAlerts ? "text-red-500 animate-pulse" : "text-gray-300"}
            hover:bg-white/10`}
            >
              <Bell size={20} />
              {hasAlerts && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
            {open && (
              <div
                ref={dropdownRef}
                className="absolute right-4 top-16 w-80 bg-white text-black rounded-xl shadow-lg border"
              >
                <div className="p-4 border-b font-semibold">Notificações</div>

                {alerts.length === 0 && (
                  <div className="p-4 text-sm text-gray-500">
                    Nenhuma notificação.
                  </div>
                )}

                {alerts.map((n, i) => (
                  <a
                    key={i}
                    href={n.link}
                    className="flex items-center gap-3 p-4 hover:bg-gray-200 hover:rounded-xl transition-all duration-300 ease-in-out"
                  >
                    <AlertTriangle className="text-orange-500" size={18} />
                    <span className="text-sm">{n.message}</span>
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pl-3 border-l border-white/10">
            <div className="hidden sm:block text-right leading-tight">
              <p className="text-sm font-semibold text-white">{user?.name}</p>
              <p className="text-xs text-gray-400 truncate max-w-[180px]">
                {user?.email}
              </p>
            </div>

            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
              <Link href="/user">
                <User size={18} className="text-white" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
