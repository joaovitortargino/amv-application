"use client";

import { useEffect, useState } from "react";
import { apiService } from "@/services/api";
import { AppLayout } from "@/components/AppLayout";
import { motion } from "framer-motion";
import { Button, Input, Spinner, addToast } from "@heroui/react";
import {
  User,
  Mail,
  KeyRound,
  Save,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";

interface UserResponse {
  id: string;
  name: string;
  email: string;
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
        <div className="p-2 bg-yellow-50 rounded-lg">
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

export default function UserSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState<UserResponse | null>(null);
  const [name, setName] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    apiService
      .get<UserResponse>("settings/user")
      .then((data) => {
        setProfile(data);
        setName(data.name);
      })
      .catch(() =>
        addToast({ title: "Erro ao carregar perfil", color: "danger" }),
      )
      .finally(() => setLoading(false));
  }, []);

  async function handleSaveProfile() {
    if (!name.trim()) {
      addToast({ title: "O nome não pode estar vazio", color: "warning" });
      return;
    }

    setSaving(true);
    try {
      const updated = await apiService.put<UserResponse>("settings/user", {
        name,
        password: null,
      });
      setProfile(updated);
      addToast({ title: "Perfil atualizado com sucesso!", color: "success" });
    } catch (error: any) {
      addToast({
        title: error?.message || "Erro ao atualizar perfil",
        color: "danger",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleSavePassword() {
    if (!newPassword || !confirmPassword) {
      addToast({ title: "Preencha os campos de senha", color: "warning" });
      return;
    }

    if (newPassword.length < 6) {
      addToast({
        title: "A senha deve ter no mínimo 6 caracteres",
        color: "warning",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      addToast({ title: "As senhas não coincidem", color: "danger" });
      return;
    }

    setSaving(true);
    try {
      await apiService.put("settings/user", {
        name,
        password: newPassword,
      });
      addToast({ title: "Senha alterada com sucesso!", color: "success" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      addToast({
        title: error?.message || "Erro ao alterar senha",
        color: "danger",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div>
          <h2 className="text-3xl font-bold text-white">Meu Perfil</h2>
          <p className="text-gray-500">
            Gerencie suas informações pessoais e senha de acesso
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner color="warning" variant="wave" />
          </div>
        ) : (
          <>
            <div className="bg-white/10 rounded-2xl p-5 flex items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-yellow-400 flex items-center justify-center shrink-0">
                <span className="text-2xl font-bold text-black">
                  {profile?.name?.charAt(0).toUpperCase() ?? "U"}
                </span>
              </div>
              <div>
                <p className="text-white text-lg font-semibold">
                  {profile?.name}
                </p>
                <p className="text-gray-400 text-sm">{profile?.email}</p>
              </div>
            </div>

            <Section
              title="Dados Pessoais"
              description="Atualize seu nome de exibição"
              icon={User}
            >
              <div className="space-y-4">
                <Input
                  label="Nome"
                  placeholder="Seu nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  startContent={<User size={14} className="text-gray-400" />}
                  isRequired
                />

                <Input
                  label="E-mail"
                  value={profile?.email || ""}
                  isReadOnly
                  isDisabled
                  startContent={<Mail size={14} className="text-gray-400" />}
                  description="O e-mail não pode ser alterado"
                />

                <div className="flex justify-end">
                  <Button
                    color="warning"
                    className="text-black font-semibold"
                    startContent={<Save size={16} />}
                    isLoading={saving}
                    onPress={handleSaveProfile}
                  >
                    Salvar Dados
                  </Button>
                </div>
              </div>
            </Section>

            <Section
              title="Alterar Senha"
              description="Escolha uma senha forte com no mínimo 6 caracteres"
              icon={ShieldCheck}
            >
              <div className="space-y-4">
                <Input
                  label="Nova Senha"
                  placeholder="••••••••"
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  startContent={
                    <KeyRound size={14} className="text-gray-400" />
                  }
                  endContent={
                    <button
                      type="button"
                      onClick={() => setShowNew((v) => !v)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                />

                <Input
                  label="Confirmar Nova Senha"
                  placeholder="••••••••"
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  startContent={
                    <KeyRound size={14} className="text-gray-400" />
                  }
                  endContent={
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                  color={
                    confirmPassword && newPassword !== confirmPassword
                      ? "danger"
                      : "default"
                  }
                  errorMessage={
                    confirmPassword && newPassword !== confirmPassword
                      ? "As senhas não coincidem"
                      : ""
                  }
                  isInvalid={
                    !!confirmPassword && newPassword !== confirmPassword
                  }
                />

                {newPassword && <PasswordStrength password={newPassword} />}

                <div className="flex justify-end">
                  <Button
                    color="warning"
                    className="text-black font-semibold"
                    startContent={<ShieldCheck size={16} />}
                    isLoading={saving}
                    onPress={handleSavePassword}
                    isDisabled={!newPassword || newPassword !== confirmPassword}
                  >
                    Alterar Senha
                  </Button>
                </div>
              </div>
            </Section>
          </>
        )}
      </motion.div>
    </AppLayout>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "Mínimo 6 caracteres", ok: password.length >= 6 },
    { label: "Letra maiúscula", ok: /[A-Z]/.test(password) },
    { label: "Número", ok: /[0-9]/.test(password) },
    { label: "Caractere especial", ok: /[^a-zA-Z0-9]/.test(password) },
  ];

  const score = checks.filter((c) => c.ok).length;

  const strengthLabel = [
    "Muito fraca",
    "Fraca",
    "Média",
    "Forte",
    "Muito forte",
  ][score];
  const strengthColor = [
    "bg-red-500",
    "bg-orange-400",
    "bg-yellow-400",
    "bg-green-400",
    "bg-green-600",
  ][score];

  return (
    <div className="space-y-2 bg-gray-50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500">Força da senha</span>
        <span className="text-xs font-medium text-gray-700">
          {strengthLabel}
        </span>
      </div>

      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i < score ? strengthColor : "bg-gray-200"
            }`}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-1 pt-1">
        {checks.map((c) => (
          <div key={c.label} className="flex items-center gap-1.5">
            <div
              className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${
                c.ok ? "bg-green-500" : "bg-gray-200"
              }`}
            >
              {c.ok && (
                <svg
                  className="w-2 h-2 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
            <span
              className={`text-xs ${c.ok ? "text-green-700" : "text-gray-400"}`}
            >
              {c.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
