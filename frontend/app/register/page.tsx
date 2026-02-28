"use client";
import { apiService } from "@/services/api";
import { addToast } from "@heroui/toast";
import { useState } from "react";
import {
  CheckCircle,
  User,
  Building2,
  MapPin,
  ArrowLeft,
  ArrowRight,
  EyeClosed,
  Eye,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import Link from "next/link";

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    password: "",
    email : "",
    corporateReason: "",
    fantasyName: "",
    cnpj: "",
    contact: {
      email: "",
      telephone: "",
      cellPhone: "",
    },
    address: {
      cep: "",
      publicPlace: "",
      number: "",
      complement: "",
      district: "",
      city: "",
      state: "",
    },
  });

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);
  const toggleVisibility = () => setShowPassword(!showPassword);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await apiService.post("auth/register", formData);
      addToast({
        title: "Cadastro efetuado com sucesso",
        color: "success",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 1000);
    } catch (error: any) {
      console.log(error);
      addToast({
        title: "Erro ao cadastrar usuário, tente novamente!",
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-yellow-500/40 to-black flex items-center justify-center p-6">
      <div className="relative bg-white/95 backdrop-blur rounded-3xl shadow-2xl w-full max-w-2xl p-10">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-yellow-400/30 rounded-full blur-3xl" />
        <div className="flex justify-between items-center mb-12">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex flex-col items-center gap-2">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all
                ${step >= s ? "bg-yellow-400 text-black shadow-lg" : "bg-gray-200 text-gray-400"}`}
              >
                {step > s ? <CheckCircle size={22} /> : s}
              </div>
              <span className="text-xs font-semibold uppercase text-gray-600">
                {s === 1 ? "Usuário" : s === 2 ? "Empresa" : "Endereço"}
              </span>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              <h2 className="flex items-center gap-2 text-xl font-bold text-black">
                <User className="text-yellow-500" /> Dados Pessoais
              </h2>

              <Input
                label="Nome Completo"
                required
                variant="bordered"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                classNames={{
                  inputWrapper:
                    "bg-white border border-gray-300 hover:border-yellow-400 focus-within:border-yellow-500 transition",
                  input: "text-black placeholder:text-gray-400",
                  base: "[&_[data-slot=label]]:text-black",
                  errorMessage: "text-red-500",
                }}
              />

              <Input
                label="Email"
                required
                variant="bordered"
                type="email"
                value={formData.contact.email}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    email: e.target.value,
                    contact: { ...formData.contact, email: e.target.value },
                  })
                }
                classNames={{
                  inputWrapper:
                    "bg-white border border-gray-300 hover:border-yellow-400 focus-within:border-yellow-500 transition",
                  input: "text-black placeholder:text-gray-400",
                  base: "[&_[data-slot=label]]:text-black",
                  errorMessage: "text-red-500",
                }}
              />

              <Input
                label="Senha"
                required
                type={showPassword ? "text" : "password"}
                variant="bordered"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                classNames={{
                  inputWrapper:
                    "bg-white border border-gray-300 hover:border-yellow-400 focus-within:border-yellow-500 transition",
                  input: "text-black placeholder:text-gray-400",
                  base: "[&_[data-slot=label]]:text-black",
                  errorMessage: "text-red-500",
                }}
                endContent={
                  <button
                    className="text-gray-400"
                    type="button"
                    onClick={toggleVisibility}
                  >
                    {showPassword ? (
                      <Eye className="w-6 h-6" />
                    ) : (
                      <EyeClosed className="w-6 h-6" />
                    )}
                  </button>
                }
              />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              <h2 className="flex items-center gap-2 text-xl font-bold text-black">
                <Building2 className="text-yellow-500" /> Dados da Empresa
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Razão Social"
                  required
                  variant="bordered"
                  value={formData.corporateReason}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      corporateReason: e.target.value,
                    })
                  }
                  classNames={{
                    inputWrapper:
                      "bg-white border border-gray-300 hover:border-yellow-400 focus-within:border-yellow-500 transition",
                    input: "text-black placeholder:text-gray-400",
                    base: "[&_[data-slot=label]]:text-black",
                    errorMessage: "text-red-500",
                  }}
                />
                <Input
                  label="Nome Fantasia"
                  required
                  variant="bordered"
                  value={formData.fantasyName}
                  onChange={(e) =>
                    setFormData({ ...formData, fantasyName: e.target.value })
                  }
                  classNames={{
                    inputWrapper:
                      "bg-white border border-gray-300 hover:border-yellow-400 focus-within:border-yellow-500 transition",
                    input: "text-black placeholder:text-gray-400",
                    base: "[&_[data-slot=label]]:text-black",
                    errorMessage: "text-red-500",
                  }}
                />
              </div>

              <Input
                label="CNPJ"
                required
                variant="bordered"
                value={formData.cnpj}
                onChange={(e) =>
                  setFormData({ ...formData, cnpj: e.target.value })
                }
                classNames={{
                  inputWrapper:
                    "bg-white border border-gray-300 hover:border-yellow-400 focus-within:border-yellow-500 transition",
                  input: "text-black placeholder:text-gray-400",
                  base: "[&_[data-slot=label]]:text-black",
                  errorMessage: "text-red-500",
                }}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Telefone"
                  required
                  variant="bordered"
                  value={formData.contact.telephone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contact: {
                        ...formData.contact,
                        telephone: e.target.value,
                      },
                    })
                  }
                  classNames={{
                    inputWrapper:
                      "bg-white border border-gray-300 hover:border-yellow-400 focus-within:border-yellow-500 transition",
                    input: "text-black placeholder:text-gray-400",
                    base: "[&_[data-slot=label]]:text-black",
                    errorMessage: "text-red-500",
                  }}
                />
                <Input
                  label="Celular"
                  required
                  variant="bordered"
                  value={formData.contact.cellPhone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contact: {
                        ...formData.contact,
                        cellPhone: e.target.value,
                      },
                    })
                  }
                  classNames={{
                    inputWrapper:
                      "bg-white border border-gray-300 hover:border-yellow-400 focus-within:border-yellow-500 transition",
                    input: "text-black placeholder:text-gray-400",
                    base: "[&_[data-slot=label]]:text-black",
                    errorMessage: "text-red-500",
                  }}
                />
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              <h2 className="flex items-center gap-2 text-xl font-bold text-black">
                <MapPin className="text-yellow-500" /> Endereço
              </h2>

              <Input
                label="CEP"
                required
                variant="bordered"
                value={formData.address.cep}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, cep: e.target.value },
                  })
                }
                classNames={{
                  inputWrapper:
                    "bg-white border border-gray-300 hover:border-yellow-400 focus-within:border-yellow-500 transition",
                  input: "text-black placeholder:text-gray-400",
                  base: "[&_[data-slot=label]]:text-black",
                  errorMessage: "text-red-500",
                }}
              />

              <div className="grid grid-cols-4 gap-4">
                <Input
                  label="Rua"
                  required
                  variant="bordered"
                  className="col-span-2"
                  value={formData.address.publicPlace}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: {
                        ...formData.address,
                        publicPlace: e.target.value,
                      },
                    })
                  }
                  classNames={{
                    inputWrapper:
                      "bg-white border border-gray-300 hover:border-yellow-400 focus-within:border-yellow-500 transition",
                    input: "text-black placeholder:text-gray-400",
                    base: "[&_[data-slot=label]]:text-black",
                    errorMessage: "text-red-500",
                  }}
                />
                <Input
                  label="Bairro"
                  required
                  variant="bordered"
                  className="col-span-1"
                  value={formData.address.district}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: {
                        ...formData.address,
                        district: e.target.value,
                      },
                    })
                  }
                  classNames={{
                    inputWrapper:
                      "bg-white border border-gray-300 hover:border-yellow-400 focus-within:border-yellow-500 transition",
                    input: "text-black placeholder:text-gray-400",
                    base: "[&_[data-slot=label]]:text-black",
                    errorMessage: "text-red-500",
                  }}
                />
                <Input
                  label="Número"
                  required
                  variant="bordered"
                  className="col-span-1"
                  value={formData.address.number}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, number: e.target.value },
                    })
                  }
                  classNames={{
                    inputWrapper:
                      "bg-white border border-gray-300 hover:border-yellow-400 focus-within:border-yellow-500 transition",
                    input: "text-black placeholder:text-gray-400",
                    base: "[&_[data-slot=label]]:text-black",
                    errorMessage: "text-red-500",
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Cidade"
                  required
                  variant="bordered"
                  value={formData.address.city}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, city: e.target.value },
                    })
                  }
                  classNames={{
                    inputWrapper:
                      "bg-white border border-gray-300 hover:border-yellow-400 focus-within:border-yellow-500 transition",
                    input: "text-black placeholder:text-gray-400",
                    base: "[&_[data-slot=label]]:text-black",
                    errorMessage: "text-red-500",
                  }}
                />
                <Input
                  label="Estado (UF)"
                  required
                  variant="bordered"
                  value={formData.address.state}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, state: e.target.value },
                    })
                  }
                  classNames={{
                    inputWrapper:
                      "bg-white border border-gray-300 hover:border-yellow-400 focus-within:border-yellow-500 transition",
                    input: "text-black placeholder:text-gray-400",
                    base: "[&_[data-slot=label]]:text-black",
                    errorMessage: "text-red-500",
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-12 flex justify-between border-t pt-6">
          {step > 1 ? (
            <Button
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold shadow-lg"
              onPress={prevStep}
              startContent={<ArrowLeft size={18} />}
            >
              Voltar
            </Button>
          ) : (
            <Button
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold shadow-lg"
              as={Link}
              href="/login"
            >
              Voltar ao Login
            </Button>
          )}

          {step < 3 ? (
            <Button
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold shadow-lg"
              endContent={<ArrowRight size={18} />}
              onPress={nextStep}
            >
              Próximo
            </Button>
          ) : (
            <Button
              isLoading={loading}
              className="bg-yellow-400 text-black font-bold shadow-lg"
              onPress={handleSubmit}
            >
              Finalizar Cadastro
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
