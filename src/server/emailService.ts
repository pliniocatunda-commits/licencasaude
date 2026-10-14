import nodemailer, { type Transporter } from 'nodemailer';

export interface EmailDispatchResult {
  sent: boolean;
  simulated: boolean;
  messageId?: string;
  error?: string;
  provider: string;
}

export class EmailService {
  private transporter: Transporter | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    if (host && user && pass) {
      try {
        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure,
          auth: {
            user,
            pass,
          },
          tls: {
            rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false',
          },
        });
        this.isConfigured = true;
        console.log(`[EmailService] Transporter SMTP configurado: ${host}:${port} (${user})`);
      } catch (err) {
        console.error('[EmailService] Falha ao configurar transportador SMTP:', err);
        this.transporter = null;
        this.isConfigured = false;
      }
    } else {
      this.isConfigured = false;
      console.log('[EmailService] SMTP não configurado no ambiente (.env). Operando em Modo Simulação / Sandbox.');
    }
  }

  public getStatus(): { isConfigured: boolean; host?: string; port?: number; user?: string; from?: string } {
    return {
      isConfigured: this.isConfigured,
      host: process.env.SMTP_HOST || 'Não configurado (Simulação)',
      port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined,
      user: process.env.SMTP_USER ? process.env.SMTP_USER.replace(/(.{2})(.*)(@.*)/, '$1***$3') : undefined,
      from: process.env.SMTP_FROM || 'IPME - Notificações <noreply@ipmeusebio.ce.gov.br>',
    };
  }

  /**
   * Envia o e-mail de confirmação de cadastro e código de 6 dígitos
   */
  public async sendConfirmationEmail(
    to: string,
    recipientName: string,
    code: string,
    temporaryPassword?: string,
    appUrl?: string
  ): Promise<EmailDispatchResult> {
    const from = process.env.SMTP_FROM || '"IPME - Instituto de Previdência de Eusébio" <atendimento@ipmeusebio.ce.gov.br>';
    const subject = `[IPME] Código de Confirmação de Cadastro: ${code}`;
    const baseUrl = appUrl || process.env.APP_URL || 'https://ais-pre-pcjbglmhysuprzhnlrvneb-534607352231.us-east1.run.app';

    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Confirmação de Cadastro IPME</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b; }
    .container { max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #0f223d, #1b3f6e); padding: 28px 24px; text-align: center; color: #ffffff; }
    .logo-badge { display: inline-block; background-color: #ffffff; padding: 6px 14px; border-radius: 8px; font-weight: 800; font-size: 16px; color: #0f223d; letter-spacing: 1px; margin-bottom: 8px; }
    .header h1 { margin: 8px 0 0; font-size: 18px; font-weight: 700; color: #f8fafc; }
    .header p { margin: 4px 0 0; font-size: 12px; color: #94a3b8; }
    .content { padding: 28px 24px; line-height: 1.6; font-size: 14px; color: #334155; }
    .code-box { background-color: #f8fafc; border: 2px dashed #059669; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0; }
    .code-title { font-size: 11px; text-transform: uppercase; font-weight: 700; color: #065f46; letter-spacing: 1px; margin-bottom: 6px; }
    .pin-code { font-family: monospace; font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #047857; margin: 6px 0; }
    .info-card { background-color: #0f223d; color: #ffffff; border-radius: 10px; padding: 14px 16px; margin: 18px 0; font-size: 12px; }
    .info-card table { width: 100%; border-collapse: collapse; }
    .info-card td { padding: 4px 0; }
    .info-label { color: #94a3b8; width: 130px; }
    .info-value { font-weight: 600; color: #f8fafc; }
    .btn { display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 700; font-size: 13px; text-align: center; margin: 16px 0; }
    .footer { background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 24px; text-align: center; font-size: 11px; color: #64748b; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-badge">IPME</div>
      <h1>Instituto de Previdência do Município de Eusébio</h1>
      <p>Sistema Eletrônico de Homologação de Licenças & Readaptações</p>
    </div>

    <div class="content">
      <p>Prezado(a) <strong>${recipientName}</strong>,</p>
      
      <p>Seu acesso como operador corporativo no Sistema Pericial do <strong>IPME (Prefeitura de Eusébio)</strong> foi criado pelo Administrador Geral do órgão.</p>
      
      <p>Para confirmar a autenticidade do seu endereço institucional e ativar seu acesso pericial, utilize o código de 6 dígitos abaixo:</p>

      <div class="code-box">
        <div class="code-title">Código PIN de Confirmação & Ativação</div>
        <div class="pin-code">${code}</div>
        <div style="font-size: 11px; color: #64748b;">Válido para liberação de acesso imediata</div>
      </div>

      <div class="info-card">
        <table>
          <tr>
            <td class="info-label">E-mail Corporativo:</td>
            <td class="info-value">${to}</td>
          </tr>
          ${temporaryPassword ? `
          <tr>
            <td class="info-label">Senha Inicial:</td>
            <td class="info-value" style="color: #fbbf24;">${temporaryPassword}</td>
          </tr>` : ''}
          <tr>
            <td class="info-label">Autarquia:</td>
            <td class="info-value">IPME · Eusébio - CE</td>
          </tr>
        </table>
      </div>

      <p style="text-align: center;">
        <a href="${baseUrl}" class="btn" style="color: #ffffff;">Acessar Portal do IPME</a>
      </p>

      <p style="font-size: 12px; color: #64748b; margin-top: 24px;">
        * Por diretrizes de conformidade previdenciária e segurança da informação, recomendamos a substituição da senha inicial após o primeiro acesso.
      </p>
    </div>

    <div class="footer">
      <strong>IPME · Instituto de Previdência do Município de Eusébio</strong><br>
      Autarquia Municipal Criada pela Lei nº 465/2002 · Ceará<br>
      Rua Irmã Ambrosina, 85 - Centro, Eusébio - CE · Tel: (85) 3260-9900
    </div>
  </div>
</body>
</html>
    `;

    const text = `
IPME - Instituto de Previdência do Município de Eusébio
Confirmação de Cadastro de Acesso Pericial

Prezado(a) ${recipientName},

Seu acesso no Sistema Pericial do IPME foi criado pelo Administrador Geral.

Código PIN de Confirmação: ${code}

E-mail: ${to}
${temporaryPassword ? `Senha Inicial: ${temporaryPassword}` : ''}
Acesse: ${baseUrl}

IPME · Prefeitura Municipal de Eusébio - Ceará (Lei nº 465/2002)
    `.trim();

    if (this.isConfigured && this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from,
          to,
          subject,
          text,
          html,
        });

        console.log(`[EmailService] E-mail REAL despachado via SMTP para ${to}. MessageId: ${info.messageId}`);
        return {
          sent: true,
          simulated: false,
          messageId: info.messageId,
          provider: 'SMTP',
        };
      } catch (error: any) {
        console.error(`[EmailService] Erro ao enviar e-mail via SMTP para ${to}:`, error);
        return {
          sent: false,
          simulated: false,
          error: error.message || 'Erro ao conectar ao servidor SMTP.',
          provider: 'SMTP (Falha)',
        };
      }
    } else {
      console.log(`[EmailService - SIMULAÇÃO] Código gerado para ${to}: ${code}`);
      return {
        sent: true,
        simulated: true,
        provider: 'Sandbox (Simulação sem SMTP)',
      };
    }
  }

  /**
   * Envia e-mail de teste para validação de SMTP pelo Administrador
   */
  public async sendTestEmail(to: string): Promise<EmailDispatchResult> {
    if (!this.isConfigured || !this.transporter) {
      return {
        sent: false,
        simulated: true,
        error: 'Servidor SMTP não configurado. Defina SMTP_HOST, SMTP_USER e SMTP_PASS nas variáveis de ambiente.',
        provider: 'Sandbox',
      };
    }

    const from = process.env.SMTP_FROM || '"IPME - Eusébio" <atendimento@ipmeusebio.ce.gov.br>';
    try {
      const info = await this.transporter.sendMail({
        from,
        to,
        subject: '[IPME] Teste de Conexão SMTP com Sucesso',
        text: 'Este é um e-mail de teste disparado pelo Sistema Pericial do IPME (Eusébio - CE). A conexão com o servidor SMTP está funcionando perfeitamente!',
        html: `
          <div style="font-family: sans-serif; padding: 20px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
            <h2 style="color: #0f223d;">Teste de Conexão SMTP - IPME</h2>
            <p>Parabéns! O servidor de e-mail institucional está <strong>conectado e enviando mensagens reais</strong> com sucesso para <strong>${to}</strong>.</p>
            <p style="color: #64748b; font-size: 12px;">Prefeitura Municipal de Eusébio - Ceará · RPPS</p>
          </div>
        `,
      });
      return {
        sent: true,
        simulated: false,
        messageId: info.messageId,
        provider: 'SMTP',
      };
    } catch (err: any) {
      return {
        sent: false,
        simulated: false,
        error: err.message || 'Falha no teste SMTP.',
        provider: 'SMTP (Falha)',
      };
    }
  }
}

export const emailService = new EmailService();
