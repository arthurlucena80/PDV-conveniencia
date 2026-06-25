import React from "react";
import { BookOpen, ShoppingCart, ClipboardList, CreditCard, Wallet, MessageCircle, Package, History } from "lucide-react";

export function UserManual() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-4 bg-orange-100 text-orange-600 rounded-2xl">
            <BookOpen size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Manual do Usuário</h1>
            <p className="text-gray-500">Aprenda a utilizar todas as funções do seu PDV ControleNaMão.</p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Venda Rápida */}
          <section>
            <h2 className="flex items-center gap-2 text-lg font-black text-gray-900 mb-3">
              <ShoppingCart className="text-orange-500" size={20} />
              1. Como fazer uma Venda Rápida (Balcão)
            </h2>
            <img src="/images/pos_checkout.png" alt="Tela de Vendas" className="w-full h-auto rounded-2xl shadow-sm border border-gray-100 mb-4" />
            <p className="text-gray-600 text-sm mb-3">Ideal para aquele cliente que pega o produto e paga na hora.</p>
            <ul className="space-y-2 text-sm text-gray-700 list-decimal pl-5">
              <li>Na tela principal (<strong>Vender</strong>), clique nos produtos que o cliente deseja comprar. Eles serão adicionados automaticamente ao carrinho.</li>
              <li>Se quiser remover um item, clique no botão <strong>( - )</strong> abaixo da foto do produto.</li>
              <li>Você pode usar a <strong>Barra de Pesquisa</strong> ou clicar nas categorias (Bebidas, Doces, etc) para achar os produtos.</li>
              <li>Clique no botão grande laranja <strong>"Cobrar"</strong> na parte de baixo da tela.</li>
              <li>Siga para a tela de pagamento.</li>
            </ul>
          </section>

          {/* Comandas / Mesas */}
          <section>
            <h2 className="flex items-center gap-2 text-lg font-black text-gray-900 mb-3">
              <ClipboardList className="text-orange-500" size={20} />
              2. Como usar Comandas ou Mesas
            </h2>
            <img src="/images/pos_sidebar.png" alt="Menu Lateral" className="w-full h-auto rounded-2xl shadow-sm border border-gray-100 mb-4" />
            <p className="text-gray-600 text-sm mb-3">Ideal para clientes que estão consumindo no local ou vão pagar depois.</p>
            <div className="bg-gray-50 rounded-2xl p-5 space-y-4">
              <div>
                <strong className="text-sm text-gray-900 block mb-1">Abrindo uma nova comanda:</strong>
                <ul className="space-y-1 text-sm text-gray-700 list-decimal pl-5">
                  <li>No menu lateral, vá em <strong>Comanda / Mesas</strong> e clique no <strong>( + )</strong>.</li>
                  <li>Digite o nome do cliente ou o número da mesa (Ex: "Mesa 04").</li>
                  <li>Clique em <strong>Salvar</strong> e depois em <strong>Continuar</strong> no cartãozinho dessa comanda.</li>
                </ul>
              </div>
              <div>
                <strong className="text-sm text-gray-900 block mb-1">Adicionando itens em uma comanda existente:</strong>
                <ul className="space-y-1 text-sm text-gray-700 list-decimal pl-5">
                  <li>Na tela de Vendas, clique nos produtos desejados.</li>
                  <li>Como você não quer cobrar agora, basta clicar no botão <strong>"⬅️ Voltar"</strong> lá embaixo (ao lado do botão de cobrar).</li>
                  <li>Pronto! Os itens foram salvos na comanda em segundo plano e a sua tela ficou limpa para o próximo cliente.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Pagamentos */}
          <section>
            <h2 className="flex items-center gap-2 text-lg font-black text-gray-900 mb-3">
              <CreditCard className="text-orange-500" size={20} />
              3. Formas de Pagamento
            </h2>
            <ul className="space-y-3 text-sm text-gray-700">
              <li><strong>Desconto:</strong> Digite o valor e escolha se é em Reais (R$) ou Porcentagem (%).</li>
              <li><strong>Dinheiro:</strong> Digite o valor que o cliente entregou e o sistema calcula o troco na hora.</li>
              <li><strong>Cartão:</strong> Escolha a máquina (Mercado Pago, C6 Bank, etc) para registro.</li>
              <li><strong>PIX:</strong> Selecione o banco (Mercado Pago, C6 Bank) para o sistema gerar o QR Code na tela. O pagamento será detectado automaticamente.</li>
            </ul>
          </section>

          {/* Fiado */}
          <section>
            <h2 className="flex items-center gap-2 text-lg font-black text-gray-900 mb-3">
              <Wallet className="text-orange-500" size={20} />
              4. Vendendo no "Fiado" (Caderno)
            </h2>
            <div className="bg-gray-50 rounded-2xl p-5 space-y-4">
              <div>
                <strong className="text-sm text-gray-900 block mb-1">Para vender no fiado:</strong>
                <ul className="space-y-1 text-sm text-gray-700 list-decimal pl-5">
                  <li>Clique em <strong>Cobrar</strong> e escolha a opção <strong>"Fiado"</strong>.</li>
                  <li>Selecione o cliente na lista. O valor da venda será somado à dívida dele.</li>
                </ul>
              </div>
              <div>
                <strong className="text-sm text-gray-900 block mb-1">Para consultar dívida ou receber pagamento:</strong>
                <ul className="space-y-1 text-sm text-gray-700 list-decimal pl-5">
                  <li>Vá no menu <strong>Cliente</strong> e clique no botão <strong>"Fiado"</strong> no cartão do cliente.</li>
                  <li>Você verá o histórico completo. Se ele for pagar, digite o valor recebido e clique em "Registrar Pagamento".</li>
                </ul>
              </div>
            </div>
          </section>

          {/* WhatsApp */}
          <section>
            <h2 className="flex items-center gap-2 text-lg font-black text-gray-900 mb-3">
              <MessageCircle className="text-orange-500" size={20} />
              5. Enviando Recibo pelo WhatsApp
            </h2>
            <ul className="space-y-2 text-sm text-gray-700 list-decimal pl-5">
              <li>Na hora de <strong>Cobrar</strong>, deixe ativada a opção "Enviar recibo por WhatsApp".</li>
              <li>Após o pagamento, o sistema abrirá seu WhatsApp com a mensagem do recibo pronta. É só enviar.</li>
              <li>Se quiser enviar o recibo antes (como uma "prévia" para uma mesa), clique no botão redondo do WhatsApp na barra inferior da tela de vendas.</li>
            </ul>
          </section>

          {/* Cadastros e Histórico */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="bg-gray-50 p-5 rounded-2xl">
              <h2 className="flex items-center gap-2 text-lg font-black text-gray-900 mb-3">
                <Package className="text-orange-500" size={20} />
                6. Cadastros
              </h2>
              <ul className="space-y-2 text-sm text-gray-700">
                <li><strong>Clientes:</strong> Vá em "Cliente" e clique no (+). O Nome é obrigatório.</li>
                <li><strong>Produtos:</strong> Vá em "Cadastro de Produtos" e clique no (+). Preencha os dados e adicione uma foto.</li>
              </ul>
            </section>
            <section className="bg-gray-50 p-5 rounded-2xl">
              <h2 className="flex items-center gap-2 text-lg font-black text-gray-900 mb-3">
                <History className="text-orange-500" size={20} />
                7. Histórico de Vendas
              </h2>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>Vá no menu "Histórico de Vendas" para ver tudo que foi vendido e recebido.</li>
                <li>Use a barra de pesquisa para encontrar vendas pelo nome do cliente ou da mesa.</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
