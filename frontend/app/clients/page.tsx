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
  Textarea,
  Tab,
  Tabs,
  Pagination,
} from "@heroui/react";
import {
  Plus,
  Search,
  Trash2,
  Edit,
  MoreVertical,
  FileDown,
  Users,
  RotateCcw,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ConfirmModal } from "@/components/ConfirmModal";
import { ClientDTO, ClientRequestDTO } from "@/types";

// Interface para a resposta do backend
interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export default function ClientsPage() {
  const [data, setData] = useState<ClientDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isFetchingCep, setIsFetchingCep] = useState(false);

  // ✅ Paginação corrigida
  const [page, setPage] = useState(1); // 1-indexed para componente Pagination
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // ✅ Busca corrigida
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
    isOpen: isDeleteConfirmOpen,
    onOpen: onDeleteConfirmOpen,
    onClose: onDeleteConfirmClose,
  } = useDisclosure();

  const {
    isOpen: isReactivateConfirmOpen,
    onOpen: onReactivateConfirmOpen,
    onClose: onReactivateConfirmClose,
  } = useDisclosure();

  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [editingClient, setEditingClient] = useState<ClientDTO | null>(null);

  const [formData, setFormData] = useState<ClientRequestDTO>({
    name: "",
    document: "",
    type: "PF",
    address: {
      cep: "",
      publicPlace: "",
      number: "",
      complement: "",
      district: "",
      city: "",
      state: "",
    },
    contact: {
      email: "",
      telephone: "",
      cellPhone: "",
    },
    notes: "",
  });

  // ✅ Load com paginação e busca corretos
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      // page é 0-indexed no backend, mas Pagination usa 1-indexed
      params.set("page", String(page - 1));
      params.set("size", "20"); // Mantenha em sync com PageableDefault do backend

      // ✅ Usar "search" em vez de "searchTerm"
      if (searchTerm) {
        params.set("search", searchTerm);
      }

      const res = await apiService.get<PageResponse<ClientDTO>>(
        `clients?${params.toString()}`,
      );

      setData(res.content);
      setTotalPages(res.totalPages);
      setTotalElements(res.totalElements);

      setTotals({
        active: res.content.filter((c) => c.active).length,
        inactive: res.content.filter((c) => !c.active).length,
      });
    } catch (error: any) {
      addToast({
        title: "Erro ao carregar clientes",
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm]);

  useEffect(() => {
    load();
  }, [load]);

  function handleSearch(value: string) {
    setSearchTerm(value);
    setPage(1); // ✅ Reset para primeira página ao buscar
  }

  function formatDocument(value: string, type: "PF" | "PJ"): string {
    const numbers = value.replace(/\D/g, "");

    if (type === "PF") {
      return numbers
        .slice(0, 11)
        .replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    } else {
      return numbers
        .slice(0, 14)
        .replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    }
  }

  function validateDocument(doc: string, type: "PF" | "PJ"): boolean {
    const numbers = doc.replace(/\D/g, "");
    if (type === "PF" && numbers.length !== 11) {
      addToast({
        title: "CPF deve conter 11 dígitos",
        color: "warning",
      });
      return false;
    }
    if (type === "PJ" && numbers.length !== 14) {
      addToast({
        title: "CNPJ deve conter 14 dígitos",
        color: "warning",
      });
      return false;
    }
    return true;
  }

  function openCreateModal() {
    setEditingClient(null);
    setFormData({
      name: "",
      document: "",
      type: "PF",
      address: {
        cep: "",
        publicPlace: "",
        number: "",
        complement: "",
        district: "",
        city: "",
        state: "",
      },
      contact: {
        email: "",
        telephone: "",
        cellPhone: "",
      },
      notes: "",
    });
    onCreateOpen();
  }

  function openEditModal(client: ClientDTO) {
    setEditingClient(client);
    setFormData({
      name: client.name,
      document: client.document,
      type: client.type,
      address: client.address || {
        cep: "",
        publicPlace: "",
        number: "",
        complement: "",
        district: "",
        city: "",
        state: "",
      },
      contact: client.contact || {
        email: "",
        telephone: "",
        cellPhone: "",
      },
      notes: client.notes || "",
    });
    onEditOpen();
  }

  async function handleCepChange(value: string) {
    const cepLimpo = value.replace(/\D/g, "");

    setFormData((prev) => ({
      ...prev,
      address: { ...prev.address, cep: cepLimpo },
    }));

    if (cepLimpo.length === 8) {
      setIsFetchingCep(true);
      try {
        const response = await fetch(
          `https://viacep.com.br/ws/${cepLimpo}/json/`,
        );
        const data = await response.json();

        if (!data.erro) {
          setFormData((prev) => ({
            ...prev,
            address: {
              ...prev.address,
              cep: cepLimpo,
              publicPlace: data.logradouro || prev.address?.publicPlace,
              district: data.bairro || prev.address?.district,
              city: data.localidade || prev.address?.city,
              state: data.uf || prev.address?.state,
            },
          }));
          addToast({ title: "Endereço encontrado!", color: "success" });
        } else {
          addToast({ title: "CEP não encontrado.", color: "warning" });
        }
      } catch (error) {
        addToast({ title: "Erro ao buscar CEP.", color: "danger" });
      } finally {
        setIsFetchingCep(false);
      }
    }
  }

  async function handleSave() {
    if (!formData.name || !formData.document) {
      addToast({
        title: "Preencha nome e documento",
        color: "warning",
      });
      return;
    }

    if (!validateDocument(formData.document, formData.type)) {
      return;
    }

    setActionLoading(editingClient ? "edit" : "create");
    try {
      if (editingClient) {
        await apiService.put(`clients/${editingClient.id}`, formData);
        addToast({
          title: "Cliente atualizado com sucesso!",
          color: "success",
        });
        onEditClose();
      } else {
        await apiService.post("clients", formData);
        addToast({
          title: "Cliente criado com sucesso!",
          color: "success",
        });
        onCreateClose();
      }

      load();
    } catch (error: any) {
      addToast({
        title: error?.message || "Erro ao salvar cliente",
        color: "danger",
      });
    } finally {
      setActionLoading(null);
    }
  }

  function deleteClient(id: string) {
    setPendingActionId(id);
    onDeleteConfirmOpen();
  }

  async function confirmDelete() {
    if (!pendingActionId) return;
    setActionLoading(pendingActionId);
    try {
      await apiService.delete(`clients/${pendingActionId}`);
      onDeleteConfirmClose();
      addToast({
        title: "Cliente desativado com sucesso!",
        color: "success",
      });
      load();
    } catch (error: any) {
      addToast({
        title: error?.message || "Erro ao desativar cliente",
        color: "danger",
      });
    } finally {
      setActionLoading(null);
      setPendingActionId(null);
    }
  }

  function reactivateClient(id: string) {
    setPendingActionId(id);
    onReactivateConfirmOpen();
  }

  async function confirmReactivate() {
    if (!pendingActionId) return;
    setActionLoading(pendingActionId);
    try {
      await apiService.post(`clients/${pendingActionId}/reactivate`, {});
      onReactivateConfirmClose();
      addToast({
        title: "Cliente reativado com sucesso!",
        color: "success",
      });
      load();
    } catch (error: any) {
      addToast({
        title: error?.message || "Erro ao reativar cliente",
        color: "danger",
      });
    } finally {
      setActionLoading(null);
      setPendingActionId(null);
    }
  }

  const typeLabel = {
    PF: "Pessoa Física",
    PJ: "Pessoa Jurídica",
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
            <h2 className="text-3xl font-bold text-white">Clientes</h2>
            <p className="text-gray-500">
              Gerenciamento de clientes e contatos
            </p>
          </div>
          <Button
            color="warning"
            className="text-black"
            startContent={<Plus size={16} />}
            onPress={openCreateModal}
          >
            Novo Cliente
          </Button>
        </div>

        <div className="bg-white rounded-2xl shadow p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input
              className="mt-4 md:col-span-3"
              placeholder="Buscar por nome, documento ou contato"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              startContent={<Search size={16} />}
              onKeyDown={(e) => e.key === "Enter" && load()}
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
                  <TableColumn>Documento</TableColumn>
                  <TableColumn>Tipo</TableColumn>
                  <TableColumn>Contato</TableColumn>
                  <TableColumn>Status</TableColumn>
                  <TableColumn>Ações</TableColumn>
                </TableHeader>

                <TableBody emptyContent="Nenhum cliente encontrado">
                  {data.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-semibold">
                        {client.name}
                      </TableCell>
                      <TableCell>
                        {formatDocument(client.document, client.type)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="sm"
                          color={client.type === "PF" ? "primary" : "secondary"}
                          variant="flat"
                        >
                          {typeLabel[client.type]}
                        </Chip>
                      </TableCell>
                      <TableCell>{client.contact?.email || "-"}</TableCell>
                      <TableCell>
                        <Chip
                          color={client.active ? "success" : "danger"}
                          variant="flat"
                        >
                          {client.active ? "Ativo" : "Inativo"}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {client.active && (
                            <Button
                              size="sm"
                              isIconOnly
                              color="warning"
                              isLoading={actionLoading === client.id}
                              onClick={() => openEditModal(client)}
                              title="Editar cliente"
                            >
                              <Edit size={16} />
                            </Button>
                          )}
                          {client.active && (
                            <Button
                              size="sm"
                              isIconOnly
                              color="danger"
                              isLoading={actionLoading === client.id}
                              onClick={() => deleteClient(client.id)}
                              title="Desativar cliente"
                            >
                              <Trash2 size={16} />
                            </Button>
                          )}
                          {!client.active && (
                            <Button
                              size="sm"
                              isIconOnly
                              color="success"
                              isLoading={actionLoading === client.id}
                              onClick={() => reactivateClient(client.id)}
                              title="Reativar cliente"
                            >
                              <RotateCcw size={16} />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex justify-between items-center mt-6">
                <span className="text-sm text-gray-500">
                  Página {page} de {totalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    isDisabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Anterior
                  </Button>
                  <Button
                    size="sm"
                    isDisabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Modal com TABS */}
      <Modal
        isOpen={isCreateOpen || isEditOpen}
        onClose={() => {
          onCreateClose();
          onEditClose();
        }}
        size="3xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            {editingClient ? "Editar Cliente" : "Novo Cliente"}
          </ModalHeader>

          <ModalBody>
            <Tabs
              aria-label="Formulário de Cliente"
              color="warning"
              variant="bordered"
            >
              <Tab key="basicos" title="Dados Básicos" className="space-y-4">
                <Input
                  label="Nome"
                  placeholder="Nome ou razão social"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  isRequired
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Select
                    label="Tipo"
                    selectedKeys={[formData.type]}
                    onSelectionChange={(k) =>
                      setFormData({
                        ...formData,
                        type: Array.from(k)[0] as any,
                      })
                    }
                    isRequired
                  >
                    <SelectItem key="PF">Pessoa Física (CPF)</SelectItem>
                    <SelectItem key="PJ">Pessoa Jurídica (CNPJ)</SelectItem>
                  </Select>

                  <Input
                    label={formData.type === "PF" ? "CPF" : "CNPJ"}
                    placeholder={
                      formData.type === "PF"
                        ? "000.000.000-00"
                        : "00.000.000/0000-00"
                    }
                    value={formatDocument(formData.document, formData.type)}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, "");
                      setFormData({ ...formData, document: raw });
                    }}
                    isRequired
                  />
                </div>
              </Tab>

              <Tab key="contato" title="Contato" className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  placeholder="contato@example.com"
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

              <Tab key="endereco" title="Endereço" className="space-y-4">
                <Input
                  label="CEP"
                  placeholder="Apenas números (Ex: 01001000)"
                  maxLength={8}
                  value={formData.address?.cep || ""}
                  onChange={(e) => handleCepChange(e.target.value)}
                  endContent={
                    isFetchingCep ? <Spinner size="sm" color="warning" /> : null
                  }
                />

                <Input
                  label="Rua/Avenida"
                  placeholder="Rua, Avenida, etc"
                  value={formData.address?.publicPlace || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: {
                        ...formData.address,
                        publicPlace: e.target.value,
                      },
                    })
                  }
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    label="Número"
                    placeholder="123"
                    value={formData.address?.number || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: {
                          ...formData.address,
                          number: e.target.value,
                        },
                      })
                    }
                  />

                  <Input
                    label="Complemento"
                    placeholder="Apto 101, Fundos, etc"
                    value={formData.address?.complement || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: {
                          ...formData.address,
                          complement: e.target.value,
                        },
                      })
                    }
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input
                    label="Bairro"
                    placeholder="Bairro"
                    value={formData.address?.district || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: {
                          ...formData.address,
                          district: e.target.value,
                        },
                      })
                    }
                  />

                  <Input
                    label="Cidade"
                    placeholder="Cidade"
                    value={formData.address?.city || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, city: e.target.value },
                      })
                    }
                  />

                  <Input
                    label="Estado"
                    placeholder="SP"
                    maxLength={2}
                    value={formData.address?.state || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: {
                          ...formData.address,
                          state: e.target.value.toUpperCase(),
                        },
                      })
                    }
                  />
                </div>
              </Tab>

              <Tab key="observacoes" title="Observações" className="space-y-4">
                <Textarea
                  label="Observações"
                  placeholder="Informações adicionais sobre o cliente"
                  value={formData.notes || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={4}
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
              {editingClient ? "Atualizar" : "Criar"} Cliente
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          onDeleteConfirmClose();
          setPendingActionId(null);
        }}
        onConfirm={confirmDelete}
        title="Desativar Cliente"
        message="Tem certeza que deseja desativar este cliente? Você poderá reativar depois."
        confirmText="Sim, Desativar"
        variant="danger"
        isLoading={!!actionLoading}
      />

      <ConfirmModal
        isOpen={isReactivateConfirmOpen}
        onClose={() => {
          onReactivateConfirmClose();
          setPendingActionId(null);
        }}
        onConfirm={confirmReactivate}
        title="Reativar Cliente"
        message="Deseja reativar este cliente?"
        confirmText="Sim, Reativar"
        variant="success"
        isLoading={!!actionLoading}
      />
    </AppLayout>
  );
}
