"use client";

import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Chip,
  Divider,
  Input,
  Select,
  SelectItem,
} from "@heroui/react";
import {
  CheckCircle,
  RotateCcw,
  Trash2,
  Edit,
  X,
  Save,
  Receipt,
} from "lucide-react";
import { FinancialTitleDTO } from "@/types";

interface FinancialTitleDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: FinancialTitleDTO | null;
  onPay: (title: FinancialTitleDTO) => void;
  onReverse: (id: string) => void;
  onCancel: (id: string) => void;
  onUpdate: (id: string, data: Partial<FinancialTitleDTO>) => void;
  onGenerateSlip: (id: string) => void;
  isLoading?: boolean;
}

export function FinancialTitleDetailsModal({
  isOpen,
  onClose,
  title,
  onPay,
  onReverse,
  onCancel,
  onUpdate,
  onGenerateSlip,
  isLoading = false,
}: FinancialTitleDetailsModalProps) {
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    description: "",
    category: "",
    originalValue: "",
    dueDate: "",
    paymentMethod: "",
  });

  if (!title) return null;

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

  function handleEditClick() {
    setEditData({
      description: title.description,
      category: title.category,
      originalValue: String(title.originalValue),
      dueDate: title.dueDate,
      paymentMethod: "BANK_SLIP",
    });
    setEditMode(true);
  }

  function handleSaveEdit() {
    onUpdate(title.id, {
      description: editData.description,
      category: editData.category,
      originalValue: parseFloat(editData.originalValue),
      dueDate: editData.dueDate,
    });
    setEditMode(false);
  }

  function handleCancelEdit() {
    setEditMode(false);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl">
      <ModalContent>
        <ModalHeader className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">Detalhes do Título</h3>
            <p className="text-sm text-gray-500 font-normal">ID: {title.id}</p>
          </div>
          <Chip color={statusColor[title.status]} variant="flat" size="lg">
            {statusLabel[title.status]}
          </Chip>
        </ModalHeader>

        <ModalBody className="space-y-6">
          {editMode ? (
            <div className="space-y-4">
              <Input
                label="Descrição"
                value={editData.description}
                onChange={(e) =>
                  setEditData({ ...editData, description: e.target.value })
                }
                isRequired
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Categoria"
                  value={editData.category}
                  onChange={(e) =>
                    setEditData({ ...editData, category: e.target.value })
                  }
                  isRequired
                />

                <Input
                  type="number"
                  label="Valor"
                  value={editData.originalValue}
                  onChange={(e) =>
                    setEditData({ ...editData, originalValue: e.target.value })
                  }
                  startContent={
                    <span className="text-sm text-gray-500">R$</span>
                  }
                  isRequired
                />
              </div>

              <Input
                type="date"
                label="Data de Vencimento"
                value={editData.dueDate}
                onChange={(e) =>
                  setEditData({ ...editData, dueDate: e.target.value })
                }
                isRequired
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Descrição</p>
                <p className="text-lg font-semibold">{title.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Categoria</p>
                  <p className="font-medium">{title.category}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Tipo</p>
                  <Chip
                    size="sm"
                    color={title.type === "INCOME" ? "success" : "danger"}
                    variant="flat"
                  >
                    {title.type === "INCOME" ? "Receita" : "Despesa"}
                  </Chip>
                </div>
              </div>
              <Divider />
              <div>
                <p className="text-sm text-gray-500 mb-2">Valores</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-700 p-3 rounded-lg">
                    <p className="text-xs text-white">Valor Original</p>
                    <p className="text-xl font-bold text-white">
                      {title.originalValue.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </p>
                  </div>

                  {title.paidValue > 0 && (
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-xs text-green-600">Valor Pago</p>
                      <p className="text-xl font-bold text-green-700">
                        {title.paidValue.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <Divider />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Data de Vencimento</p>
                  <p className="font-medium">
                    {new Date(title.dueDate + "T00:00:00").toLocaleDateString(
                      "pt-BR",
                    )}
                  </p>
                </div>

                {title.paymentDate && (
                  <div>
                    <p className="text-sm text-gray-500">Data de Pagamento</p>
                    <p className="font-medium">
                      {new Date(
                        title.paymentDate + "T00:00:00",
                      ).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </ModalBody>

        <ModalFooter className="flex justify-between">
          {editMode ? (
            <>
              <Button
                variant="light"
                startContent={<X size={16} />}
                onClick={handleCancelEdit}
              >
                Cancelar
              </Button>
              <Button
                color="success"
                startContent={<Save size={16} />}
                onClick={handleSaveEdit}
                isLoading={isLoading}
              >
                Salvar Alterações
              </Button>
            </>
          ) : (
            <>
              <div className="flex gap-2">
                {title.status === "OPEN" || title.status === "DELAYED" && (
                  <>
                    <Button
                      color="success"
                      startContent={<CheckCircle size={16} />}
                      onClick={() => onPay(title)}
                      isLoading={isLoading}
                    >
                      Pagar
                    </Button>
                    <Button
                      color="warning"
                      variant="flat"
                      startContent={<Receipt size={16} />}
                      onClick={() => onGenerateSlip(title.id)}
                      isLoading={isLoading}
                    >
                      Gerar Boleto
                    </Button>
                  </>
                )}

                {title.status === "PAID" && (
                  <Button
                    color="warning"
                    startContent={<RotateCcw size={16} />}
                    onClick={() => onReverse(title.id)}
                    isLoading={isLoading}
                  >
                    Estornar
                  </Button>
                )}
              </div>

              <div className="flex gap-2">
                {title.status === "OPEN" && (
                  <Button
                    variant="light"
                    startContent={<Edit size={16} />}
                    onClick={handleEditClick}
                  >
                    Editar
                  </Button>
                )}

                {title.status !== "PAID" && (
                  <Button
                    color="danger"
                    variant="light"
                    startContent={<Trash2 size={16} />}
                    onClick={() => onCancel(title.id)}
                    isLoading={isLoading}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
