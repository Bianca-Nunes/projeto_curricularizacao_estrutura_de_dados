import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — SisInsumos" },
      { name: "description", content: "Acesse sua conta SisInsumos." },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrar, setMostrar] = useState(false);
  const [erro, setErro] = useState("");
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined" && localStorage.getItem("sis_auth") === "1") {
      navigate({ to: "/" });
    }
  }, [navigate]);

  if (!mounted) return null;

  const entrar = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim().toLowerCase() === "admin" && senha === "admin") {
      localStorage.setItem("sis_auth", "1");
      navigate({ to: "/" });
    } else {
      setErro("E-mail ou senha incorretos.");
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Lateral escura */}
      <aside className="hidden md:flex md:w-1/2 bg-sidebar text-sidebar-foreground p-12 flex-col justify-between">
        <div>
          <h1 className="text-3xl font-bold text-sidebar-primary">🍰 SisInsumos</h1>
          <p className="text-sm opacity-80 mt-1">Controle & Precificação</p>
          <div className="mt-16">
            <h2 className="text-2xl font-bold leading-snug">Tenha o controle completo<br />do seu negócio</h2>
            <p className="mt-4 text-sm opacity-80 max-w-sm">
              Gerencie seus insumos, produtos, estoque, receitas e finanças em um só lugar.
            </p>
          </div>
        </div>
        <div className="text-7xl">📦</div>
      </aside>

      {/* Formulário */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-card rounded-2xl border shadow-sm p-8">
          <h2 className="text-2xl font-bold text-center text-foreground">Bem-vindo de volta!</h2>
          <p className="text-sm text-center text-muted-foreground mt-1">Faça login para acessar sua conta</p>

          <form onSubmit={entrar} className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">E-mail</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Senha</label>
              <div className="relative mt-1">
                <input
                  type={mostrar ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border rounded-md px-3 py-2 pr-10 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setMostrar((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm"
                  aria-label="Mostrar senha"
                >
                  {mostrar ? "🙈" : "👁"}
                </button>
              </div>
              <div className="text-right mt-1">
                <a className="text-xs text-primary hover:underline" href="#">Esqueceu sua senha?</a>
              </div>
            </div>

            {erro && <div className="text-sm text-destructive">{erro}</div>}

            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground rounded-md px-4 py-2.5 text-sm font-semibold hover:opacity-90"
            >
              → Entrar
            </button>

            <p className="text-center text-sm text-muted-foreground">
              Ainda não tem uma conta?{" "}
              <Link to="/contato" className="text-primary font-semibold hover:underline">
                Fale com o administrador
              </Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}
