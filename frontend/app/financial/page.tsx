"use client";

import { useCallback, useEffect, useState } from "react";
import { apiService } from "@/services/api";
import {
  ClientDTO,
  FinancialFilterDTO,
  FinancialTitleDTO,
  PageResponse,
  ServiceOrderDTO,
} from "@/types";
import { AppLayout } from "@/components/AppLayout";
import { ClientSearchInput } from "@/components/ClientSearchInput";
import { ServiceOrderSearchInput } from "@/components/ServiceOrderSearchInput";

import { motion } from "framer-motion";
import {
  Button,
  Chip,
  Spinner,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Select,
  SelectItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  addToast,
} from "@heroui/react";
import {
  CheckCircle,
  RotateCcw,
  Trash2,
  Search,
  FileDown,
  TrendingUp,
  TrendingDown,
  Plus,
  MoreVertical,
  Receipt,
  Eye,
  Ban,
  Calendar,
  FileText,
} from "lucide-react";
import { FinancialTitleDetailsModal } from "@/components/FinancialTitleDetailsModal";
import { ConfirmModal } from "@/components/ConfirmModal";

export default function FinancialPage() {
  const [data, setData] = useState<FinancialTitleDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [totals, setTotals] = useState({
    income: 0,
    pending: 0,
    canceled: 0,
    delayed: 0,
  });

  const today = new Date(
    new Date().getTime() - new Date().getTimezoneOffset() * 60000,
  )
    .toISOString()
    .split("T")[0];

  const [filters, setFilters] = useState<FinancialFilterDTO>({
    text: "",
    status: undefined,
    type: undefined,
    from: today,
    to: today,
  });

  const [exportDates, setExportDates] = useState({
    from: today,
    to: today,
  });

  const {
    isOpen: isExportOpen,
    onOpen: onExportOpen,
    onClose: onExportClose,
  } = useDisclosure();

  const {
    isOpen: isSlipConfirmOpen,
    onOpen: onSlipConfirmOpen,
    onClose: onSlipConfirmClose,
  } = useDisclosure();
  const {
    isOpen: isReverseConfirmOpen,
    onOpen: onReverseConfirmOpen,
    onClose: onReverseConfirmClose,
  } = useDisclosure();
  const {
    isOpen: isCancelConfirmOpen,
    onOpen: onCancelConfirmOpen,
    onClose: onCancelConfirmClose,
  } = useDisclosure();

  const [pendingActionId, setPendingActionId] = useState<string | null>(null);

  const {
    isOpen: isPaymentOpen,
    onOpen: onPaymentOpen,
    onClose: onPaymentClose,
  } = useDisclosure();
  const [selectedTitle, setSelectedTitle] = useState<FinancialTitleDTO | null>(
    null,
  );
  const [partialValue, setPartialValue] = useState("");
  const [isPartial, setIsPartial] = useState(false);

  const {
    isOpen: isDetailsOpen,
    onOpen: onDetailsOpen,
    onClose: onDetailsClose,
  } = useDisclosure();

  const {
    isOpen: isCreateOpen,
    onOpen: onCreateOpen,
    onClose: onCreateClose,
  } = useDisclosure();

  const [newTitle, setNewTitle] = useState({
    description: "",
    type: "INCOME" as "INCOME" | "EXPENSE",
    category: "",
    originalValue: "",
    dueDate: today,
    paymentMethod: "BANK_SLIP",
    clientId: "",
    osIds: [] as string[],
  });
  const [selectedClient, setSelectedClient] = useState<ClientDTO | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<ServiceOrderDTO[]>([]);
  const [selectedTitleForDetails, setSelectedTitleForDetails] =
    useState<FinancialTitleDTO | null>(null);

  function buildQueryString(currentPage: number) {
    const params = new URLSearchParams();
    params.set("page", String(currentPage));
    params.set("size", "10");

    if (filters.text) params.set("description", filters.text);
    if (filters.status) params.set("status", filters.status);
    if (filters.type) params.set("type", filters.type);
    if (filters.from) params.set("dueDateStart", filters.from);
    if (filters.to) params.set("dueDateEnd", filters.to);

    return params.toString();
  }

  const load = useCallback(
    async (currentPage = 0) => {
      setLoading(true);
      try {
        const res = await apiService.get<PageResponse<FinancialTitleDTO>>(
          `financial-titles?${buildQueryString(currentPage)}`,
        );
        setData(res.content);
        setTotalPages(res.totalPages);
        setTotalElements(res.totalElements);
      } finally {
        setLoading(false);
      }
    },
    [filters],
  );

  async function loadTotals() {
    try {
      const [paid, open, canceled, delayed] = await Promise.all([
        apiService.get<PageResponse<FinancialTitleDTO>>(
          `financial-titles?status=PAID&size=1`,
        ),
        apiService.get<PageResponse<FinancialTitleDTO>>(
          `financial-titles?status=OPEN&size=1`,
        ),
        apiService.get<PageResponse<FinancialTitleDTO>>(
          `financial-titles?status=CANCELED&size=1`,
        ),
        apiService.get<PageResponse<FinancialTitleDTO>>(
          `financial-titles?status=DELAYED&size=1`,
        ),
      ]);
      setTotals({
        income: paid.totalElements,
        pending: open.totalElements,
        canceled: canceled.totalElements,
        delayed: delayed.totalElements,
      });
    } catch {
      // silencia
    }
  }

  useEffect(() => {
    setPage(0);
    load(0);
    loadTotals();
  }, []);

  useEffect(() => {
    load(page);
  }, [page]);

  function handleFilter() {
    setPage(0);
    load(0);
  }
  async function handleExport() {
    if (!exportDates.from || !exportDates.to) {
      addToast({ title: "Selecione o período do relatório", color: "warning" });
      return;
    }

    if (exportDates.from > exportDates.to) {
      addToast({
        title: "A data inicial não pode ser maior que a data final",
        color: "warning",
      });
      return;
    }

    setExportLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token") || "";

      const params = new URLSearchParams({
        startDate: exportDates.from,
        endDate: exportDates.to,
      });

      const response = await fetch(
        `${baseUrl}/financial-titles/report?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (!response.ok) throw new Error("Erro ao gerar relatório");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const win = window.open(url, "_blank");
      if (!win) {
        addToast({
          title: "Permita pop-ups para visualizar o relatório",
          color: "warning",
        });
      }

      setTimeout(() => URL.revokeObjectURL(url), 60000);

      onExportClose();
      addToast({ title: "Relatório gerado com sucesso!", color: "success" });
    } catch (error: any) {
      addToast({
        title: error?.message || "Erro ao gerar relatório",
        color: "danger",
      });
    } finally {
      setExportLoading(false);
    }
  }

  async function handleCreateTitle() {
    if (!newTitle.description || !newTitle.originalValue || !selectedClient) {
      addToast({
        title: "Preencha todos os campos obrigatórios",
        color: "danger",
      });
      return;
    }

    setActionLoading("create");
    try {
      const body = {
        description: newTitle.description,
        type: newTitle.type,
        category: newTitle.category,
        originalValue: parseFloat(newTitle.originalValue),
        dueDate: newTitle.dueDate,
        paymentMethod: newTitle.paymentMethod,
        clientId: selectedClient.id,
        osId: selectedOrders.map((os) => os.id),
      };

      await apiService.post("financial-titles/manual", body);
      onCreateClose();

      setNewTitle({
        description: "",
        type: "INCOME",
        category: "",
        originalValue: "",
        dueDate: today,
        paymentMethod: "BANK_SLIP",
        clientId: "",
        osIds: [],
      });
      setSelectedClient(null);
      setSelectedOrders([]);

      addToast({ title: "Título criado com sucesso!", color: "success" });
      load(page);
      loadTotals();
    } catch (error: any) {
      addToast({
        title: error?.message || "Erro ao criar título",
        color: "danger",
      });
    } finally {
      setActionLoading(null);
    }
  }

  async function pay(title: FinancialTitleDTO) {
    setSelectedTitle(title);
    setPartialValue("");
    setIsPartial(false);
    onPaymentOpen();
  }

  async function confirmPay() {
    if (!selectedTitle) return;
    setActionLoading(selectedTitle.id);
    try {
      const body = isPartial
        ? { paidValue: parseFloat(partialValue), isPartialPayment: true }
        : null;

      await apiService.patch(`financial-titles/${selectedTitle.id}/pay`, body);
      onPaymentClose();
      addToast({ title: "Pagamento realizado com sucesso!", color: "success" });
      load(page);
      loadTotals();
    } catch (error: any) {
      addToast({
        title: error?.message || "Erro ao realizar pagamento",
        color: "danger",
      });
    } finally {
      setActionLoading(null);
    }
  }

  function handleViewDetails(title: FinancialTitleDTO) {
    setSelectedTitleForDetails(title);
    onDetailsOpen();
  }

  async function handleUpdate(id: string, data: Partial<FinancialTitleDTO>) {
    setActionLoading(id);
    try {
      await apiService.put(`financial-titles/${id}`, data);
      addToast({ title: "Título atualizado com sucesso!", color: "success" });
      load(page);
      loadTotals();
      onDetailsClose();
    } catch (error: any) {
      addToast({
        title: error?.message || "Erro ao atualizar título",
        color: "danger",
      });
    } finally {
      setActionLoading(null);
    }
  }

  function generateSlip(titleId: string) {
    setPendingActionId(titleId);
    onSlipConfirmOpen();
  }

  async function confirmGenerateSlip() {
    if (!pendingActionId) return;
    setActionLoading(pendingActionId);
    try {
      await apiService.post(`slips/from-title/${pendingActionId}`);
      onSlipConfirmClose();
      addToast({ title: "Boleto gerado com sucesso!", color: "success" });
      load(page);
    } catch (error: any) {
      addToast({
        title: error?.message || "Erro ao gerar boleto",
        color: "danger",
      });
    } finally {
      setActionLoading(null);
      setPendingActionId(null);
    }
  }

  function reverse(id: string) {
    setPendingActionId(id);
    onReverseConfirmOpen();
  }

  async function confirmReverse() {
    if (!pendingActionId) return;
    setActionLoading(pendingActionId);
    try {
      await apiService.post(`financial-titles/${pendingActionId}/reverse`);
      onReverseConfirmClose();
      addToast({ title: "Pagamento estornado com sucesso!", color: "success" });
      load(page);
      loadTotals();
    } catch (error: any) {
      addToast({
        title: error?.message || "Erro ao estornar pagamento",
        color: "danger",
      });
    } finally {
      setActionLoading(null);
      setPendingActionId(null);
    }
  }

  function cancel(id: string) {
    setPendingActionId(id);
    onCancelConfirmOpen();
  }

  async function confirmCancel() {
    if (!pendingActionId) return;
    setActionLoading(pendingActionId);
    try {
      await apiService.delete(`financial-titles/${pendingActionId}`);
      onCancelConfirmClose();
      addToast({ title: "Título cancelado com sucesso!", color: "success" });
      load(page);
      loadTotals();
    } catch (error: any) {
      addToast({
        title: error?.message || "Erro ao cancelar título",
        color: "danger",
      });
    } finally {
      setActionLoading(null);
      setPendingActionId(null);
    }
  }

  const statusColor = {
    OPEN: "warning",
    PAID: "success",
    CANCELED: "danger",
    DELAYED: "danger",
  } as const;

  const statusLabel = {
    OPEN: "ABERTO",
    PAID: "PAGO",
    CANCELED: "CANCELADO",
    DELAYED: "ATRASADO",
  };

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-white">Financeiro</h2>
            <p className="text-gray-500">
              Controle de títulos, pagamentos e pendências
            </p>
          </div>
          <Button
            color="warning"
            className="text-black"
            startContent={<Plus size={16} />}
            onPress={onCreateOpen}
          >
            Novo Título
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryCard
            title="Títulos Pagos"
            color="green"
            value={sum(data, "PAID")}
            icon={<TrendingUp size={20} />}
          />
          <SummaryCard
            title="Vencidos"
            color="orange"
            value={sum(data, "DELAYED")}
            icon={<TrendingDown size={20} />}
          />
          <SummaryCard
            title="Cancelados"
            color="red"
            value={sum(data, "CANCELED")}
            icon={<Ban size={20} />}
          />
        </div>

        <div className="bg-white rounded-2xl shadow p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <Input
              className="mt-4"
              placeholder="Buscar descrição"
              value={filters.text}
              onChange={(e) => setFilters({ ...filters, text: e.target.value })}
              startContent={<Search size={16} />}
              onKeyDown={(e) => e.key === "Enter" && handleFilter()}
            />

            <Select
              placeholder="Status"
              selectedKeys={filters.status ? [filters.status] : []}
              onSelectionChange={(k) => {
                const val = Array.from(k)[0] as string;
                setFilters({ ...filters, status: (val as any) || undefined });
              }}
            >
              <SelectItem key="OPEN">Aberto</SelectItem>
              <SelectItem key="PAID">Pago</SelectItem>
              <SelectItem key="CANCELED">Cancelado</SelectItem>
              <SelectItem key="DELAYED">Atrasado</SelectItem>
            </Select>

            <Select
              placeholder="Tipo"
              selectedKeys={filters.type ? [filters.type] : []}
              onSelectionChange={(k) => {
                const val = Array.from(k)[0] as string;
                setFilters({ ...filters, type: (val as any) || undefined });
              }}
            >
              <SelectItem key="INCOME">Receita</SelectItem>
              <SelectItem key="EXPENSE">Despesa</SelectItem>
            </Select>

            <Input
              type="date"
              label="Vencimento de"
              value={filters.from ?? ""}
              onChange={(e) =>
                setFilters({ ...filters, from: e.target.value || undefined })
              }
            />
            <Input
              type="date"
              label="Até"
              value={filters.to ?? ""}
              onChange={(e) =>
                setFilters({ ...filters, to: e.target.value || undefined })
              }
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="light"
              onClick={() => {
                setFilters({
                  text: "",
                  status: undefined,
                  type: undefined,
                  from: undefined,
                  to: undefined,
                });
                setTimeout(() => {
                  setPage(0);
                  load(0);
                }, 0);
              }}
            >
              Limpar Filtros
            </Button>
            <Button
              color="warning"
              className="text-black"
              onClick={handleFilter}
            >
              Filtrar
            </Button>
          </div>
        </div>

        <div className="bg-white text-black rounded-2xl shadow-xl p-6">
          {loading ? (
            <div className="flex justify-center py-10">
              <Spinner color="warning" variant="wave" />
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-gray-500">
                  {totalElements} registro(s) encontrado(s)
                </span>
                <Button
                  color="warning"
                  className="text-black"
                  startContent={<FileDown size={16} />}
                  onPress={() => {
                    setExportDates({
                      from: filters.from || today,
                      to: filters.to || today,
                    });
                    onExportOpen();
                  }}
                >
                  Exportar
                </Button>
              </div>

              <Table className="text-white">
                <TableHeader>
                  <TableColumn>Descrição</TableColumn>
                  <TableColumn>Categoria</TableColumn>
                  <TableColumn>Tipo</TableColumn>
                  <TableColumn>Vencimento</TableColumn>
                  <TableColumn>Valor Original</TableColumn>
                  <TableColumn>Status</TableColumn>
                  <TableColumn>Ações</TableColumn>
                </TableHeader>

                <TableBody emptyContent="Nenhum título encontrado">
                  {data.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{t.description}</TableCell>
                      <TableCell>{t.category}</TableCell>
                      <TableCell>
                        <Chip
                          size="sm"
                          color={t.type === "INCOME" ? "success" : "danger"}
                          variant="flat"
                        >
                          {t.type === "INCOME" ? "Receita" : "Despesa"}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        {new Date(t.dueDate + "T00:00:00").toLocaleDateString(
                          "pt-BR",
                        )}
                      </TableCell>
                      <TableCell>
                        {Number(t.originalValue).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </TableCell>
                      <TableCell>
                        <Chip color={statusColor[t.status]} variant="flat">
                          {statusLabel[t.status]}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {(t.status === "OPEN" || t.status === "DELAYED") && (
                            <Button
                              size="sm"
                              isIconOnly
                              color="success"
                              isLoading={actionLoading === t.id}
                              onClick={() => pay(t)}
                              title="Registrar pagamento"
                            >
                              <CheckCircle size={16} />
                            </Button>
                          )}
                          {t.status === "PAID" && (
                            <Button
                              size="sm"
                              isIconOnly
                              color="warning"
                              isLoading={actionLoading === t.id}
                              onClick={() => reverse(t.id)}
                              title="Estornar pagamento"
                            >
                              <RotateCcw size={16} />
                            </Button>
                          )}
                          {t.status !== "PAID" && (
                            <Button
                              size="sm"
                              isIconOnly
                              color="danger"
                              isLoading={actionLoading === t.id}
                              onClick={() => cancel(t.id)}
                              title="Cancelar título"
                            >
                              <Trash2 size={16} />
                            </Button>
                          )}

                          <Dropdown>
                            <DropdownTrigger>
                              <Button
                                className="bg-gray-600 hover:bg-gray-500"
                                size="sm"
                                isIconOnly
                                isDisabled={actionLoading === t.id}
                              >
                                <MoreVertical size={16} />
                              </Button>
                            </DropdownTrigger>
                            <DropdownMenu aria-label="Ações do título">
                              {t.status === "OPEN" ? (
                                <DropdownItem
                                  key="generate-slip"
                                  startContent={<Receipt size={16} />}
                                  onPress={() => generateSlip(t.id)}
                                >
                                  Gerar Boleto
                                </DropdownItem>
                              ) : null}
                              <DropdownItem
                                key="view"
                                startContent={<Eye size={16} />}
                                onPress={() => handleViewDetails(t)}
                              >
                                Ver Detalhes
                              </DropdownItem>
                            </DropdownMenu>
                          </Dropdown>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-gray-500">
                  Página {page + 1} de {totalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    isDisabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Anterior
                  </Button>
                  <Button
                    size="sm"
                    isDisabled={page + 1 >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>

      <Modal isOpen={isExportOpen} onClose={onExportClose} size="sm">
        <ModalContent>
          <ModalHeader className="flex items-center gap-2">
            <FileText size={20} className="text-yellow-500" />
            Exportar Relatório Financeiro
          </ModalHeader>
          <ModalBody className="space-y-4 pb-2">
            <p className="text-sm text-gray-400">
              Selecione o período para gerar o relatório em PDF com todos os
              títulos do intervalo.
            </p>

            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Calendar size={15} className="text-yellow-500" />
                <span className="text-sm font-medium text-gray-700">
                  Período
                </span>
              </div>

              <Input
                type="date"
                label="Data inicial"
                value={exportDates.from}
                onChange={(e) =>
                  setExportDates({ ...exportDates, from: e.target.value })
                }
                isRequired
              />
              <Input
                type="date"
                label="Data final"
                value={exportDates.to}
                onChange={(e) =>
                  setExportDates({ ...exportDates, to: e.target.value })
                }
                isRequired
                isInvalid={
                  !!exportDates.from && exportDates.to < exportDates.from
                }
                errorMessage="A data final não pode ser anterior à inicial"
              />
            </div>

            {exportDates.from &&
              exportDates.to &&
              exportDates.to >= exportDates.from && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-800">
                  Relatório de{" "}
                  <span className="font-semibold">
                    {new Date(
                      exportDates.from + "T00:00:00",
                    ).toLocaleDateString("pt-BR")}
                  </span>{" "}
                  até{" "}
                  <span className="font-semibold">
                    {new Date(exportDates.to + "T00:00:00").toLocaleDateString(
                      "pt-BR",
                    )}
                  </span>
                </div>
              )}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={onExportClose}
              isDisabled={exportLoading}
            >
              Cancelar
            </Button>
            <Button
              color="warning"
              className="text-black font-semibold"
              startContent={!exportLoading ? <FileDown size={16} /> : undefined}
              isLoading={exportLoading}
              onPress={handleExport}
              isDisabled={
                !exportDates.from ||
                !exportDates.to ||
                exportDates.to < exportDates.from
              }
            >
              Gerar Relatório
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <Modal isOpen={isPaymentOpen} onClose={onPaymentClose}>
        <ModalContent>
          <ModalHeader>Registrar Pagamento</ModalHeader>
          <ModalBody>
            {selectedTitle && (
              <>
                <p className="text-xl text-white">
                  Título:{" "}
                  <span className="font-semibold">
                    {selectedTitle.description}
                  </span>
                </p>
                <p className="text-md text-white">
                  Categoria:{" "}
                  <span className="font-semibold">
                    {selectedTitle.category}
                  </span>
                </p>
                <p className="text-md text-white">
                  Valor original:{" "}
                  <span className="font-semibold text-green-600">
                    {Number(selectedTitle.originalValue).toLocaleString(
                      "pt-BR",
                      {
                        style: "currency",
                        currency: "BRL",
                      },
                    )}
                  </span>
                </p>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="partial"
                    checked={isPartial}
                    onChange={(e) => setIsPartial(e.target.checked)}
                  />
                  <label htmlFor="partial" className="text-sm">
                    Pagamento parcial
                  </label>
                </div>

                {isPartial && (
                  <Input
                    type="number"
                    label="Valor pago"
                    placeholder="0,00"
                    value={partialValue}
                    onChange={(e) => setPartialValue(e.target.value)}
                    startContent={
                      <span className="text-sm text-gray-500">R$</span>
                    }
                  />
                )}
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onClick={onPaymentClose}>
              Cancelar
            </Button>
            <Button
              color="success"
              isLoading={!!actionLoading}
              onClick={confirmPay}
              isDisabled={isPartial && !partialValue}
            >
              Confirmar Pagamento
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isCreateOpen} onClose={onCreateClose} size="4xl">
        <ModalContent>
          <ModalHeader>Criar Novo Título</ModalHeader>
          <ModalBody className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <ClientSearchInput
                value={newTitle.clientId}
                onSelect={(client) => {
                  setSelectedClient(client);
                  setNewTitle({ ...newTitle, clientId: client.id });
                }}
                onClear={() => {
                  setSelectedClient(null);
                  setSelectedOrders([]);
                  setNewTitle({ ...newTitle, clientId: "", osIds: [] });
                }}
                selectedClientName={selectedClient?.name}
              />
              <ServiceOrderSearchInput
                clientId={selectedClient?.id || null}
                selectedOrders={selectedOrders}
                onAdd={(order) => setSelectedOrders([...selectedOrders, order])}
                onRemove={(orderId) =>
                  setSelectedOrders(
                    selectedOrders.filter((o) => o.id !== orderId),
                  )
                }
              />
            </div>

            <Input
              label="Descrição"
              placeholder="Ex: Serviço de revisão"
              value={newTitle.description}
              onChange={(e) =>
                setNewTitle({ ...newTitle, description: e.target.value })
              }
              isRequired
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Select
                label="Tipo"
                selectedKeys={[newTitle.type]}
                onSelectionChange={(k) =>
                  setNewTitle({ ...newTitle, type: Array.from(k)[0] as any })
                }
                isRequired
              >
                <SelectItem key="INCOME">Receita</SelectItem>
                <SelectItem key="EXPENSE">Despesa</SelectItem>
              </Select>
              <Input
                label="Categoria"
                placeholder="Ex: Serviços"
                value={newTitle.category}
                onChange={(e) =>
                  setNewTitle({ ...newTitle, category: e.target.value })
                }
                isRequired
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                type="number"
                label="Valor"
                placeholder="0,00"
                value={newTitle.originalValue}
                onChange={(e) =>
                  setNewTitle({ ...newTitle, originalValue: e.target.value })
                }
                startContent={<span className="text-sm text-gray-500">R$</span>}
                isRequired
              />
              <Input
                type="date"
                label="Vencimento"
                value={newTitle.dueDate}
                onChange={(e) =>
                  setNewTitle({ ...newTitle, dueDate: e.target.value })
                }
                isRequired
              />
            </div>

            <Select
              label="Forma de Pagamento"
              selectedKeys={[newTitle.paymentMethod]}
              onSelectionChange={(k) =>
                setNewTitle({
                  ...newTitle,
                  paymentMethod: Array.from(k)[0] as string,
                })
              }
              isRequired
            >
              <SelectItem key="BANK_SLIP">Boleto</SelectItem>
              <SelectItem key="PIX">PIX</SelectItem>
              <SelectItem key="CREDIT_CARD">Cartão de Crédito</SelectItem>
              <SelectItem key="DEBIT_CARD">Cartão de Débito</SelectItem>
              <SelectItem key="CASH">Dinheiro</SelectItem>
            </Select>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onClick={onCreateClose}>
              Cancelar
            </Button>
            <Button
              color="warning"
              className="text-black"
              isLoading={actionLoading === "create"}
              onClick={handleCreateTitle}
            >
              Criar Título
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <ConfirmModal
        isOpen={isSlipConfirmOpen}
        onClose={() => {
          onSlipConfirmClose();
          setPendingActionId(null);
        }}
        onConfirm={confirmGenerateSlip}
        title="Gerar Boleto"
        message="Deseja gerar um boleto bancário para este título? Esta ação criará um novo boleto no sistema."
        confirmText="Gerar Boleto"
        variant="info"
        isLoading={!!actionLoading}
      />
      <ConfirmModal
        isOpen={isReverseConfirmOpen}
        onClose={() => {
          onReverseConfirmClose();
          setPendingActionId(null);
        }}
        onConfirm={confirmReverse}
        title="Estornar Pagamento"
        message="Tem certeza que deseja estornar este pagamento? O título voltará ao status ABERTO e o valor pago será zerado."
        confirmText="Sim, Estornar"
        variant="warning"
        isLoading={!!actionLoading}
      />
      <ConfirmModal
        isOpen={isCancelConfirmOpen}
        onClose={() => {
          onCancelConfirmClose();
          setPendingActionId(null);
        }}
        onConfirm={confirmCancel}
        title="Cancelar Título"
        message="Tem certeza que deseja cancelar este título? Esta ação não poderá ser desfeita."
        confirmText="Sim, Cancelar"
        cancelText="Não, Voltar"
        variant="danger"
        isLoading={!!actionLoading}
      />
      <FinancialTitleDetailsModal
        isOpen={isDetailsOpen}
        onClose={onDetailsClose}
        title={selectedTitleForDetails}
        onPay={pay}
        onReverse={reverse}
        onCancel={cancel}
        onUpdate={handleUpdate}
        onGenerateSlip={generateSlip}
        isLoading={!!actionLoading}
      />
    </AppLayout>
  );
}

function SummaryCard({
  title,
  value,
  color,
  icon,
}: {
  title: string;
  value: number;
  color: "green" | "orange" | "red";
  icon: React.ReactNode;
}) {
  const map = {
    green: "bg-green-50 text-green-700 border-green-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
    red: "bg-red-50 text-red-700 border-red-200",
  };
  const iconMap = {
    green: "text-green-500",
    orange: "text-orange-500",
    red: "text-red-500",
  };

  return (
    <div className={`p-4 rounded-xl shadow bg-white border ${map[color]}`}>
      <div className="flex justify-between items-start">
        <p className="text-sm text-gray-500">{title}</p>
        <span className={iconMap[color]}>{icon}</span>
      </div>
      <p className={`text-2xl font-bold mt-1 rounded-md ${map[color]}`}>
        {value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
      </p>
    </div>
  );
}

function sum(data: FinancialTitleDTO[], status: string) {
  return data
    .filter((d) => d.status === status)
    .reduce((acc, d) => acc + Number(d.originalValue), 0);
}
