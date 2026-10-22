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
import { Employee, Occurrence, Doctor, Secretaria, AppUser, AuditLog } from '../types/index.ts';

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
  EMPLOYEES: 'employees',
  OCCURRENCES: 'occurrences',
  DOCTORS: 'doctors',
  SECRETARIAS: 'secretarias',
  USERS: 'users',
  AUDIT_LOGS: 'audit_logs',
} as const;

/**
 * Firestore Service for IPME
 */
export const firestoreService = {
  // Test connection
  testConnection: validateFirestoreConnection,

  // --- Employees ---
  async getEmployees(): Promise<Employee[]> {
    const snap = await getDocs(collection(firestoreDb, COLLECTIONS.EMPLOYEES));
    return snap.docs.map(d => d.data() as Employee);
  },

  async saveEmployee(emp: Employee): Promise<void> {
    await setDoc(doc(firestoreDb, COLLECTIONS.EMPLOYEES, emp.matricula), emp, { merge: true });
  },

  async deleteEmployee(matricula: string): Promise<void> {
    await deleteDoc(doc(firestoreDb, COLLECTIONS.EMPLOYEES, matricula));
  },

  // --- Occurrences ---
  async getOccurrences(matricula?: string): Promise<Occurrence[]> {
    let q;
    if (matricula) {
      q = query(collection(firestoreDb, COLLECTIONS.OCCURRENCES), where('matricula', '==', matricula));
    } else {
      q = query(collection(firestoreDb, COLLECTIONS.OCCURRENCES));
    }
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Occurrence);
  },

  async saveOccurrence(occ: Occurrence): Promise<void> {
    await setDoc(doc(firestoreDb, COLLECTIONS.OCCURRENCES, String(occ.id)), occ, { merge: true });
  },

  async deleteOccurrence(id: string): Promise<void> {
    await deleteDoc(doc(firestoreDb, COLLECTIONS.OCCURRENCES, String(id)));
  },

  // --- Doctors ---
  async getDoctors(): Promise<Doctor[]> {
    const snap = await getDocs(collection(firestoreDb, COLLECTIONS.DOCTORS));
    return snap.docs.map(d => d.data() as Doctor);
  },

  async saveDoctor(docItem: Doctor): Promise<void> {
    await setDoc(doc(firestoreDb, COLLECTIONS.DOCTORS, String(docItem.id)), docItem, { merge: true });
  },

  async deleteDoctor(id: string): Promise<void> {
    await deleteDoc(doc(firestoreDb, COLLECTIONS.DOCTORS, String(id)));
  },

  // --- Secretarias ---
  async getSecretarias(): Promise<Secretaria[]> {
    const snap = await getDocs(collection(firestoreDb, COLLECTIONS.SECRETARIAS));
    return snap.docs.map(d => d.data() as Secretaria);
  },

  async saveSecretaria(sec: Secretaria): Promise<void> {
    await setDoc(doc(firestoreDb, COLLECTIONS.SECRETARIAS, sec.id), sec, { merge: true });
  },

  async deleteSecretaria(id: string): Promise<void> {
    await deleteDoc(doc(firestoreDb, COLLECTIONS.SECRETARIAS, id));
  },

  // --- Audit Logs ---
  async getAuditLogs(max = 100): Promise<AuditLog[]> {
    const q = query(collection(firestoreDb, COLLECTIONS.AUDIT_LOGS), orderBy('timestamp', 'desc'), limit(max));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as AuditLog);
  },

  async addAuditLog(log: AuditLog): Promise<void> {
    await setDoc(doc(firestoreDb, COLLECTIONS.AUDIT_LOGS, log.id), log);
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
