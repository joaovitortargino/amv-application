"use client";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { Form, Input, Button, addToast } from "@heroui/react";
import { Eye, EyeClosed } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login({ email, password });

      addToast({
        title: "Login efetuado com sucesso",
        color: "success",
      });
      setTimeout(() => {
        setSubmitted(true);
        setLoading(false);
        window.location.href = "/dashboard";
      }, 1000);
    } catch (error: any) {
      setError(error.message ? error.message : "Erro ao fazer login");
      addToast({
        title: "Erro ao fazer login, verifique as credenciais",
        color: "danger",
      });
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const toggleVisibility = () => setShowPassword(!showPassword);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-yellow-500/40 to-black flex items-center justify-center p-6">
      <div className="relative bg-white/95 backdrop-blur rounded-3xl shadow-2xl w-full max-w-md p-10">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-yellow-400/30 rounded-full blur-3xl" />

        <div className="text-center mb-10">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-400 text-black shadow-lg">
            <span className="text-2xl font-bold">AMV</span>
          </div>

          <h1 className="text-3xl font-bold text-black">AMV Mecânica</h1>
          <p className="text-sm text-gray-500">Sistema de gerenciamento</p>
        </div>

        <Form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5 text-black"
        >
          <Input
            isRequired
            errorMessage={error}
            label="Email"
            labelPlacement="outside"
            name="email"
            placeholder="Insira seu e-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            variant="bordered"
            classNames={{
              inputWrapper:
                "bg-white border border-gray-300 hover:border-yellow-400 focus-within:border-yellow-500 transition",
              input: "text-black placeholder:text-gray-400",
              base: "[&_[data-slot=label]]:text-black",
              errorMessage: "text-red-500",
            }}
          />

          <Input
            isRequired
            label="Senha"
            labelPlacement="outside"
            name="password"
            placeholder="Insira sua senha"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            variant="bordered"
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
            classNames={{
              inputWrapper:
                "bg-white border border-gray-300 hover:border-yellow-400 focus-within:border-yellow-500 transition",
              input: "text-black placeholder:text-gray-400",
              base: "[&_[data-slot=label]]:text-black",
              errorMessage: "text-red-500",
            }}
          />

          <Button
            type="submit"
            isLoading={loading}
            isDisabled={loading}
            className="h-10 w-full text-black bg-yellow-400 hover:bg-yellow-500 font-semibold rounded-xl shadow-md transition"
          >
            Entrar
          </Button>
        </Form>

        <p className="text-gray-500 text-xs text-center mt-7">
          Ainda não tem uma conta?{" "}
          <a
            href="/register"
            className="font-semibold text-yellow-400 hover:text-yellow-500 transition-all duration-300"
          >
            Registre-se
          </a>
        </p>

        <p className="mt-8 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} AMV Mecânica • Todos os direitos
          reservados
        </p>
      </div>
    </div>
  );
}
