import express, { type Request, type Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { db } from './src/server/database.ts';
import { emailService } from './src/server/emailService.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Helper to extract actor information from headers or body
  function getActor(req: Request) {
    const actorEmail = (req.headers['x-user-email'] as string) || req.body?.actorEmail || 'Pliniocatunda@gmail.com';
    const actorRole = ((req.headers['x-user-role'] as string) || req.body?.actorRole || 'admin') as 'admin' | 'operator';
    return { actorEmail, actorRole };
  }

  function getTenantId(req: Request): string {
    const headerTenant = req.headers['x-tenant-id'] as string;
    if (headerTenant && headerTenant.trim()) {
      return headerTenant.trim();
    }
    const bodyTenant = req.body?.tenantId as string;
    if (bodyTenant && bodyTenant.trim()) {
      return bodyTenant.trim();
    }
    const queryTenant = req.query?.tenantId as string;
    if (queryTenant && queryTenant.trim()) {
      return queryTenant.trim();
    }
    return 'ipme_eusebio';
  }

  function getTenantDb(req: Request) {
    return db.forTenant(getTenantId(req));
  }

  // --- API Routes ---

  // Tenants & Isolation Endpoints
  app.get('/api/tenants', (_req: Request, res: Response) => {
    try {
      const tenants = db.getTenants();
      res.json({ success: true, data: tenants });
    } catch (error) {
      res.status(500).json({ success: false, message: (error as Error).message });
    }
  });

  app.get('/api/tenants/current', (req: Request, res: Response) => {
    try {
      const tid = getTenantId(req);
      const tenant = db.getTenantById(tid) || db.getTenantById('ipme_eusebio');
      res.json({ success: true, data: tenant });
    } catch (error) {
      res.status(500).json({ success: false, message: (error as Error).message });
    }
  });

  app.post('/api/tenants', (req: Request, res: Response) => {
    try {
      const { actorRole } = getActor(req);
      if (actorRole !== 'admin') {
        return res.status(403).json({ success: false, message: 'Apenas Administradores podem registrar novos clientes.' });
      }
      const saved = db.saveTenant(req.body);
      res.status(201).json({ success: true, data: saved });
    } catch (error) {
      res.status(400).json({ success: false, message: (error as Error).message });
    }
  });

  app.post('/api/tenants/reset-sandbox', (req: Request, res: Response) => {
    try {
      const { actorEmail, actorRole } = getActor(req);
      if (actorRole !== 'admin') {
        return res.status(403).json({ success: false, message: 'Apenas Administradores podem reiniciar a base de testes.' });
      }
      db.resetSandbox(actorEmail);
      res.json({ success: true, message: 'Ambiente de testes (Studio Sandbox) reinicializado com sucesso.' });
    } catch (error) {
      res.status(500).json({ success: false, message: (error as Error).message });
    }
  });

  app.post('/api/tenants/reset-eusebio', (req: Request, res: Response) => {
    try {
      const { actorEmail } = getActor(req);
      db.resetEusebioOfficial(actorEmail);
      res.json({ success: true, message: 'Base oficial de Eusébio sincronizada com sucesso.' });
    } catch (error) {
      res.status(500).json({ success: false, message: (error as Error).message });
    }
  });


  // Dashboard Stats & Metrics
  app.get('/api/stats', (req: Request, res: Response) => {
    try {
      const metrics = getTenantDb(req).getMetrics();
      res.json({ success: true, data: metrics });
    } catch (error) {
      res.status(500).json({ success: false, message: (error as Error).message });
    }
  });

  // Employees CRUD
  app.get('/api/employees', (req: Request, res: Response) => {
    try {
      const { search, secretaria, status } = req.query as { search?: string; secretaria?: string; status?: string };
      const employees = getTenantDb(req).getEmployees(search, secretaria, status);
      res.json({ success: true, data: employees, count: employees.length });
    } catch (error) {
      res.status(500).json({ success: false, message: (error as Error).message });
    }
  });

  app.get('/api/employees/:matricula', (req: Request, res: Response) => {
    try {
      const emp = getTenantDb(req).getEmployeeByMatricula(req.params.matricula);
      if (!emp) {
        return res.status(404).json({ success: false, message: 'Servidor não encontrado.' });
      }
      const history = getTenantDb(req).getOccurrences(emp.matricula);
      res.json({ success: true, data: { ...emp, history } });
    } catch (error) {
      res.status(500).json({ success: false, message: (error as Error).message });
    }
  });

  app.post('/api/employees', (req: Request, res: Response) => {
    try {
      const { actorEmail, actorRole } = getActor(req);
      const { matricula, nome, cpf, telefone, secretaria, setor, cargo, status, data_admissao, email } = req.body;

      if (!matricula || !nome || !cpf) {
        return res.status(400).json({ success: false, message: 'Matrícula, Nome e CPF são obrigatórios.' });
      }

      const saved = getTenantDb(req).saveEmployee(
        { matricula, nome, cpf, telefone, secretaria, setor, cargo, status, data_admissao, email },
        actorEmail,
        actorRole
      );
      res.status(201).json({ success: true, data: saved });
    } catch (error) {
      res.status(400).json({ success: false, message: (error as Error).message });
    }
  });

  app.put('/api/employees/:matricula', (req: Request, res: Response) => {
    try {
      const { actorEmail, actorRole } = getActor(req);
      const saved = getTenantDb(req).saveEmployee(
        { ...req.body, matricula: req.params.matricula },
        actorEmail,
        actorRole
      );
      res.json({ success: true, data: saved });
    } catch (error) {
      res.status(400).json({ success: false, message: (error as Error).message });
    }
  });

  app.delete('/api/employees/:matricula', (req: Request, res: Response) => {
    try {
      const { actorEmail, actorRole } = getActor(req);
      if (actorRole !== 'admin') {
        return res.status(403).json({ success: false, message: 'Apenas Administradores podem excluir servidores.' });
      }
      const deleted = getTenantDb(req).deleteEmployee(req.params.matricula, actorEmail, actorRole);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Servidor não encontrado.' });
      }
      res.json({ success: true, message: 'Servidor excluído com sucesso.' });
    } catch (error) {
      res.status(400).json({ success: false, message: (error as Error).message });
    }
  });

  app.post('/api/admin/clear-employees', (req: Request, res: Response) => {
    try {
      const { actorEmail, actorRole } = getActor(req);
      if (actorRole !== 'admin') {
        return res.status(403).json({ success: false, message: 'Apenas Administradores podem limpar o cadastro de servidores.' });
      }
      const result = getTenantDb(req).clearAllEmployees(actorEmail, actorRole);
      res.json({ success: true, message: 'Cadastro de servidores apagado com sucesso.', data: result });
    } catch (error) {
      res.status(400).json({ success: false, message: (error as Error).message });
    }
  });

  // Importação de Dados via CSV (Servidores e Secretarias)
  app.post('/api/admin/import-csv', (req: Request, res: Response) => {
    try {
      const { actorEmail, actorRole } = getActor(req);
      const { csvText, substituirExistentes } = req.body;

      if (!csvText || typeof csvText !== 'string') {
        return res.status(400).json({ success: false, message: 'Conteúdo CSV não fornecido.' });
      }

      const result = getTenantDb(req).importCadastroCSV(csvText, Boolean(substituirExistentes), actorEmail, actorRole);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, message: (error as Error).message });
    }
  });

  // Occurrences (Licença Saúde & Readaptação) CRUD
  app.get('/api/occurrences', (req: Request, res: Response) => {
    try {
      const { matricula, tipo, status, dataInicio, dataTermino } = req.query as {
        matricula?: string;
        tipo?: string;
        status?: string;
        dataInicio?: string;
        dataTermino?: string;
      };
      const list = getTenantDb(req).getOccurrences(matricula, tipo, status, dataInicio, dataTermino);
      res.json({ success: true, data: list, count: list.length });
    } catch (error) {
      res.status(500).json({ success: false, message: (error as Error).message });
    }
  });

  app.get('/api/occurrences/:id', (req: Request, res: Response) => {
    try {
      const occ = getTenantDb(req).getOccurrenceById(req.params.id);
      if (!occ) {
        return res.status(404).json({ success: false, message: 'Ocorrência não encontrada.' });
      }
      res.json({ success: true, data: occ });
    } catch (error) {
      res.status(500).json({ success: false, message: (error as Error).message });
    }
  });

  app.post('/api/occurrences', (req: Request, res: Response) => {
    try {
      const { actorEmail, actorRole } = getActor(req);
      const { matricula, tipo, data_inicio, data_termino, cid, medico_perito, crm, anexo_url, anexo_nome, observacoes, parecer_tecnico } = req.body;

      if (!matricula || !tipo || !data_inicio || !data_termino) {
        return res.status(400).json({ success: false, message: 'Matrícula, tipo e datas de início e término são obrigatórios.' });
      }

      if (tipo === 'Licença Definitiva') {
        return res.status(400).json({
          success: false,
          message: 'A Licença Definitiva não pode ser cadastrada diretamente como uma nova ocorrência. Ela deve ser originada a partir da transformação de uma licença já ativa ou prorrogada com a devida Data da Concessão.'
        });
      }

      const saved = getTenantDb(req).saveOccurrence(
        { matricula, tipo, data_inicio, data_termino, cid, medico_perito, crm, anexo_url, anexo_nome, observacoes, parecer_tecnico },
        actorEmail,
        actorRole
      );
      res.status(201).json({ success: true, data: saved });
    } catch (error) {
      res.status(400).json({ success: false, message: (error as Error).message });
    }
  });

  app.put('/api/occurrences/:id', (req: Request, res: Response) => {
    try {
      const { actorEmail, actorRole } = getActor(req);
      const saved = getTenantDb(req).saveOccurrence(
        { ...req.body, id: req.params.id },
        actorEmail,
        actorRole
      );
      res.json({ success: true, data: saved });
    } catch (error) {
      res.status(400).json({ success: false, message: (error as Error).message });
    }
  });

  app.post('/api/occurrences/:id/prorrogar', (req: Request, res: Response) => {
    try {
      const { actorEmail, actorRole } = getActor(req);
      const { novaDataTermino, motivo, medico, crm } = req.body;
      if (!novaDataTermino) {
        return res.status(400).json({ success: false, message: 'Nova data de término é obrigatória.' });
      }
      const updated = getTenantDb(req).prorrogarOccurrence(req.params.id, novaDataTermino, motivo || 'Prorrogação pericial deferida', medico, crm, actorEmail, actorRole);
      res.json({ success: true, data: updated });
    } catch (error) {
      res.status(400).json({ success: false, message: (error as Error).message });
    }
  });

  app.post('/api/occurrences/:id/concluir', (req: Request, res: Response) => {
    try {
      const { actorEmail, actorRole } = getActor(req);
      const { parecerFinal, dataConcessao, atoConcessao } = req.body;
      const updated = getTenantDb(req).concluirOccurrence(req.params.id, parecerFinal, actorEmail, actorRole, dataConcessao, atoConcessao);
      res.json({ success: true, data: updated });
    } catch (error) {
      res.status(400).json({ success: false, message: (error as Error).message });
    }
  });

  app.post('/api/occurrences/:id/retorno-trabalho', (req: Request, res: Response) => {
    try {
      const { actorEmail, actorRole } = getActor(req);
      const { dataRetorno, motivoRetorno, medico, crm, atoReversao } = req.body;
      if (!dataRetorno) {
        return res.status(400).json({ success: false, message: 'Data do Retorno ao Trabalho é obrigatória.' });
      }
      const updated = getTenantDb(req).retornarTrabalhoOccurrence(
        req.params.id,
        dataRetorno,
        motivoRetorno,
        medico,
        crm,
        atoReversao,
        actorEmail,
        actorRole
      );
      res.json({ success: true, data: updated });
    } catch (error) {
      res.status(400).json({ success: false, message: (error as Error).message });
    }
  });

  app.post('/api/occurrences/:id/converter-definitiva', (req: Request, res: Response) => {
    try {
      const { actorEmail, actorRole } = getActor(req);
      const { dataConcessao, atoConcessao, motivo, medico, crm, parecerTecnico } = req.body;
      if (!dataConcessao) {
        return res.status(400).json({ success: false, message: 'A Data da Concessão é obrigatória para tornar a licença definitiva.' });
      }
      const occ = getTenantDb(req).getOccurrenceById(req.params.id);
      if (!occ) {
        return res.status(404).json({ success: false, message: 'Ocorrência não encontrada.' });
      }
      if (occ.data_termino && dataConcessao <= occ.data_termino) {
        return res.status(400).json({ 
          success: false, 
          message: `A licença permanente não poderá ser concedida dentro do prazo vigente de licença (vigente até ${occ.data_termino}). A Data da Concessão deve ser posterior ao término da licença atual.` 
        });
      }
      const updated = getTenantDb(req).converterOccurrenceDefinitiva(
        req.params.id,
        dataConcessao,
        atoConcessao,
        motivo,
        medico,
        crm,
        parecerTecnico,
        actorEmail,
        actorRole
      );
      res.json({ success: true, data: updated });
    } catch (error) {
      res.status(400).json({ success: false, message: (error as Error).message });
    }
  });

  app.post('/api/occurrences/:id/cancelar', (req: Request, res: Response) => {
    try {
      const { actorEmail, actorRole } = getActor(req);
      const { motivo } = req.body;
      const updated = getTenantDb(req).cancelarOccurrence(req.params.id, motivo || 'Cancelamento solicitado', actorEmail, actorRole);
      res.json({ success: true, data: updated });
    } catch (error) {
      res.status(400).json({ success: false, message: (error as Error).message });
    }
  });

  app.delete('/api/occurrences/:id', (req: Request, res: Response) => {
    try {
      const { actorEmail, actorRole } = getActor(req);
      if (actorRole !== 'admin') {
        return res.status(403).json({ success: false, message: 'Apenas Administradores podem excluir afastamentos definitivamente.' });
      }
      const ok = getTenantDb(req).deleteOccurrence(req.params.id, actorEmail, actorRole);
      if (!ok) return res.status(404).json({ success: false, message: 'Ocorrência não encontrada.' });
      res.json({ success: true, message: 'Registro excluído com sucesso.' });
    } catch (error) {
      res.status(400).json({ success: false, message: (error as Error).message });
    }
  });

  // Clear only occurrences (keeps employees intact)
  app.post('/api/admin/clear-occurrences', (req: Request, res: Response) => {
    try {
      const { actorEmail, actorRole } = getActor(req);
      const count = getTenantDb(req).clearOccurrences(actorEmail, actorRole);
      res.json({ success: true, message: `${count} ocorrências excluídas com sucesso. Todos os servidores mantidos e ativos.`, data: { deletedOccurrences: count } });
    } catch (error) {
      res.status(400).json({ success: false, message: (error as Error).message });
    }
  });

  // Audit Logs
  app.get('/api/audit-logs', (req: Request, res: Response) => {
    try {
      const { entityType, search } = req.query as { entityType?: string; search?: string };
      const logs = getTenantDb(req).getAuditLogs(entityType, search);
      res.json({ success: true, data: logs });
    } catch (error) {
      res.status(500).json({ success: false, message: (error as Error).message });
    }
  });

  // User Management
  app.get('/api/users', (req: Request, res: Response) => {
    try {
      const users = getTenantDb(req).getUsers();
      res.json({ success: true, data: users });
    } catch (error) {
      res.status(500).json({ success: false, message: (error as Error).message });
    }
  });

  app.post('/api/users', async (req: Request, res: Response) => {
    try {
      const { actorEmail, actorRole } = getActor(req);
      const user = getTenantDb(req).saveUser(req.body, actorEmail, actorRole);

      let emailDispatch = null;
      if (user.confirmation_code && user.email_verified === false) {
        emailDispatch = await emailService.sendConfirmationEmail(
          user.email,
          user.name,
          user.confirmation_code,
          user.password
        );
      }

      res.status(201).json({ success: true, data: user, emailDispatch });
    } catch (error) {
      res.status(400).json({ success: false, message: (error as Error).message });
    }
  });

  app.put('/api/users/:email', (req: Request, res: Response) => {
    try {
      const { actorEmail, actorRole } = getActor(req);
      const user = getTenantDb(req).saveUser({ ...req.body, email: req.params.email }, actorEmail, actorRole);
      res.json({ success: true, data: user });
    } catch (error) {
      res.status(400).json({ success: false, message: (error as Error).message });
    }
  });

  app.delete('/api/users/:email', (req: Request, res: Response) => {
    try {
      const { actorEmail, actorRole } = getActor(req);
      (getTenantDb(req) as any).deleteUser?.(req.params.email, actorEmail, actorRole);
      res.json({ success: true, message: 'Operador excluído com sucesso.' });
    } catch (error) {
      res.status(400).json({ success: false, message: (error as Error).message });
    }
  });

  // Secretarias CRUD
  app.get('/api/secretarias', (req: Request, res: Response) => {
    try {
      const { search, apenasAtivas } = req.query as { search?: string; apenasAtivas?: string };
      const secretarias = getTenantDb(req).getSecretarias(search, apenasAtivas === 'true');
      res.json({ success: true, data: secretarias, count: secretarias.length });
    } catch (error) {
      res.status(500).json({ success: false, message: (error as Error).message });
    }
  });

  app.get('/api/secretarias/:id', (req: Request, res: Response) => {
    try {
      const sec = getTenantDb(req).getSecretariaById(req.params.id);
      if (!sec) {
        return res.status(404).json({ success: false, message: 'Secretaria não encontrada.' });
      }
      res.json({ success: true, data: sec });
    } catch (error) {
      res.status(500).json({ success: false, message: (error as Error).message });
    }
  });

  app.post('/api/secretarias', (req: Request, res: Response) => {
    try {
      const { actorEmail, actorRole } = getActor(req);
      const { sigla, nome, secretario, email, telefone, endereco, ativa } = req.body;

      if (!sigla || !nome) {
        return res.status(400).json({ success: false, message: 'Sigla e Nome da Secretaria são obrigatórios.' });
      }

      const saved = getTenantDb(req).saveSecretaria(
        { sigla, nome, secretario, email, telefone, endereco, ativa },
        actorEmail,
        actorRole
      );
      res.status(201).json({ success: true, data: saved });
    } catch (error) {
      res.status(400).json({ success: false, message: (error as Error).message });
    }
  });

  app.put('/api/secretarias/:id', (req: Request, res: Response) => {
    try {
      const { actorEmail, actorRole } = getActor(req);
      const saved = getTenantDb(req).saveSecretaria(
        { ...req.body, id: req.params.id },
        actorEmail,
        actorRole
      );
      res.json({ success: true, data: saved });
    } catch (error) {
      res.status(400).json({ success: false, message: (error as Error).message });
    }
  });

  app.delete('/api/secretarias/:id', (req: Request, res: Response) => {
    try {
      const { actorEmail, actorRole } = getActor(req);
      if (actorRole !== 'admin') {
        return res.status(403).json({ success: false, message: 'Apenas Administradores podem excluir secretarias.' });
      }
      const ok = getTenantDb(req).deleteSecretaria(req.params.id, actorEmail, actorRole);
      if (!ok) return res.status(404).json({ success: false, message: 'Secretaria não encontrada.' });
      res.json({ success: true, message: 'Secretaria excluída com sucesso.' });
    } catch (error) {
      res.status(400).json({ success: false, message: (error as Error).message });
    }
  });

  // Doctors CRUD
  app.get('/api/doctors', (req: Request, res: Response) => {
    try {
      const { search, apenasAtivos } = req.query as { search?: string; apenasAtivos?: string };
      const doctors = getTenantDb(req).getDoctors(search, apenasAtivos === 'true');
      res.json({ success: true, data: doctors, count: doctors.length });
    } catch (error) {
      res.status(500).json({ success: false, message: (error as Error).message });
    }
  });

  app.get('/api/doctors/:id', (req: Request, res: Response) => {
    try {
      const doc = getTenantDb(req).getDoctorById(req.params.id);
      if (!doc) {
        return res.status(404).json({ success: false, message: 'Médico não encontrado.' });
      }
      res.json({ success: true, data: doc });
    } catch (error) {
      res.status(500).json({ success: false, message: (error as Error).message });
    }
  });

  app.post('/api/doctors', (req: Request, res: Response) => {
    try {
      const { actorEmail, actorRole } = getActor(req);
      const { nome, crm, especialidade, ativo, vinculo, is_diretor } = req.body;

      if (!nome || !crm) {
        return res.status(400).json({ success: false, message: 'Nome e Número de CRM são obrigatórios.' });
      }

      const saved = getTenantDb(req).saveDoctor({ nome, crm, especialidade, ativo, vinculo, is_diretor }, actorEmail, actorRole);
      res.status(201).json({ success: true, data: saved });
    } catch (error) {
      res.status(400).json({ success: false, message: (error as Error).message });
    }
  });

  app.put('/api/doctors/:id', (req: Request, res: Response) => {
    try {
      const { actorEmail, actorRole } = getActor(req);
      const doctorIdOrCrm = decodeURIComponent(req.params.id);
      const saved = getTenantDb(req).saveDoctor({ ...req.body, id: doctorIdOrCrm }, actorEmail, actorRole);
      res.json({ success: true, data: saved });
    } catch (error) {
      res.status(400).json({ success: false, message: (error as Error).message });
    }
  });

  app.patch('/api/doctors/:id/set-diretor', (req: Request, res: Response) => {
    try {
      const { actorEmail, actorRole } = getActor(req);
      const doctorIdOrCrm = decodeURIComponent(req.params.id);
      const doc = getTenantDb(req).setDoctorDiretor(doctorIdOrCrm, actorEmail, actorRole);
      res.json({ success: true, data: doc });
    } catch (error) {
      res.status(400).json({ success: false, message: (error as Error).message });
    }
  });

  app.patch('/api/doctors/:id/toggle', (req: Request, res: Response) => {
    try {
      const { actorEmail, actorRole } = getActor(req);
      const doctorIdOrCrm = decodeURIComponent(req.params.id);
      const doc = getTenantDb(req).toggleDoctorStatus(doctorIdOrCrm, actorEmail, actorRole);
      res.json({ success: true, data: doc });
    } catch (error) {
      res.status(400).json({ success: false, message: (error as Error).message });
    }
  });

  app.delete('/api/doctors/:id', (req: Request, res: Response) => {
    try {
      const { actorEmail, actorRole } = getActor(req);
      if (actorRole !== 'admin') {
        return res.status(403).json({ success: false, message: 'Apenas Administradores podem excluir médicos.' });
      }
      const doctorIdOrCrm = decodeURIComponent(req.params.id);
      const ok = getTenantDb(req).deleteDoctor(doctorIdOrCrm, actorEmail, actorRole);
      if (!ok) return res.status(404).json({ success: false, message: 'Médico não localizado no cadastro.' });
      res.json({ success: true, message: 'Médico excluído com sucesso.' });
    } catch (error) {
      res.status(400).json({ success: false, message: (error as Error).message });
    }
  });

  // Auth endpoint for Google Master and corporate operators
  app.post('/api/auth/login', (req: Request, res: Response) => {
    try {
      const { email, name, provider, password } = req.body;
      if (!email || !email.trim()) {
        return res.status(400).json({ success: false, message: 'Email é obrigatório para autenticação.' });
      }

      const emailNorm = email.trim().toLowerCase();
      const isMaster = emailNorm === 'pliniocatunda@gmail.com';
      const users = getTenantDb(req).getUsers();
      let user = users.find(u => u.email.toLowerCase() === emailNorm);

      if (!user) {
        if (isMaster) {
          // Master administrator is auto-provisioned/restored if missing
          user = getTenantDb(req).saveUser(
            {
              email: 'Pliniocatunda@gmail.com',
              name: name || 'Plínio Catunda (Administrador Master)',
              role: 'admin',
              auth_provider: 'google',
              department: 'IPME - Presidência & Governança',
              cargo: 'Administrador Geral & Master do Sistema',
              ativo: true,
              password: password || 'IpmeMaster@2026',
              email_verified: true,
              must_change_password: false,
              avatar_url: '/logo-ipme.png',
            },
            'Sistema IPME',
            'admin'
          );
        } else {
          return res.status(403).json({
            success: false,
            message: `O e-mail corporativo "${email}" não está cadastrado. Apenas operadores previamente cadastrados pelo Administrador Master (pliniocatunda@gmail.com) possuem permissão de acesso ao sistema.`
          });
        }
      }

      if (user.ativo === false) {
        return res.status(403).json({
          success: false,
          message: `O acesso do operador "${user.name}" está inativo. Solicite a reativação ao Administrador Master.`
        });
      }

      if (provider === 'google') {
        if (!isMaster) {
          return res.status(403).json({
            success: false,
            message: 'Acesso negado. Apenas a conta Google oficial (pliniocatunda@gmail.com) tem permissão de Administrador Master.'
          });
        }
        // Autenticado com sucesso via Google - sem necessidade de senha de sistema!
      } else {
        // Validação obrigatória de senha para operadores corporativos
        const userPassword = user.password || (isMaster ? 'IpmeMaster@2026' : 'Ipme@2026');
        if (!password || !password.trim()) {
          return res.status(401).json({
            success: false,
            message: 'Por favor, informe sua senha de acesso para entrar no sistema.'
          });
        }
        if (userPassword !== password.trim()) {
          return res.status(401).json({
            success: false,
            message: 'Senha de acesso incorreta. Verifique os caracteres e tente novamente.'
          });
        }
      }

      user.last_login = new Date().toISOString();
      res.json({ success: true, data: user });
    } catch (error) {
      res.status(400).json({ success: false, message: (error as Error).message });
    }
  });

  // Logout endpoint
  app.post('/api/auth/logout', (_req: Request, res: Response) => {
    res.json({ success: true, message: 'Sessão encerrada com sucesso.' });
  });

  // Confirm user email endpoint
  app.post('/api/auth/confirm-email', (req: Request, res: Response) => {
    try {
      const { email, code, token } = req.body;
      const { actorEmail } = getActor(req);
      const user = getTenantDb(req).confirmEmail(email, code || token, actorEmail);
      res.json({ success: true, message: 'Cadastro e e-mail confirmados com sucesso! Você já pode realizar login.', data: user });
    } catch (error) {
      res.status(400).json({ success: false, message: (error as Error).message });
    }
  });

  // Resend confirmation email endpoint
  app.post('/api/auth/resend-confirmation', async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      const { actorEmail } = getActor(req);
      const result = getTenantDb(req).resendConfirmationEmail(email, actorEmail);
      const emailDispatch = await emailService.sendConfirmationEmail(
        result.email,
        result.name,
        result.code
      );
      res.json({
        success: true,
        message: 'Novo código de confirmação gerado e enviado para o e-mail corporativo.',
        data: result,
        emailDispatch,
      });
    } catch (error) {
      res.status(400).json({ success: false, message: (error as Error).message });
    }
  });

  // SMTP Email Status endpoint
  app.get('/api/admin/email-status', (_req: Request, res: Response) => {
    res.json({ success: true, data: emailService.getStatus() });
  });

  // Admin test email endpoint
  app.post('/api/admin/test-email', async (req: Request, res: Response) => {
    try {
      const { to } = req.body;
      if (!to) {
        return res.status(400).json({ success: false, message: 'Informe o endereço de e-mail de destino para o teste.' });
      }
      const result = await emailService.sendTestEmail(to);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: (error as Error).message });
    }
  });

  // Change password endpoint
  app.post('/api/auth/change-password', (req: Request, res: Response) => {
    try {
      const { email, currentPassword, newPassword } = req.body;
      const { actorEmail } = getActor(req);
      const user = getTenantDb(req).changePassword(email, currentPassword, newPassword, actorEmail);
      res.json({ success: true, message: 'Senha de acesso alterada com sucesso!', data: user });
    } catch (error) {
      res.status(400).json({ success: false, message: (error as Error).message });
    }
  });

  // Vite Integration
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server IPME running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
