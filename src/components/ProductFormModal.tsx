"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useTransition, useRef, useEffect } from "react";
import { createProduct, updateProduct, deleteProduct } from "@/actions/product";
import { toast } from "sonner";
import { ImagePlus, Trash2 } from "lucide-react";

interface ProductFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  product?: any;
  categories: { id: string; name: string }[];
}

export function ProductFormModal({ isOpen, onOpenChange, product, categories }: ProductFormModalProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(product?.name || "");
      setPrice(product?.price?.toString() || "");
      setCategoryId(product?.category_id || "");
      setImageUrl(product?.image_url || "");
      setImagePreview(product?.image_url || "");
    }
  }, [isOpen, product]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setImagePreview(result);
      setImageUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;
    startTransition(async () => {
      try {
        const payload = { 
          name, 
          price: parseFloat(price), 
          image_url: imageUrl,
          category_id: categoryId || undefined 
        };
        if (product) {
          await updateProduct(product.id, payload);
          toast.success("Produto atualizado!");
        } else {
          await createProduct(payload);
          toast.success("Produto cadastrado!");
        }
        onOpenChange(false);
      } catch (e: any) { toast.error(e.message); }
    });
  };

  const handleDelete = () => {
    if (!product) return;
    if (!confirm(`Excluir "${product.name}"?`)) return;
    startTransition(async () => {
      try {
        await deleteProduct(product.id);
        toast.success("Produto excluído!");
        onOpenChange(false);
      } catch (e: any) { toast.error(e.message); }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 overflow-hidden rounded-2xl border-0 max-w-sm w-full" style={{ background: '#111A14' }}>
        
        {/* Header */}
        <div className="px-6 py-5" style={{ borderBottom: '1px solid #1E2E21' }}>
          <DialogTitle className="text-lg font-black" style={{ color: '#F4F6F3' }}>
            {product ? "Editar Produto" : "Novo Produto"}
          </DialogTitle>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Image Upload */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative w-full h-32 rounded-xl overflow-hidden cursor-pointer transition-all group"
            style={{ 
              border: imagePreview ? '2px solid #00805A30' : '2px dashed #1E2E21',
              background: '#0C0F0A'
            }}
          >
            {imagePreview ? (
              <>
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: '#0C0F0AB0' }}>
                  <ImagePlus className="size-5" style={{ color: '#00805A' }} />
                  <span className="text-sm font-bold" style={{ color: '#F4F6F3' }}>Trocar Foto</span>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-2 transition-colors group-hover:opacity-80">
                <ImagePlus className="size-7" style={{ color: '#3d5e42' }} />
                <span className="text-sm font-bold" style={{ color: '#7A9B82' }}>Adicionar Foto</span>
                <span className="text-xs" style={{ color: '#3d5e42' }}>Clique para fazer upload</span>
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

          {/* Name */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#7A9B82' }}>Nome do Produto</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="Ex: Coca-Cola Lata 350ml"
              className="h-12 rounded-xl text-sm focus-visible:ring-[#00805A]"
              style={{ background: '#0C0F0A', border: '1px solid #1E2E21', color: '#F4F6F3' }}
            />
          </div>

          {/* Price */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#7A9B82' }}>Preço (R$)</Label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: '#7A9B82' }}>R$</span>
              <Input
                type="number" step="0.01" min="0.01"
                value={price}
                onChange={e => setPrice(e.target.value)}
                required
                placeholder="0,00"
                className="h-12 rounded-xl text-lg font-black pl-10 focus-visible:ring-[#00805A] font-money"
                style={{ background: '#0C0F0A', border: '1px solid #1E2E21', color: '#F4F6F3' }}
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#7A9B82' }}>Categoria</Label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full h-12 rounded-xl text-sm px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00805A]"
              style={{ background: '#0C0F0A', border: '1px solid #1E2E21', color: '#F4F6F3' }}
            >
              <option value="">Sem categoria</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            {product && (
              <button type="button" onClick={handleDelete} disabled={isPending} className="h-12 px-4 rounded-xl font-bold text-sm transition-all" style={{ background: '#E5393910', border: '1px solid #E5393930', color: '#E53935' }}>
                <Trash2 className="size-4" />
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending || !name || !price}
              className="flex-1 h-12 rounded-xl font-black text-sm transition-all active:scale-95 disabled:opacity-40"
              style={{ background: '#00805A', color: '#F4F6F3', boxShadow: '0 4px 16px #00805A30' }}
            >
              {isPending ? "Salvando..." : product ? "Salvar Alterações" : "Criar Produto"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
