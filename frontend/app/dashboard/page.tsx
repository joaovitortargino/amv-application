"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DollarSign, TrendingUp, TrendingDown, Clock } from "lucide-react";
import { Card, CardBody, Spinner } from "@heroui/react";
import { DashboardSnapshot, DashboardTotals } from "@/types";
import { apiService } from "@/services/api";
import { AppLayout } from "@/components/AppLayout";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 1) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.6, ease: "easeOut" },
  }),
};

export default function DashboardPage() {
  const [totals, setTotals] = useState<DashboardTotals | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const currentData =
        await apiService.get<DashboardSnapshot>("dashboard/current");

      setTotals({
        totalIncome: currentData.totalIncome,
        totalExpense: currentData.totalExpense,
        totalRevenue: currentData.totalIncome - currentData.totalExpense,
        openedOsCount: currentData.openedOsCount,
        delayedOsCount: currentData.delayedOsCount,
        pendingTitles: currentData.pendingTitles,
      });
    } catch (error) {
      console.error("Erro ao carregar dashboard", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-lg text-gray-500"
          >
            <Spinner variant="wave" color="warning" />
          </motion.div>
        </div>
      </AppLayout>
    );
  }

  const cards = [
    {
      title: "Receitas",
      value: totals?.totalIncome || 0,
      icon: TrendingUp,
      color: "from-green-400 to-green-600",
      isCount: false,
    },
    {
      title: "Despesas",
      value: totals?.totalExpense || 0,
      icon: TrendingDown,
      color: "from-red-400 to-red-600",
      isCount: false,
    },
    {
      title: "Receita total",
      value: totals?.totalRevenue || 0,
      icon: DollarSign,
      color: "from-yellow-400 to-yellow-500",
      isCount: false,
    },
    {
      title: "T. Pendentes",
      value: totals?.pendingTitles || 0,
      icon: Clock,
      color: "from-orange-400 to-orange-600",
      isCount: true,
    },
    {
      title: "OS Atrasadas",
      value: totals?.delayedOsCount || 0,
      icon: Clock,
      color: "from-red-400 to-red-600",
      isCount: true,
    },
  ];

  return (
    <AppLayout>
      <motion.div
        initial="hidden"
        animate="visible"
        className="space-y-8 l mx-auto pb-10"
      >
        <motion.div variants={fadeUp} className="flex flex-col gap-1">
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Dashboard
          </h2>
          <p className="text-gray-400 text-sm">
            Visão geral do desempenho da sua oficina
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          {cards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.title}
                variants={fadeUp}
                custom={i}
                whileHover={{ y: -4 }}
                className="transition-transform"
              >
                <Card className="rounded-2xl shadow-sm border border-gray-100 bg-white">
                  <CardBody className="p-5 flex flex-row items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium text-gray-500">
                        {card.title}
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {card.isCount ? card.value : formatCurrency(card.value)}
                      </p>
                    </div>

                    <div
                      className={`shrink-0 w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br ${card.color} text-white shadow-sm`}
                    >
                      <Icon size={22} />
                    </div>
                  </CardBody>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <div className="w-full">
          <motion.div variants={fadeUp} custom={6}>
            <Card className="rounded-2xl bg-white border border-gray-100 shadow-sm">
              <CardBody className="p-8 space-y-6">
                <h3 className="text-lg font-bold text-gray-900">
                  Resumo Financeiro
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="relative overflow-hidden flex flex-col p-6 rounded-2xl bg-green-100 border border-gray-100">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-green-400"></div>
                    <span className="text-sm font-medium text-gray-500 mb-2">
                      Receitas
                    </span>
                    <strong className="text-2xl font-bold text-gray-900">
                      {formatCurrency(totals?.totalIncome || 0)}
                    </strong>
                  </div>

                  <div className="relative overflow-hidden flex flex-col p-6 rounded-2xl bg-red-100 border border-gray-100">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-400"></div>
                    <span className="text-sm font-medium text-gray-500 mb-2">
                      Despesas
                    </span>
                    <strong className="text-2xl font-bold text-gray-900">
                      {formatCurrency(totals?.totalExpense || 0)}
                    </strong>
                  </div>

                  <div className="relative overflow-hidden flex flex-col p-6 rounded-2xl bg-yellow-100 border border-yellow-200">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-yellow-400"></div>
                    <span className="text-sm font-bold text-yellow-900 mb-2">
                      Saldo Final
                    </span>
                    <strong className="text-3xl font-black text-yellow-700">
                      {formatCurrency(totals?.totalRevenue || 0)}
                    </strong>
                  </div>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </AppLayout>
  );
}
