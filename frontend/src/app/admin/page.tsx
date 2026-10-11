'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatPrice } from '@/lib/utils';
import type { Category, Paginated, Product } from '@/types';

export default function AdminPage() {
  const router = useRouter();
  const { user, mounted } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    categoryId: '',
    imageUrl: '',
  });

  const load = async () => {
    try {
      const [p, c] = await Promise.all([
        api.get<Paginated<Product>>('/products', { params: { limit: 100 } }),
        api.get<Category[]>('/categories'),
      ]);
      setProducts(p.data.items);
      setCategories(c.data);
    } catch {
      toast.error('Erro ao carregar dados');
    }
  };

  useEffect(() => {
    if (!mounted) return;
    if (user?.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, user, router]);

  if (!mounted) return <p className="container mx-auto p-8">Carregando...</p>;

  if (user?.role !== 'ADMIN') {
    return (
      <p className="container mx-auto p-8 text-muted-foreground">
        Acesso restrito a administradores.
      </p>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.categoryId) {
      toast.error('Selecione uma categoria');
      return;
    }
    try {
      setLoading(true);
      await api.post('/products', {
        ...form,
        imageUrl: form.imageUrl || undefined,
      });
      toast.success('Produto criado!');
      setForm({
        name: '',
        description: '',
        price: 0,
        stock: 0,
        categoryId: '',
        imageUrl: '',
      });
      load();
    } catch {
      toast.error('Erro ao criar produto');
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Deletar este produto?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Produto deletado');
      load();
    } catch {
      toast.error('Erro ao deletar');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Painel Admin</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Formulário */}
        <Card>
          <CardHeader>
            <CardTitle>Novo produto</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-3">
              <Input
                placeholder="Nome"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <Input
                placeholder="Descrição"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                required
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Preço"
                value={form.price}
                onChange={(e) =>
                  setForm({ ...form, price: Number(e.target.value) })
                }
                required
              />
              <Input
                type="number"
                placeholder="Estoque"
                value={form.stock}
                onChange={(e) =>
                  setForm({ ...form, stock: Number(e.target.value) })
                }
                required
              />
              <Input
                placeholder="URL da imagem (opcional)"
                value={form.imageUrl}
                onChange={(e) =>
                  setForm({ ...form, imageUrl: e.target.value })
                }
              />
              <select
                className="w-full rounded-md border bg-background p-2 text-sm"
                value={form.categoryId}
                onChange={(e) =>
                  setForm({ ...form, categoryId: e.target.value })
                }
                required
              >
                <option value="">Selecione uma categoria</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Criando...' : 'Criar produto'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Lista */}
        <Card>
          <CardHeader>
            <CardTitle>Produtos ({products.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[500px] space-y-2 overflow-y-auto">
              {products.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum produto cadastrado.
                </p>
              ) : (
                products.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded border p-2 text-sm"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{p.name}</p>
                      <p className="text-muted-foreground">
                        {formatPrice(p.price)} · {p.stock} un.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => remove(p.id)}
                    >
                      Excluir
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
