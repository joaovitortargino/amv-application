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
  Textarea,
  Tab,
  Tabs,
} from "@heroui/react";
import {
  Plus,
  Search,
  Trash2,
  Edit,
  MoreVertical,
  FileDown,
  Wrench,
  ToggleRight,
  ToggleLeft,
  Eye,
} from "lucide-react";
import { ConfirmModal } from "@/components/ConfirmModal";
import { MechanicDTO, MechanicRequestDTO } from "@/types";
import MechanicDetailsModal from "@/components/MechanicDetailsModal";

export default function MechanicsPage() {
  const [data, setData] = useState<MechanicDTO[]>([]);
  const [filteredData, setFilteredData] = useState<MechanicDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");

  const [totals, setTotals] = useState({
    active: 0,
    inactive: 0,
  });

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
    isOpen: isToggleConfirmOpen,
    onOpen: onToggleConfirmOpen,
    onClose: onToggleConfirmClose,
  } = useDisclosure();

  const {
    isOpen: isDetailsOpen,
    onOpen: onDetailsOpen,
    onClose: onDetailsClose,
  } = useDisclosure();

  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [editingMechanic, setEditingMechanic] = useState<MechanicDTO | null>(
    null,
  );

  const [formData, setFormData] = useState<MechanicRequestDTO>({
    name: "",
    document: "",
    contact: {
      email: "",
      telephone: "",
      cellPhone: "",
    },
    active: true,
    standardCommissionPercentage: 0,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiService.get<MechanicDTO[]>("mechanics/active");

      setData(res);
      filterData(res, searchTerm);

      setTotals({
        active: res.filter((m) => m.active).length,
        inactive: res.filter((m) => !m.active).length,
      });
    } catch (error: any) {
      addToast({
        title: "Erro ao carregar mecânicos",
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  function filterData(mechanics: MechanicDTO[], term: string) {
    const lowerTerm = term.toLowerCase();
    const filtered = mechanics.filter(
      (m) =>
        m.name.toLowerCase().includes(lowerTerm) ||
        m.document.includes(lowerTerm) ||
        m.contact?.email?.toLowerCase().includes(lowerTerm),
    );
    setFilteredData(filtered);
  }

  useEffect(() => {
    load();
  }, [load]);

  function handleSearch(value: string) {
    setSearchTerm(value);
    filterData(data, value);
  }

  function formatCPF(value: string): string {
    const numbers = value.replace(/\D/g, "");
    return numbers
      .slice(0, 11)
      .replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }

  function validateCPF(doc: string): boolean {
    const numbers = doc.replace(/\D/g, "");
    if (numbers.length !== 11) {
      addToast({
        title: "CPF deve conter 11 dígitos",
        color: "warning",
      });
      return false;
    }
    return true;
  }

  function openCreateModal() {
    setEditingMechanic(null);
    setFormData({
      name: "",
      document: "",
      contact: {
        email: "",
        telephone: "",
        cellPhone: "",
      },
      active: true,
      standardCommissionPercentage: 0,
    });
    onCreateOpen();
  }

  function openDetailsModal(mechanic: MechanicDTO) {
    setEditingMechanic(mechanic);
    onDetailsOpen();
  }

  function openEditModal(mechanic: MechanicDTO) {
    setEditingMechanic(mechanic);
    setFormData({
      name: mechanic.name,
      document: mechanic.document,
      contact: mechanic.contact || {
        email: "",
        telephone: "",
        cellPhone: "",
      },
      active: mechanic.active,
      standardCommissionPercentage: mechanic.standardCommissionPercentage,
    });
    onEditOpen();
  }

  async function handleSave() {
    if (!formData.name || !formData.document) {
      addToast({
        title: "Preencha nome e CPF",
        color: "warning",
      });
      return;
    }

    if (!validateCPF(formData.document)) {
      return;
    }

    if (formData.standardCommissionPercentage < 0) {
      addToast({
        title: "Comissão não pode ser negativa",
        color: "warning",
      });
      return;
    }

    setActionLoading(editingMechanic ? "edit" : "create");
    try {
      if (editingMechanic) {
        await apiService.put(`mechanics/${editingMechanic.id}`, formData);
        addToast({
          title: "Mecânico atualizado com sucesso!",
          color: "success",
        });
        onEditClose();
      } else {
        await apiService.post("mechanics", formData);
        addToast({
          title: "Mecânico criado com sucesso!",
          color: "success",
        });
        onCreateClose();
      }

      load();
    } catch (error: any) {
      addToast({
        title: error?.message || "Erro ao salvar mecânico",
        color: "danger",
      });
    } finally {
      setActionLoading(null);
    }
  }

  function toggleMechanic(id: string) {
    setPendingActionId(id);
    onToggleConfirmOpen();
  }

  async function confirmToggle() {
    if (!pendingActionId) return;
    setActionLoading(pendingActionId);
    try {
      await apiService.patch(`mechanics/${pendingActionId}/active`, {});
      onToggleConfirmClose();
      addToast({
        title: "Status atualizado com sucesso!",
        color: "success",
      });
      load();
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
            <h2 className="text-3xl font-bold text-white">Mecânicos</h2>
            <p className="text-gray-500">
              Gerenciamento de mecânicos e comissões
            </p>
          </div>
          <Button
            color="warning"
            className="text-black"
            startContent={<Plus size={16} />}
            onPress={openCreateModal}
          >
            Novo Mecânico
          </Button>
        </div>

        <div className="bg-white rounded-2xl shadow p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input
              className="mt-4 md:col-span-3"
              placeholder="Buscar por nome, CPF ou email"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              startContent={<Search size={16} />}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              color="warning"
              className="text-black"
              onClick={() => load()}
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
                  <TableColumn>CPF</TableColumn>
                  <TableColumn>Email</TableColumn>
                  <TableColumn>Comissão</TableColumn>
                  <TableColumn>Status</TableColumn>
                  <TableColumn>Ações</TableColumn>
                </TableHeader>

                <TableBody emptyContent="Nenhum mecânico encontrado">
                  {filteredData.map((mechanic) => (
                    <TableRow key={mechanic.id}>
                      <TableCell className="font-semibold">
                        {mechanic.name}
                      </TableCell>
                      <TableCell>{formatCPF(mechanic.document)}</TableCell>
                      <TableCell>{mechanic.contact?.email || "-"}</TableCell>
                      <TableCell>
                        {mechanic.standardCommissionPercentage.toFixed(2)}%
                      </TableCell>
                      <TableCell>
                        <Chip
                          color={mechanic.active ? "success" : "danger"}
                          variant="flat"
                        >
                          {mechanic.active ? "Ativo" : "Inativo"}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            isIconOnly
                            color="warning"
                            isLoading={actionLoading === mechanic.id}
                            onClick={() => openEditModal(mechanic)}
                            title="Editar mecânico"
                          >
                            <Edit size={16} />
                          </Button>

                          <Button
                            size="sm"
                            isIconOnly
                            color={mechanic.active ? "danger" : "success"}
                            isLoading={actionLoading === mechanic.id}
                            onClick={() => toggleMechanic(mechanic.id)}
                            title={
                              mechanic.active
                                ? "Desativar mecânico"
                                : "Ativar mecânico"
                            }
                          >
                            {mechanic.active ? (
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
                            <DropdownMenu aria-label="Ações do mecânico">
                              <DropdownItem
                                onClick={() => openDetailsModal(mechanic)}
                                key="view"
                                startContent={<Eye size={16} />}
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
            </>
          )}
        </div>
      </motion.div>

      <Modal
        isOpen={isCreateOpen || isEditOpen}
        onClose={() => {
          onCreateClose();
          onEditClose();
        }}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            {editingMechanic ? "Editar Mecânico" : "Novo Mecânico"}
          </ModalHeader>

          <ModalBody>
            <Tabs
              aria-label="Formulário de Mecânico"
              color="warning"
              variant="bordered"
            >
              <Tab key="basicos" title="Dados Básicos" className="space-y-4">
                <Input
                  label="Nome"
                  placeholder="Nome completo"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  isRequired
                />

                <Input
                  label="CPF"
                  placeholder="000.000.000-00"
                  value={formatCPF(formData.document)}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "");
                    setFormData({ ...formData, document: raw });
                  }}
                  isRequired
                />

                <Input
                  type="number"
                  label="Comissão Padrão (%)"
                  placeholder="Ex: 10.5"
                  value={formData.standardCommissionPercentage.toString()}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      standardCommissionPercentage:
                        parseFloat(e.target.value) || 0,
                    })
                  }
                  step="0.1"
                  min="0"
                  isRequired
                />
              </Tab>

              <Tab key="contato" title="Contato" className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  placeholder="mecanico@example.com"
                  value={formData.contact?.email || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contact: {
                        ...formData.contact,
                        email: e.target.value,
                      },
                    })
                  }
                />

                <Input
                  label="Telefone"
                  placeholder="(11) 3333-0000"
                  value={formData.contact?.telephone || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contact: {
                        ...formData.contact,
                        telephone: e.target.value,
                      },
                    })
                  }
                />

                <Input
                  label="Celular"
                  placeholder="(11) 99999-0000"
                  value={formData.contact?.cellPhone || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contact: {
                        ...formData.contact,
                        cellPhone: e.target.value,
                      },
                    })
                  }
                />
              </Tab>
            </Tabs>
          </ModalBody>

          <ModalFooter>
            <Button
              variant="light"
              onClick={() => {
                onCreateClose();
                onEditClose();
              }}
            >
              Cancelar
            </Button>
            <Button
              color="warning"
              className="text-black"
              isLoading={actionLoading === "create" || actionLoading === "edit"}
              onClick={handleSave}
            >
              {editingMechanic ? "Atualizar" : "Criar"} Mecânico
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isDetailsOpen}
        onClose={() => {
          onDetailsClose();
        }}
        size="4xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>Detalhes do Mecânico</ModalHeader>
          <ModalBody>
            <MechanicDetailsModal mechanic={editingMechanic} />
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onClick={() => {
                onDetailsClose();
              }}
            >
              Fechar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <ConfirmModal
        isOpen={isToggleConfirmOpen}
        onClose={() => {
          onToggleConfirmClose();
          setPendingActionId(null);
        }}
        onConfirm={confirmToggle}
        title="Mudar Status"
        message="Deseja alterar o status deste mecânico?"
        confirmText="Sim, Alterar"
        variant="warning"
        isLoading={!!actionLoading}
      />
    </AppLayout>
  );
}
