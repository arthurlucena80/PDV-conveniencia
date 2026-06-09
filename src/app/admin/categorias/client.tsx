"use client";
// ============================================================
// categorias/client.tsx — Interface de Categorias (Navegador)
// (interface-de-categorias.tsx)
//
// O QUE ESTE ARQUIVO FAZ:
// É o componente de interface INTERATIVO da página de categorias.
// Exibe a grade de categorias e gerencia o modal de criação/edição.
//
// "use client" = este componente roda NO NAVEGADOR, não no servidor.
// Isso é necessário porque usamos:
//   - useState: para controlar o formulário e o modal
//   - eventos como onClick, onSubmit
//   - router.refresh(): para atualizar a página após salvar
//
// FLUXO DE USO:
//   1. Usuário vê a grade de categorias (cards coloridos com emoji)
//   2. Clica em "Nova Categoria" → abre modal vazio
//   3. OU clica em uma categoria existente → abre modal preenchido
//   4. Preenche nome, seleciona ícone e cor
//   5. Clica em "Salvar" → Server Action salva no banco
//   6. Modal fecha e a página atualiza (router.refresh())
//
// ONDE FICA: src/app/admin/categorias/client.tsx
// ============================================================

import { useState } from "react";
// useState = "memória" do componente — armazena valores que podem mudar
// Quando um useState muda, o componente re-renderiza (atualiza a tela)

import {
  createCategory,
  updateCategory,
  deleteCategory
} from "@/actions/category";
// Importa as Server Actions — funções que rodam NO SERVIDOR
// mesmo sendo chamadas do navegador (Client Component)

import { Input } from "@/components/ui/input";
// Input = campo de texto estilizado (componente reutilizável)

import { Label } from "@/components/ui/label";
// Label = rótulo de formulário estilizado

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
// Dialog = modal/janela flutuante
// DialogContent = o conteúdo dentro do modal
// DialogTitle = título acessível do modal (obrigatório para leitores de tela)

import { Plus, Edit3, Layers, X } from "lucide-react";
// Plus = ícone "+" para o botão Nova Categoria
// Edit3 = ícone de lápis para indicar que é clicável
// Layers = ícone de camadas para estado vazio
// X = ícone de fechar

import { toast } from "sonner";
// toast = notificação "toast" (aparece e some)
// toast.success() = toast verde de sucesso
// toast.error() = toast vermelho de erro

import { useRouter } from "next/navigation";
// useRouter = permite navegar ou atualizar a página programaticamente

// ── Listas de opções para ícone e cor ────────────────────────
// Array de emojis disponíveis como ícone de categoria
const ICONS = ["🍺", "🥤", "🍕", "🍫", "🚬", "🧹", "💊", "🧃", "🍦", "📦"];

// Array de cores em hexadecimal para o destaque da categoria
const COLORS = [
  "#00805A", // Verde escuro (padrão)
  "#F59E0B", // Âmbar/dourado
  "#3B82F6", // Azul
  "#EF4444", // Vermelho
  "#8B5CF6", // Roxo
  "#EC4899", // Rosa
  "#14B8A6", // Ciano/teal
  "#F97316", // Laranja
];

// ── Tipo TypeScript: Category ─────────────────────────────────
// Define o "formato" de uma categoria para o TypeScript
// Garante que o código use sempre os campos corretos
type Category = {
  id: string;     // UUID único no banco
  name: string;   // Nome da categoria (obrigatório)
  icon?: string;  // Emoji ícone (opcional — "?" significa opcional)
  color?: string; // Cor hex (opcional)
};

// ── Componente Principal: CategoriasClient ────────────────────
// Recebe "categories" como prop do page.tsx (Server Component)
// "{ categories }: { categories: Category[] }" = desestruturação de props
// Category[] = array (lista) de objetos Category
export function CategoriasClient({ categories }: { categories: Category[] }) {

  // Hook para atualizar a página sem recarregar completamente
  const router = useRouter();

  // ── Estados do Componente ──
  // useState retorna: [valorAtual, funçãoParaMudar]

  const [isOpen, setIsOpen] = useState(false);
  // isOpen = true/false → controla se o modal está aberto ou fechado
  // setIsOpen(true) abre o modal, setIsOpen(false) fecha

  const [editId, setEditId] = useState<string | null>(null);
  // editId = ID da categoria sendo editada (null = criando nova)
  // Usado para saber se é uma criação ou edição ao salvar

  const [name, setName] = useState("");
  // name = texto digitado no campo "Nome" do formulário

  const [icon, setIcon] = useState(ICONS[0]);
  // icon = emoji selecionado (começa com o primeiro da lista)

  const [color, setColor] = useState(COLORS[0]);
  // color = cor selecionada (começa com verde)

  const [loading, setLoading] = useState(false);
  // loading = true enquanto está salvando → desativa o botão

  // ── Funções de Controle do Modal ──

  // Abre o modal para CRIAR uma nova categoria (formulário limpo)
  const openCreate = () => {
    setEditId(null);        // Sem ID = nova categoria
    setName("");            // Limpa o nome
    setIcon(ICONS[0]);     // Ícone padrão
    setColor(COLORS[0]);   // Cor padrão (verde)
    setIsOpen(true);        // Abre o modal
  };

  // Abre o modal para EDITAR uma categoria existente (formulário preenchido)
  // c = objeto Category com os dados da categoria clicada
  const openEdit = (c: Category) => {
    setEditId(c.id);                   // Guarda o ID para usar no save
    setName(c.name);                   // Preenche com o nome atual
    setIcon(c.icon || ICONS[0]);       // Usa o ícone atual (ou padrão)
    setColor(c.color || COLORS[0]);    // Usa a cor atual (ou padrão)
    setIsOpen(true);                   // Abre o modal
  };

  // ── Salvar Categoria ──────────────────────────────────────────
  // Chamada ao submeter o formulário
  // e: React.FormEvent = o evento de submit do formulário
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    // e.preventDefault() = evita que o formulário recarregue a página
    // (comportamento padrão do HTML que não queremos aqui)

    // Validação: nome não pode estar vazio
    if (!name.trim()) {
      // .trim() remove espaços antes e depois
      toast.error("Nome obrigatório");
      return; // Para a execução aqui
    }

    try {
      setLoading(true); // Ativa o loading (desabilita o botão)

      if (editId) {
        // ── Modo edição: atualiza a categoria existente ──
        await updateCategory(editId, { name, icon, color });
        toast.success("Categoria atualizada!");
      } else {
        // ── Modo criação: cria nova categoria ──
        await createCategory({ name, icon, color });
        toast.success("Categoria criada!");
      }

      setIsOpen(false);  // Fecha o modal
      router.refresh();  // Atualiza a página para mostrar as mudanças

    } catch (err: any) {
      // catch = captura erros (como "Categoria já existe")
      toast.error(err.message); // Mostra o erro ao usuário
    } finally {
      // finally = sempre executa (com ou sem erro)
      setLoading(false); // Desativa o loading
    }
  };

  // ── Excluir Categoria ─────────────────────────────────────────
  // id = ID da categoria a excluir
  const handleDelete = async (id: string) => {
    // Pede confirmação antes de excluir (window.confirm = caixa de diálogo nativa)
    if (!confirm("Excluir categoria?")) return;

    try {
      await deleteCategory(id); // Chama a Server Action de exclusão
      toast.success("Categoria excluída.");
      setIsOpen(false);  // Fecha o modal
      router.refresh();  // Atualiza a lista
    } catch (err: any) {
      // Se tiver produtos nessa categoria, o servidor lança um erro
      toast.error(err.message);
    }
  };

  // ── Renderização da Interface ──────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── Cabeçalho da Página ── */}
      <div className="flex items-center justify-between">
        {/* Título e contador */}
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: "#F0F4F0" }}>
            Categorias
          </h1>
          {/* Exibe quantas categorias existem — .length = tamanho do array */}
          <p className="text-sm mt-1" style={{ color: "#4A7A52" }}>
            {categories.length} categorias cadastradas
          </p>
        </div>
        {/* Botão para abrir o modal de criação */}
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all active:scale-95"
          style={{ background: "#00805A", color: "#F0F4F0", boxShadow: "0 4px 20px #00805A30" }}
        >
          <Plus size={16} /> Nova Categoria
        </button>
      </div>

      {/* ── Grade de Categorias ── */}
      {/* grid = layout de grade (colunas automáticas conforme a tela) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* .map() cria um card para cada categoria */}
        {categories.map((c) => (
          <div
            key={c.id}  // key = identificador único para o React
            className="rounded-2xl p-5 flex items-center justify-between cursor-pointer transition-all hover:brightness-125"
            style={{
              background: "#111A14",
              // Borda com a cor da categoria, 30% de opacidade
              border: `1px solid ${c.color || "#1A2B1D"}30`,
            }}
            onClick={() => openEdit(c)}  // Clique → abre modal de edição
          >
            {/* Ícone + Nome */}
            <div className="flex items-center gap-3">
              {/* Círculo colorido com o emoji */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                style={{ background: `${c.color || "#00805A"}20` }} // 20% de opacidade
              >
                {c.icon || "📦"}  {/* Se não tem ícone, usa caixa */}
              </div>
              {/* Nome e label "categoria" */}
              <div>
                <p className="font-bold text-sm" style={{ color: "#F0F4F0" }}>{c.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "#4A7A52" }}>categoria</p>
              </div>
            </div>
            {/* Ícone de editar (caneta) */}
            <Edit3 size={14} style={{ color: "#4A7A52" }} />
          </div>
        ))}

        {/* ── Estado Vazio ── */}
        {/* Só aparece se não tiver nenhuma categoria */}
        {categories.length === 0 && (
          <div
            className="col-span-full rounded-2xl p-12 text-center"
            style={{ background: "#111A14", border: "1px solid #1A2B1D" }}
          >
            {/* col-span-full = ocupa todas as colunas da grade */}
            <Layers size={32} style={{ color: "#2D4D33", margin: "0 auto 12px" }} />
            <p style={{ color: "#2D4D33" }}>Nenhuma categoria criada ainda.</p>
          </div>
        )}
      </div>

      {/* ── Modal de Criar/Editar Categoria ── */}
      {/* Dialog = componente de modal acessível */}
      {/* open={isOpen} = visibilidade controlada pelo estado */}
      {/* onOpenChange = chamado quando o usuário fecha (clica fora ou pressiona Esc) */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          className="p-0 overflow-hidden max-w-sm rounded-2xl border-0"
          style={{ background: "#111A14" }}
        >
          {/* ── Cabeçalho do Modal ── */}
          <div
            className="px-6 py-5 flex items-center justify-between"
            style={{ borderBottom: "1px solid #1A2B1D" }}
          >
            {/* Título muda conforme o modo (criar ou editar) */}
            <DialogTitle className="text-xl font-black" style={{ color: "#F0F4F0" }}>
              {editId ? "Editar Categoria" : "Nova Categoria"}
              {/* operador ternário: "se editId existe ? mostro editar : mostro nova" */}
            </DialogTitle>
            {/* Botão X para fechar */}
            <button onClick={() => setIsOpen(false)} style={{ color: "#4A7A52" }}>
              <X size={18} />
            </button>
          </div>

          {/* ── Formulário ── */}
          <form onSubmit={handleSave} className="px-6 py-5 space-y-4">

            {/* Campo: Nome */}
            <div className="space-y-1.5">
              <Label
                className="text-xs font-black uppercase tracking-widest"
                style={{ color: "#4A7A52" }}
              >
                Nome
              </Label>
              <Input
                value={name}             // Valor ligado ao estado "name"
                onChange={(e) => setName(e.target.value)}
                // e.target.value = o texto digitado pelo usuário
                // Cada tecla pressionada atualiza o estado "name"
                placeholder="Ex: Bebidas"
                required  // HTML5: não permite submeter com campo vazio
                className="h-11 rounded-xl"
                style={{ background: "#0A0D0A", border: "1px solid #1A2B1D", color: "#F0F4F0" }}
              />
            </div>

            {/* Campo: Ícone (seleção de emoji) */}
            <div className="space-y-1.5">
              <Label
                className="text-xs font-black uppercase tracking-widest"
                style={{ color: "#4A7A52" }}
              >
                Ícone
              </Label>
              <div className="flex flex-wrap gap-2">
                {/* Um botão por emoji na lista ICONS */}
                {ICONS.map((ic) => (
                  <button
                    key={ic}
                    type="button"  // "button" evita submeter o formulário ao clicar
                    onClick={() => setIcon(ic)}  // Seleciona este ícone
                    className="w-10 h-10 rounded-xl text-xl transition-all"
                    style={{
                      // Destaque visual no ícone selecionado
                      background: icon === ic ? "#00805A30" : "#0A0D0A",
                      border: `1px solid ${icon === ic ? "#00805A" : "#1A2B1D"}`,
                    }}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>

            {/* Campo: Cor (paleta de cores) */}
            <div className="space-y-1.5">
              <Label
                className="text-xs font-black uppercase tracking-widest"
                style={{ color: "#4A7A52" }}
              >
                Cor
              </Label>
              <div className="flex flex-wrap gap-2">
                {/* Um botão por cor na lista COLORS */}
                {COLORS.map((cl) => (
                  <button
                    key={cl}
                    type="button"
                    onClick={() => setColor(cl)}  // Seleciona esta cor
                    className="w-8 h-8 rounded-lg transition-all"
                    style={{
                      background: cl,  // Fundo com a própria cor
                      // Borda branca na cor selecionada (feedback visual)
                      outline: color === cl ? "2px solid white" : "none",
                      outlineOffset: "2px",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Pré-visualização: como ficará o card da categoria */}
            <div
              className="rounded-xl p-4 flex items-center gap-3"
              style={{ background: `${color}10`, border: `1px solid ${color}30` }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                style={{ background: `${color}20` }}
              >
                {icon}
              </div>
              {/* Mostra o nome digitado ou "Preview" se estiver vazio */}
              <span className="font-bold text-sm" style={{ color: "#F0F4F0" }}>
                {name || "Preview"}
              </span>
            </div>

            {/* Botões: Excluir (só no modo edição) + Salvar */}
            <div className="flex gap-3 pt-2">
              {/* Botão "Excluir" só aparece ao EDITAR (editId existe) */}
              {editId && (
                <button
                  type="button"
                  onClick={() => handleDelete(editId)}
                  className="px-4 h-12 rounded-xl text-xs font-bold"
                  style={{ background: "#E5393510", border: "1px solid #E5393930", color: "#E53935" }}
                >
                  Excluir
                </button>
              )}

              {/* Botão Salvar */}
              <button
                type="submit"  // Submete o formulário → chama handleSave
                disabled={loading}  // Desabilitado enquanto salvando
                className="flex-1 h-12 rounded-xl font-black text-sm transition-all active:scale-95 disabled:opacity-50"
                // disabled:opacity-50 = fica mais transparente quando desabilitado
                style={{ background: "#00805A", color: "#F0F4F0" }}
              >
                {/* Muda o texto conforme o estado de loading */}
                {loading ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
