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
   * Sync initial batch of data into Firestore if Firestore is currently empty.
   */
  async syncInitialDataIfEmpty(initialData: {
    employees: Employee[];
    occurrences: Occurrence[];
    doctors: Doctor[];
    secretarias: Secretaria[];
    users: AppUser[];
  }): Promise<{ synced: boolean; message: string }> {
    try {
      const snap = await getDocs(query(collection(firestoreDb, COLLECTIONS.DOCTORS), limit(1)));
      if (!snap.empty) {
        return { synced: false, message: 'Cloud Firestore já possui dados cadastrados.' };
      }

      console.info('Sincronizando dados iniciais para o Cloud Firestore...');

      // Batch 1: Doctors
      const batchDocs = writeBatch(firestoreDb);
      for (const d of initialData.doctors) {
        batchDocs.set(doc(firestoreDb, COLLECTIONS.DOCTORS, String(d.id)), d);
      }
      await batchDocs.commit();

      // Batch 2: Secretarias
      const batchSec = writeBatch(firestoreDb);
      for (const s of initialData.secretarias) {
        batchSec.set(doc(firestoreDb, COLLECTIONS.SECRETARIAS, s.id), s);
      }
      await batchSec.commit();

      // Batch 3: Users
      const batchUsers = writeBatch(firestoreDb);
      for (const u of initialData.users) {
        batchUsers.set(doc(firestoreDb, COLLECTIONS.USERS, u.email.toLowerCase()), u);
      }
      await batchUsers.commit();

      // Batch 4: Occurrences
      if (initialData.occurrences.length > 0) {
        const batchOcc = writeBatch(firestoreDb);
        for (const o of initialData.occurrences) {
          batchOcc.set(doc(firestoreDb, COLLECTIONS.OCCURRENCES, String(o.id)), o);
        }
        await batchOcc.commit();
      }

      // Batch 5: Employees (sync up to first 50 in batch)
      const empSample = initialData.employees.slice(0, 50);
      const batchEmp = writeBatch(firestoreDb);
      for (const e of empSample) {
        batchEmp.set(doc(firestoreDb, COLLECTIONS.EMPLOYEES, e.matricula), e);
      }
      await batchEmp.commit();

      return { synced: true, message: 'Dados sincronizados com o Cloud Firestore com sucesso.' };
    } catch (err) {
      console.warn('Erro ao sincronizar dados iniciais no Firestore:', err);
      return { synced: false, message: (err as Error).message };
    }
  }
};
