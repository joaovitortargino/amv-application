"use client";

import { useAuth } from "@/context/AuthContext";
import {
  DollarSign,
  Home,
  LogOut,
  Settings,
  Users,
  Wrench,
  ChevronLeft,
  ChevronRight,
  Box,
  ClipboardList,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Tooltip } from "@heroui/react";

export function Sidebar() {
  const { logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(true);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const menuItems = [
    { id: "dashboard", href: "/dashboard", label: "Dashboard", icon: Home },
    {
      id: "financial",
      href: "/financial",
      label: "Financeiro",
      icon: DollarSign,
    },
    { id: "clients", href: "/clients", label: "Clientes", icon: Users },
    { id: "itens", href: "/itens", label: "Cadastros", icon: Box },
    { id: "mechanics", href: "/mechanics", label: "Mecânicos", icon: Wrench },
    {
      id: "service-orders",
      href: "/service-orders",
      label: "Ordens de Serviço",
      icon: ClipboardList,
    },
    {
      id: "settings",
      href: "/settings",
      label: "Configurações",
      icon: Settings,
    },
  ];

  if (!mounted) return null;

  return (
    <motion.aside
      initial={false}
      animate={{ width: open ? 240 : 80 }}
      className="relative h-screen bg-zinc-950 text-zinc-300 flex flex-col shadow-2xl border-r border-white/5 z-50"
    >
      <button
        onClick={() => setOpen(!open)}
        className="absolute -right-3.5 top-8 bg-zinc-800 border border-white/10 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-full p-1.5 transition-colors z-50 shadow-md"
      >
        {open ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      <div className="flex items-center h-20 px-6 border-b border-white/5">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-lg bg-yellow-500 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(234,179,8,0.3)]">
            <Wrench size={18} className="text-zinc-950" />
          </div>
          <AnimatePresence>
            {open && (
              <motion.h1
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="ml-3 text-xl font-bold tracking-wide text-white whitespace-nowrap overflow-hidden"
              >
                AMV
              </motion.h1>
            )}
          </AnimatePresence>
        </div>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <div key={item.id} className="relative group">
              <Tooltip
                content={item.label}
                placement="right"
                isDisabled={open}
                showArrow={true}
                classNames={{
                  base: "before:bg-zinc-800",
                  content:
                    "bg-zinc-800 text-zinc-100 text-xs font-medium border border-white/5 shadow-xl px-2.5 py-1.5",
                }}
              >
                <Link
                  href={item.href}
                  className={`flex items-center px-3 py-2.5 rounded-lg transition-all duration-200
                  ${
                    isActive
                      ? "bg-yellow-500/10 text-yellow-400 font-medium"
                      : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
                  }`}
                >
                  <Icon size={20} className="shrink-0" />

                  <AnimatePresence>
                    {open && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        className="ml-3 text-sm whitespace-nowrap overflow-hidden"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {isActive && (
                    <motion.div
                      layoutId="active-nav-indicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-2/3 w-1 bg-yellow-500 rounded-r-full"
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                    />
                  )}
                </Link>
              </Tooltip>
            </div>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5">
        <Tooltip
          content="Sair"
          placement="right"
          isDisabled={open}
          showArrow={true}
          classNames={{
            base: "before:bg-zinc-800",
            content:
              "bg-zinc-800 text-red-400 text-xs font-medium border border-white/5 shadow-xl px-2.5 py-1.5",
          }}
        >
          <button
            onClick={logout}
            className="w-full flex items-center px-3 py-2.5 rounded-lg text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-colors group"
          >
            <LogOut
              size={20}
              className="shrink-0 group-hover:rotate-12 transition-transform"
            />
            <AnimatePresence>
              {open && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="ml-3 text-sm font-medium whitespace-nowrap overflow-hidden"
                >
                  Sair do sistema
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </Tooltip>
      </div>
    </motion.aside>
  );
}
