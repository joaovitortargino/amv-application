"use client";

import { useCallback, useEffect, useState } from "react";
import { apiService } from "@/services/api";
import { AppLayout } from "@/components/AppLayout";
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
  Tabs,
  Tab,
  Textarea,
} from "@heroui/react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  MoreVertical,
  FileDown,
  ToggleRight,
  ToggleLeft,
  Package,
  Wrench,
  Tag,
  ShoppingCart,
} from "lucide-react";
import { ConfirmModal } from "@/components/ConfirmModal";
import { ProductServiceDTO } from "@/types";

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
}

interface ProductServiceRequestDTO {
  name: string;
  description: string;
  type: "PRODUCT" | "SERVICE";
  price: number;
  salePrice: number;
  priceCost: number;
  active: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

const emptyForm: ProductServiceRequestDTO = {
  name: "",
  description: "",
  type: "SERVICE",
  price: 0,
  salePrice: 0,
  priceCost: 0,
  active: true,
};

function SummaryCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: "green" | "blue" | "orange" | "purple";
}) {
  const map = {
    green: "bg-green-50 text-green-700 border-green-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
  };
  const iconMap = {
    green: "text-green-500",
    blue: "text-blue-500",
    orange: "text-orange-500",
    purple: "text-purple-500",
  };

  return (
    <div className={`p-4 rounded-xl shadow bg-white border ${map[color]}`}>
      <div className="flex justify-between items-start">
        <p className="text-sm text-gray-500">{title}</p>
        <span className={iconMap[color]}>{icon}</span>
      </div>
      <p className={`text-2xl font-bold mt-1 ${map[color]}`}>{value}</p>
    </div>
  );
}

interface ItemFormProps {
  formData: ProductServiceRequestDTO;
  setFormData: React.Dispatch<React.SetStateAction<ProductServiceRequestDTO>>;
}

function ItemForm({ formData, setFormData }: ItemFormProps) {
  return (
    <Tabs aria-label="Formulário de item" color="warning" variant="bordered">
      <Tab key="dados" title="Dados Básicos" className="space-y-4">
        <Input
          label="Nome"
          placeholder="Nome do produto ou serviço"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          isRequired
        />

        <Textarea
          label="Descrição"
          placeholder="Descrição detalhada"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          minRows={3}
        />

        <Select
          label="Tipo"
          selectedKeys={[formData.type]}
          onSelectionChange={(k) =>
            setFormData({
              ...formData,
              type: Array.from(k)[0] as "PRODUCT" | "SERVICE",
              price: 0,
              salePrice: 0,
              priceCost: 0,
            })
          }
          isRequired
        >
          <SelectItem key="SERVICE" startContent={<Wrench size={16} />}>
            Serviço
          </SelectItem>
          <SelectItem key="PRODUCT" startContent={<Package size={16} />}>
            Produto
          </SelectItem>
        </Select>
      </Tab>

      <Tab key="precos" title="Preços" className="space-y-4">
        {formData.type === "SERVICE" ? (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-2">
              <Wrench size={16} className="text-blue-500 shrink-0" />
              <p className="text-sm text-blue-700">
                Para serviços, informe apenas o valor cobrado pela mão de obra.
              </p>
            </div>

            <Input
              type="number"
              label="Valor do Serviço"
              placeholder="0,00"
              value={formData.salePrice.toString()}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                setFormData({
                  ...formData,
                  salePrice: val,
                  price: val,
                  priceCost: 0,
                });
              }}
              startContent={<span className="text-sm text-gray-500">R$</span>}
              step="0.01"
              min="0"
              description="Valor cobrado ao cliente por este serviço"
              isRequired
            />
          </>
        ) : (
          <>
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 flex items-center gap-2">
              <Package size={16} className="text-purple-500 shrink-0" />
              <p className="text-sm text-purple-700">
                Para produtos, informe os três preços para cálculo de margem.
              </p>
            </div>

            <Input
              type="number"
              label="Preço de Custo"
              placeholder="0,00"
              value={formData.priceCost.toString()}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  priceCost: parseFloat(e.target.value) || 0,
                })
              }
              startContent={<span className="text-sm text-gray-500">R$</span>}
              step="0.01"
              min="0"
              description="Quanto você paga pelo produto"
            />

            <Input
              type="number"
              label="Preço Padrão"
              placeholder="0,00"
              value={formData.price.toString()}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  price: parseFloat(e.target.value) || 0,
                })
              }
              startContent={<span className="text-sm text-gray-500">R$</span>}
              step="0.01"
              min="0"
              description="Preço de tabela / referência"
            />

            <Input
              type="number"
              label="Preço de Venda"
              placeholder="0,00"
              value={formData.salePrice.toString()}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  salePrice: parseFloat(e.target.value) || 0,
                })
              }
              startContent={<span className="text-sm text-gray-500">R$</span>}
              step="0.01"
              min="0"
              description="Preço cobrado ao cliente"
              isRequired
            />

            {formData.priceCost > 0 && formData.salePrice > 0 && (
              <div className="bg-gray-50 rounded-xl p-3 flex justify-between items-center">
                <span className="text-sm text-gray-500">Margem de lucro</span>
                <span
                  className={`text-sm font-bold ${
                    formData.salePrice >= formData.priceCost
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {(
                    ((formData.salePrice - formData.priceCost) /
                      formData.priceCost) *
                    100
                  ).toFixed(1)}
                  %
                </span>
              </div>
            )}
          </>
        )}
      </Tab>
    </Tabs>
  );
}

export default function ProductsServicesPage() {
  const [data, setData] = useState<ProductServiceDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "PRODUCT" | "SERVICE">(
    "ALL",
  );

  const [editingItem, setEditingItem] = useState<ProductServiceDTO | null>(
    null,
  );
  const [formData, setFormData] = useState<ProductServiceRequestDTO>(emptyForm);

  const [pendingActionId, setPendingActionId] = useState<string | null>(null);

  const {
    isOpen: isCreateOpen,
    onOpen: onCreateOpen,
    onClose: onCreateClose,
  } = useDisclosure();
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const {
    isOpen: isToggleOpen,
    onOpen: onToggleOpen,
    onClose: onToggleClose,
  } = useDisclosure();

  const load = useCallback(async (currentPage = 0) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      params.set("size", "10");

      const res = await apiService.get<PageResponse<ProductServiceDTO>>(
        `items?${params.toString()}`,
      );

      setData(res.content);
      setTotalPages(res.totalPages);
      setTotalElements(res.totalElements);
    } catch {
      addToast({ title: "Erro ao carregar itens", color: "danger" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(0);
  }, []);

  useEffect(() => {
    load(page);
  }, [page]);

  const filteredData = data.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "ALL" || item.type === filterType;
    return matchesSearch && matchesType;
  });

  const totalProducts = data.filter((i) => i.type === "PRODUCT").length;
  const totalServices = data.filter((i) => i.type === "SERVICE").length;
  const totalActive = data.filter((i) => i.active).length;

  function openCreate() {
    setEditingItem(null);
    setFormData(emptyForm);
    onCreateOpen();
  }

  function openEdit(item: ProductServiceDTO) {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || "",
      type: item.type as "PRODUCT" | "SERVICE",
      price: item.price,
      salePrice: item.salePrice,
      priceCost: item.priceCost,
      active: item.active,
    });
    onEditOpen();
  }

  function openDelete(id: string) {
    setPendingActionId(id);
    onDeleteOpen();
  }

  function openToggle(id: string) {
    setPendingActionId(id);
    onToggleOpen();
  }

  async function handleSave() {
    if (!formData.name || !formData.type) {
      addToast({ title: "Preencha nome e tipo", color: "warning" });
      return;
    }

    const isEdit = !!editingItem;
    setActionLoading(isEdit ? "edit" : "create");
    try {
      if (isEdit) {
        await apiService.put(`items/${editingItem!.id}`, formData);
        addToast({ title: "Item atualizado com sucesso!", color: "success" });
        onEditClose();
      } else {
        await apiService.post("items", formData);
        addToast({ title: "Item criado com sucesso!", color: "success" });
        onCreateClose();
      }
      load(page);
    } catch (error: any) {
      addToast({
        title: error?.message || "Erro ao salvar item",
        color: "danger",
      });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete() {
    if (!pendingActionId) return;
    setActionLoading(pendingActionId);
    try {
      await apiService.delete(`items/${pendingActionId}`);
      onDeleteClose();
      addToast({ title: "Item excluído com sucesso!", color: "success" });
      load(page);
    } catch (error: any) {
      addToast({
        title: error?.message || "Erro ao excluir item",
        color: "danger",
      });
    } finally {
      setActionLoading(null);
      setPendingActionId(null);
    }
  }

  async function handleToggle() {
    if (!pendingActionId) return;
    setActionLoading(pendingActionId);
    try {
      await apiService.patch(`items/${pendingActionId}/active`, {});
      onToggleClose();
      addToast({ title: "Status atualizado com sucesso!", color: "success" });
      load(page);
    } catch (error: any) {
      addToast({
        title: error?.message || "Erro ao atualizar status",
        color: "danger",
      });
    } finally {
      setActionLoading(null);
      setPendingActionId(null);
    }
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
            <h2 className="text-3xl font-bold text-white">
              Produtos e Serviços
            </h2>
            <p className="text-gray-500">
              Catálogo de itens utilizados nas ordens de serviço
            </p>
          </div>
          <Button
            color="warning"
            className="text-black"
            startContent={<Plus size={16} />}
            onPress={openCreate}
          >
            Novo Item
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SummaryCard
            title="Total de Itens"
            value={totalElements}
            icon={<Tag size={20} />}
            color="blue"
          />
          <SummaryCard
            title="Serviços"
            value={totalServices}
            icon={<Wrench size={20} />}
            color="orange"
          />
          <SummaryCard
            title="Produtos"
            value={totalProducts}
            icon={<Package size={20} />}
            color="purple"
          />
          <SummaryCard
            title="Ativos"
            value={totalActive}
            icon={<ShoppingCart size={20} />}
            color="green"
          />
        </div>

        <div className="bg-white rounded-2xl shadow p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input
              className="md:col-span-2 mt-4"
              placeholder="Buscar por nome ou descrição"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              startContent={<Search size={16} />}
            />

            <Select
              placeholder="Filtrar por tipo"
              selectedKeys={[filterType]}
              onSelectionChange={(k) =>
                setFilterType(
                  (Array.from(k)[0] as "ALL" | "PRODUCT" | "SERVICE") || "ALL",
                )
              }
            >
              <SelectItem key="ALL">Todos</SelectItem>
              <SelectItem key="SERVICE">Serviços</SelectItem>
              <SelectItem key="PRODUCT">Produtos</SelectItem>
            </Select>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="light"
              onClick={() => {
                setSearchTerm("");
                setFilterType("ALL");
              }}
            >
              Limpar
            </Button>
            <Button
              color="warning"
              className="text-black"
              onClick={() => load(0)}
            >
              Buscar
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
              <Table className="text-white">
                <TableHeader>
                  <TableColumn>Nome</TableColumn>
                  <TableColumn>Tipo</TableColumn>
                  <TableColumn>Preço de Custo</TableColumn>
                  <TableColumn>Preço Padrão</TableColumn>
                  <TableColumn>Preço de Venda</TableColumn>
                  <TableColumn>Status</TableColumn>
                  <TableColumn>Ações</TableColumn>
                </TableHeader>

                <TableBody emptyContent="Nenhum item encontrado">
                  {filteredData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-semibold">{item.name}</p>
                          {item.description && (
                            <p className="text-xs text-gray-400 truncate max-w-[200px]">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <Chip
                          size="sm"
                          color={
                            item.type === "SERVICE" ? "primary" : "secondary"
                          }
                          variant="flat"
                          startContent={
                            item.type === "SERVICE" ? (
                              <Wrench size={12} />
                            ) : (
                              <Package size={12} />
                            )
                          }
                        >
                          {item.type === "SERVICE" ? "Serviço" : "Produto"}
                        </Chip>
                      </TableCell>

                      <TableCell className="text-gray-600">
                        {formatCurrency(Number(item.priceCost))}
                      </TableCell>

                      <TableCell className="text-gray-600">
                        {formatCurrency(Number(item.price))}
                      </TableCell>

                      <TableCell className="font-semibold text-green-700">
                        {formatCurrency(Number(item.salePrice))}
                      </TableCell>

                      <TableCell>
                        <Chip
                          color={item.active ? "success" : "danger"}
                          variant="flat"
                        >
                          {item.active ? "Ativo" : "Inativo"}
                        </Chip>
                      </TableCell>

                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            isIconOnly
                            color="warning"
                            isLoading={actionLoading === item.id}
                            onClick={() => openEdit(item)}
                            title="Editar item"
                          >
                            <Edit size={16} />
                          </Button>

                          <Button
                            size="sm"
                            isIconOnly
                            color={item.active ? "danger" : "success"}
                            isLoading={actionLoading === item.id}
                            onClick={() => openToggle(item.id)}
                            title={item.active ? "Desativar" : "Ativar"}
                          >
                            {item.active ? (
                              <ToggleRight size={16} />
                            ) : (
                              <ToggleLeft size={16} />
                            )}
                          </Button>

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
                            <DropdownMenu aria-label="Ações do item">
                              <DropdownItem
                                key="delete"
                                className="text-danger"
                                color="danger"
                                startContent={<Trash2 size={16} />}
                                onPress={() => openDelete(item.id)}
                              >
                                Excluir
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
                  Página {page + 1} de {totalPages || 1}
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

      <Modal
        isOpen={isCreateOpen}
        onClose={onCreateClose}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>Novo Item</ModalHeader>
          <ModalBody>
            <ItemForm formData={formData} setFormData={setFormData} />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onCreateClose}>
              Cancelar
            </Button>
            <Button
              color="warning"
              className="text-black"
              isLoading={actionLoading === "create"}
              onPress={handleSave}
            >
              Criar Item
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isEditOpen}
        onClose={onEditClose}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>Editar Item</ModalHeader>
          <ModalBody>
            <ItemForm formData={formData} setFormData={setFormData} />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onEditClose}>
              Cancelar
            </Button>
            <Button
              color="warning"
              className="text-black"
              isLoading={actionLoading === "edit"}
              onPress={handleSave}
            >
              Atualizar Item
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <ConfirmModal
        isOpen={isToggleOpen}
        onClose={() => {
          onToggleClose();
          setPendingActionId(null);
        }}
        onConfirm={handleToggle}
        title="Mudar Status"
        message="Deseja alterar o status deste item?"
        confirmText="Sim, Alterar"
        variant="warning"
        isLoading={!!actionLoading}
      />

      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => {
          onDeleteClose();
          setPendingActionId(null);
        }}
        onConfirm={handleDelete}
        title="Excluir Item"
        message="Tem certeza que deseja excluir este item? Esta ação não poderá ser desfeita."
        confirmText="Sim, Excluir"
        cancelText="Não, Voltar"
        variant="danger"
        isLoading={!!actionLoading}
      />
    </AppLayout>
  );
}
