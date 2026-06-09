# Documentação do Código: Sistema de PDV

Bem-vindo(a) à explicação completa do seu sistema de Ponto de Venda (PDV). Como você pediu, esta documentação foi feita para explicar **cada detalhe, função e variável** do código principal, traduzindo a lógica de programação para algo fácil de entender, mesmo para quem não tem experiência na área.

Os bugs principais que encontramos (como a falha de carregamento envolvendo "Decimals") já foram corrigidos para você na etapa anterior. O sistema está estável e seguro!

---

## 1. Arquivo: `src/app/page.tsx`
Este arquivo é o "Ponto de Entrada" do seu sistema de PDV no servidor. Ele é responsável por buscar todas as informações no banco de dados ANTES de entregar a tela para o usuário final.

### O Código Explicado Linha a Linha:

```typescript
import { getActiveProducts } from "@/actions/product";
import { getOpenOrders } from "@/actions/order";
import { getClients } from "@/actions/client";
import { POSClient } from "./pos-client";
```
* **O que faz:** `import` significa "trazer". Aqui, o sistema está trazendo as ferramentas ("funções") que pegam os produtos, as comandas abertas e os clientes lá do banco de dados. O `POSClient` é a "Tela" propriamente dita (o visual).

```typescript
export const dynamic = "force-dynamic";
```
* **O que faz:** Essa é uma instrução para o Next.js (o motor do seu site). Ela diz: "Não guarde essa tela em cache! Toda vez que alguém acessar, carregue os dados ao vivo e atualizados do banco de dados".

```typescript
export default async function POSPage() {
```
* **O que faz:** Cria a função principal da página. A palavra `async` significa que ela é "assíncrona", ou seja, ela vai fazer pedidos de dados (como consultar o banco) e vai *esperar* as respostas antes de desenhar a tela.

```typescript
  const [products, openOrders, clients] = await Promise.all([
    getActiveProducts(),
    getOpenOrders(),
    getClients(),
  ]);
```
* **O que faz:** `await Promise.all` é uma maneira muito inteligente e rápida de pedir as três informações ao MESMO TEMPO ao invés de uma por uma.
  * `products` guarda a lista de produtos.
  * `openOrders` guarda as comandas que ainda não foram pagas.
  * `clients` guarda a lista de todos os seus clientes.

```typescript
  const serializedProducts = products.map(p => ({
    ...p,
    price: Number(p.price)
  }));
```
* **O que faz:** No banco de dados, os preços são salvos como `Decimal` (um tipo muito seguro para dinheiro). Mas a tela do navegador só entende `Number` (números normais). O `map` passa por cada produto da lista e converte o preço para o tipo Número. O `...p` copia todo o resto (nome, imagem, etc) como já estava.

*(O mesmo processo é repetido logo abaixo para as dívidas dos clientes e para os itens das comandas).*

```typescript
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <POSClient 
        initialProducts={serializedProducts} 
        openOrders={serializedOpenOrders} 
        clients={serializedClients} 
      />
    </main>
  );
}
```
* **O que faz:** Aqui é onde o servidor "desenha" a base da tela. A palavra `<main>` cria a caixa principal da página.
  * `min-h-screen`: Diz que a tela deve ocupar no mínimo 100% da altura do monitor/celular.
  * `bg-zinc-950`: Coloca aquele fundo cinza bem escuro (Premium) que implementamos.
  * `<POSClient ... />`: Ele pega os dados que traduzimos para números normais lá em cima e "injeta" eles dentro do componente visual da tela, entregando a interface final nas mãos do usuário.

---

## 2. Arquivo: `src/app/pos-client.tsx`
Este é o coração do sistema (a tela que o usuário clica e interage). Vamos entender os blocos principais:

### Declarando o Tipo de Tela Atual
```typescript
type ScreenState = "CLIENT_SELECTION" | "ORDER_VIEW" | "ADD_PRODUCTS";
```
* **O que faz:** Cria uma regra de negócio que diz: "A nossa tela só pode estar em um desses três modos:
  1. Escolhendo o Cliente (`CLIENT_SELECTION`)
  2. Vendo a Comanda Aberta (`ORDER_VIEW`)
  3. Adicionando Novos Produtos (`ADD_PRODUCTS`)

### As Variáveis que Guardam Informações (Os "Estados")
```typescript
const [screen, setScreen] = useState<ScreenState>("CLIENT_SELECTION");
```
* **O que faz:** O `useState` cria uma "memória" na tela. A memória `screen` lembra em qual tela você está. A função `setScreen` é o "controle remoto" que você aperta para mudar de tela. O site começa por padrão na tela "CLIENT_SELECTION".

```typescript
const [cartQuantities, setCartQuantities] = useState<Record<string, number>>({});
```
* **O que faz:** Quando você toca no sinal de "+" nos produtos, precisamos lembrar quantos de cada item você pegou antes de confirmar. Essa memória `cartQuantities` guarda um "dicionário": a chave é a ID do produto, e o valor é a quantidade (ex: "Cerveja": 2, "Água": 1).

### Função: `handleSelectClient` (Quando você clica em um cliente)
```typescript
  const handleSelectClient = (clientId: string | undefined) => {
    startTransition(async () => {
      try {
        const order = await getOrCreateOrder(clientId);
        const fullOrder = await getOrder(order.id);
        setActiveOrder(fullOrder);
        setScreen("ORDER_VIEW");
      } catch (e: any) {
        toast.error(e.message);
      }
    });
  };
```
* **O que faz:** 
  * Quando você clica num cartão de cliente (ou no balcão), essa função é acionada.
  * `getOrCreateOrder`: Ele vai no banco. Se o cliente já tem comanda aberta, ele traz. Se não tem, ele cria uma comanda vazia nova na hora.
  * `setActiveOrder`: Salva essa comanda na memória da tela para você ver os produtos.
  * `setScreen("ORDER_VIEW")`: Pula para a próxima tela automaticamente!

### Função: `handlePayDebt` (Abatendo a dívida do Fiado)
```typescript
  const handlePayDebt = () => {
    if (!clientFormId || !debtPaymentAmount) return;
    const amount = Number(debtPaymentAmount.replace(',', '.'));
```
* **O que faz:** Verifica se você digitou um valor no campo de pagamento. A função `replace(',', '.')` é muito importante: ela troca a vírgula (que o brasileiro usa no dinheiro) por um ponto (que é o que o computador entende como matemática).

```typescript
        await payDebt(clientFormId, amount);
        toast.success("Dívida abatida com sucesso!");
        window.location.reload();
```
* **O que faz:** Aciona a ferramenta `payDebt` que vai lá no banco de dados e tira esse valor da dívida total do cliente. O `toast.success` faz subir aquele balãozinho verde na tela avisando que deu certo. O `reload()` atualiza a página para puxar os novos saldos.

### Função: `handleCheckout` (O botão Gigante "Cobrar")
```typescript
  const handleCheckout = (method: "PIX" | "CARD" | "CASH" | "TAB") => {
    // ...
    await closeOrder(activeOrder.id, method, activeOrder.client_id);
    // ...
  };
```
* **O que faz:** Quando você escolhe a forma de pagamento, essa função manda fechar a comanda (`closeOrder`) no banco de dados, enviando três informações cruciais: qual é a comanda, como foi paga (PIX, Dinheiro, ou Fiado - TAB), e de quem é a comanda. O banco se encarrega de somar a dívida caso a opção seja "Fiado".

---

## 3. Resumo Visual
Toda a parte que começa com `return (` dentro do `renderClientSelection` ou `renderOrderView` é pura programação visual em HTML e Tailwind (CSS).

Por exemplo:
`<div className="w-12 h-12 rounded-xl bg-zinc-800 ...">`
* `w-12 h-12`: Define a largura e altura do bloco em pixels.
* `rounded-xl`: Faz as bordas ficarem redondinhas e suaves.
* `bg-zinc-800`: Coloca uma cor cinza escura no fundo.

Tudo isso foi construído para seguir rigorosamente os princípios de Design da Apple: espaços de respiro grandes, textos com alto contraste de cinzas (`zinc-500` e branco), e animações discretas ao tocar nos itens.

---
**Espero que esta documentação torne o seu sistema 100% transparente para você! A programação dele está profissional, escalável e sem problemas de engasgo no servidor.**
