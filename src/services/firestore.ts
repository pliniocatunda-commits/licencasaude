import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  writeBatch,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Employee, Occurrence, Doctor, Secretaria, AppUser, AuditLog, TenantInfo } from '../types/index.ts';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID if configured
export const firestoreDb = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

/**
 * Validates connection to Firestore server directly.
 */
export async function validateFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(firestoreDb, 'test', 'connection'));
    console.info('Cloud Firestore conectado com sucesso ao projeto:', firebaseConfig.projectId);
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline ou aguardando conexão de rede.');
    } else {
      console.info('Firestore handshake:', (error as Error).message);
    }
    return false;
  }
}

// Collections references
export const COLLECTIONS = {
  TENANTS: 'tenants',
  EMPLOYEES: 'employees',
  OCCURRENCES: 'occurrences',
  DOCTORS: 'doctors',
  SECRETARIAS: 'secretarias',
  USERS: 'users',
  AUDIT_LOGS: 'audit_logs',
} as const;

export function getTenantCollectionPath(colName: string, tenantId?: string): string {
  const tid = tenantId || (typeof window !== 'undefined' ? localStorage.getItem('ipme_active_tenant_id') || 'ipme_eusebio' : 'ipme_eusebio');
  const clean = tid.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'ipme_eusebio';
  return `tenants/${clean}/${colName}`;
}

/**
 * Firestore Service for IPME with Strict Tenant Isolation
 */
export const firestoreService = {
  // Test connection
  testConnection: validateFirestoreConnection,

  getTenantId(tenantId?: string): string {
    return tenantId || (typeof window !== 'undefined' ? localStorage.getItem('ipme_active_tenant_id') || 'ipme_eusebio' : 'ipme_eusebio');
  },

  // --- Tenants Registry ---
  async getTenants(): Promise<TenantInfo[]> {
    const snap = await getDocs(collection(firestoreDb, COLLECTIONS.TENANTS));
    return snap.docs.map(d => d.data() as TenantInfo);
  },

  async saveTenant(tenant: TenantInfo): Promise<void> {
    await setDoc(doc(firestoreDb, COLLECTIONS.TENANTS, tenant.id), tenant, { merge: true });
  },

  // --- Employees (Tenant Isolated) ---
  async getEmployees(tenantId?: string): Promise<Employee[]> {
    const tid = this.getTenantId(tenantId);
    const snap = await getDocs(collection(firestoreDb, getTenantCollectionPath(COLLECTIONS.EMPLOYEES, tid)));
    return snap.docs.map(d => d.data() as Employee);
  },

  async saveEmployee(emp: Employee, tenantId?: string): Promise<void> {
    const tid = this.getTenantId(tenantId);
    await setDoc(doc(firestoreDb, getTenantCollectionPath(COLLECTIONS.EMPLOYEES, tid), emp.matricula), emp, { merge: true });
  },

  async deleteEmployee(matricula: string, tenantId?: string): Promise<void> {
    const tid = this.getTenantId(tenantId);
    await deleteDoc(doc(firestoreDb, getTenantCollectionPath(COLLECTIONS.EMPLOYEES, tid), matricula));
  },

  // --- Occurrences (Tenant Isolated) ---
  async getOccurrences(matricula?: string, tenantId?: string): Promise<Occurrence[]> {
    const tid = this.getTenantId(tenantId);
    const colRef = collection(firestoreDb, getTenantCollectionPath(COLLECTIONS.OCCURRENCES, tid));
    let q;
    if (matricula) {
      q = query(colRef, where('matricula', '==', matricula));
    } else {
      q = query(colRef);
    }
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Occurrence);
  },

  async saveOccurrence(occ: Occurrence, tenantId?: string): Promise<void> {
    const tid = this.getTenantId(tenantId);
    await setDoc(doc(firestoreDb, getTenantCollectionPath(COLLECTIONS.OCCURRENCES, tid), String(occ.id)), occ, { merge: true });
  },

  async deleteOccurrence(id: string, tenantId?: string): Promise<void> {
    const tid = this.getTenantId(tenantId);
    await deleteDoc(doc(firestoreDb, getTenantCollectionPath(COLLECTIONS.OCCURRENCES, tid), String(id)));
  },

  // --- Doctors (Tenant Isolated) ---
  async getDoctors(tenantId?: string): Promise<Doctor[]> {
    const tid = this.getTenantId(tenantId);
    const snap = await getDocs(collection(firestoreDb, getTenantCollectionPath(COLLECTIONS.DOCTORS, tid)));
    return snap.docs.map(d => d.data() as Doctor);
  },

  async saveDoctor(docItem: Doctor, tenantId?: string): Promise<void> {
    const tid = this.getTenantId(tenantId);
    await setDoc(doc(firestoreDb, getTenantCollectionPath(COLLECTIONS.DOCTORS, tid), String(docItem.id)), docItem, { merge: true });
  },

  async deleteDoctor(id: string, tenantId?: string): Promise<void> {
    const tid = this.getTenantId(tenantId);
    await deleteDoc(doc(firestoreDb, getTenantCollectionPath(COLLECTIONS.DOCTORS, tid), String(id)));
  },

  // --- Secretarias (Tenant Isolated) ---
  async getSecretarias(tenantId?: string): Promise<Secretaria[]> {
    const tid = this.getTenantId(tenantId);
    const snap = await getDocs(collection(firestoreDb, getTenantCollectionPath(COLLECTIONS.SECRETARIAS, tid)));
    return snap.docs.map(d => d.data() as Secretaria);
  },

  async saveSecretaria(sec: Secretaria, tenantId?: string): Promise<void> {
    const tid = this.getTenantId(tenantId);
    await setDoc(doc(firestoreDb, getTenantCollectionPath(COLLECTIONS.SECRETARIAS, tid), sec.id), sec, { merge: true });
  },

  async deleteSecretaria(id: string, tenantId?: string): Promise<void> {
    const tid = this.getTenantId(tenantId);
    await deleteDoc(doc(firestoreDb, getTenantCollectionPath(COLLECTIONS.SECRETARIAS, tid), id));
  },

  // --- Audit Logs (Tenant Isolated) ---
  async getAuditLogs(max = 100, tenantId?: string): Promise<AuditLog[]> {
    const tid = this.getTenantId(tenantId);
    const q = query(collection(firestoreDb, getTenantCollectionPath(COLLECTIONS.AUDIT_LOGS, tid)), orderBy('timestamp', 'desc'), limit(max));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as AuditLog);
  },

  async addAuditLog(log: AuditLog, tenantId?: string): Promise<void> {
    const tid = this.getTenantId(tenantId);
    await setDoc(doc(firestoreDb, getTenantCollectionPath(COLLECTIONS.AUDIT_LOGS, tid), log.id), log);
  },

  // --- Users ---
  async getUsers(): Promise<AppUser[]> {
    const snap = await getDocs(collection(firestoreDb, COLLECTIONS.USERS));
    return snap.docs.map(d => d.data() as AppUser);
  },

  async saveUser(user: AppUser): Promise<void> {
    await setDoc(doc(firestoreDb, COLLECTIONS.USERS, user.email.toLowerCase()), user, { merge: true });
  },

  /**
   * Retorna um resumo rápido do que está atualmente gravado no Cloud Firestore para o Tenant
   */
  async getCloudSummary(tenantId?: string): Promise<{
    connected: boolean;
    occurrencesCount: number;
    employeesCount: number;
    lastUpdated?: string;
  }> {
    const tid = this.getTenantId(tenantId);
    try {
      const isOnline = await validateFirestoreConnection();
      if (!isOnline) {
        return { connected: false, occurrencesCount: 0, employeesCount: 0 };
      }
      const occSnap = await getDocs(collection(firestoreDb, getTenantCollectionPath(COLLECTIONS.OCCURRENCES, tid)));
      const empSnap = await getDocs(collection(firestoreDb, getTenantCollectionPath(COLLECTIONS.EMPLOYEES, tid)));
      return {
        connected: true,
        occurrencesCount: occSnap.size,
        employeesCount: empSnap.size,
      };
    } catch (err) {
      console.warn('[Firestore] Erro ao obter resumo da nuvem:', err);
      return { connected: false, occurrencesCount: 0, employeesCount: 0 };
    }
  },

  /**
   * Faz upload completo e em lotes de toda a base (servidores, licenças, médicos, secretarias)
   * para a partição isolada do Tenant no Google Cloud Firestore.
   */
  async uploadFullDatabaseToFirestore(
    tenantId: string,
    data: {
      employees: Employee[];
      occurrences: Occurrence[];
      doctors?: Doctor[];
      secretarias?: Secretaria[];
      users?: AppUser[];
      audit_logs?: AuditLog[];
    },
    onProgress?: (message: string, percent: number) => void
  ): Promise<{ success: boolean; totalUploaded: number; message: string }> {
    const tid = this.getTenantId(tenantId);
    let totalUploaded = 0;

    onProgress?.('Conectando ao Google Cloud Firestore...', 5);

    // 1. Médicos Peritos
    if (data.doctors && data.doctors.length > 0) {
      onProgress?.(`Enviando ${data.doctors.length} médicos peritos...`, 10);
      const batchDoc = writeBatch(firestoreDb);
      for (const d of data.doctors) {
        batchDoc.set(doc(firestoreDb, getTenantCollectionPath(COLLECTIONS.DOCTORS, tid), String(d.id)), d, { merge: true });
        totalUploaded++;
      }
      await batchDoc.commit();
    }

    // 2. Secretarias Municipais
    if (data.secretarias && data.secretarias.length > 0) {
      onProgress?.(`Enviando catálogo de ${data.secretarias.length} secretarias...`, 20);
      const batchSec = writeBatch(firestoreDb);
      for (const s of data.secretarias) {
        batchSec.set(doc(firestoreDb, getTenantCollectionPath(COLLECTIONS.SECRETARIAS, tid), s.id), s, { merge: true });
        totalUploaded++;
      }
      await batchSec.commit();
    }

    // 3. Ocorrências (Licenças de Saúde, Readaptações, Maternidade)
    if (data.occurrences && data.occurrences.length > 0) {
      onProgress?.(`Enviando ${data.occurrences.length} licenças e ocorrências periciais...`, 30);
      const occChunks: Occurrence[][] = [];
      for (let i = 0; i < data.occurrences.length; i += 400) {
        occChunks.push(data.occurrences.slice(i, i + 400));
      }
      for (let idx = 0; idx < occChunks.length; idx++) {
        const chunk = occChunks[idx];
        const batchOcc = writeBatch(firestoreDb);
        for (const o of chunk) {
          batchOcc.set(doc(firestoreDb, getTenantCollectionPath(COLLECTIONS.OCCURRENCES, tid), String(o.id)), o, { merge: true });
          totalUploaded++;
        }
        await batchOcc.commit();
      }
    }

    // 4. Servidores em lotes de 400 (limite seguro do Firestore)
    if (data.employees && data.employees.length > 0) {
      const empChunks: Employee[][] = [];
      for (let i = 0; i < data.employees.length; i += 400) {
        empChunks.push(data.employees.slice(i, i + 400));
      }
      for (let idx = 0; idx < empChunks.length; idx++) {
        const chunk = empChunks[idx];
        const pct = 40 + Math.round(((idx + 1) / empChunks.length) * 50);
        onProgress?.(`Enviando servidores para a nuvem (${Math.min((idx + 1) * 400, data.employees.length)} de ${data.employees.length})...`, pct);
        const batchEmp = writeBatch(firestoreDb);
        for (const e of chunk) {
          batchEmp.set(doc(firestoreDb, getTenantCollectionPath(COLLECTIONS.EMPLOYEES, tid), e.matricula), e, { merge: true });
          totalUploaded++;
        }
        await batchEmp.commit();
      }
    }

    // 5. Atualiza Metadados do Tenant
    onProgress?.('Gravando metadados e selo de segurança...', 95);
    await setDoc(doc(firestoreDb, COLLECTIONS.TENANTS, tid), {
      id: tid,
      updated_at: new Date().toISOString(),
      occurrences_count: data.occurrences?.length || 0,
      employees_count: data.employees?.length || 0,
      status: 'ativo_nuvem',
    }, { merge: true });

    onProgress?.('Publicação concluída com sucesso!', 100);

    return {
      success: true,
      totalUploaded,
      message: `Sucesso! ${data.employees?.length || 0} servidores e ${data.occurrences?.length || 0} licenças foram gravados com sucesso no Cloud Firestore.`
    };
  },

  /**
   * Baixa a base completa do Tenant a partir do Cloud Firestore
   */
  async downloadFullDatabaseFromFirestore(tenantId?: string): Promise<{
    employees: Employee[];
    occurrences: Occurrence[];
    doctors: Doctor[];
    secretarias: Secretaria[];
    users: AppUser[];
    audit_logs: AuditLog[];
  } | null> {
    const tid = this.getTenantId(tenantId);
    try {
      const occs = await this.getOccurrences(undefined, tid);
      if (occs.length === 0) {
        return null;
      }
      const [emps, docs, secs, logs, usrs] = await Promise.all([
        this.getEmployees(tid),
        this.getDoctors(tid),
        this.getSecretarias(tid),
        this.getAuditLogs(100, tid),
        this.getUsers(),
      ]);

      return {
        employees: emps,
        occurrences: occs,
        doctors: docs,
        secretarias: secs,
        users: usrs,
        audit_logs: logs,
      };
    } catch (err) {
      console.warn('Erro ao carregar dados completos do Firestore:', err);
      return null;
    }
  },

  /**
   * Sincronização automática para primeira carga se o Firestore estiver vazio
   */
  async syncInitialDataIfEmpty(initialData: {
    employees: Employee[];
    occurrences: Occurrence[];
    doctors: Doctor[];
    secretarias: Secretaria[];
    users: AppUser[];
  }): Promise<{ synced: boolean; message: string }> {
    try {
      const tid = this.getTenantId();
      const snap = await getDocs(query(collection(firestoreDb, getTenantCollectionPath(COLLECTIONS.OCCURRENCES, tid)), limit(1)));
      if (!snap.empty) {
        return { synced: false, message: 'Cloud Firestore já possui dados cadastrados.' };
      }
      const res = await this.uploadFullDatabaseToFirestore(tid, initialData);
      return { synced: res.success, message: res.message };
    } catch (err) {
      return { synced: false, message: (err as Error).message };
    }
  }
};
