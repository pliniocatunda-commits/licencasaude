import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { db } from './src/server/database.ts';

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

  // --- API Routes ---

  // Dashboard Stats & Metrics
  app.get('/api/stats', (_req: Request, res: Response) => {
    try {
      const metrics = db.getMetrics();
      res.json({ success: true, data: metrics });
    } catch (error) {
      res.status(500).json({ success: false, message: (error as Error).message });
    }
  });

  // Employees CRUD
  app.get('/api/employees', (req: Request, res: Response) => {
    try {
      const { search, secretaria, status } = req.query as { search?: string; secretaria?: string; status?: string };
      const employees = db.getEmployees(search, secretaria, status);
      res.json({ success: true, data: employees, count: employees.length });
    } catch (error) {
      res.status(500).json({ success: false, message: (error as Error).message });
    }
  });

  app.get('/api/employees/:matricula', (req: Request, res: Response) => {
    try {
      const emp = db.getEmployeeByMatricula(req.params.matricula);
      if (!emp) {
        return res.status(404).json({ success: false, message: 'Servidor não encontrado.' });
      }
      const history = db.getOccurrences(emp.matricula);
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

      const saved = db.saveEmployee(
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
      const saved = db.saveEmployee(
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
      const deleted = db.deleteEmployee(req.params.matricula, actorEmail, actorRole);
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
      const result = db.clearAllEmployees(actorEmail, actorRole);
      res.json({ success: true, message: 'Cadastro de servidores apagado com sucesso.', data: result });
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
      const list = db.getOccurrences(matricula, tipo, status, dataInicio, dataTermino);
      res.json({ success: true, data: list, count: list.length });
    } catch (error) {
      res.status(500).json({ success: false, message: (error as Error).message });
    }
  });

  app.get('/api/occurrences/:id', (req: Request, res: Response) => {
    try {
      const occ = db.getOccurrenceById(req.params.id);
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

      const saved = db.saveOccurrence(
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
      const saved = db.saveOccurrence(
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
      const updated = db.prorrogarOccurrence(req.params.id, novaDataTermino, motivo || 'Prorrogação pericial deferida', medico, crm, actorEmail, actorRole);
      res.json({ success: true, data: updated });
    } catch (error) {
      res.status(400).json({ success: false, message: (error as Error).message });
    }
  });

  app.post('/api/occurrences/:id/concluir', (req: Request, res: Response) => {
    try {
      const { actorEmail, actorRole } = getActor(req);
      const { parecerFinal } = req.body;
      const updated = db.concluirOccurrence(req.params.id, parecerFinal, actorEmail, actorRole);
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
      const occ = db.getOccurrenceById(req.params.id);
      if (!occ) {
        return res.status(404).json({ success: false, message: 'Ocorrência não encontrada.' });
      }
      if (occ.data_termino && dataConcessao <= occ.data_termino) {
        return res.status(400).json({ 
          success: false, 
          message: `A licença permanente não poderá ser concedida dentro do prazo vigente de licença (vigente até ${occ.data_termino}). A Data da Concessão deve ser posterior ao término da licença atual.` 
        });
      }
      const updated = db.converterOccurrenceDefinitiva(
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
      const updated = db.cancelarOccurrence(req.params.id, motivo || 'Cancelamento solicitado', actorEmail, actorRole);
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
      const ok = db.deleteOccurrence(req.params.id, actorEmail, actorRole);
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
      const count = db.clearOccurrences(actorEmail, actorRole);
      res.json({ success: true, message: `${count} ocorrências excluídas com sucesso. Todos os servidores mantidos e ativos.`, data: { deletedOccurrences: count } });
    } catch (error) {
      res.status(400).json({ success: false, message: (error as Error).message });
    }
  });

  // Audit Logs
  app.get('/api/audit-logs', (req: Request, res: Response) => {
    try {
      const { entityType, search } = req.query as { entityType?: string; search?: string };
      const logs = db.getAuditLogs(entityType, search);
      res.json({ success: true, data: logs });
    } catch (error) {
      res.status(500).json({ success: false, message: (error as Error).message });
    }
  });

  // User Management
  app.get('/api/users', (_req: Request, res: Response) => {
    try {
      const users = db.getUsers();
      res.json({ success: true, data: users });
    } catch (error) {
      res.status(500).json({ success: false, message: (error as Error).message });
    }
  });

  app.post('/api/users', (req: Request, res: Response) => {
    try {
      const { actorEmail, actorRole } = getActor(req);
      const user = db.saveUser(req.body, actorEmail, actorRole);
      res.status(201).json({ success: true, data: user });
    } catch (error) {
      res.status(400).json({ success: false, message: (error as Error).message });
    }
  });

  // Secretarias CRUD
  app.get('/api/secretarias', (req: Request, res: Response) => {
    try {
      const { search, apenasAtivas } = req.query as { search?: string; apenasAtivas?: string };
      const secretarias = db.getSecretarias(search, apenasAtivas === 'true');
      res.json({ success: true, data: secretarias, count: secretarias.length });
    } catch (error) {
      res.status(500).json({ success: false, message: (error as Error).message });
    }
  });

  app.get('/api/secretarias/:id', (req: Request, res: Response) => {
    try {
      const sec = db.getSecretariaById(req.params.id);
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

      const saved = db.saveSecretaria(
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
      const saved = db.saveSecretaria(
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
      const ok = db.deleteSecretaria(req.params.id, actorEmail, actorRole);
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
      const doctors = db.getDoctors(search, apenasAtivos === 'true');
      res.json({ success: true, data: doctors, count: doctors.length });
    } catch (error) {
      res.status(500).json({ success: false, message: (error as Error).message });
    }
  });

  app.get('/api/doctors/:id', (req: Request, res: Response) => {
    try {
      const doc = db.getDoctorById(req.params.id);
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

      const saved = db.saveDoctor({ nome, crm, especialidade, ativo, vinculo, is_diretor }, actorEmail, actorRole);
      res.status(201).json({ success: true, data: saved });
    } catch (error) {
      res.status(400).json({ success: false, message: (error as Error).message });
    }
  });

  app.put('/api/doctors/:id', (req: Request, res: Response) => {
    try {
      const { actorEmail, actorRole } = getActor(req);
      const saved = db.saveDoctor({ ...req.body, id: req.params.id }, actorEmail, actorRole);
      res.json({ success: true, data: saved });
    } catch (error) {
      res.status(400).json({ success: false, message: (error as Error).message });
    }
  });

  app.patch('/api/doctors/:id/set-diretor', (req: Request, res: Response) => {
    try {
      const { actorEmail, actorRole } = getActor(req);
      const doc = db.setDoctorDiretor(req.params.id, actorEmail, actorRole);
      res.json({ success: true, data: doc });
    } catch (error) {
      res.status(400).json({ success: false, message: (error as Error).message });
    }
  });

  app.patch('/api/doctors/:id/toggle', (req: Request, res: Response) => {
    try {
      const { actorEmail, actorRole } = getActor(req);
      const doc = db.toggleDoctorStatus(req.params.id, actorEmail, actorRole);
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
      const ok = db.deleteDoctor(req.params.id, actorEmail, actorRole);
      if (!ok) return res.status(404).json({ success: false, message: 'Médico não encontrado.' });
      res.json({ success: true, message: 'Médico excluído com sucesso.' });
    } catch (error) {
      res.status(400).json({ success: false, message: (error as Error).message });
    }
  });

  // Auth endpoint for simulated or verified login
  app.post('/api/auth/login', (req: Request, res: Response) => {
    try {
      const { email, name, provider } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, message: 'Email é obrigatório.' });
      }

      const users = db.getUsers();
      let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      // If user is the master email or ends with @eusebio.ce.gov.br
      if (!user) {
        const isMaster = email.toLowerCase() === 'pliniocatunda@gmail.com';
        const role = isMaster ? 'admin' : 'operator';
        user = db.saveUser(
          {
            email,
            name: name || (isMaster ? 'Plínio Catunda (Admin)' : email.split('@')[0]),
            role,
            auth_provider: provider === 'google' ? 'google' : 'corporate',
            department: isMaster ? 'IPME Presidência' : 'Prefeitura Municipal de Eusébio',
          },
          'Sistema IPME',
          'admin'
        );
      }

      res.json({ success: true, data: user });
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
