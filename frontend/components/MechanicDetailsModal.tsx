"use client";

import { useEffect, useState } from "react";
import { apiService } from "@/services/api";
import {
  Button,
  Chip,
  Spinner,
  Tab,
  Tabs,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Checkbox,
  addToast,
} from "@heroui/react";
import {
  User,
  Phone,
  Mail,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle,
  DollarSign,
  CreditCard,
} from "lucide-react";
import { Comissions, MechanicDTO } from "@/types";

interface MechanicDetailsModalProps {
  mechanic: MechanicDTO | null;
}

function formatCPF(value: string): string {
  const n = value.replace(/\D/g, "");
  return n.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

const statusConfig: Record<
  CommissionStatus,
  { label: string; color: "warning" | "success" | "danger" }
> = {
  PENDING: { label: "Pendente", color: "warning" },
  PAID: { label: "Pago", color: "success" },
  CANCELLED: { label: "Cancelado", color: "danger" },
};

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-gray-300 last:border-0">
      <div className="p-2 bg-yellow-400 rounded-full">
        <Icon size={16} className="text-yellow-600" />
      </div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-800">{value || "—"}</p>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className={`rounded-xl p-4 flex items-center gap-3 ${color}`}>
      <div className="p-2 bg-white/40 rounded-lg">
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <p className="text-xs text-white/80">{title}</p>
        <p className="text-base font-bold text-white">{value}</p>
      </div>
    </div>
  );
}

export default function MechanicDetailsModal({
  mechanic,
}: MechanicDetailsModalProps) {
  const [commissions, setCommissions] = useState<Comissions[]>([]);
  const [loadingCommissions, setLoadingCommissions] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [paying, setPaying] = useState(false);

  function loadCommissions() {
    if (!mechanic?.id) return;
    setLoadingCommissions(true);
    apiService
      .get<Comissions[]>(`commissions/mechanic/${mechanic.id}`)
      .then((data) => {
        setCommissions(data);
        setSelectedIds(new Set());
      })
      .catch(() =>
        addToast({ title: "Erro ao carregar comissões", color: "danger" }),
      )
      .finally(() => setLoadingCommissions(false));
  }

  useEffect(() => {
    loadCommissions();
  }, [mechanic?.id]);

  if (!mechanic) return null;

  const pendingList = commissions.filter((c) => c.status === "PENDING");

  const totalAll = commissions.reduce(
    (acc, c) => acc + Number(c.valueCommission),
    0,
  );
  const totalPending = pendingList.reduce(
    (acc, c) => acc + Number(c.valueCommission),
    0,
  );
  const totalPaid = commissions
    .filter((c) => c.status === "PAID")
    .reduce((acc, c) => acc + Number(c.valueCommission), 0);

  const selectedTotal = commissions
    .filter((c) => selectedIds.has(c.id))
    .reduce((acc, c) => acc + Number(c.valueCommission), 0);

  const allPendingSelected =
    pendingList.length > 0 && pendingList.every((c) => selectedIds.has(c.id));

  const someSelected = selectedIds.size > 0 && !allPendingSelected;

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    const pendingIds = pendingList.map((c) => c.id);
    setSelectedIds(allPendingSelected ? new Set() : new Set(pendingIds));
  }

  async function handlePay() {
    if (selectedIds.size === 0) return;
    setPaying(true);
    try {
      await apiService.post("commissions/pay", {
        commissionIds: Array.from(selectedIds),
      });
      addToast({
        title: `${selectedIds.size} comissão(ões) paga(s) com sucesso!`,
        description: `Despesa gerada: Pagamento comissão - ${mechanic.name}`,
        color: "success",
      });
      loadCommissions();
    } catch (error: any) {
      addToast({
        title: error?.message || "Erro ao realizar pagamento",
        color: "danger",
      });
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-500 to-zinc-700 rounded-xl">
        <div className="w-14 h-14 rounded-full bg-white/30 flex items-center justify-center">
          <User size={28} className="text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white">{mechanic.name}</h3>
          <p className="text-yellow-100 text-sm">
            {formatCPF(mechanic.document)}
          </p>
        </div>
        <Chip color={mechanic.active ? "success" : "danger"} variant="flat">
          {mechanic.active ? "Ativo" : "Inativo"}
        </Chip>
      </div>

      <Tabs
        aria-label="Detalhes do mecânico"
        color="warning"
        variant="underlined"
        className="w-full"
      >
        <Tab key="info" title="Dados Pessoais">
          <div className="space-y-2 pt-2">
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">
                Informações Gerais
              </h4>
              <InfoRow icon={User} label="Nome" value={mechanic.name} />
              <InfoRow
                icon={FileText}
                label="CPF"
                value={formatCPF(mechanic.document)}
              />
              <InfoRow
                icon={TrendingUp}
                label="Comissão Padrão"
                value={`${mechanic.standardCommissionPercentage.toFixed(2)}%`}
              />
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">
                Contato
              </h4>
              <InfoRow
                icon={Mail}
                label="E-mail"
                value={mechanic.contact?.email}
              />
              <InfoRow
                icon={Phone}
                label="Telefone"
                value={mechanic.contact?.telephone}
              />
              <InfoRow
                icon={Phone}
                label="Celular"
                value={mechanic.contact?.cellPhone}
              />
            </div>
          </div>
        </Tab>

        <Tab
          key="commissions"
          title={
            <span className="flex items-center gap-1">
              Comissões
              {commissions.length > 0 && (
                <Chip size="sm" color="warning" variant="flat">
                  {commissions.length}
                </Chip>
              )}
            </span>
          }
        >
          {loadingCommissions ? (
            <div className="flex justify-center py-10">
              <Spinner color="warning" variant="wave" />
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              {/* Cards resumo */}
              <div className="grid grid-cols-3 gap-2">
                <SummaryCard
                  title="Total Gerado"
                  value={formatCurrency(totalAll)}
                  icon={DollarSign}
                  color="bg-blue-500"
                />
                <SummaryCard
                  title="Pendente"
                  value={formatCurrency(totalPending)}
                  icon={Clock}
                  color="bg-yellow-500"
                />
                <SummaryCard
                  title="Pago"
                  value={formatCurrency(totalPaid)}
                  icon={CheckCircle}
                  color="bg-green-500"
                />
              </div>

              {/* Barra de pagamento */}
              {selectedIds.size > 0 && (
                <div className="flex items-center justify-between bg-yellow-50 border border-yellow-300 rounded-xl px-4 py-3 transition-all">
                  <div>
                    <p className="text-sm font-semibold text-yellow-800">
                      {selectedIds.size} comissão(ões) selecionada(s)
                    </p>
                    <p className="text-xs text-yellow-600">
                      Total a pagar:{" "}
                      <span className="font-bold">
                        {formatCurrency(selectedTotal)}
                      </span>
                    </p>
                  </div>
                  <Button
                    color="warning"
                    className="text-black font-semibold"
                    startContent={<CreditCard size={16} />}
                    isLoading={paying}
                    onPress={handlePay}
                  >
                    Pagar Selecionadas
                  </Button>
                </div>
              )}

              <Table aria-label="Comissões do mecânico" className="text-sm">
                <TableHeader>
                  <TableColumn width={40}>
                    {pendingList.length > 0 ? (
                      <Checkbox
                        isSelected={allPendingSelected}
                        isIndeterminate={someSelected}
                        onChange={toggleSelectAll}
                        color="warning"
                        aria-label="Selecionar todas pendentes"
                      />
                    ) : (
                      <span />
                    )}
                  </TableColumn>
                  <TableColumn>Serviço</TableColumn>
                  <TableColumn>Base</TableColumn>
                  <TableColumn>%</TableColumn>
                  <TableColumn>Comissão</TableColumn>
                  <TableColumn>Data</TableColumn>
                  <TableColumn>Status</TableColumn>
                </TableHeader>

                <TableBody emptyContent="Nenhuma comissão encontrada">
                  {commissions.map((c) => {
                    const isPending = c.status === "PENDING";
                    const isSelected = selectedIds.has(c.id);
                    return (
                      <TableRow
                        key={c.id}
                        className={isSelected ? "bg-yellow-800" : ""}
                      >
                        <TableCell>
                          {isPending && (
                            <Checkbox
                              isSelected={isSelected}
                              onChange={() => toggleSelect(c.id)}
                              color="warning"
                              aria-label={`Selecionar ${c.serviceName}`}
                            />
                          )}
                        </TableCell>
                        <TableCell className="font-medium max-w-[140px] truncate">
                          {c.serviceName}
                        </TableCell>
                        <TableCell className="text-white">
                          {formatCurrency(Number(c.valueBaseService))}
                        </TableCell>
                        <TableCell className="text-white">
                          {Number(c.percentageApplied).toFixed(1)}%
                        </TableCell>
                        <TableCell className="font-semibold text-green-500">
                          {formatCurrency(Number(c.valueCommission))}
                        </TableCell>
                        <TableCell className="text-white text-xs">
                          {formatDate(c.dateCalculation)}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="sm"
                            color={
                              statusConfig[c.status as CommissionStatus].color
                            }
                            variant="flat"
                          >
                            {statusConfig[c.status as CommissionStatus].label}
                          </Chip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </Tab>
      </Tabs>
    </div>
  );
}
