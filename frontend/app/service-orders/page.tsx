"use client";

import { useCallback, useEffect, useState } from "react";
import { apiService } from "@/services/api";
import {
  ClientDTO,
  PageResponse,
  ProductServiceDTO,
  ServiceOrderDTO,
  ServiceOrderItem,
  ServiceOrderRequestDTO,
} from "@/types";
import { AppLayout } from "@/components/AppLayout";
import { ClientSearchInput } from "@/components/ClientSearchInput";
import { MechanicSearchInput } from "@/components/MechanicSearchInput";
import { ServiceOrderDetailsModal } from "@/components/ServiceOrderDetailsModal";
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
  Select,
  SelectItem,
  Divider,
} from "@heroui/react";
import {
  CheckCircle,
  Trash2,
  Search,
  FileDown,
  Wrench,
  CheckSquare,
  XCircle,
  Plus,
  MoreVertical,
  Eye,
  AlertCircle,
  Printer,
  Calendar,
  FileText,
} from "lucide-react";
import { ConfirmModal } from "@/components/ConfirmModal";

export default function ServiceOrderPage() {
  const [data, setData] = useState<ServiceOrderDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [printLoading, setPrintLoading] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);

  const {
    isOpen: isExportOpen,
    onOpen: onExportOpen,
    onClose: onExportClose,
  } = useDisclosure();
  const {
    isOpen: isDetailsOpen,
    onOpen: onDetailsOpen,
    onClose: onDetailsClose,
  } = useDisclosure();
  const [selectedOrderDetails, setSelectedOrderDetails] =
    useState<ServiceOrderDTO | null>(null);
  const [page, setPage] = useState(0);
  const itemsPerPage = 10;

  const today = new Date(
    new Date().getTime() - new Date().getTimezoneOffset() * 60000,
  )
    .toISOString()
    .split("T")[0];

  const [filters, setFilters] = useState({
    text: "",
    from: today,
    to: today,
  });

  const [exportDates, setExportDates] = useState({ from: today, to: today });

  const [totals, setTotals] = useState({
    open: 0,
    finished: 0,
    canceled: 0,
  });

  const {
    isOpen: isFinishConfirmOpen,
    onOpen: onFinishConfirmOpen,
    onClose: onFinishConfirmClose,
  } = useDisclosure();

  const {
    isOpen: isCancelConfirmOpen,
    onOpen: onCancelConfirmOpen,
    onClose: onCancelConfirmClose,
  } = useDisclosure();

  const {
    isOpen: isCreateOpen,
    onOpen: onCreateOpen,
    onClose: onCreateClose,
  } = useDisclosure();

  const [pendingActionId, setPendingActionId] = useState<string | null>(null);

  const [newOrder, setNewOrder] = useState<Partial<ServiceOrderRequestDTO>>({
    clientId: "",
    vehicle: {
      plate: "",
      model: "",
      mark: "",
      year: new Date().getFullYear(),
    },
    observations: "",
    items: [],
  });

  const [selectedClient, setSelectedClient] = useState<ClientDTO | null>(null);
  const [availableProducts, setAvailableProducts] = useState<
    ProductServiceDTO[]
  >([]);

  const [draftItem, setDraftItem] = useState<
    Partial<ServiceOrderItem> & { mechanicName?: string }
  >({
    productServiceId: "",
    name: "",
    type: "PRODUCT",
    amount: 1,
    unitValue: 0,
    discount: 0,
    mechanicId: undefined,
    mechanicName: undefined,
  });
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.from) params.set("startDate", filters.from);
      if (filters.to) params.set("endDate", filters.to);

      const res = await apiService.get<ServiceOrderDTO[]>(
        `service-orders?${params.toString()}`,
      );
      setData(res);

      setTotals({
        open: res.filter((os) => os.status === "OPEN").length,
        finished: res.filter((os) => os.status === "FINISHED").length,
        canceled: res.filter((os) => os.status === "CANCELED").length,
      });
    } catch (error: any) {
      addToast({
        title: "Erro ao carregar Ordens de Serviço",
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (isCreateOpen) {
      setIsLoadingProducts(true);
      apiService
        .get<PageResponse<ProductServiceDTO>>("items?size=100&sort=name,asc")
        .then((res) =>
          setAvailableProducts(res.content.filter((p) => p.active)),
        )
        .catch(() =>
          addToast({
            title: "Erro ao carregar produtos/serviços",
            color: "danger",
          }),
        )
        .finally(() => setIsLoadingProducts(false));
    }
  }, [isCreateOpen]);

  // ── Print ────────────────────────────────────────────────────────────────────

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
        `${baseUrl}/service-orders/report?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) throw new Error("Erro ao gerar relatório");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const win = window.open(url, "_blank");
      if (!win)
        addToast({
          title: "Permita pop-ups para visualizar o relatório",
          color: "warning",
        });

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

  async function handlePrint(osId: string, osNumber?: string) {
    setPrintLoading(osId);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token") || "";

      const response = await fetch(`${baseUrl}/service-orders/${osId}/print`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Erro ao gerar PDF");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      // Abre o PDF inline em nova aba
      const win = window.open(url, "_blank");
      if (!win) {
        addToast({
          title: "Permita pop-ups para visualizar o PDF",
          color: "warning",
        });
      }

      // Libera a URL após 60s
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error: any) {
      addToast({
        title: error?.message || "Erro ao imprimir OS",
        color: "danger",
      });
    } finally {
      setPrintLoading(null);
    }
  }

  function handleAddDraftItem() {
    if (
      !draftItem.productServiceId ||
      !draftItem.amount ||
      draftItem.amount <= 0
    ) {
      addToast({
        title: "Selecione um produto/serviço e informe uma quantidade válida",
        color: "warning",
      });
      return;
    }

    if (draftItem.type === "SERVICE" && !draftItem.mechanicId) {
      addToast({
        title: "Selecione um mecânico para este serviço",
        color: "warning",
      });
      return;
    }

    const totalValue =
      draftItem.amount * (draftItem.unitValue || 0) - (draftItem.discount || 0);

    const newItem = {
      productServiceId: draftItem.productServiceId,
      type: draftItem.type,
      name: draftItem.name,
      amount: draftItem.amount,
      unitValue: draftItem.unitValue,
      discount: draftItem.discount,
      mechanicId: draftItem.mechanicId,
      mechanicName: draftItem.mechanicName,
      totalValue,
    } as ServiceOrderItem & { mechanicName?: string };

    setNewOrder({
      ...newOrder,
      items: [...(newOrder.items || []), newItem],
    });

    setDraftItem({
      productServiceId: "",
      name: "",
      type: "PRODUCT",
      amount: 1,
      unitValue: 0,
      discount: 0,
      mechanicId: undefined,
      mechanicName: undefined,
    });
  }

  function handleRemoveItemFromOrder(index: number) {
    const updatedItems = [...(newOrder.items || [])];
    updatedItems.splice(index, 1);
    setNewOrder({ ...newOrder, items: updatedItems });
  }

  async function handleCreateOrder() {
    if (
      !selectedClient ||
      !newOrder.vehicle?.plate ||
      !newOrder.vehicle?.model
    ) {
      addToast({
        title: "Preencha o cliente e os dados básicos do veículo",
        color: "danger",
      });
      return;
    }

    if (!newOrder.items || newOrder.items.length === 0) {
      addToast({
        title: "Adicione pelo menos um item à OS",
        color: "danger",
      });
      return;
    }

    setActionLoading("create");
    try {
      await apiService.post("service-orders", newOrder);
      onCreateClose();

      setNewOrder({
        clientId: "",
        vehicle: {
          plate: "",
          model: "",
          mark: "",
          year: new Date().getFullYear(),
        },
        observations: "",
        items: [],
      });
      setSelectedClient(null);

      addToast({ title: "OS criada com sucesso!", color: "success" });
      load();
    } catch (error: any) {
      addToast({
        title: error?.message || "Erro ao criar OS",
        color: "danger",
      });
    } finally {
      setActionLoading(null);
    }
  }

  function finishOrder(id: string) {
    setPendingActionId(id);
    onFinishConfirmOpen();
  }

  async function confirmFinish() {
    if (!pendingActionId) return;
    setActionLoading(pendingActionId);
    try {
      await apiService.patch(`service-orders/${pendingActionId}/finish`);
      onFinishConfirmClose();
      addToast({ title: "OS finalizada com sucesso!", color: "success" });
      load();
    } catch (error: any) {
      addToast({
        title: error?.message || "Erro ao finalizar OS",
        color: "danger",
      });
    } finally {
      setActionLoading(null);
      setPendingActionId(null);
    }
  }

  function cancelOrder(id: string) {
    setPendingActionId(id);
    onCancelConfirmOpen();
  }

  async function confirmCancel() {
    if (!pendingActionId) return;
    setActionLoading(pendingActionId);
    try {
      await apiService.patch(`service-orders/${pendingActionId}/cancel`);
      onCancelConfirmClose();
      addToast({ title: "OS cancelada com sucesso!", color: "success" });
      load();
    } catch (error: any) {
      addToast({
        title: error?.message || "Erro ao cancelar OS",
        color: "danger",
      });
    } finally {
      setActionLoading(null);
      setPendingActionId(null);
    }
  }

  const filteredData = data.filter((os) => {
    const term = filters.text.toLowerCase();
    const matchOS = os.osNumber?.toLowerCase().includes(term);
    const matchVehicle =
      os.vehicle?.plate?.toLowerCase().includes(term) ||
      os.vehicle?.model?.toLowerCase().includes(term) ||
      os.vehicle?.mark?.toLowerCase().includes(term);
    return matchOS || matchVehicle;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    page * itemsPerPage,
    (page + 1) * itemsPerPage,
  );

  const statusColor = {
    OPEN: "warning",
    FINISHED: "success",
    CANCELED: "danger",
  } as const;

  const statusLabel = {
    OPEN: "Em Andamento",
    FINISHED: "Finalizada",
    CANCELED: "Cancelada",
  };

  function handleFilter() {
    setPage(0);
    load();
  }

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-white">Ordens de Serviço</h2>
            <p className="text-gray-500">
              Controle de manutenções, veículos e serviços
            </p>
          </div>
          <Button
            color="warning"
            className="text-black"
            startContent={<Plus size={16} />}
            onPress={onCreateOpen}
          >
            Nova OS
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryCard
            title="Em Andamento"
            color="orange"
            value={totals.open}
            icon={<Wrench size={20} />}
            isCurrency={false}
          />
          <SummaryCard
            title="Finalizadas"
            color="green"
            value={totals.finished}
            icon={<CheckSquare size={20} />}
            isCurrency={false}
          />
          <SummaryCard
            title="Canceladas"
            color="red"
            value={totals.canceled}
            icon={<XCircle size={20} />}
            isCurrency={false}
          />
        </div>

        <div className="bg-white rounded-2xl shadow p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Input
              className="mt-4 md:col-span-2"
              placeholder="Buscar por número da OS ou veículo"
              value={filters.text}
              onChange={(e) => setFilters({ ...filters, text: e.target.value })}
              startContent={<Search size={16} />}
              onKeyDown={(e) => e.key === "Enter" && handleFilter()}
            />
            <Input
              type="date"
              label="Criação de"
              value={filters.from}
              onChange={(e) => setFilters({ ...filters, from: e.target.value })}
            />
            <Input
              type="date"
              label="Até"
              value={filters.to}
              onChange={(e) => setFilters({ ...filters, to: e.target.value })}
            />
          </div>
          <div className="flex gap-2 justify-end">
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
                  {filteredData.length} registro(s) encontrado(s)
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
                  <TableColumn>Nº OS</TableColumn>
                  <TableColumn>Veículo</TableColumn>
                  <TableColumn>Criação</TableColumn>
                  <TableColumn>Total</TableColumn>
                  <TableColumn>Status</TableColumn>
                  <TableColumn>Ações</TableColumn>
                </TableHeader>

                <TableBody emptyContent="Nenhuma OS encontrada">
                  {paginatedData.map((os) => (
                    <TableRow key={os.id}>
                      <TableCell className="font-semibold">
                        {os.osNumber}
                      </TableCell>
                      <TableCell>
                        {os.vehicle
                          ? `${os.vehicle.mark} ${os.vehicle.model} - ${os.vehicle.plate}`
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {new Date(os.createdAt).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        {os.totals.total?.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }) || "R$ 0,00"}
                      </TableCell>
                      <TableCell>
                        <Chip
                          color={
                            statusColor[
                              os.status as keyof typeof statusColor
                            ] || "default"
                          }
                          variant="flat"
                        >
                          {statusLabel[os.status as keyof typeof statusLabel] ||
                            os.status}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {os.status === "OPEN" && (
                            <Button
                              size="sm"
                              isIconOnly
                              color="success"
                              isLoading={actionLoading === os.id}
                              onClick={() => finishOrder(os.id)}
                              title="Finalizar OS"
                            >
                              <CheckCircle size={16} />
                            </Button>
                          )}
                          {os.status === "OPEN" && (
                            <Button
                              size="sm"
                              isIconOnly
                              color="danger"
                              isLoading={actionLoading === os.id}
                              onClick={() => cancelOrder(os.id)}
                              title="Cancelar OS"
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
                              >
                                <MoreVertical size={16} />
                              </Button>
                            </DropdownTrigger>
                            <DropdownMenu aria-label="Ações da OS">
                              <DropdownItem
                                key="view"
                                startContent={<Eye size={16} />}
                                onPress={() => {
                                  setSelectedOrderDetails(os);
                                  onDetailsOpen();
                                }}
                              >
                                Ver Detalhes
                              </DropdownItem>
                              <DropdownItem
                                key="print"
                                startContent={
                                  printLoading === os.id ? (
                                    <Spinner size="sm" color="current" />
                                  ) : (
                                    <Printer size={16} />
                                  )
                                }
                                onPress={() => handlePrint(os.id, os.osNumber)}
                                isDisabled={printLoading === os.id}
                              >
                                Imprimir OS
                              </DropdownItem>
                            </DropdownMenu>
                          </Dropdown>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 0 && (
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
              )}
            </>
          )}
        </div>
      </motion.div>

      <Modal isOpen={isCreateOpen} onClose={onCreateClose} size="4xl">
        <ModalContent>
          <ModalHeader>Abrir Nova Ordem de Serviço</ModalHeader>
          <ModalBody className="space-y-4">
            <div className="bg-gray-50/5 p-4 rounded-xl border border-gray-800 space-y-4">
              <h3 className="text-lg font-semibold text-white">
                Dados Básicos
              </h3>
              <ClientSearchInput
                value={newOrder.clientId || ""}
                onSelect={(client) => {
                  setSelectedClient(client);
                  setNewOrder({ ...newOrder, clientId: client.id });
                }}
                onClear={() => {
                  setSelectedClient(null);
                  setNewOrder({ ...newOrder, clientId: "" });
                }}
                selectedClientName={selectedClient?.name}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  label="Placa"
                  placeholder="Ex: ABC-1234"
                  value={newOrder.vehicle?.plate}
                  onChange={(e) =>
                    setNewOrder({
                      ...newOrder,
                      vehicle: {
                        ...(newOrder.vehicle as any),
                        plate: e.target.value,
                      },
                    })
                  }
                  isRequired
                />
                <Input
                  label="Marca"
                  placeholder="Ex: Honda"
                  value={newOrder.vehicle?.mark}
                  onChange={(e) =>
                    setNewOrder({
                      ...newOrder,
                      vehicle: {
                        ...(newOrder.vehicle as any),
                        mark: e.target.value,
                      },
                    })
                  }
                  isRequired
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  label="Modelo"
                  className="md:col-span-2"
                  placeholder="Ex: Civic"
                  value={newOrder.vehicle?.model}
                  onChange={(e) =>
                    setNewOrder({
                      ...newOrder,
                      vehicle: {
                        ...(newOrder.vehicle as any),
                        model: e.target.value,
                      },
                    })
                  }
                  isRequired
                />
                <Input
                  type="number"
                  label="Ano"
                  placeholder="Ex: 2021"
                  value={newOrder.vehicle?.year?.toString()}
                  onChange={(e) =>
                    setNewOrder({
                      ...newOrder,
                      vehicle: {
                        ...(newOrder.vehicle as any),
                        year:
                          parseInt(e.target.value) || new Date().getFullYear(),
                      },
                    })
                  }
                />
              </div>

              <Input
                label="Observações iniciais"
                placeholder="Detalhes do problema relatado pelo cliente"
                value={newOrder.observations}
                onChange={(e) =>
                  setNewOrder({ ...newOrder, observations: e.target.value })
                }
              />
            </div>

            <Divider />

            <div className="bg-gray-50/5 p-4 rounded-xl border border-gray-800 space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-white">
                  Itens e Serviços
                </h3>
                <div className="flex items-center gap-1 text-blue-400 text-xs bg-blue-950/30 px-2 py-1 rounded">
                  <AlertCircle size={14} />
                  <span>Mecânico obrigatório apenas para serviços</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-5">
                    <Select
                      label="Produto/Serviço"
                      isLoading={isLoadingProducts}
                      selectedKeys={
                        draftItem.productServiceId
                          ? [draftItem.productServiceId]
                          : []
                      }
                      onSelectionChange={(k) => {
                        const id = Array.from(k)[0] as string;
                        const prod = availableProducts.find((p) => p.id === id);
                        if (prod) {
                          setDraftItem({
                            ...draftItem,
                            productServiceId: prod.id,
                            name: prod.name,
                            type: prod.type,
                            unitValue: prod.salePrice,
                            mechanicId:
                              prod.type === "SERVICE"
                                ? draftItem.mechanicId
                                : undefined,
                            mechanicName:
                              prod.type === "SERVICE"
                                ? draftItem.mechanicName
                                : undefined,
                          });
                        }
                      }}
                    >
                      {availableProducts.map((p) => (
                        <SelectItem key={p.id} textValue={p.name}>
                          <div className="flex justify-between items-center">
                            <span>{p.name}</span>
                            <span className="text-gray-400 text-sm">
                              {p.type === "PRODUCT" ? "Produto" : "Serviço"} -
                              R$ {p.salePrice.toFixed(2)}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </Select>
                  </div>

                  <div className="md:col-span-2">
                    <Input
                      type="number"
                      label="Qtd"
                      value={draftItem.amount?.toString()}
                      onChange={(e) =>
                        setDraftItem({
                          ...draftItem,
                          amount: Number(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Input
                      type="number"
                      label="Desc. (R$)"
                      value={draftItem.discount?.toString()}
                      onChange={(e) =>
                        setDraftItem({
                          ...draftItem,
                          discount: Number(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div className="md:col-span-3">
                    <Button
                      color="primary"
                      className="w-full h-14"
                      onPress={handleAddDraftItem}
                    >
                      Adicionar
                    </Button>
                  </div>
                </div>

                {draftItem.type === "SERVICE" && (
                  <div className="bg-gray-700/30 p-3 rounded-lg border border-gray-700">
                    <MechanicSearchInput
                      value={draftItem.mechanicId || ""}
                      onSelect={(mechanic) => {
                        setDraftItem({
                          ...draftItem,
                          mechanicId: mechanic.id,
                          mechanicName: mechanic.name,
                        });
                      }}
                      onClear={() => {
                        setDraftItem({
                          ...draftItem,
                          mechanicId: undefined,
                          mechanicName: undefined,
                        });
                      }}
                      selectedMechanicName={draftItem.mechanicName}
                      isRequired={true}
                    />
                  </div>
                )}
              </div>

              {newOrder.items && newOrder.items.length > 0 && (
                <div className="mt-4 border border-gray-700 rounded-lg overflow-hidden">
                  <Table aria-label="Itens da OS" removeWrapper>
                    <TableHeader>
                      <TableColumn>Nome</TableColumn>
                      <TableColumn>Tipo</TableColumn>
                      <TableColumn>Qtd</TableColumn>
                      <TableColumn>V. Unit</TableColumn>
                      <TableColumn>Desc.</TableColumn>
                      <TableColumn>Mecânico</TableColumn>
                      <TableColumn>Total</TableColumn>
                      <TableColumn>Ações</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {newOrder.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {item.name}
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="sm"
                              color={
                                item.type === "SERVICE" ? "success" : "default"
                              }
                              variant="flat"
                            >
                              {item.type === "SERVICE" ? "Serviço" : "Produto"}
                            </Chip>
                          </TableCell>
                          <TableCell>{item.amount}</TableCell>
                          <TableCell>
                            {item.unitValue.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </TableCell>
                          <TableCell>
                            {item.discount.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </TableCell>
                          <TableCell>
                            {item.mechanicId ? (
                              <Chip
                                size="sm"
                                startContent={<Wrench size={14} />}
                                color="warning"
                                variant="flat"
                              >
                                {(item as any).mechanicName}
                              </Chip>
                            ) : (
                              <span className="text-gray-400 text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {(item.totalValue || 0).toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              color="danger"
                              isIconOnly
                              variant="light"
                              onPress={() => handleRemoveItemFromOrder(index)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onClick={onCreateClose}>
              Cancelar
            </Button>
            <Button
              color="warning"
              className="text-black"
              isLoading={actionLoading === "create"}
              onClick={handleCreateOrder}
            >
              Criar OS
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ── Modal Exportar ── */}
      <Modal isOpen={isExportOpen} onClose={onExportClose} size="sm">
        <ModalContent>
          <ModalHeader className="flex items-center gap-2">
            <FileText size={20} className="text-yellow-500" />
            Exportar Relatório de OS
          </ModalHeader>
          <ModalBody className="space-y-4 pb-2">
            <p className="text-sm text-gray-400">
              Selecione o período para gerar o relatório em PDF com todas as
              ordens de serviço do intervalo.
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

      <ServiceOrderDetailsModal
        isOpen={isDetailsOpen}
        onClose={onDetailsClose}
        order={selectedOrderDetails}
        onUpdate={() => {
          load();
          if (selectedOrderDetails) {
            apiService
              .get<ServiceOrderDTO>(`service-orders/${selectedOrderDetails.id}`)
              .then((res) => setSelectedOrderDetails(res));
          }
        }}
      />

      <ConfirmModal
        isOpen={isFinishConfirmOpen}
        onClose={() => {
          onFinishConfirmClose();
          setPendingActionId(null);
        }}
        onConfirm={confirmFinish}
        title="Finalizar Ordem de Serviço"
        message="Tem certeza que deseja finalizar esta OS? Não será mais possível adicionar ou remover itens."
        confirmText="Sim, Finalizar"
        variant="success"
        isLoading={!!actionLoading}
      />

      <ConfirmModal
        isOpen={isCancelConfirmOpen}
        onClose={() => {
          onCancelConfirmClose();
          setPendingActionId(null);
        }}
        onConfirm={confirmCancel}
        title="Cancelar Ordem de Serviço"
        message="Tem certeza que deseja cancelar esta OS? Esta ação não poderá ser desfeita."
        confirmText="Sim, Cancelar"
        variant="danger"
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
  isCurrency = true,
}: {
  title: string;
  value: number;
  color: "green" | "orange" | "red";
  icon: React.ReactNode;
  isCurrency?: boolean;
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
        {isCurrency
          ? value.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })
          : value}
      </p>
    </div>
  );
}
