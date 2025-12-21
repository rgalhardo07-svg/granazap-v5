"use client";

import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
import { useBranding } from "@/contexts/branding-context";

export default function PrivacyPolicyPage() {
  const { settings } = useBranding();
  const currentDate = new Date().toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#1E293B]/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link 
            href="/"
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Voltar</span>
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold text-white">{settings.appName}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Title */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Política de Privacidade</h1>
          <p className="text-zinc-400">Última atualização: {currentDate}</p>
        </div>

        {/* Sections */}
        <div className="space-y-8 text-zinc-300 leading-relaxed">
          
          {/* Introduction */}
          <section>
            <p className="mb-4">
              A <span className="text-primary font-semibold">{settings.appName}</span> valoriza e respeita sua privacidade. Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas informações pessoais quando você utiliza nossa plataforma de gestão financeira.
            </p>
            <p>
              Ao utilizar nossos serviços, você concorda com a coleta e uso de informações de acordo com esta política. Recomendamos que você leia atentamente este documento.
            </p>
          </section>

          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Informações que Coletamos</h2>
            
            <h3 className="text-xl font-semibold text-white mb-3 mt-6">1.1 Informações Fornecidas por Você</h3>
            <p className="mb-4">Coletamos informações que você nos fornece diretamente ao:</p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
              <li><strong className="text-white">Criar uma conta:</strong> Nome completo, endereço de e-mail, telefone e senha</li>
              <li><strong className="text-white">Usar o serviço:</strong> Dados financeiros (receitas, despesas, contas bancárias, cartões de crédito), categorias, metas e orçamentos</li>
              <li><strong className="text-white">Entrar em contato conosco:</strong> Informações de comunicação e feedback</li>
              <li><strong className="text-white">Realizar pagamentos:</strong> Informações de cobrança e pagamento (processadas por terceiros seguros)</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3 mt-6">1.2 Informações Coletadas Automaticamente</h3>
            <p className="mb-4">Quando você acessa nossa plataforma, coletamos automaticamente:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong className="text-white">Dados de uso:</strong> Páginas visitadas, recursos utilizados, tempo de uso</li>
              <li><strong className="text-white">Informações do dispositivo:</strong> Tipo de dispositivo, sistema operacional, navegador, endereço IP</li>
              <li><strong className="text-white">Cookies e tecnologias similares:</strong> Para melhorar sua experiência e analisar o uso da plataforma</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Como Usamos Suas Informações</h2>
            <p className="mb-4">Utilizamos as informações coletadas para:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong className="text-white">Fornecer e manter o serviço:</strong> Processar transações, gerenciar sua conta e fornecer suporte</li>
              <li><strong className="text-white">Melhorar nossos serviços:</strong> Analisar como você usa a plataforma para desenvolver novos recursos</li>
              <li><strong className="text-white">Comunicação:</strong> Enviar atualizações, notificações de segurança e informações sobre sua conta</li>
              <li><strong className="text-white">Segurança:</strong> Detectar, prevenir e resolver problemas técnicos e de segurança</li>
              <li><strong className="text-white">Conformidade legal:</strong> Cumprir obrigações legais e regulatórias</li>
              <li><strong className="text-white">Personalização:</strong> Adaptar a experiência do usuário às suas preferências</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Compartilhamento de Informações</h2>
            <p className="mb-4">
              Não vendemos suas informações pessoais. Podemos compartilhar suas informações apenas nas seguintes circunstâncias:
            </p>
            
            <h3 className="text-xl font-semibold text-white mb-3 mt-6">3.1 Com Seu Consentimento</h3>
            <p className="mb-4">
              Compartilhamos suas informações quando você nos autoriza explicitamente, como ao convidar membros da equipe ou família para acessar sua conta.
            </p>

            <h3 className="text-xl font-semibold text-white mb-3 mt-6">3.2 Provedores de Serviços</h3>
            <p className="mb-4">
              Compartilhamos informações com prestadores de serviços terceirizados que nos auxiliam a operar a plataforma, como:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
              <li>Provedores de hospedagem e infraestrutura</li>
              <li>Processadores de pagamento</li>
              <li>Serviços de análise e monitoramento</li>
              <li>Serviços de e-mail e comunicação</li>
            </ul>
            <p className="mb-4">
              Esses provedores têm acesso limitado às suas informações e são obrigados contratualmente a protegê-las.
            </p>

            <h3 className="text-xl font-semibold text-white mb-3 mt-6">3.3 Requisitos Legais</h3>
            <p className="mb-4">
              Podemos divulgar suas informações se exigido por lei ou em resposta a processos legais válidos, como:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Ordens judiciais ou intimações</li>
              <li>Investigações governamentais</li>
              <li>Proteção de direitos, propriedade ou segurança</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Segurança dos Dados</h2>
            <p className="mb-4">
              A segurança de suas informações é uma prioridade para nós. Implementamos medidas técnicas e organizacionais para proteger seus dados:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
              <li><strong className="text-white">Criptografia:</strong> Todos os dados são transmitidos usando SSL/TLS e armazenados com criptografia</li>
              <li><strong className="text-white">Controle de acesso:</strong> Acesso restrito às informações apenas para funcionários autorizados</li>
              <li><strong className="text-white">Monitoramento:</strong> Sistemas de detecção de intrusão e monitoramento contínuo</li>
              <li><strong className="text-white">Backups:</strong> Backups regulares para prevenir perda de dados</li>
              <li><strong className="text-white">Auditorias:</strong> Revisões periódicas de segurança e conformidade</li>
            </ul>
            <p>
              No entanto, nenhum método de transmissão pela Internet ou armazenamento eletrônico é 100% seguro. Embora nos esforcemos para proteger suas informações, não podemos garantir sua segurança absoluta.
            </p>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Retenção de Dados</h2>
            <p className="mb-4">
              Retemos suas informações pessoais pelo tempo necessário para cumprir os propósitos descritos nesta Política de Privacidade, a menos que um período de retenção mais longo seja exigido ou permitido por lei.
            </p>
            <p className="mb-4">
              <strong className="text-white">Dados da conta:</strong> Mantemos enquanto sua conta estiver ativa ou conforme necessário para fornecer serviços.
            </p>
            <p className="mb-4">
              <strong className="text-white">Dados financeiros:</strong> Podem ser retidos por períodos mais longos para conformidade com obrigações legais, fiscais e contábeis.
            </p>
            <p>
              <strong className="text-white">Exclusão de conta:</strong> Quando você solicita a exclusão de sua conta, excluímos ou anonimizamos suas informações pessoais, exceto quando a retenção for necessária por lei.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Seus Direitos e Escolhas</h2>
            <p className="mb-4">Você tem os seguintes direitos em relação às suas informações pessoais:</p>
            
            <div className="space-y-4">
              <div className="bg-[#1E293B] border border-white/10 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">Acesso e Portabilidade</h4>
                <p className="text-zinc-400 text-sm">Você pode acessar e exportar seus dados a qualquer momento através das configurações da conta.</p>
              </div>

              <div className="bg-[#1E293B] border border-white/10 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">Correção</h4>
                <p className="text-zinc-400 text-sm">Você pode atualizar ou corrigir suas informações pessoais diretamente na plataforma.</p>
              </div>

              <div className="bg-[#1E293B] border border-white/10 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">Exclusão</h4>
                <p className="text-zinc-400 text-sm">Você pode solicitar a exclusão de sua conta e dados pessoais entrando em contato conosco.</p>
              </div>

              <div className="bg-[#1E293B] border border-white/10 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">Restrição e Objeção</h4>
                <p className="text-zinc-400 text-sm">Você pode solicitar a restrição do processamento de suas informações ou se opor a certos usos.</p>
              </div>

              <div className="bg-[#1E293B] border border-white/10 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">Revogação de Consentimento</h4>
                <p className="text-zinc-400 text-sm">Onde o processamento é baseado em consentimento, você pode revogá-lo a qualquer momento.</p>
              </div>
            </div>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Cookies e Tecnologias de Rastreamento</h2>
            <p className="mb-4">
              Utilizamos cookies e tecnologias similares para melhorar sua experiência na plataforma:
            </p>
            
            <h3 className="text-xl font-semibold text-white mb-3 mt-6">Tipos de Cookies que Usamos:</h3>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
              <li><strong className="text-white">Cookies Essenciais:</strong> Necessários para o funcionamento básico da plataforma</li>
              <li><strong className="text-white">Cookies de Preferência:</strong> Lembram suas configurações e preferências</li>
              <li><strong className="text-white">Cookies de Análise:</strong> Nos ajudam a entender como você usa a plataforma</li>
              <li><strong className="text-white">Cookies de Segurança:</strong> Protegem contra atividades fraudulentas</li>
            </ul>
            <p>
              Você pode controlar o uso de cookies através das configurações do seu navegador. No entanto, desabilitar cookies pode afetar a funcionalidade da plataforma.
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Transferências Internacionais</h2>
            <p className="mb-4">
              Suas informações podem ser transferidas e mantidas em servidores localizados fora do seu país de residência, onde as leis de proteção de dados podem ser diferentes.
            </p>
            <p>
              Ao usar nossos serviços, você consente com a transferência de suas informações para outros países. Tomamos medidas para garantir que suas informações recebam proteção adequada, independentemente de onde sejam processadas.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. Privacidade de Crianças</h2>
            <p className="mb-4">
              Nossos serviços não são direcionados a menores de 18 anos. Não coletamos intencionalmente informações pessoais de crianças.
            </p>
            <p>
              Se você é pai ou responsável e acredita que seu filho nos forneceu informações pessoais, entre em contato conosco para que possamos tomar as medidas necessárias para remover essas informações.
            </p>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">10. Alterações nesta Política</h2>
            <p className="mb-4">
              Podemos atualizar esta Política de Privacidade periodicamente para refletir mudanças em nossas práticas ou por outros motivos operacionais, legais ou regulatórios.
            </p>
            <p className="mb-4">
              Notificaremos você sobre alterações significativas publicando a nova Política de Privacidade nesta página e atualizando a data de "Última atualização" no topo.
            </p>
            <p>
              Recomendamos que você revise esta Política periodicamente para se manter informado sobre como protegemos suas informações.
            </p>
          </section>

          {/* Section 11 */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">11. Lei Aplicável</h2>
            <p className="mb-4">
              Esta Política de Privacidade é regida pelas leis do Brasil, incluindo a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
            </p>
            <p>
              Comprometemo-nos a cumprir todos os requisitos da LGPD e outras legislações aplicáveis de proteção de dados.
            </p>
          </section>

          {/* Section 12 */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">12. Contato</h2>
            <p className="mb-4">
              Se você tiver dúvidas, preocupações ou solicitações relacionadas a esta Política de Privacidade ou ao tratamento de suas informações pessoais, entre em contato conosco:
            </p>
            <div className="bg-[#1E293B] border border-white/10 rounded-lg p-6">
              <p className="text-white font-semibold mb-4">{settings.appName}</p>
              <div className="space-y-2 text-zinc-400">
                <p><strong className="text-white">Email de Suporte:</strong> {settings.supportEmail}</p>
              </div>
              <p className="text-zinc-500 text-sm mt-4">
                Responderemos à sua solicitação dentro de 30 dias, conforme exigido pela LGPD.
              </p>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="flex items-center justify-between text-sm text-zinc-500">
            <p>© {new Date().getFullYear()} {settings.appName}. Todos os direitos reservados.</p>
            <Link href="/termos-de-uso" className="text-primary hover:text-primary/80 transition-colors">
              Termos de Uso
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
