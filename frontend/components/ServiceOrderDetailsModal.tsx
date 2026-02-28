"use client";

import { useEffect, useState } from "react";
import { apiService } from "@/services/api";
import {
  ProductServiceDTO,
  ServiceOrderDTO,
  ServiceOrderItem,
  PageResponse,
  MechanicDTO,
} from "@/types";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Select,
  SelectItem,
  addToast,
  Spinner,
  Divider,
} from "@heroui/react";
import {
  Trash2,
  Plus,
  Printer,
  Receipt,
  AlertCircle,
  Wrench,
} from "lucide-react";
import { MechanicSearchInput } from "@/components/MechanicSearchInput";

interface ServiceOrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ServiceOrderDTO | null;
  onUpdate: () => void;
}

export function ServiceOrderDetailsModal({
  isOpen,
  onClose,
  order,
  onUpdate,
}: ServiceOrderDetailsModalProps) {
  const [orderDetails, setOrderDetails] = useState<ServiceOrderDTO | null>(
    null,
  );
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [availableProducts, setAvailableProducts] = useState<
    ProductServiceDTO[]
  >([]);
  const [availableMechanics, setAvailableMechanics] = useState<MechanicDTO[]>(
    [],
  );
  const [printLoading, setPrintLoading] = useState<string | null>(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
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

  useEffect(() => {
    if (isOpen && order?.id) {
      setIsLoadingDetails(true);

      apiService
        .get<ServiceOrderDTO>(`service-orders/${order.id}`)
        .then((res) => setOrderDetails(res))
        .catch(() =>
          addToast({
            title: "Erro ao carregar detalhes da OS",
            color: "danger",
          }),
        )
        .finally(() => setIsLoadingDetails(false));

      apiService
        .get<MechanicDTO[]>("mechanics/active")
        .then((res) => setAvailableMechanics(res))
        .catch(() => console.error("Erro ao carregar mecânicos"));
    } else {
      setOrderDetails(null);
    }
  }, [isOpen, order?.id]);

  useEffect(() => {
    if (isOpen && order?.id) {
      setIsLoadingDetails(true);
      apiService
        .get<ServiceOrderDTO>(`service-orders/${order.id}`)
        .then((res) => setOrderDetails(res))
        .catch(() =>
          addToast({
            title: "Erro ao carregar detalhes da OS",
            color: "danger",
          }),
        )
        .finally(() => setIsLoadingDetails(false));
    } else {
      setOrderDetails(null);
    }
  }, [isOpen, order?.id]);

  useEffect(() => {
    if (isOpen && orderDetails?.status === "OPEN") {
      setIsLoadingProducts(true);
      apiService
        .get<PageResponse<ProductServiceDTO>>("items?size=100&sort=name,asc")
        .then((res) =>
          setAvailableProducts(res.content.filter((p) => p.active)),
        )
        .catch(() =>
          addToast({ title: "Erro ao carregar produtos", color: "danger" }),
        )
        .finally(() => setIsLoadingProducts(false));
    }
  }, [isOpen, orderDetails?.status]);

  if (!isOpen || !order) return null;

  async function handleAddItem() {
    if (
      !draftItem.productServiceId ||
      !draftItem.amount ||
      draftItem.amount <= 0
    ) {
      addToast({
        title: "Selecione um produto e quantidade válida",
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

    setIsProcessing(true);
    try {
      const updatedOS = await apiService.post<ServiceOrderDTO>(
        `service-orders/${orderDetails?.id}/items`,
        {
          productServiceId: draftItem.productServiceId,
          type: draftItem.type,
          name: draftItem.name,
          amount: draftItem.amount,
          unitValue: draftItem.unitValue,
          discount: draftItem.discount,
          mechanicId: draftItem.mechanicId,
          mechanicName: draftItem.mechanicName,
        },
      );

      setOrderDetails(updatedOS);
      addToast({ title: "Item adicionado com sucesso!", color: "success" });
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
      onUpdate();
    } catch (error: any) {
      addToast({
        title: error?.message || "Erro ao adicionar item",
        color: "danger",
      });
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleRemoveItem(index: number) {
    setIsProcessing(true);
    try {
      const updatedOS = await apiService.delete<ServiceOrderDTO>(
        `service-orders/${orderDetails?.id}/items/${index}`,
      );

      setOrderDetails(updatedOS);
      addToast({ title: "Item removido com sucesso!", color: "success" });
      onUpdate();
    } catch (error: any) {
      addToast({
        title: error?.message || "Erro ao remover item",
        color: "danger",
      });
    } finally {
      setIsProcessing(false);
    }
  }

  if (isLoadingDetails || !orderDetails) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="4xl">
        <ModalContent>
          <div className="flex flex-col items-center justify-center p-20 gap-4">
            <Spinner color="warning" size="lg" variant="wave" />
            <p className="text-gray-400">
              Buscando detalhes da Ordem de Serviço...
            </p>
          </div>
        </ModalContent>
      </Modal>
    );
  }

  const isEditable = orderDetails.status === "OPEN";
  const statusColor: any = {
    OPEN: "warning",
    FINISHED: "success",
    CANCELED: "danger",
  };
  const statusLabel: any = {
    OPEN: "Em Andamento",
    FINISHED: "Finalizada",
    CANCELED: "Cancelada",
  };
  const finStatusColor: any = {
    OPEN: "warning",
    PAID: "success",
    CANCELED: "danger",
    OVERDUE: "danger",
  };
  const finStatusLabel: any = {
    OPEN: "Em Aberto",
    PAID: "Pago",
    CANCELED: "Cancelado",
    OVERDUE: "Vencido",
  };
  const paymentMethods: any = {
    BANK_SLIP: "Boleto",
    PIX: "PIX",
    CREDIT_CARD: "Cartão de Crédito",
    DEBIT_CARD: "Cartão de Débito",
    CASH: "Dinheiro",
  };

  async function handlePrint(osId: string, osNumber?: string) {
    setPrintLoading(osId);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token") || "";

      const response = await fetch(`${baseUrl}/service-orders/${osId}/print`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Erro ao gerar PDF");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const win = window.open(url, "_blank");
      if (!win) {
        addToast({
          title: "Permita pop-ups no navegador para visualizar o PDF",
          color: "warning",
        });
      }

      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (error: any) {
      addToast({
        title: error?.message || "Erro ao imprimir OS",
        color: "danger",
      });
    } finally {
      setPrintLoading(null);
    }
  }

  const orderItems: any[] = orderDetails.items || orderDetails.itemOS || [];
  const osNumberDisplay = orderDetails.osNumber || orderDetails.osNumber || "";
  const subtotal = orderDetails.totals?.subtotal || 0;
  const totalDescontos = orderDetails.totals?.descont || 0;
  const totalGeral = orderDetails.totals?.total || 0;
  const vehicleBrand = orderDetails.vehicle?.mark || "Marca Desconhecida";
  const mechanicName =
    orderDetails.itemOS?.[0].mechanic?.name || "Mecânico Desconhecido";

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex justify-between items-center pr-10">
          <div className="flex items-center gap-3">
            <span>Detalhes da OS: {osNumberDisplay}</span>
            <Chip
              color={statusColor[orderDetails.status] || "default"}
              variant="flat"
              size="sm"
            >
              {statusLabel[orderDetails.status] || orderDetails.status}
            </Chip>
          </div>
        </ModalHeader>

        <ModalBody className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50/5 p-4 rounded-xl border border-gray-800">
            <div>
              <p className="text-sm text-gray-500 mb-1">Veículo</p>
              <p className="font-semibold text-white">
                {orderDetails.vehicle
                  ? `${vehicleBrand} ${orderDetails.vehicle.model} - ${orderDetails.vehicle.plate}`
                  : "Não informado"}
              </p>
              <p className="text-sm text-gray-400">
                Ano: {orderDetails.vehicle?.year || "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Datas</p>
              <p className="text-white text-sm">
                Criada em:{" "}
                {orderDetails.createdAt
                  ? new Date(orderDetails.createdAt).toLocaleDateString("pt-BR")
                  : "N/A"}
              </p>
              {orderDetails.completionDate && (
                <p className="text-white text-sm">
                  Finalizada em:{" "}
                  {new Date(orderDetails.completionDate).toLocaleDateString(
                    "pt-BR",
                  )}
                </p>
              )}
            </div>
            {orderDetails.observations && (
              <div className="col-span-1 md:col-span-2 mt-2 pt-2 border-t border-gray-800">
                <p className="text-sm text-gray-500 mb-1">Observações</p>
                <p className="text-white text-sm">
                  {orderDetails.observations}
                </p>
              </div>
            )}
          </div>

          {isEditable && (
            <div className="bg-gray-50/5 p-4 rounded-xl border border-gray-800 space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-md font-semibold text-white">
                  Adicionar Novo Item
                </h3>
                <div className="flex items-center gap-1 text-blue-400 text-xs bg-blue-950/30 px-2 py-1 rounded">
                  <AlertCircle size={14} />
                  <span>Mecânico obrigatório apenas para serviços</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-5">
                  <Select
                    label="Produto/Serviço"
                    size="sm"
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
                            {p.type === "PRODUCT" ? "Produto" : "Serviço"} - R${" "}
                            {p.salePrice.toFixed(2)}
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
                    size="sm"
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
                    size="sm"
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
                    size="lg"
                    className="w-full"
                    onPress={handleAddItem}
                    isLoading={isProcessing}
                  >
                    <Plus size={18} /> Adicionar
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
          )}
          <Divider />
          <div>
            <h3 className="text-md font-semibold text-white mb-3">
              Itens Lançados ({orderItems.length})
            </h3>
            <div className="border border-gray-700 rounded-lg overflow-hidden">
              <Table aria-label="Itens da Ordem de Serviço" removeWrapper>
                <TableHeader>
                  <TableColumn>Nome</TableColumn>
                  <TableColumn>Tipo</TableColumn>
                  <TableColumn>Qtd</TableColumn>
                  <TableColumn>V. Unit</TableColumn>
                  <TableColumn>Desc.</TableColumn>
                  <TableColumn>Mecânico</TableColumn>
                  <TableColumn>Subtotal</TableColumn>
                  <TableColumn>Ações</TableColumn>
                </TableHeader>
                <TableBody emptyContent="Nenhum item lançado nesta OS.">
                  {orderItems.map((item, index) => {
                    const itemSubtotal =
                      item.total !== undefined
                        ? item.total
                        : item.amount * (item.unitValue || 0) -
                          (item.discount || 0);
                    const mechanicFound = availableMechanics.find(
                      (m) => m.id === item.mechanicId,
                    );
                    return (
                      <TableRow key={index}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>
                          <Chip
                            size="sm"
                            variant="flat"
                            color={
                              item.type === "SERVICE" ? "primary" : "secondary"
                            }
                          >
                            {item.type === "SERVICE" ? "Serviço" : "Produto"}
                          </Chip>
                        </TableCell>
                        <TableCell>{item.amount}</TableCell>
                        <TableCell>
                          {(item.unitValue || 0).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </TableCell>
                        <TableCell>
                          {(item.discount || 0).toLocaleString("pt-BR", {
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
                              {mechanicFound ? (
                                mechanicFound.name
                              ) : (
                                <Spinner
                                  variant="wave"
                                  color="warning"
                                  size="sm"
                                />
                              )}
                            </Chip>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="font-semibold text-green-500">
                          {itemSubtotal.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </TableCell>
                        <TableCell>
                          {isEditable ? (
                            <Button
                              size="sm"
                              color="danger"
                              isIconOnly
                              variant="light"
                              onPress={() => handleRemoveItem(index)}
                              isDisabled={isProcessing}
                            >
                              <Trash2 size={16} />
                            </Button>
                          ) : (
                            <span className="text-gray-500 text-xs">
                              Bloqueado
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {orderDetails.financialTitle && (
            <div className="bg-primary-900/10 p-5 rounded-xl border border-primary-900/50 mt-4">
              <div className="flex items-center gap-2 mb-4">
                <Receipt className="text-primary-500" size={20} />
                <h3 className="text-md font-semibold text-primary-400">
                  Faturamento Vinculado
                </h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">
                    Status
                  </p>
                  <Chip
                    size="sm"
                    color={finStatusColor[orderDetails.financialTitle.status]}
                    variant="flat"
                    className="mt-1"
                  >
                    {finStatusLabel[orderDetails.financialTitle.status] ||
                      orderDetails.financialTitle.status}
                  </Chip>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">
                    Vencimento
                  </p>
                  <p className="text-white font-medium mt-1">
                    {orderDetails.financialTitle.dueDate
                      ? new Date(
                          orderDetails.financialTitle.dueDate + "T00:00:00",
                        ).toLocaleDateString("pt-BR")
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">
                    Método
                  </p>
                  <p className="text-white font-medium mt-1">
                    {paymentMethods[
                      orderDetails.financialTitle.paymentMethod as any
                    ] || orderDetails.financialTitle.paymentMethod}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">
                    Valor Faturado
                  </p>
                  <p className="text-primary-400 font-bold mt-1">
                    {orderDetails.financialTitle.originalValue
                      ? orderDetails.financialTitle.originalValue.toLocaleString(
                          "pt-BR",
                          { style: "currency", currency: "BRL" },
                        )
                      : "R$ 0,00"}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4 pb-2">
            <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 w-full md:w-1/3">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Subtotal Itens:</span>
                <span>
                  {subtotal.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </span>
              </div>
              <div className="flex justify-between text-sm text-red-400 mb-3 border-b border-gray-700 pb-3">
                <span>Descontos (-):</span>
                <span>
                  {totalDescontos.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300 font-medium">Total Final:</span>
                <span className="text-3xl font-bold text-green-500">
                  {totalGeral.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </span>
              </div>
            </div>
          </div>
        </ModalBody>

        <ModalFooter className="flex justify-between">
          <Button
            variant="light"
            color="primary"
            startContent={<Printer size={16} />}
            onPress={() => handlePrint(orderDetails.id, orderDetails.osNumber)}
            isDisabled={printLoading === orderDetails.id}
          >
            Imprimir OS
          </Button>
          <Button variant="solid" color="default" onPress={onClose}>
            Fechar Detalhes
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
