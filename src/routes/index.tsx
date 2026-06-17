import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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

const VIEWS = ["Dashboard", "Insumos", "Produtos", "Receitas", "Histórico", "Reposição", "Benchmark"] as const;
type View = typeof VIEWS[number];

const ROTULOS: Record<View, string> = {
  Dashboard: "Dashboard", Insumos: "Insumos e Controle de Estoque", Produtos: "Produtos",
  Receitas: "Receitas", Histórico: "Histórico", Reposição: "Reposição", Benchmark: "Benchmark",
};

const ICONES: Record<View, string> = {
  Dashboard: "📊", Insumos: "🥚", Produtos: "🎂",
  Receitas: "💰", Histórico: "📜", Reposição: "🔄", Benchmark: "⚡",
};

function App() {
  const [view, setView] = useState<View>("Dashboard");

  // Estado mantido em estruturas manuais
  const [, setTick] = useState(0);
  const force = () => setTick((t) => t + 1);

  const { listaInsumos, hashInsumos, listaProdutos, hashProdutos, pilha, fila } = useMemo(() => {
    const li = new ListaEncadeada<Insumo>();
    const hi = new TabelaHash<Insumo>();
    insumosSeed.forEach((i) => { li.inserir(i); hi.inserir(i.codigo, i); });

    const lp = new ListaEncadeada<Produto>();
    const hp = new TabelaHash<Produto>();
    produtosSeed.forEach((p) => { lp.inserir(p); hp.inserir(p.codigo, p); });

    const p = new Pilha<Movimentacao>();
    const f = new Fila<Reposicao>();
    // Pré-popula com algumas movimentações
    const movs: Movimentacao[] = [
      { data: "2026-06-15 09:12", codigoInsumo: "INS001", tipo: "ENTRADA", qtd: 5, obs: "Compra mensal" },
      { data: "2026-06-16 14:30", codigoInsumo: "INS002", tipo: "SAIDA", qtd: 0.5, obs: "Bolo do dia" },
      { data: "2026-06-17 08:45", codigoInsumo: "INS004", tipo: "SAIDA", qtd: 3, obs: "Brigadeiros" },
    ];
    movs.forEach((m) => p.push(m));
    // INS004 e INS002 estão abaixo do mínimo → enfileirar
    insumosSeed.filter((i) => i.estoque < i.minimo).forEach((i) => {
      f.enfileirar({ codigoInsumo: i.codigo, sugerido: i.minimo * 2 - i.estoque, data: "2026-06-17 09:00" });
    });
    return { listaInsumos: li, hashInsumos: hi, listaProdutos: lp, hashProdutos: hp, pilha: p, fila: f };
  }, []);

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
            className={`text-left px-3 py-2.5 rounded-lg text-sm font-medium transition ${
              view === v ? "bg-sidebar-primary text-sidebar-primary-foreground" : "hover:bg-sidebar-accent"
            }`}
          >
            <span className="mr-2">{ICONES[v]}</span>{ROTULOS[v]}
          </button>
        ))}
        <div className="mt-auto pt-6 text-xs opacity-60">
          Trabalho acadêmico<br />Estrutura de Dados • ADS
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-auto">
        {view === "Dashboard" && <Dashboard listaInsumos={listaInsumos} listaProdutos={listaProdutos} pilha={pilha} fila={fila} setView={setView} />}
        {view === "Insumos" && <Insumos lista={listaInsumos} hash={hashInsumos} pilha={pilha} fila={fila} onChange={force} />}
        {view === "Produtos" && <Produtos lista={listaProdutos} hash={hashProdutos} hashInsumos={hashInsumos} listaInsumos={listaInsumos} onChange={force} />}
        {view === "Receitas" && <Receitas listaProdutos={listaProdutos} hashInsumos={hashInsumos} />}
        {view === "Histórico" && <Historico pilha={pilha} hashInsumos={hashInsumos} />}
        {view === "Reposição" && <Reposicao fila={fila} hashInsumos={hashInsumos} onChange={force} />}
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
function Dashboard({ listaInsumos, listaProdutos, pilha, fila, setView }: any) {
  const ins: Insumo[] = listaInsumos.listar();
  const movs: Movimentacao[] = pilha.exibir();
  return (
    <>
      <H1 sub="Visão geral do seu negócio">Dashboard</H1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card titulo="Insumos" valor={ins.length} onClick={() => setView("Insumos")} />
        <Card titulo="Produtos" valor={listaProdutos.tamanho} onClick={() => setView("Produtos")} />
        <Card titulo="Movimentações" valor={pilha.tamanho} sub="Controle de estoque" onClick={() => setView("Insumos")} />
        <Card titulo="Reposições" valor={fila.tamanho} onClick={() => setView("Reposição")} />
      </div>
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

  // ===== Controle de estoque =====
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

      {/* ===== Cadastrar insumo ===== */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3 text-foreground flex items-center gap-2">
          <span>➕</span> Cadastrar novo insumo
        </h2>
        <div className="bg-card p-5 rounded-xl border grid grid-cols-2 md:grid-cols-4 gap-3">
          {(["codigo","nome","categoria","unidade"] as const).map((k) => (
            <input key={k} placeholder={k} value={(form as any)[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })}
              className="border rounded-md px-3 py-2 text-sm" />
          ))}
          {(["estoque","minimo","valor"] as const).map((k) => (
            <input key={k} type="number" step="0.01" placeholder={k} value={(form as any)[k]}
              onChange={(e) => setForm({ ...form, [k]: parseFloat(e.target.value) || 0 })}
              className="border rounded-md px-3 py-2 text-sm" />
          ))}
          <button onClick={cadastrar} className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-semibold hover:opacity-90">+ Cadastrar</button>
        </div>
      </section>

      {/* ===== Controle de estoque ===== */}
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

      {/* ===== Lista de insumos ===== */}
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

  // Cálculos automáticos
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

function Historico({ pilha, hashInsumos }: any) {
  const movs: Movimentacao[] = pilha.exibir();
  return (
    <>
      <H1 sub="">Histórico</H1>
      <Tabela cabecalho={["Data","Insumo","Tipo","Qtd","Obs"]}
        linhas={movs.map((m) => [m.data, hashInsumos.buscar(m.codigoInsumo)?.nome || m.codigoInsumo, m.tipo, m.qtd, m.obs || "-"])} />
    </>
  );
}

function Reposicao({ fila, hashInsumos, onChange }: any) {
  const pedidos: Reposicao[] = fila.consultar();
  const atender = () => { fila.desenfileirar(); onChange(); };
  return (
    <>
      <H1 sub="">Pedidos de Reposição</H1>
      <button onClick={atender} disabled={!pedidos.length} className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-semibold mb-4 disabled:opacity-40">
        Atender próximo
      </button>
      <Tabela cabecalho={["#","Insumo","Qtd sugerida","Criado em"]}
        linhas={pedidos.map((p, i) => [i + 1, hashInsumos.buscar(p.codigoInsumo)?.nome || p.codigoInsumo, p.sugerido.toFixed(2), p.data])} />
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
