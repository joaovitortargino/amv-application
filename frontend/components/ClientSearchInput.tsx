"use client";

import { useState, useEffect, useRef } from "react";
import { Input, Card, Spinner } from "@heroui/react";
import { Search, X } from "lucide-react";
import { apiService } from "@/services/api";
import { ClientDTO, PageResponse } from "@/types";

interface ClientSearchInputProps {
  value: string;
  onSelect: (client: ClientDTO) => void;
  onClear: () => void;
  selectedClientName?: string;
}

export function ClientSearchInput({
  value,
  onSelect,
  onClear,
  selectedClientName,
}: ClientSearchInputProps) {
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState<ClientDTO[]>([]);
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
    if (search.length < 2) {
      setClients([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await apiService.get<PageResponse<ClientDTO>>(
          `clients?search=${encodeURIComponent(search)}&size=10`,
        );
        setClients(res.content);
        setShowDropdown(true);
      } catch {
        setClients([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  function handleSelect(client: ClientDTO) {
    onSelect(client);
    setSearch("");
    setClients([]);
    setShowDropdown(false);
  }

  function handleClear() {
    onClear();
    setSearch("");
    setClients([]);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        label="Cliente"
        placeholder={selectedClientName || "Digite para buscar..."}
        value={selectedClientName || search}
        onChange={(e) => !selectedClientName && setSearch(e.target.value)}
        startContent={<Search size={16} />}
        endContent={
          selectedClientName ? (
            <button
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          ) : loading ? (
            <Spinner size="sm" variant="wave" color="warning" />
          ) : null
        }
        isReadOnly={!!selectedClientName}
        isRequired
      />

      {showDropdown && clients.length > 0 && !selectedClientName && (
        <Card className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto shadow-lg">
          <div className="p-2">
            {clients.map((client) => (
              <button
                key={client.id}
                onClick={() => handleSelect(client)}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 hover:text-black hover:cursor-pointer rounded-lg transition-colors"
              >
                <p className="font-semibold text-sm">{client.name}</p>
                <p className="text-xs text-gray-500">
                  {client.document} • {client.contact.cellPhone}
                </p>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}