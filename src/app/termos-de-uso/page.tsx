"use client";

import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { useBranding } from "@/contexts/branding-context";

export default function TermsOfUsePage() {
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
            <FileText className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold text-white">{settings.appName}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Title */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Termos de Uso</h1>
          <p className="text-zinc-400">Última atualização: {currentDate}</p>
        </div>

        {/* Sections */}
        <div className="space-y-8 text-zinc-300 leading-relaxed">
          
          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Aceitação dos Termos</h2>
            <p className="mb-4">
              Ao acessar e utilizar a plataforma <span className="text-primary font-semibold">{settings.appName}</span>, você concorda em cumprir e estar vinculado aos seguintes Termos de Uso. Se você não concordar com qualquer parte destes termos, não deverá utilizar nossos serviços.
            </p>
            <p>
              Estes termos aplicam-se a todos os visitantes, usuários e outras pessoas que acessam ou utilizam o serviço.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Descrição do Serviço</h2>
            <p className="mb-4">
              O <span className="text-primary font-semibold">{settings.appName}</span> é uma plataforma de gestão financeira pessoal e empresarial que permite aos usuários:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Registrar e categorizar receitas e despesas</li>
              <li>Gerenciar contas bancárias e cartões de crédito</li>
              <li>Acompanhar metas financeiras e orçamentos</li>
              <li>Gerar relatórios e análises financeiras</li>
              <li>Compartilhar acesso com membros da equipe ou família (conforme plano contratado)</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Cadastro e Conta de Usuário</h2>
            <p className="mb-4">
              Para utilizar determinadas funcionalidades do <span className="text-primary font-semibold">{settings.appName}</span>, você deve criar uma conta fornecendo informações verdadeiras, precisas e completas.
            </p>
            <p className="mb-4">
              Você é responsável por:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Manter a confidencialidade de sua senha e credenciais de acesso</li>
              <li>Todas as atividades realizadas em sua conta</li>
              <li>Notificar-nos imediatamente sobre qualquer uso não autorizado de sua conta</li>
              <li>Garantir que suas informações de cadastro estejam sempre atualizadas</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Uso Aceitável</h2>
            <p className="mb-4">Você concorda em NÃO:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Utilizar o serviço para qualquer finalidade ilegal ou não autorizada</li>
              <li>Violar quaisquer leis em sua jurisdição</li>
              <li>Transmitir vírus, malware ou qualquer código malicioso</li>
              <li>Tentar obter acesso não autorizado a sistemas ou redes conectadas ao serviço</li>
              <li>Interferir ou interromper o serviço ou servidores conectados</li>
              <li>Copiar, modificar, distribuir ou criar trabalhos derivados do serviço</li>
              <li>Usar o serviço para enviar spam ou comunicações não solicitadas</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Planos e Pagamentos</h2>
            <p className="mb-4">
              O <span className="text-primary font-semibold">{settings.appName}</span> oferece diferentes planos de assinatura com funcionalidades variadas. Os detalhes de cada plano, incluindo preços e recursos, estão disponíveis em nossa página de planos.
            </p>
            <p className="mb-4">
              <strong className="text-white">Renovação Automática:</strong> As assinaturas são renovadas automaticamente no final de cada período de cobrança, a menos que você cancele antes da data de renovação.
            </p>
            <p className="mb-4">
              <strong className="text-white">Cancelamento:</strong> Você pode cancelar sua assinatura a qualquer momento através das configurações de sua conta. O cancelamento entrará em vigor no final do período de cobrança atual.
            </p>
            <p>
              <strong className="text-white">Reembolsos:</strong> Não oferecemos reembolsos para períodos de assinatura já pagos, exceto quando exigido por lei.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Propriedade Intelectual</h2>
            <p className="mb-4">
              O serviço e todo o conteúdo, recursos e funcionalidades (incluindo, mas não limitado a, informações, software, texto, displays, imagens, vídeo e áudio, e o design, seleção e arranjo dos mesmos) são de propriedade do <span className="text-primary font-semibold">{settings.appName}</span>, seus licenciadores ou outros provedores de tal material e são protegidos por direitos autorais, marcas registradas e outras leis de propriedade intelectual.
            </p>
            <p>
              Seus dados financeiros e informações pessoais permanecem de sua propriedade. Concedemos a você uma licença limitada para acessar e usar o serviço para fins pessoais ou comerciais internos.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Privacidade e Segurança</h2>
            <p className="mb-4">
              Levamos sua privacidade a sério. Nossa Política de Privacidade descreve como coletamos, usamos e protegemos suas informações pessoais.
            </p>
            <p className="mb-4">
              <strong className="text-white">Segurança dos Dados:</strong> Implementamos medidas de segurança técnicas e organizacionais para proteger seus dados contra acesso não autorizado, alteração, divulgação ou destruição.
            </p>
            <p>
              <strong className="text-white">Responsabilidade do Usuário:</strong> Embora tomemos precauções para proteger seus dados, você também é responsável por manter a segurança de suas credenciais de acesso.
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Limitação de Responsabilidade</h2>
            <p className="mb-4">
              O <span className="text-primary font-semibold">{settings.appName}</span> é fornecido "como está" e "conforme disponível", sem garantias de qualquer tipo, expressas ou implícitas.
            </p>
            <p className="mb-4">
              Não garantimos que:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>O serviço atenderá às suas necessidades específicas</li>
              <li>O serviço será ininterrupto, oportuno, seguro ou livre de erros</li>
              <li>Os resultados obtidos pelo uso do serviço serão precisos ou confiáveis</li>
              <li>Quaisquer erros no serviço serão corrigidos</li>
            </ul>
            <p className="mt-4">
              Em nenhuma circunstância seremos responsáveis por quaisquer danos diretos, indiretos, incidentais, especiais, consequenciais ou punitivos resultantes do uso ou incapacidade de usar o serviço.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. Modificações do Serviço</h2>
            <p className="mb-4">
              Reservamo-nos o direito de modificar ou descontinuar, temporária ou permanentemente, o serviço (ou qualquer parte dele) com ou sem aviso prévio.
            </p>
            <p>
              Não seremos responsáveis perante você ou terceiros por qualquer modificação, suspensão ou descontinuação do serviço.
            </p>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">10. Rescisão</h2>
            <p className="mb-4">
              Podemos encerrar ou suspender seu acesso ao serviço imediatamente, sem aviso prévio ou responsabilidade, por qualquer motivo, incluindo, sem limitação, se você violar os Termos de Uso.
            </p>
            <p className="mb-4">
              Após a rescisão, seu direito de usar o serviço cessará imediatamente. Se você deseja encerrar sua conta, pode simplesmente descontinuar o uso do serviço ou entrar em contato conosco.
            </p>
            <p>
              Todas as disposições dos Termos de Uso que, por sua natureza, devem sobreviver à rescisão, sobreviverão à rescisão, incluindo, sem limitação, disposições de propriedade, isenções de garantia, indenização e limitações de responsabilidade.
            </p>
          </section>

          {/* Section 11 */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">11. Alterações nos Termos</h2>
            <p className="mb-4">
              Reservamo-nos o direito, a nosso exclusivo critério, de modificar ou substituir estes Termos a qualquer momento. Se uma revisão for material, tentaremos fornecer um aviso com pelo menos 30 dias de antecedência antes que os novos termos entrem em vigor.
            </p>
            <p>
              O que constitui uma mudança material será determinado a nosso exclusivo critério. Ao continuar a acessar ou usar nosso serviço após essas revisões entrarem em vigor, você concorda em ficar vinculado aos termos revisados.
            </p>
          </section>

          {/* Section 12 */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">12. Lei Aplicável</h2>
            <p className="mb-4">
              Estes Termos serão regidos e interpretados de acordo com as leis do Brasil, sem considerar suas disposições sobre conflitos de leis.
            </p>
            <p>
              Nossa falha em fazer cumprir qualquer direito ou disposição destes Termos não será considerada uma renúncia a esses direitos. Se qualquer disposição destes Termos for considerada inválida ou inexequível por um tribunal, as disposições restantes destes Termos permanecerão em vigor.
            </p>
          </section>

          {/* Section 13 */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">13. Contato</h2>
            <p className="mb-4">
              Se você tiver alguma dúvida sobre estes Termos de Uso, entre em contato conosco:
            </p>
            <div className="bg-[#1E293B] border border-white/10 rounded-lg p-6">
              <p className="text-white font-semibold mb-2">{settings.appName}</p>
              <p className="text-zinc-400">Email: {settings.supportEmail}</p>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="flex items-center justify-between text-sm text-zinc-500">
            <p>© {new Date().getFullYear()} {settings.appName}. Todos os direitos reservados.</p>
            <Link href="/politica-de-privacidade" className="text-primary hover:text-primary/80 transition-colors">
              Política de Privacidade
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
