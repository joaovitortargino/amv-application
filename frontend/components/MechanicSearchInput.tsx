"use client";

import { useEffect, useState } from "react";
import { apiService } from "@/services/api";
import { MechanicDTO } from "@/types";
import {
  Autocomplete,
  AutocompleteItem,
  Button,
  Input,
  Spinner,
  addToast,
} from "@heroui/react";
import { X, Search, Wrench } from "lucide-react";

interface MechanicSearchInputProps {
  value: string;
  onSelect: (mechanic: MechanicDTO) => void;
  onClear: () => void;
  selectedMechanicName?: string;
  isRequired?: boolean;
  onlyService?: boolean;
}

export function MechanicSearchInput({
  value,
  onSelect,
  onClear,
  selectedMechanicName,
  isRequired = false,
  onlyService = false,
}: MechanicSearchInputProps) {
  const [mechanics, setMechanics] = useState<MechanicDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!loading && mechanics.length === 0) {
      loadMechanics("");
    }
  }, []);

  async function loadMechanics(search: string) {
    setLoading(true);
    try {
      const res = await apiService.get<MechanicDTO[]>("mechanics/active");

      let filtered = res;
      if (search) {
        filtered = res.filter(
          (m) =>
            m.name.toLowerCase().includes(search.toLowerCase()) ||
            m.document.includes(search),
        );
      }

      setMechanics(filtered);
    } catch (error) {
      addToast({
        title: "Erro ao carregar mecânicos",
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(searchValue: string) {
    setSearchTerm(searchValue);
    loadMechanics(searchValue);
  }

  function handleSelectMechanic(mechanicId: string) {
    const mechanic = mechanics.find((m) => m.id === mechanicId);
    if (mechanic) {
      onSelect(mechanic);
      setSearchTerm("");
    }
  }

  function handleClear() {
    onClear();
    setSearchTerm("");
  }

  return (
    <div className="space-y-2">
      {selectedMechanicName ? (
        <div className="flex items-center gap-2 p-3 bg-gray-50/5 rounded-lg border border-gray-700">
          <Wrench size={16} className="text-warning" />
          <span className="text-white font-medium">{selectedMechanicName}</span>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={handleClear}
            className="ml-auto"
          >
            <X size={16} />
          </Button>
        </div>
      ) : (
        <Autocomplete
          label="Mecânico"
          placeholder="Buscar mecânico por nome ou CPF"
          isRequired={isRequired}
          startContent={<Search size={16} />}
          isLoading={loading}
          inputValue={searchTerm}
          onInputChange={handleSearch}
          onSelectionChange={(key) => {
            if (key) {
              handleSelectMechanic(key as string);
            }
          }}
          className="w-full"
          description="Selecione o mecânico responsável pelo serviço"
        >
          {mechanics.map((mechanic) => (
            <AutocompleteItem
              key={mechanic.id}
              textValue={`${mechanic.name} - ${mechanic.document}`}
            >
              <div className="flex justify-between items-center w-full">
                <span>{mechanic.name}</span>
                <span className="text-gray-400 text-sm">
                  Comissão: {mechanic.standardCommissionPercentage.toFixed(2)}%
                </span>
              </div>
            </AutocompleteItem>
          ))}
        </Autocomplete>
      )}
    </div>
  );
}
