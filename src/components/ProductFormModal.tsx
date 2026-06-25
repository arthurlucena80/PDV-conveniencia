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

      // Comprimir a imagem usando canvas para não pesar o banco de dados
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 600;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        // Gera o base64 comprimido (Qualidade 70%)
        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
        setImageUrl(compressedBase64);
      };
      img.src = result;
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
      <DialogContent className="p-0 overflow-hidden rounded-2xl border-0 max-w-sm w-full bg-white shadow-xl">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50">
          <DialogTitle className="text-lg font-black text-gray-900">
            {product ? "Editar Produto" : "Novo Produto"}
          </DialogTitle>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Image Upload */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative w-full h-32 rounded-xl overflow-hidden cursor-pointer transition-all group bg-gray-50"
            style={{ 
              border: imagePreview ? '2px solid rgba(249, 115, 22, 0.3)' : '2px dashed #E5E7EB',
            }}
          >
            {imagePreview ? (
              <>
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                  <ImagePlus className="size-5 text-orange-400" />
                  <span className="text-sm font-bold text-white">Trocar Foto</span>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-2 transition-colors group-hover:opacity-80">
                <ImagePlus className="size-7 text-gray-400" />
                <span className="text-sm font-bold text-gray-500">Adicionar Foto</span>
                <span className="text-xs text-gray-400">Clique para fazer upload</span>
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

          {/* Name */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">Nome do Produto</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="Ex: Coca-Cola Lata 350ml"
              className="h-12 rounded-xl text-sm bg-white border-gray-200 text-gray-900 focus-visible:ring-orange-500"
            />
          </div>

          {/* Price */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">Preço (R$)</Label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-500">R$</span>
              <Input
                type="number" step="0.01" min="0.01"
                value={price}
                onChange={e => setPrice(e.target.value)}
                required
                placeholder="0,00"
                className="h-12 rounded-xl text-lg font-black pl-10 focus-visible:ring-orange-500 font-money bg-white border-gray-200 text-gray-900"
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">Categoria</Label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full h-12 rounded-xl text-sm px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 bg-white border border-gray-200 text-gray-900"
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
              <button type="button" onClick={handleDelete} disabled={isPending} className="h-12 px-4 rounded-xl font-bold text-sm transition-all bg-red-50 border border-red-100 text-red-600 hover:bg-red-100">
                <Trash2 className="size-4" />
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending || !name || !price}
              className="flex-1 h-12 rounded-xl font-black text-sm transition-all active:scale-95 disabled:opacity-40 bg-orange-500 text-white shadow-sm hover:bg-orange-600"
            >
              {isPending ? "Salvando..." : product ? "Salvar Alterações" : "Criar Produto"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
