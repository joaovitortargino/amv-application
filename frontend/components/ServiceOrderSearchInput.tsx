"use client";

import { useState, useEffect, useRef } from "react";
import { Input, Card, Chip, Spinner } from "@heroui/react";
import { Search, X } from "lucide-react";
import { apiService } from "@/services/api";
import { ServiceOrderDTO } from "@/types";

interface ServiceOrderSearchInputProps {
  clientId: string | null;
  selectedOrders: ServiceOrderDTO[];
  onAdd: (order: ServiceOrderDTO) => void;
  onRemove: (orderId: string) => void;
}

export function ServiceOrderSearchInput({
  clientId,
  selectedOrders,
  onAdd,
  onRemove,
}: ServiceOrderSearchInputProps) {
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState<ServiceOrderDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!clientId || search.length < 2) {
      setOrders([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await apiService.get<ServiceOrderDTO[]>(
          `service-orders/client/${clientId}`,
        );
        const filtered = res.filter(
          (os) =>
            os.osNumber.toLowerCase().includes(search.toLowerCase()) &&
            os.status === "FINISHED" &&
            !selectedOrders.some((sel) => sel.id === os.id),
        );
        setOrders(filtered);
        setShowDropdown(true);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search, clientId, selectedOrders]);

  function handleSelect(order: ServiceOrderDTO) {
    onAdd(order);
    setSearch("");
    setOrders([]);
    setShowDropdown(false);
  }

  return (
    <div className="space-y-2">
      <div ref={wrapperRef} className="relative">
        <Input
          label="Ordens de Serviço"
          placeholder={
            clientId
              ? "Digite o número da OS..."
              : "Selecione um cliente primeiro"
          }
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          startContent={<Search size={16} />}
          endContent={
            loading ? (
              <Spinner size="sm" variant="wave" color="warning" />
            ) : null
          }
          isDisabled={!clientId}
        />

        {showDropdown && orders.length > 0 && (
          <Card className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto shadow-lg">
            <div className="p-2">
              {orders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => handleSelect(order)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 hover:text-black hover:cursor-pointer rounded-lg transition-colors"
                >
                  <p className="font-semibold text-sm">{order.osNumber}</p>
                  <p className="text-xs text-gray-500">
                    {order.totals.total.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}{" "}
                    • {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </button>
              ))}
            </div>
          </Card>
        )}
      </div>

      {selectedOrders.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedOrders.map((order) => (
            <Chip
              key={order.id}
              onClose={() => onRemove(order.id)}
              variant="flat"
              color="primary"
            >
              {order.osNumber} (
              {order.totals.total.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
              )
            </Chip>
          ))}
        </div>
      )}
    </div>
  );
}
