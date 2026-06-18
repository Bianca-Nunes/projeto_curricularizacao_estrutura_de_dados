import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Fale com o administrador — SisInsumos" },
      { name: "description", content: "Deixe seus dados e entraremos em contato." },
    ],
  }),
  component: Contato,
});

function Contato() {
  const [form, setForm] = useState({ nome: "", telefone: "", email: "" });
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState("");

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    if (!form.nome.trim() || form.nome.length > 100) return setErro("Informe um nome válido.");
    if (!form.telefone.trim() || form.telefone.length > 30) return setErro("Informe um telefone válido.");
    if (!/^\S+@\S+\.\S+$/.test(form.email) || form.email.length > 120) return setErro("Informe um e-mail válido.");
    setEnviado(true);
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-6">
      <div className="w-full max-w-md bg-card rounded-2xl border shadow-sm p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">🍰 SisInsumos</h1>
          <p className="text-sm text-muted-foreground mt-1">Fale com o administrador</p>
        </div>

        {enviado ? (
          <div className="mt-8 text-center space-y-4">
            <div className="text-5xl">✅</div>
            <h2 className="text-xl font-bold text-foreground">Dados enviados com sucesso!</h2>
            <p className="text-sm text-muted-foreground">
              Obrigado, <strong>{form.nome}</strong>. Em breve alguém da nossa equipe entrará em contato.
            </p>
            <Link to="/login" className="inline-block mt-4 text-primary font-semibold hover:underline">
              ← Voltar para o login
            </Link>
          </div>
        ) : (
          <form onSubmit={enviar} className="mt-6 space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Preencha seus dados e nossa equipe entrará em contato em breve.
            </p>
            <div>
              <label className="text-sm font-medium text-foreground">Nome</label>
              <input
                value={form.nome}
                maxLength={100}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
                placeholder="Seu nome completo"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Telefone</label>
              <input
                value={form.telefone}
                maxLength={30}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
                placeholder="(00) 00000-0000"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">E-mail</label>
              <input
                type="email"
                value={form.email}
                maxLength={120}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
                placeholder="seu@email.com"
              />
            </div>
            {erro && <div className="text-sm text-destructive">{erro}</div>}
            <button type="submit" className="w-full bg-primary text-primary-foreground rounded-md px-4 py-2.5 text-sm font-semibold hover:opacity-90">
              Enviar
            </button>
            <p className="text-center text-sm">
              <Link to="/login" className="text-muted-foreground hover:underline">← Voltar para o login</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
