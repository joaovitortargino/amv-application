"use client";

import { useEffect, useState } from "react";
import { apiService } from "@/services/api";
import { AppLayout } from "@/components/AppLayout";
import { motion } from "framer-motion";
import { Button, Input, Spinner, addToast, Chip } from "@heroui/react";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Save,
  CreditCard,
  KeyRound,
  ShieldCheck,
  Upload,
  FileKey,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Enterprise } from "@/types";

interface ItauConfigResponse {
  clientId: string;
  clientSecret: string;
  active: boolean;
  hasCertificate: boolean;
}

function Section({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description?: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
        <div className="p-2 bg-yellow-400 rounded-lg">
          <Icon size={20} className="text-yellow-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-800">{title}</h3>
          {description && (
            <p className="text-xs text-gray-400">{description}</p>
          )}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function EnterpriseSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Enterprise | null>(null);

  useEffect(() => {
    apiService
      .get<Enterprise>("settings/enterprise")
      .then(setForm)
      .catch(() =>
        addToast({ title: "Erro ao carregar configurações", color: "danger" }),
      )
      .finally(() => setLoading(false));
  }, []);

  function set(field: string, value: string) {
    setForm((prev) => {
      if (!prev) return prev;
      const keys = field.split(".");
      if (keys.length === 1) return { ...prev, [field]: value };
      return {
        ...prev,
        [keys[0]]: {
          ...(prev as any)[keys[0]],
          [keys[1]]: value,
        },
      };
    });
  }

  async function handleSave() {
    if (!form) return;
    setSaving(true);
    try {
      await apiService.put("settings/enterprise", form);
      addToast({
        title: "Configurações salvas com sucesso!",
        color: "success",
      });
    } catch (error: any) {
      addToast({
        title: error?.message || "Erro ao salvar configurações",
        color: "danger",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <div className="flex justify-center py-10">
        <Spinner color="warning" variant="wave" />
      </div>
    );

  if (!form) return null;

  return (
    <div className="space-y-6">
      <Section
        title="Dados da Empresa"
        description="Razão social, nome fantasia e CNPJ"
        icon={Building2}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Razão Social"
            value={form.corporateReason || ""}
            onChange={(e) => set("corporateReason", e.target.value)}
          />
          <Input
            label="Nome Fantasia"
            value={form.fantasyName || ""}
            onChange={(e) => set("fantasyName", e.target.value)}
          />
          <Input
            label="CNPJ"
            value={form.cnpj || ""}
            onChange={(e) => set("cnpj", e.target.value)}
            className="md:col-span-2"
          />
        </div>
      </Section>

      <Section
        title="Contato"
        description="E-mail e telefones da empresa"
        icon={Mail}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="E-mail"
            type="email"
            value={form.contact?.email || ""}
            onChange={(e) => set("contact.email", e.target.value)}
            startContent={<Mail size={14} className="text-gray-400" />}
            className="md:col-span-3"
          />
          <Input
            label="Telefone"
            value={form.contact?.telephone || ""}
            onChange={(e) => set("contact.telephone", e.target.value)}
            startContent={<Phone size={14} className="text-gray-400" />}
          />
          <Input
            label="Celular"
            value={form.contact?.cellPhone || ""}
            onChange={(e) => set("contact.cellPhone", e.target.value)}
            startContent={<Phone size={14} className="text-gray-400" />}
          />
        </div>
      </Section>

      <Section
        title="Endereço"
        description="Localização da empresa"
        icon={MapPin}
      >
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Input
            label="CEP"
            value={form.address?.cep || ""}
            onChange={(e) => set("address.cep", e.target.value)}
            className="md:col-span-2"
          />
          <Input
            label="Logradouro"
            value={form.address?.publicPlace || ""}
            onChange={(e) => set("address.publicPlace", e.target.value)}
            className="md:col-span-3"
          />
          <Input
            label="Número"
            value={form.address?.number || ""}
            onChange={(e) => set("address.number", e.target.value)}
            className="md:col-span-1"
          />
          <Input
            label="Complemento"
            value={form.address?.complement || ""}
            onChange={(e) => set("address.complement", e.target.value)}
            className="md:col-span-2"
          />
          <Input
            label="Bairro"
            value={form.address?.district || ""}
            onChange={(e) => set("address.district", e.target.value)}
            className="md:col-span-2"
          />
          <Input
            label="Cidade"
            value={form.address?.city || ""}
            onChange={(e) => set("address.city", e.target.value)}
            className="md:col-span-1"
          />
          <Input
            label="Estado"
            value={form.address?.state || ""}
            onChange={(e) => set("address.state", e.target.value)}
            className="md:col-span-1"
          />
        </div>
      </Section>

      <div className="flex justify-end">
        <Button
          color="warning"
          className="text-black font-semibold"
          startContent={<Save size={16} />}
          isLoading={saving}
          onPress={handleSave}
        >
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}

function ItauSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [current, setCurrent] = useState<ItauConfigResponse | null>(null);

  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [certPassword, setCertPassword] = useState("");
  const [certFile, setCertFile] = useState<File | null>(null);

  const [showSecret, setShowSecret] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    apiService
      .get<ItauConfigResponse>("settings/itau")
      .then((data) => {
        setCurrent(data);
        setClientId(data.clientId || "");
        setClientSecret(data.clientSecret || "");
      })
      .catch((err) => {
        // 204 No Content = sem config ainda, não é erro
        if (err?.status !== 204) {
          addToast({ title: "Erro ao carregar config Itaú", color: "danger" });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    if (!clientId || !clientSecret) {
      addToast({
        title: "Client ID e Client Secret são obrigatórios",
        color: "warning",
      });
      return;
    }

    if (!current?.hasCertificate && !certFile) {
      addToast({
        title: "Envie um certificado .p12 para configurar a integração",
        color: "warning",
      });
      return;
    }

    if (certFile && !certPassword) {
      addToast({
        title: "Informe a senha do certificado",
        color: "warning",
      });
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("clientId", clientId);
      formData.append("clientSecret", clientSecret);
      formData.append("certificatePassword", certPassword);
      if (certFile) formData.append("certificate", certFile);

      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token") || "";
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";

      const res = await fetch(`${baseUrl}/settings/itau`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error("Erro ao salvar");

      addToast({
        title: "Integração Itaú configurada com sucesso!",
        color: "success",
      });

      const updated = await apiService.get<ItauConfigResponse>("settings/itau");
      setCurrent(updated);
      setCertFile(null);
      setCertPassword("");
    } catch (error: any) {
      addToast({
        title: error?.message || "Erro ao salvar configuração Itaú",
        color: "danger",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <div className="flex justify-center py-10">
        <Spinner color="warning" variant="wave" />
      </div>
    );

  return (
    <div className="space-y-6">
      <Section
        title="Status da Integração"
        description="Situação atual da conexão com o Itaú"
        icon={CreditCard}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatusCard
            label="Integração"
            active={current?.active ?? false}
            activeText="Ativa"
            inactiveText="Inativa"
          />
          <StatusCard
            label="Certificado Digital"
            active={current?.hasCertificate ?? false}
            activeText="Configurado"
            inactiveText="Não configurado"
          />
          <StatusCard
            label="Credenciais"
            active={!!current?.clientId}
            activeText="Salvas"
            inactiveText="Não configuradas"
          />
        </div>
      </Section>

      <Section
        title="Credenciais API"
        description="Client ID e Client Secret fornecidos pelo Itaú"
        icon={KeyRound}
      >
        <div className="space-y-4">
          <Input
            label="Client ID"
            placeholder="Informe o Client ID"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            startContent={<KeyRound size={14} className="text-gray-400" />}
            isRequired
          />
          <Input
            label="Client Secret"
            placeholder="Informe o Client Secret"
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
            type={showSecret ? "text" : "password"}
            startContent={<KeyRound size={14} className="text-gray-400" />}
            endContent={
              <button
                type="button"
                onClick={() => setShowSecret((v) => !v)}
                className="text-gray-400 hover:text-gray-600"
              >
                {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
            isRequired
          />
        </div>
      </Section>

      <Section
        title="Certificado Digital (.p12)"
        description={
          current?.hasCertificate
            ? "Já existe um certificado configurado. Envie um novo apenas para substituí-lo."
            : "Envie o arquivo .p12 do certificado digital fornecido pelo Itaú"
        }
        icon={FileKey}
      >
        <div className="space-y-4">
          <label
            htmlFor="cert-upload"
            className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
              certFile
                ? "border-yellow-400 bg-yellow-400"
                : "border-gray-300 bg-gray-50 hover:border-yellow-400 hover:bg-yellow-400"
            }`}
          >
            {certFile ? (
              <div className="flex flex-col items-center gap-1">
                <FileKey size={28} className="text-yellow-500" />
                <p className="text-sm font-semibold text-yellow-700">
                  {certFile.name}
                </p>
                <p className="text-xs text-yellow-500">
                  {(certFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-400">
                <Upload size={28} />
                <p className="text-sm">
                  Clique para selecionar o arquivo{" "}
                  <span className="font-semibold text-yellow-600">.p12</span>
                </p>
                <p className="text-xs">Somente arquivos .p12 ou .pfx</p>
              </div>
            )}
            <input
              id="cert-upload"
              type="file"
              accept=".p12,.pfx"
              className="hidden"
              onChange={(e) => setCertFile(e.target.files?.[0] ?? null)}
            />
          </label>

          {(certFile || !current?.hasCertificate) && (
            <Input
              label="Senha do Certificado"
              placeholder="Senha do arquivo .p12"
              type={showPassword ? "text" : "password"}
              value={certPassword}
              onChange={(e) => setCertPassword(e.target.value)}
              startContent={<ShieldCheck size={14} className="text-gray-400" />}
              endContent={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              description="A senha não será armazenada em texto puro"
              isRequired={!!certFile}
            />
          )}
        </div>
      </Section>

      <div className="flex justify-end">
        <Button
          color="warning"
          className="text-black font-semibold"
          startContent={<Save size={16} />}
          isLoading={saving}
          onPress={handleSave}
        >
          Salvar Integração Itaú
        </Button>
      </div>
    </div>
  );
}

function StatusCard({
  label,
  active,
  activeText,
  inactiveText,
}: {
  label: string;
  active: boolean;
  activeText: string;
  inactiveText: string;
}) {
  return (
    <div
      className={`rounded-xl p-4 border flex items-center gap-3 ${
        active ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
      }`}
    >
      {active ? (
        <CheckCircle size={20} className="text-green-500 shrink-0" />
      ) : (
        <AlertCircle size={20} className="text-gray-400 shrink-0" />
      )}
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <Chip size="sm" color={active ? "success" : "default"} variant="flat">
          {active ? activeText : inactiveText}
        </Chip>
      </div>
    </div>
  );
}

type SettingsTab = "enterprise" | "itau";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("enterprise");

  const tabs: { key: SettingsTab; label: string; icon: React.ElementType }[] = [
    { key: "enterprise", label: "Empresa", icon: Building2 },
    { key: "itau", label: "Integração Itaú", icon: CreditCard },
  ];

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div>
          <h2 className="text-3xl font-bold text-white">Configurações</h2>
          <p className="text-gray-500">
            Gerencie os dados da empresa e integrações
          </p>
        </div>

        <div className="flex gap-2 bg-white/10 p-1 rounded-xl w-fit">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === key
                  ? "bg-yellow-400 text-black shadow"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {activeTab === "enterprise" && <EnterpriseSettings />}
        {activeTab === "itau" && <ItauSettings />}
      </motion.div>
    </AppLayout>
  );
}
