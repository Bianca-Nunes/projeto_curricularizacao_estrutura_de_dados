import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ListaEncadeada, Pilha, Fila, TabelaHash,
  buscaSequencial, bubbleSort, insertionSort,
} from "@/lib/estruturas";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SisInsumos — Controle de Insumos e Precificação" },
      { name: "description", content: "Sistema acadêmico para controle de estoque e cálculo de preço de venda demonstrando estruturas de dados." },
    ],
  }),
  component: App,
});

// ===== Tipos =====
type Insumo = { codigo: string; nome: string; categoria: string; unidade: string; estoque: number; minimo: number; valor: number };
type Produto = { codigo: string; nome: string; margem: number; rendimento: number; receita: { codigoInsumo: string; qtd: number }[] };
type Movimentacao = { data: string; codigoInsumo: string; tipo: "ENTRADA" | "SAIDA" | "AJUSTE"; qtd: number; obs?: string };
type Reposicao = { codigoInsumo: string; sugerido: number; data: string };
type FormaPgto = "Dinheiro" | "Pix" | "Débito" | "Crédito";
type Venda = { id: string; data: string; codigoProduto: string; qtd: number; precoUnit: number; custoUnit: number; forma: FormaPgto };
type Conta = { id: string; data: string; descricao: string; categoria: string; valor: number; pago: boolean };

// ===== Dados iniciais =====
const insumosSeed: Insumo[] = [
  { codigo: "INS001", nome: "Farinha de trigo", categoria: "Secos", unidade: "kg", estoque: 10, minimo: 2, valor: 6.5 },
  { codigo: "INS002", nome: "Chocolate em pó", categoria: "Secos", unidade: "kg", estoque: 1.5, minimo: 1, valor: 32 },
  { codigo: "INS003", nome: "Ovos", categoria: "Frescos", unidade: "un", estoque: 30, minimo: 12, valor: 0.85 },
  { codigo: "INS004", nome: "Leite condensado", categoria: "Laticínios", unidade: "un", estoque: 2, minimo: 3, valor: 7.2 },
  { codigo: "INS005", nome: "Açúcar refinado", categoria: "Secos", unidade: "kg", estoque: 8, minimo: 2, valor: 4.5 },
  { codigo: "INS006", nome: "Manteiga", categoria: "Laticínios", unidade: "kg", estoque: 1.2, minimo: 0.5, valor: 38 },
];

const produtosSeed: Produto[] = [
  { codigo: "PRD001", nome: "Bolo de Chocolate", margem: 80, rendimento: 10, receita: [
    { codigoInsumo: "INS001", qtd: 0.5 }, { codigoInsumo: "INS002", qtd: 0.2 },
    { codigoInsumo: "INS003", qtd: 4 }, { codigoInsumo: "INS005", qtd: 0.4 },
  ]},
  { codigo: "PRD002", nome: "Brigadeiro Gourmet (cento)", margem: 120, rendimento: 100, receita: [
    { codigoInsumo: "INS002", qtd: 0.3 }, { codigoInsumo: "INS004", qtd: 4 }, { codigoInsumo: "INS006", qtd: 0.1 },
  ]},
  { codigo: "PRD003", nome: "Pão de Mel", margem: 90, rendimento: 20, receita: [
    { codigoInsumo: "INS001", qtd: 0.4 }, { codigoInsumo: "INS002", qtd: 0.1 }, { codigoInsumo: "INS005", qtd: 0.3 },
  ]},
];

const hoje = () => new Date().toISOString().slice(0, 10);
const diasAtras = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };

const vendasSeed: Venda[] = [
  { id: "V1", data: diasAtras(6), codigoProduto: "PRD001", qtd: 2, precoUnit: 12, custoUnit: 6.67, forma: "Pix" },
  { id: "V2", data: diasAtras(5), codigoProduto: "PRD002", qtd: 1, precoUnit: 60, custoUnit: 27.4, forma: "Dinheiro" },
  { id: "V3", data: diasAtras(4), codigoProduto: "PRD003", qtd: 5, precoUnit: 6, custoUnit: 3.16, forma: "Débito" },
  { id: "V4", data: diasAtras(3), codigoProduto: "PRD001", qtd: 3, precoUnit: 12, custoUnit: 6.67, forma: "Crédito" },
  { id: "V5", data: diasAtras(2), codigoProduto: "PRD002", qtd: 2, precoUnit: 60, custoUnit: 27.4, forma: "Pix" },
  { id: "V6", data: diasAtras(1), codigoProduto: "PRD003", qtd: 8, precoUnit: 6, custoUnit: 3.16, forma: "Pix" },
  { id: "V7", data: hoje(), codigoProduto: "PRD001", qtd: 4, precoUnit: 12, custoUnit: 6.67, forma: "Dinheiro" },
];

const contasSeed: Conta[] = [
  { id: "C1", data: diasAtras(35), descricao: "Conta de luz", categoria: "Luz", valor: 180, pago: true },
  { id: "C2", data: diasAtras(33), descricao: "Conta de água", categoria: "Água", valor: 95, pago: true },
  { id: "C3", data: diasAtras(5), descricao: "Recarga de gás", categoria: "Gás", valor: 130, pago: true },
  { id: "C4", data: hoje(), descricao: "Fornecedor — farinha e açúcar", categoria: "Fornecedor", valor: 220, pago: false },
];

const VIEWS = ["Dashboard", "Insumos", "Produtos", "Receitas", "Registradora", "Reposição", "Benchmark"] as const;
type View = typeof VIEWS[number];

const ROTULOS: Record<View, string> = {
  Dashboard: "Dashboard", Insumos: "Insumos e Controle de Estoque", Produtos: "Produtos",
  Receitas: "Receitas", Registradora: "Registradora", Reposição: "Reposição e Contas a Pagar", Benchmark: "Benchmark",
};

const ICONES: Record<View, string> = {
  Dashboard: "📊", Insumos: "📦", Produtos: "🎂",
  Receitas: "💰", Registradora: "🧾", Reposição: "🔄", Benchmark: "⚡",
};

function App() {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [autorizado, setAutorizado] = useState(false);
  const [view, setView] = useState<View>("Dashboard");
  const [, setTick] = useState(0);
  const force = () => setTick((t) => t + 1);

  const [vendas, setVendas] = useState<Venda[]>(vendasSeed);
  const [contas, setContas] = useState<Conta[]>(contasSeed);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      if (localStorage.getItem("sis_auth") === "1") setAutorizado(true);
      else navigate({ to: "/login" });
    }
  }, [navigate]);

  const sair = () => {
    localStorage.removeItem("sis_auth");
    navigate({ to: "/login" });
  };


  const { listaInsumos, hashInsumos, listaProdutos, hashProdutos, pilha, fila } = useMemo(() => {
    const li = new ListaEncadeada<Insumo>();
    const hi = new TabelaHash<Insumo>();
    insumosSeed.forEach((i) => { li.inserir(i); hi.inserir(i.codigo, i); });

    const lp = new ListaEncadeada<Produto>();
    const hp = new TabelaHash<Produto>();
    produtosSeed.forEach((p) => { lp.inserir(p); hp.inserir(p.codigo, p); });

    const p = new Pilha<Movimentacao>();
    const f = new Fila<Reposicao>();
    const movs: Movimentacao[] = [
      { data: "2026-06-15 09:12", codigoInsumo: "INS001", tipo: "ENTRADA", qtd: 5, obs: "Compra mensal" },
      { data: "2026-06-16 14:30", codigoInsumo: "INS002", tipo: "SAIDA", qtd: 0.5, obs: "Bolo do dia" },
      { data: "2026-06-17 08:45", codigoInsumo: "INS004", tipo: "SAIDA", qtd: 3, obs: "Brigadeiros" },
    ];
    movs.forEach((m) => p.push(m));
    insumosSeed.filter((i) => i.estoque < i.minimo).forEach((i) => {
      f.enfileirar({ codigoInsumo: i.codigo, sugerido: i.minimo * 2 - i.estoque, data: "2026-06-17 09:00" });
    });
    return { listaInsumos: li, hashInsumos: hi, listaProdutos: lp, hashProdutos: hp, pilha: p, fila: f };
  }, []);

  if (!mounted || !autorizado) return null;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="w-64 bg-sidebar text-sidebar-foreground p-5 flex flex-col gap-1">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-sidebar-primary">🍰 SisInsumos</h1>
          <p className="text-xs opacity-70 mt-1">Controle & Precificação</p>
        </div>
        {VIEWS.filter(v => v !== "Benchmark").map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`flex items-start gap-2 text-left px-3 py-2.5 rounded-lg text-sm font-medium transition ${
              view === v ? "bg-sidebar-primary text-sidebar-primary-foreground" : "hover:bg-sidebar-accent"
            }`}
          >
            <span className="w-5 shrink-0 leading-snug">{ICONES[v]}</span>
            <span className="flex-1 leading-snug">{ROTULOS[v]}</span>
          </button>
        ))}
        <button onClick={sair} className="mt-4 text-left px-3 py-2 rounded-lg text-sm font-medium hover:bg-sidebar-accent opacity-80">
          ⎋ Sair
        </button>
        <div className="mt-auto pt-6 text-xs opacity-60">
          Trabalho acadêmico<br />Estrutura de Dados • ADS
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-auto">
        {view === "Dashboard" && <Dashboard listaInsumos={listaInsumos} listaProdutos={listaProdutos} pilha={pilha} fila={fila} vendas={vendas} setView={setView} />}
        {view === "Insumos" && <Insumos lista={listaInsumos} hash={hashInsumos} pilha={pilha} fila={fila} onChange={force} />}
        {view === "Produtos" && <Produtos lista={listaProdutos} hash={hashProdutos} hashInsumos={hashInsumos} listaInsumos={listaInsumos} onChange={force} />}
        {view === "Receitas" && <Receitas listaProdutos={listaProdutos} hashInsumos={hashInsumos} />}
        {view === "Registradora" && <Registradora vendas={vendas} setVendas={setVendas} listaProdutos={listaProdutos} hashProdutos={hashProdutos} hashInsumos={hashInsumos} />}
        {view === "Reposição" && <Reposicao fila={fila} hashInsumos={hashInsumos} contas={contas} setContas={setContas} onChange={force} />}
        {view === "Benchmark" && <Benchmark lista={listaInsumos} hash={hashInsumos} />}
      </main>
    </div>
  );
}

// ===== Componentes auxiliares =====
function Card({ titulo, valor, sub, onClick }: { titulo: string; valor: string | number; sub?: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`bg-card rounded-xl p-5 shadow-sm border text-left w-full transition hover:shadow-md hover:border-primary/40 ${onClick ? "cursor-pointer" : ""}`}
    >
      <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">{titulo}</div>
      <div className="text-3xl font-bold text-primary mt-2">{valor}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </button>
  );
}

function H1({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold text-foreground">{children}</h1>
      {sub && <p className="text-sm text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

function Tabela({ cabecalho, linhas }: { cabecalho: string[]; linhas: (string | number | React.ReactNode)[][] }) {
  return (
    <div className="bg-card rounded-xl border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-secondary"><tr>{cabecalho.map((c) => <th key={c} className="text-left p-3 font-semibold text-secondary-foreground">{c}</th>)}</tr></thead>
        <tbody>
          {linhas.length === 0 && <tr><td colSpan={cabecalho.length} className="p-6 text-center text-muted-foreground">Sem registros</td></tr>}
          {linhas.map((l, i) => (
            <tr key={i} className="border-t">{l.map((c, j) => <td key={j} className="p-3">{c}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ===== Views =====
function Dashboard({ listaInsumos, listaProdutos, pilha, fila, vendas, setView }: any) {
  const ins: Insumo[] = listaInsumos.listar();
  const movs: Movimentacao[] = pilha.exibir();

  // Agrupa lucro por dia (últimos 7 dias)
  const dias: string[] = [];
  for (let i = 6; i >= 0; i--) dias.push(diasAtras(i));
  const lucroPorDia = dias.map((d) => {
    const total = (vendas as Venda[])
      .filter((v) => v.data === d)
      .reduce((acc, v) => acc + (v.precoUnit - v.custoUnit) * v.qtd, 0);
    return { dia: d, lucro: total };
  });
  const maxLucro = Math.max(1, ...lucroPorDia.map((x) => x.lucro));
  const lucroHoje = lucroPorDia[lucroPorDia.length - 1].lucro;
  const lucro7d = lucroPorDia.reduce((a, x) => a + x.lucro, 0);

  return (
    <>
      <H1 sub="Visão geral do seu negócio">Dashboard</H1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card titulo="Insumos" valor={ins.length} onClick={() => setView("Insumos")} />
        <Card titulo="Produtos" valor={listaProdutos.tamanho} onClick={() => setView("Produtos")} />
        <Card titulo="Movimentações" valor={pilha.tamanho} sub="Controle de estoque" onClick={() => setView("Insumos")} />
        <Card titulo="Reposições" valor={fila.tamanho} onClick={() => setView("Reposição")} />
      </div>

      {/* Gráfico de vendas clicável */}
      <button
        onClick={() => setView("Registradora")}
        className="w-full text-left bg-card rounded-xl p-5 shadow-sm border mb-8 hover:shadow-md hover:border-primary/40 transition cursor-pointer"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">📈 Lucro dos últimos 7 dias</h2>
            <p className="text-xs text-muted-foreground mt-1">Clique para abrir a registradora</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Hoje</div>
            <div className="text-2xl font-bold text-primary">R$ {lucroHoje.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground mt-1">7d: R$ {lucro7d.toFixed(2)}</div>
          </div>
        </div>
        <div className="flex items-end gap-2 h-40">
          {lucroPorDia.map((d, i) => {
            const altura = (d.lucro / maxLucro) * 100;
            const ehHoje = i === lucroPorDia.length - 1;
            return (
              <div key={d.dia} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-xs font-medium text-foreground">R$ {d.lucro.toFixed(0)}</div>
                <div className="w-full flex-1 flex items-end">
                  <div
                    className={`w-full rounded-t-md transition ${ehHoje ? "bg-primary" : "bg-primary/40"}`}
                    style={{ height: `${Math.max(2, altura)}%` }}
                  />
                </div>
                <div className="text-[10px] text-muted-foreground">{d.dia.slice(8)}/{d.dia.slice(5, 7)}</div>
              </div>
            );
          })}
        </div>
      </button>

      <h2 className="text-lg font-semibold mb-3 text-foreground">Últimas movimentações</h2>
      <Tabela
        cabecalho={["Data", "Insumo", "Tipo", "Qtd", "Obs"]}
        linhas={movs.slice(0, 8).map((m) => [m.data, m.codigoInsumo, <span className={`px-2 py-1 rounded text-xs font-medium ${
          m.tipo === "ENTRADA" ? "bg-chart-2/20 text-chart-2" : m.tipo === "SAIDA" ? "bg-destructive/20 text-destructive" : "bg-muted text-foreground"
        }`}>{m.tipo}</span>, m.qtd, m.obs || "-"])}
      />
    </>
  );
}

function Insumos({ lista, hash, pilha, fila, onChange }: any) {
  const [busca, setBusca] = useState("");
  const [form, setForm] = useState({ codigo: "", nome: "", categoria: "", unidade: "kg", estoque: 0, minimo: 0, valor: 0 });
  const todos: Insumo[] = lista.listar();
  const filtrados = busca ? buscaSequencial(todos, (i) => i.nome.toLowerCase().includes(busca.toLowerCase())) : todos;
  const cadastrar = () => {
    if (!form.codigo || !form.nome) return alert("Código e nome são obrigatórios");
    if (hash.buscar(form.codigo)) return alert("Código já existe");
    lista.inserir({ ...form }); hash.inserir(form.codigo, form);
    setForm({ codigo: "", nome: "", categoria: "", unidade: "kg", estoque: 0, minimo: 0, valor: 0 });
    onChange();
  };
  const remover = (c: string) => { lista.remover((i: Insumo) => i.codigo === c); onChange(); };

  const [mCodigo, setMCodigo] = useState(todos[0]?.codigo || "");
  const [mTipo, setMTipo] = useState<"ENTRADA" | "SAIDA" | "AJUSTE">("ENTRADA");
  const [mQtd, setMQtd] = useState(1);
  const [mObs, setMObs] = useState("");
  const registrar = () => {
    const i = todos.find((x) => x.codigo === mCodigo); if (!i) return alert("Selecione um insumo");
    if (mTipo === "ENTRADA") i.estoque += mQtd;
    else if (mTipo === "SAIDA") {
      if (i.estoque - mQtd < 0) return alert("Estoque insuficiente!");
      i.estoque -= mQtd;
    } else i.estoque = mQtd;
    pilha.push({ data: new Date().toLocaleString("pt-BR"), codigoInsumo: mCodigo, tipo: mTipo, qtd: mQtd, obs: mObs });
    if (i.estoque < i.minimo) fila.enfileirar({ codigoInsumo: i.codigo, sugerido: i.minimo * 2 - i.estoque, data: new Date().toLocaleString("pt-BR") });
    setMObs(""); onChange();
  };

  return (
    <>
      <H1 sub="Cadastro de insumos e movimentações de estoque">Insumos e Controle de Estoque</H1>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3 text-foreground flex items-center gap-2">
          <span>➕</span> Cadastrar novo insumo
        </h2>
        <div className="bg-card p-5 rounded-xl border space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(["codigo","nome","categoria","unidade"] as const).map((k) => (
              <input key={k} placeholder={k} value={(form as any)[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                className="border rounded-md px-3 py-2 text-sm" />
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
            <div>
              <label className="text-xs text-muted-foreground">Preço (R$)</label>
              <input type="number" step="0.01" value={form.valor}
                onChange={(e) => setForm({ ...form, valor: parseFloat(e.target.value) || 0 })}
                className="w-full border rounded-md px-3 py-2 text-sm" />
            </div>
            <div className="md:col-start-4">
              <button onClick={cadastrar} className="w-full bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-semibold hover:opacity-90">+ Cadastrar</button>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3 text-foreground flex items-center gap-2">
          <span>📦</span> Controle de estoque (movimentações)
        </h2>
        <div className="bg-card p-5 rounded-xl border grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
          <div><label className="text-xs text-muted-foreground">Insumo</label>
            <select value={mCodigo} onChange={(e) => setMCodigo(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm">
              {todos.map((i) => <option key={i.codigo} value={i.codigo}>{i.codigo} — {i.nome}</option>)}
            </select></div>
          <div><label className="text-xs text-muted-foreground">Tipo</label>
            <select value={mTipo} onChange={(e) => setMTipo(e.target.value as any)} className="w-full border rounded-md px-3 py-2 text-sm">
              <option>ENTRADA</option><option>SAIDA</option><option>AJUSTE</option>
            </select></div>
          <div><label className="text-xs text-muted-foreground">Quantidade</label>
            <input type="number" step="0.01" value={mQtd} onChange={(e) => setMQtd(parseFloat(e.target.value) || 0)} className="w-full border rounded-md px-3 py-2 text-sm" /></div>
          <div><label className="text-xs text-muted-foreground">Observação</label>
            <input value={mObs} onChange={(e) => setMObs(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm" /></div>
          <button onClick={registrar} className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-semibold hover:opacity-90">Registrar</button>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3 text-foreground flex items-center gap-2">
          <span>📋</span> Insumos cadastrados
        </h2>
        <input placeholder="🔍 Buscar por nome (busca sequencial)..." value={busca} onChange={(e) => setBusca(e.target.value)}
          className="w-full border rounded-md px-3 py-2 text-sm mb-3" />
        <Tabela
          cabecalho={["Código","Nome","Categoria","Estoque","R$ unit.","Ação"]}
          linhas={filtrados.map((i) => [
            i.codigo, i.nome, i.categoria,
            <>{i.estoque} {i.unidade} {i.estoque < i.minimo && <span className="ml-2 text-xs bg-destructive text-destructive-foreground px-2 py-0.5 rounded">BAIXO</span>}</>,
            `R$ ${i.valor.toFixed(2)}`,
            <button onClick={() => remover(i.codigo)} className="text-destructive text-xs hover:underline">excluir</button>,
          ])}
        />
      </section>
    </>
  );
}

function Produtos({ lista, hash, hashInsumos, listaInsumos, onChange }: any) {
  const ps: Produto[] = lista.listar();
  const insumos: Insumo[] = listaInsumos.listar();
  const [form, setForm] = useState({ codigo: "", nome: "", margem: 0, rendimento: 1 });
  const [receita, setReceita] = useState<{ codigoInsumo: string; qtd: number }[]>([]);
  const [itemSel, setItemSel] = useState(insumos[0]?.codigo || "");
  const [itemQtd, setItemQtd] = useState(1);

  const addItem = () => {
    if (!itemSel || itemQtd <= 0) return;
    if (receita.some((r) => r.codigoInsumo === itemSel)) return alert("Insumo já adicionado");
    setReceita([...receita, { codigoInsumo: itemSel, qtd: itemQtd }]);
    setItemQtd(1);
  };
  const removerItem = (c: string) => setReceita(receita.filter((r) => r.codigoInsumo !== c));

  const custoTotal = receita.reduce((acc, r) => {
    const ins: Insumo | null = hashInsumos.buscar(r.codigoInsumo);
    return acc + (ins?.valor || 0) * r.qtd;
  }, 0);
  const custoUnit = form.rendimento > 0 ? custoTotal / form.rendimento : 0;
  const lucroUnit = (custoUnit * form.margem) / 100;
  const precoVenda = custoUnit + lucroUnit;

  const cadastrar = () => {
    if (!form.codigo.trim() || !form.nome.trim()) return alert("Código e nome são obrigatórios");
    if (form.codigo.length > 20 || form.nome.length > 100) return alert("Código/nome muito longos");
    if (hash.buscar(form.codigo)) return alert("Código já existe");
    const novo: Produto = { ...form, receita: [...receita] };
    lista.inserir(novo); hash.inserir(novo.codigo, novo);
    setForm({ codigo: "", nome: "", margem: 0, rendimento: 1 });
    setReceita([]);
    onChange();
  };
  const remover = (c: string) => { lista.remover((p: Produto) => p.codigo === c); onChange(); };

  return (
    <>
      <H1 sub="">Produtos</H1>

      <h2 className="text-lg font-semibold mb-3 text-foreground flex items-center gap-2">
        <span>➕</span> Cadastrar produto
      </h2>
      <div className="bg-card p-5 rounded-xl border mb-5 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div><label className="text-xs text-muted-foreground">Código</label>
            <input maxLength={20} value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} className="w-full border rounded-md px-3 py-2 text-sm" /></div>
          <div><label className="text-xs text-muted-foreground">Nome</label>
            <input maxLength={100} value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className="w-full border rounded-md px-3 py-2 text-sm" /></div>
          <div><label className="text-xs text-muted-foreground">Margem (%)</label>
            <input type="number" step="1" value={form.margem} onChange={(e) => setForm({ ...form, margem: parseFloat(e.target.value) || 0 })} className="w-full border rounded-md px-3 py-2 text-sm" /></div>
          <div><label className="text-xs text-muted-foreground">Rendimento</label>
            <input type="number" step="1" value={form.rendimento} onChange={(e) => setForm({ ...form, rendimento: parseFloat(e.target.value) || 1 })} className="w-full border rounded-md px-3 py-2 text-sm" /></div>
        </div>

        <div className="border-t pt-4">
          <div className="text-sm font-semibold mb-2 text-foreground">Itens da receita</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
            <div className="md:col-span-2"><label className="text-xs text-muted-foreground">Insumo</label>
              <select value={itemSel} onChange={(e) => setItemSel(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm">
                {insumos.map((i) => <option key={i.codigo} value={i.codigo}>{i.nome} (R$ {i.valor.toFixed(2)}/{i.unidade})</option>)}
              </select></div>
            <div><label className="text-xs text-muted-foreground">Quantidade</label>
              <input type="number" step="0.01" value={itemQtd} onChange={(e) => setItemQtd(parseFloat(e.target.value) || 0)} className="w-full border rounded-md px-3 py-2 text-sm" /></div>
            <button onClick={addItem} className="bg-secondary text-secondary-foreground rounded-md px-4 py-2 text-sm font-semibold hover:opacity-90">+ Adicionar item</button>
          </div>
          {receita.length > 0 && (
            <div className="mt-3 border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-secondary"><tr>
                  <th className="text-left p-2">Insumo</th><th className="text-left p-2">Qtd</th>
                  <th className="text-left p-2">Subtotal</th><th className="p-2"></th>
                </tr></thead>
                <tbody>{receita.map((r) => {
                  const ins: Insumo | null = hashInsumos.buscar(r.codigoInsumo);
                  const sub = (ins?.valor || 0) * r.qtd;
                  return (<tr key={r.codigoInsumo} className="border-t">
                    <td className="p-2">{ins?.nome || r.codigoInsumo}</td>
                    <td className="p-2">{r.qtd} {ins?.unidade}</td>
                    <td className="p-2">R$ {sub.toFixed(2)}</td>
                    <td className="p-2 text-right"><button onClick={() => removerItem(r.codigoInsumo)} className="text-destructive text-xs hover:underline">remover</button></td>
                  </tr>);
                })}</tbody>
              </table>
            </div>
          )}
        </div>

        <div className="border-t pt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-secondary/50 rounded-md p-3"><div className="text-xs text-muted-foreground">Custo total</div><div className="text-lg font-bold text-foreground">R$ {custoTotal.toFixed(2)}</div></div>
          <div className="bg-secondary/50 rounded-md p-3"><div className="text-xs text-muted-foreground">Custo unitário</div><div className="text-lg font-bold text-foreground">R$ {custoUnit.toFixed(2)}</div></div>
          <div className="bg-secondary/50 rounded-md p-3"><div className="text-xs text-muted-foreground">Lucro por un.</div><div className="text-lg font-bold text-chart-2">R$ {lucroUnit.toFixed(2)}</div></div>
          <div className="bg-primary/10 rounded-md p-3"><div className="text-xs text-muted-foreground">Preço de venda</div><div className="text-lg font-bold text-primary">R$ {precoVenda.toFixed(2)}</div></div>
        </div>

        <button onClick={cadastrar} className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-semibold hover:opacity-90 w-full md:w-auto">+ Cadastrar produto</button>
      </div>
      <Tabela cabecalho={["Código","Nome","Margem","Rendimento","Itens na receita","Ação"]}
        linhas={ps.map((p) => [p.codigo, p.nome, `${p.margem}%`, p.rendimento, p.receita.length,
          <button onClick={() => remover(p.codigo)} className="text-destructive text-xs hover:underline">excluir</button>])} />
    </>
  );
}

function Receitas({ listaProdutos, hashInsumos }: any) {
  const ps: Produto[] = listaProdutos.listar();
  const [cod, setCod] = useState(ps[0]?.codigo || "");
  const p = ps.find((x) => x.codigo === cod);
  let custoTotal = 0;
  const itens = (p?.receita || []).map((r) => {
    const ins: Insumo | null = hashInsumos.buscar(r.codigoInsumo);
    const sub = (ins?.valor || 0) * r.qtd; custoTotal += sub;
    return { nome: ins?.nome || "?", qtd: r.qtd, unid: ins?.unidade || "", unit: ins?.valor || 0, sub };
  });
  const custoUnit = p ? custoTotal / p.rendimento : 0;
  const preco = p ? custoUnit + (custoUnit * p.margem) / 100 : 0;
  return (
    <>
      <H1 sub="Cálculo automático: Preço = Custo + (Custo × Margem)">Receitas e Precificação</H1>
      <select value={cod} onChange={(e) => setCod(e.target.value)} className="border rounded-md px-3 py-2 text-sm mb-5">
        {ps.map((x) => <option key={x.codigo} value={x.codigo}>{x.nome}</option>)}
      </select>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card titulo="Custo total" valor={`R$ ${custoTotal.toFixed(2)}`} sub={`receita p/ ${p?.rendimento} un`} />
        <Card titulo="Custo unitário" valor={`R$ ${custoUnit.toFixed(2)}`} />
        <Card titulo="Margem" valor={`${p?.margem || 0}%`} />
        <Card titulo="Preço sugerido" valor={`R$ ${preco.toFixed(2)}`} sub="por unidade" />
      </div>
      <Tabela cabecalho={["Insumo","Qtd usada","R$ unit.","Subtotal"]}
        linhas={itens.map((i) => [i.nome, `${i.qtd} ${i.unid}`, `R$ ${i.unit.toFixed(2)}`, `R$ ${i.sub.toFixed(2)}`])} />
    </>
  );
}

function Registradora({ vendas, setVendas, listaProdutos, hashProdutos, hashInsumos }: any) {
  const produtos: Produto[] = listaProdutos.listar();

  // calcula custo unitário a partir da receita
  const custoUnitDe = (p: Produto) => {
    if (!p) return 0;
    const total = p.receita.reduce((acc, r) => {
      const ins: Insumo | null = hashInsumos.buscar(r.codigoInsumo);
      return acc + (ins?.valor || 0) * r.qtd;
    }, 0);
    return p.rendimento > 0 ? total / p.rendimento : 0;
  };
  // preço sugerido
  const precoSugDe = (p: Produto) => {
    const c = custoUnitDe(p);
    return c + (c * p.margem) / 100;
  };

  const [codProd, setCodProd] = useState(produtos[0]?.codigo || "");
  const prodSel: Produto | undefined = produtos.find((p) => p.codigo === codProd);
  const [qtd, setQtd] = useState(1);
  const [preco, setPreco] = useState(prodSel ? +precoSugDe(prodSel).toFixed(2) : 0);
  const [forma, setForma] = useState<FormaPgto>("Pix");

  const trocarProduto = (c: string) => {
    setCodProd(c);
    const p = produtos.find((x) => x.codigo === c);
    if (p) setPreco(+precoSugDe(p).toFixed(2));
  };

  const adicionarVenda = () => {
    const p = produtos.find((x) => x.codigo === codProd);
    if (!p) return alert("Selecione um produto");
    if (qtd <= 0 || preco <= 0) return alert("Quantidade e preço devem ser maiores que zero");
    const nova: Venda = {
      id: `V${Date.now()}`,
      data: hoje(),
      codigoProduto: codProd,
      qtd,
      precoUnit: preco,
      custoUnit: custoUnitDe(p),
      forma,
    };
    setVendas([nova, ...vendas]);
    setQtd(1);
  };

  const remover = (id: string) => setVendas((vendas as Venda[]).filter((v) => v.id !== id));

  // agrupa por dia
  const porDia: Record<string, Venda[]> = {};
  (vendas as Venda[]).forEach((v) => { (porDia[v.data] = porDia[v.data] || []).push(v); });
  const dias = Object.keys(porDia).sort((a, b) => b.localeCompare(a));

  const totalDia = (vs: Venda[]) => vs.reduce((a, v) => a + v.precoUnit * v.qtd, 0);
  const lucroDia = (vs: Venda[]) => vs.reduce((a, v) => a + (v.precoUnit - v.custoUnit) * v.qtd, 0);

  return (
    <>
      <H1 sub="Registro de vendas do dia e histórico anterior">Registradora</H1>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-3 text-foreground flex items-center gap-2">
          <span>➕</span> Registrar venda
        </h2>
        <div className="bg-card p-5 rounded-xl border grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
          <div className="md:col-span-2">
            <label className="text-xs text-muted-foreground">Produto vendido</label>
            <select value={codProd} onChange={(e) => trocarProduto(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm">
              {produtos.map((p) => <option key={p.codigo} value={p.codigo}>{p.nome} (sug. R$ {precoSugDe(p).toFixed(2)})</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Quantidade</label>
            <input type="number" step="1" value={qtd} onChange={(e) => setQtd(parseInt(e.target.value) || 0)} className="w-full border rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Preço unit. (R$)</label>
            <input type="number" step="0.01" value={preco} onChange={(e) => setPreco(parseFloat(e.target.value) || 0)} className="w-full border rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Forma de pagamento</label>
            <select value={forma} onChange={(e) => setForma(e.target.value as FormaPgto)} className="w-full border rounded-md px-3 py-2 text-sm">
              <option>Dinheiro</option><option>Pix</option><option>Débito</option><option>Crédito</option>
            </select>
          </div>
          <button onClick={adicionarVenda} className="md:col-span-5 bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-semibold hover:opacity-90">
            + Adicionar venda
          </button>
        </div>
      </section>

      {dias.map((d) => {
        const vs = porDia[d];
        const ehHoje = d === hoje();
        return (
          <section key={d} className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-semibold text-foreground">
                {ehHoje ? "📅 Hoje — " : "📅 "}{d.split("-").reverse().join("/")}
              </h3>
              <div className="text-sm text-muted-foreground">
                Total: <span className="font-bold text-primary">R$ {totalDia(vs).toFixed(2)}</span>
                <span className="ml-3">Lucro: <span className="font-bold text-chart-2">R$ {lucroDia(vs).toFixed(2)}</span></span>
              </div>
            </div>
            <Tabela
              cabecalho={["Produto", "Qtd", "Preço unit.", "Subtotal", "Pagamento", "Ação"]}
              linhas={vs.map((v) => {
                const p: Produto | null = hashProdutos.buscar(v.codigoProduto);
                return [
                  p?.nome || v.codigoProduto,
                  v.qtd,
                  `R$ ${v.precoUnit.toFixed(2)}`,
                  `R$ ${(v.precoUnit * v.qtd).toFixed(2)}`,
                  <span className="px-2 py-1 rounded text-xs font-medium bg-secondary text-secondary-foreground">{v.forma}</span>,
                  <button onClick={() => remover(v.id)} className="text-destructive text-xs hover:underline">excluir</button>,
                ];
              })}
            />
          </section>
        );
      })}
    </>
  );
}

function Reposicao({ fila, hashInsumos, contas, setContas, onChange }: any) {
  const pedidos: Reposicao[] = fila.consultar();
  const atender = () => { fila.desenfileirar(); onChange(); };

  const [form, setForm] = useState<{ descricao: string; categoria: string; valor: number; pago: boolean; data: string }>({
    descricao: "", categoria: "Fornecedor", valor: 0, pago: false, data: hoje(),
  });
  const adicionarConta = () => {
    if (!form.descricao.trim() || form.valor <= 0) return alert("Descrição e valor são obrigatórios");
    const nova: Conta = { id: `C${Date.now()}`, ...form };
    setContas([nova, ...contas]);
    setForm({ descricao: "", categoria: "Fornecedor", valor: 0, pago: false, data: hoje() });
  };
  const togglePago = (id: string) => setContas((contas as Conta[]).map((c) => c.id === id ? { ...c, pago: !c.pago } : c));
  const removerConta = (id: string) => setContas((contas as Conta[]).filter((c) => c.id !== id));

  // agrupa por mês
  const mesAtual = hoje().slice(0, 7);
  const [mesSel, setMesSel] = useState(mesAtual);
  const mesesDisp = Array.from(new Set((contas as Conta[]).map((c) => c.data.slice(0, 7)))).sort((a, b) => b.localeCompare(a));
  if (!mesesDisp.includes(mesAtual)) mesesDisp.unshift(mesAtual);

  const contasMes = (contas as Conta[]).filter((c) => c.data.startsWith(mesSel));
  const totalMes = contasMes.reduce((a, c) => a + c.valor, 0);
  const aPagarMes = contasMes.filter((c) => !c.pago).reduce((a, c) => a + c.valor, 0);

  return (
    <>
      <H1 sub="Pedidos de reposição de insumos e contas do mês">Reposição e Contas a Pagar</H1>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3 text-foreground flex items-center gap-2"><span>🔄</span> Pedidos de Reposição</h2>
        <button onClick={atender} disabled={!pedidos.length} className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-semibold mb-3 disabled:opacity-40">
          Atender próximo
        </button>
        <Tabela cabecalho={["#","Insumo","Qtd sugerida","Criado em"]}
          linhas={pedidos.map((p, i) => [i + 1, hashInsumos.buscar(p.codigoInsumo)?.nome || p.codigoInsumo, p.sugerido.toFixed(2), p.data])} />
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-3 text-foreground flex items-center gap-2"><span>💵</span> Adicionar conta a pagar</h2>
        <div className="bg-card p-5 rounded-xl border grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
          <div className="md:col-span-2">
            <label className="text-xs text-muted-foreground">Descrição</label>
            <input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} className="w-full border rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Categoria</label>
            <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} className="w-full border rounded-md px-3 py-2 text-sm">
              <option>Gás</option><option>Fornecedor</option><option>Água</option><option>Luz</option><option>Internet</option><option>Aluguel</option><option>Outros</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Valor (R$)</label>
            <input type="number" step="0.01" value={form.valor} onChange={(e) => setForm({ ...form, valor: parseFloat(e.target.value) || 0 })} className="w-full border rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Data</label>
            <input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} className="w-full border rounded-md px-3 py-2 text-sm" />
          </div>
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input type="checkbox" checked={form.pago} onChange={(e) => setForm({ ...form, pago: e.target.checked })} />
            Já está pago
          </label>
          <button onClick={adicionarConta} className="md:col-span-3 bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-semibold hover:opacity-90">
            + Adicionar conta
          </button>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2"><span>📅</span> Contas do mês</h2>
          <div className="flex items-center gap-3">
            <select value={mesSel} onChange={(e) => setMesSel(e.target.value)} className="border rounded-md px-3 py-2 text-sm">
              {mesesDisp.map((m) => <option key={m} value={m}>{m.split("-").reverse().join("/")}</option>)}
            </select>
            <div className="text-sm text-muted-foreground">
              Total: <span className="font-bold text-foreground">R$ {totalMes.toFixed(2)}</span>
              <span className="ml-3">A pagar: <span className="font-bold text-destructive">R$ {aPagarMes.toFixed(2)}</span></span>
            </div>
          </div>
        </div>
        <Tabela
          cabecalho={["Data", "Descrição", "Categoria", "Valor", "Status", "Ação"]}
          linhas={contasMes.map((c) => [
            c.data.split("-").reverse().join("/"),
            c.descricao,
            c.categoria,
            `R$ ${c.valor.toFixed(2)}`,
            <button onClick={() => togglePago(c.id)} className={`px-2 py-1 rounded text-xs font-medium ${c.pago ? "bg-chart-2/20 text-chart-2" : "bg-destructive/20 text-destructive"}`}>
              {c.pago ? "✓ Pago" : "Pendente"}
            </button>,
            <button onClick={() => removerConta(c.id)} className="text-destructive text-xs hover:underline">excluir</button>,
          ])}
        />
      </section>
    </>
  );
}

function Benchmark({ lista, hash }: any) {
  const [codigo, setCodigo] = useState("INS001");
  const [resBusca, setResBusca] = useState<{ tecnica: string; tempoMs: number; comp: number; achou: boolean }[]>([]);
  const [resOrd, setResOrd] = useState<{ tecnica: string; tempoMs: number }[]>([]);

  const compararBusca = () => {
    const arr: Insumo[] = lista.listar();
    const t1 = performance.now(); let comp = 0; let achouSeq = false;
    for (const i of arr) { comp++; if (i.codigo === codigo) { achouSeq = true; break; } }
    const tSeq = performance.now() - t1;
    const t2 = performance.now(); const achouHash = !!hash.buscar(codigo); const tHash = performance.now() - t2;
    setResBusca([
      { tecnica: "Busca Sequencial", tempoMs: tSeq, comp, achou: achouSeq },
      { tecnica: "Busca por Hash",   tempoMs: tHash, comp: 1, achou: achouHash },
    ]);
  };
  const compararOrd = () => {
    const arr: Insumo[] = lista.listar();
    const b = bubbleSort(arr, (a, c) => a.nome.localeCompare(c.nome));
    const i = insertionSort(arr, (a, c) => a.nome.localeCompare(c.nome));
    setResOrd([
      { tecnica: "Bubble Sort", tempoMs: b.tempoMs },
      { tecnica: "Insertion Sort", tempoMs: i.tempoMs },
    ]);
  };

  return (
    <>
      <H1 sub="Compare empiricamente os algoritmos implementados manualmente">Benchmark</H1>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-card p-5 rounded-xl border">
          <h3 className="font-semibold mb-3">Busca: Sequencial vs Hash</h3>
          <div className="flex gap-2 mb-3">
            <input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Código do insumo" className="flex-1 border rounded-md px-3 py-2 text-sm" />
            <button onClick={compararBusca} className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-semibold">Comparar</button>
          </div>
          {resBusca.length > 0 && <Tabela cabecalho={["Técnica","Tempo (ms)","Comparações","Achou"]}
            linhas={resBusca.map((r) => [r.tecnica, r.tempoMs.toFixed(4), r.comp, r.achou ? "✓" : "✗"])} />}
        </div>
        <div className="bg-card p-5 rounded-xl border">
          <h3 className="font-semibold mb-3">Ordenação: Bubble vs Insertion</h3>
          <button onClick={compararOrd} className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-semibold mb-3">Ordenar por nome</button>
          {resOrd.length > 0 && <Tabela cabecalho={["Técnica","Tempo (ms)"]}
            linhas={resOrd.map((r) => [r.tecnica, r.tempoMs.toFixed(4)])} />}
        </div>
      </div>
    </>
  );
}
