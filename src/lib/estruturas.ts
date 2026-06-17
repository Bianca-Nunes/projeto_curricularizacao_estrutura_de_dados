// Estruturas de dados manuais (espelham a implementação Java didaticamente)
// Lista Simplesmente Encadeada, Pilha, Fila — usadas para popular o protótipo.

export class NoSimples<T> { constructor(public valor: T, public proximo: NoSimples<T> | null = null) {} }

export class ListaEncadeada<T> {
  private inicio: NoSimples<T> | null = null;
  private _tamanho = 0;
  inserir(v: T) {
    const n = new NoSimples(v);
    if (!this.inicio) this.inicio = n;
    else { let a = this.inicio; while (a.proximo) a = a.proximo; a.proximo = n; }
    this._tamanho++;
  }
  remover(pred: (v: T) => boolean): boolean {
    if (!this.inicio) return false;
    if (pred(this.inicio.valor)) { this.inicio = this.inicio.proximo; this._tamanho--; return true; }
    let ant = this.inicio, atual = this.inicio.proximo;
    while (atual) {
      if (pred(atual.valor)) { ant.proximo = atual.proximo; this._tamanho--; return true; }
      ant = atual; atual = atual.proximo;
    }
    return false;
  }
  listar(): T[] { const r: T[] = []; let a = this.inicio; while (a) { r.push(a.valor); a = a.proximo; } return r; }
  get tamanho() { return this._tamanho; }
}

export class Pilha<T> {
  private topo: { v: T; ant: any } | null = null;
  private _tamanho = 0;
  push(v: T) { this.topo = { v, ant: this.topo }; this._tamanho++; }
  pop(): T | null { if (!this.topo) return null; const v = this.topo.v; this.topo = this.topo.ant; this._tamanho--; return v; }
  exibir(): T[] { const r: T[] = []; let a = this.topo; while (a) { r.push(a.v); a = a.ant; } return r; }
  get tamanho() { return this._tamanho; }
}

export class Fila<T> {
  private inicio: { v: T; prox: any } | null = null;
  private fim: { v: T; prox: any } | null = null;
  private _tamanho = 0;
  enfileirar(v: T) {
    const n = { v, prox: null };
    if (!this.inicio) this.inicio = this.fim = n;
    else { this.fim!.prox = n; this.fim = n; }
    this._tamanho++;
  }
  desenfileirar(): T | null {
    if (!this.inicio) return null;
    const v = this.inicio.v; this.inicio = this.inicio.prox;
    if (!this.inicio) this.fim = null;
    this._tamanho--;
    return v;
  }
  consultar(): T[] { const r: T[] = []; let a = this.inicio; while (a) { r.push(a.v); a = a.prox; } return r; }
  get tamanho() { return this._tamanho; }
}

export class TabelaHash<T> {
  private buckets: Array<Array<{ k: string; v: T }>>;
  constructor(private capacidade = 31) { this.buckets = Array.from({ length: capacidade }, () => []); }
  private hash(k: string) { let s = 0; for (let i = 0; i < k.length; i++) s += k.charCodeAt(i); return s % this.capacidade; }
  inserir(k: string, v: T) {
    const i = this.hash(k); const b = this.buckets[i];
    const ex = b.find((e) => e.k === k); if (ex) { ex.v = v; return; }
    b.push({ k, v });
  }
  buscar(k: string): T | null { return this.buckets[this.hash(k)].find((e) => e.k === k)?.v ?? null; }
}

export function buscaSequencial<T>(arr: T[], pred: (v: T) => boolean): T[] {
  const r: T[] = []; for (let i = 0; i < arr.length; i++) if (pred(arr[i])) r.push(arr[i]); return r;
}

export function bubbleSort<T>(arr: T[], cmp: (a: T, b: T) => number): { arr: T[]; tempoMs: number } {
  const a = [...arr]; const t0 = performance.now();
  for (let i = 0; i < a.length - 1; i++) {
    let trocou = false;
    for (let j = 0; j < a.length - 1 - i; j++) {
      if (cmp(a[j], a[j + 1]) > 0) { [a[j], a[j + 1]] = [a[j + 1], a[j]]; trocou = true; }
    }
    if (!trocou) break;
  }
  return { arr: a, tempoMs: performance.now() - t0 };
}

export function insertionSort<T>(arr: T[], cmp: (a: T, b: T) => number): { arr: T[]; tempoMs: number } {
  const a = [...arr]; const t0 = performance.now();
  for (let i = 1; i < a.length; i++) {
    const ch = a[i]; let j = i - 1;
    while (j >= 0 && cmp(a[j], ch) > 0) { a[j + 1] = a[j]; j--; }
    a[j + 1] = ch;
  }
  return { arr: a, tempoMs: performance.now() - t0 };
}
