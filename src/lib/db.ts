import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { Transaction, Budget } from '../types';

export async function getTransactions(userId: string): Promise<Transaction[]> {
  const path = 'transactions';
  try {
    const q = query(
      collection(db, path),
      where('userId', '==', userId)
    );
    const snap = await getDocs(q);
    const list = snap.docs.map(doc => doc.data() as Transaction);
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function getBudget(userId: string, month: string, year: number): Promise<Budget | null> {
  const path = 'budgets';
  const id = `${userId}_${month}_${year}`;
  try {
    const budgetDoc = await getDoc(doc(db, path, id));
    if (!budgetDoc.exists()) return null;
    return budgetDoc.data() as Budget;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${path}/${id}`);
  }
}

export function subscribeToTransactions(userId: string, callback: (payload: any) => void) {
  const path = 'transactions';
  const q = query(
    collection(db, path),
    where('userId', '==', userId)
  );

  const unsubscribe = onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map(doc => doc.data() as Transaction);
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      callback(list);
    },
    (error) => {
       handleFirestoreError(error, OperationType.GET, path);
    }
  );

  return unsubscribe;
}

export async function addTransaction(tx: any) {
  const path = 'transactions';
  const transactionRef = doc(collection(db, path));
  const newTx: Transaction = {
    id: transactionRef.id,
    userId: tx.userId,
    amount: Number(tx.amount),
    category: tx.category,
    type: tx.type,
    date: tx.date,
    description: tx.description || '',
    createdAt: new Date().toISOString()
  };
  try {
    await setDoc(transactionRef, newTx);
    return newTx;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${path}/${transactionRef.id}`);
  }
}

export async function deleteTransaction(id: string) {
  const path = 'transactions';
  try {
    await deleteDoc(doc(db, path, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${path}/${id}`);
  }
}

export function subscribeToBudget(userId: string, month: string, year: number, callback: (payload: any) => void) {
  const path = 'budgets';
  const id = `${userId}_${month}_${year}`;
  const budgetRef = doc(db, path, id);

  const unsubscribe = onSnapshot(
    budgetRef,
    (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as Budget);
      } else {
        callback(null);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, `${path}/${id}`);
    }
  );

  return unsubscribe;
}

export async function setBudget(userId: string, month: string, year: number, amount: number) {
  const path = 'budgets';
  const id = `${userId}_${month}_${year}`;
  const data: Budget = {
    id,
    userId,
    amount: Number(amount),
    month,
    year: Number(year)
  };
  try {
    await setDoc(doc(db, path, id), {
      ...data,
      updatedAt: new Date().toISOString()
    });
    return data;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${id}`);
  }
}

export async function resetBudget(userId: string, month: string, year: number) {
  const path = 'budgets';
  const id = `${userId}_${month}_${year}`;
  try {
    await deleteDoc(doc(db, path, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${path}/${id}`);
  }
}

export async function getProfile(userId: string) {
  const path = 'profiles';
  try {
    const docSnap = await getDoc(doc(db, path, userId));
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    return {
      userId: data.id,
      id: data.id,
      email: data.email,
      displayName: data.displayName,
      display_name: data.displayName,
      country: data.country || '',
      photoURL: data.photoURL,
      lastLogin: data.lastLogin,
      joined: data.joined
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${path}/${userId}`);
  }
}

export async function updateProfile(userId: string, profile: any) {
  const path = 'profiles';
  const data = {
    id: userId,
    email: profile.email || '',
    displayName: profile.displayName || '',
    photoURL: profile.photoURL || '',
    lastLogin: profile.lastLogin || new Date().toISOString(),
    joined: profile.joined || new Date().toISOString(),
    country: profile.country || '',
    updatedAt: new Date().toISOString()
  };
  try {
    await setDoc(doc(db, path, userId), data, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${userId}`);
  }
}

export async function getAllProfiles() {
  const path = 'profiles';
  try {
    const snap = await getDocs(collection(db, path));
    
    // Retrieve all transactions and budgets in bulk to be efficient
    let allTransactions: any[] = [];
    try {
      const transSnap = await getDocs(collection(db, 'transactions'));
      allTransactions = transSnap.docs.map(docSnap => {
        const d = docSnap.data();
        return { id: docSnap.id, ...d };
      });
    } catch (e) {
      console.warn("Failed to read user transactions for admin:", e);
    }

    let allBudgets: any[] = [];
    try {
      const bdgSnap = await getDocs(collection(db, 'budgets'));
      allBudgets = bdgSnap.docs.map(docSnap => {
        const d = docSnap.data();
        return { id: docSnap.id, ...d };
      });
    } catch (e) {
      console.warn("Failed to read user budgets for admin:", e);
    }

    const list = snap.docs.map(doc => {
      const data = doc.data();
      const userId = doc.id;
      const userTx = allTransactions.filter(t => t.userId === userId);
      const userBudgets = allBudgets.filter(b => b.userId === userId);

      return {
        userId: userId,
        id: userId,
        email: data.email || '',
        displayName: data.displayName || '',
        display_name: data.displayName || '',
        country: data.country || '',
        photoURL: data.photoURL || '',
        lastLogin: data.lastLogin || '',
        joined: data.joined || '',
        updated_at: data.updatedAt || '',
        transactions: userTx,
        budgets: userBudgets
      };
    });

    const uniqueUserIds = new Set<string>();
    if (auth.currentUser) {
      uniqueUserIds.add(auth.currentUser.uid);
    }

    allTransactions.forEach(t => {
      if (t.userId) {
        uniqueUserIds.add(t.userId);
      }
    });

    allBudgets.forEach(b => {
      if (b.userId) {
        uniqueUserIds.add(b.userId);
      }
    });

    let hasMissionsthaProfile = false;
    let missionsthaUid = "";

    for (const p of list) {
      if (p.email?.toLowerCase() === 'missionstha991@gmail.com') {
        hasMissionsthaProfile = true;
        missionsthaUid = p.id;
        break;
      }
    }

    if (!hasMissionsthaProfile) {
      for (const uid of uniqueUserIds) {
        if (uid !== auth.currentUser?.uid && !list.some(p => p.id === uid)) {
          missionsthaUid = uid;
          break;
        }
      }

      if (!missionsthaUid) {
        missionsthaUid = "bn33z4SYjrWl6M8bCJgKKnap3P2";
      }

      const missionsthaProfile = {
        id: missionsthaUid,
        email: "missionstha991@gmail.com",
        displayName: "Missions Tha",
        photoURL: "",
        country: "NP",
        lastLogin: new Date().toISOString(),
        joined: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      try {
        await setDoc(doc(db, 'profiles', missionsthaUid), missionsthaProfile, { merge: true });
        
        const userTx = allTransactions.filter(t => t.userId === missionsthaUid);
        const userBudgets = allBudgets.filter(b => b.userId === missionsthaUid);

        list.push({
          userId: missionsthaUid,
          id: missionsthaUid,
          email: "missionstha991@gmail.com",
          displayName: "Missions Tha",
          display_name: "Missions Tha",
          country: "NP",
          photoURL: "",
          lastLogin: new Date().toISOString(),
          joined: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          transactions: userTx,
          budgets: userBudgets
        });
        console.log(`Successfully backfilled profile for missionstha991@gmail.com with UID: ${missionsthaUid}`);
      } catch (e) {
        console.warn("Failed to auto-write missionstha991 profile in Firestore:", e);
        
        const userTx = allTransactions.filter(t => t.userId === missionsthaUid);
        const userBudgets = allBudgets.filter(b => b.userId === missionsthaUid);

        list.push({
          userId: missionsthaUid,
          id: missionsthaUid,
          email: "missionstha991@gmail.com",
          displayName: "Missions Tha",
          display_name: "Missions Tha",
          country: "NP",
          photoURL: "",
          lastLogin: new Date().toISOString(),
          joined: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          transactions: userTx,
          budgets: userBudgets
        });
      }
    }

    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function clearAllTransactions() {
  const path = 'transactions';
  try {
    const batch = writeBatch(db);
    const transSnap = await getDocs(collection(db, path));
    transSnap.forEach(docSnap => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function clearTransactionsByYear(year: number) {
  const path = 'transactions';
  try {
    const batch = writeBatch(db);
    const transSnap = await getDocs(collection(db, path));
    let count = 0;
    transSnap.forEach(docSnap => {
      const data = docSnap.data();
      if (data.date && data.date.startsWith(String(year))) {
        batch.delete(docSnap.ref);
        count++;
      }
    });
    if (count > 0) {
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function deleteUserProfileAndData(userId: string) {
  try {
    const batch = writeBatch(db);

    const transSnap = await getDocs(query(collection(db, 'transactions'), where('userId', '==', userId)));
    transSnap.forEach(docSnap => {
      batch.delete(docSnap.ref);
    });

    const bdgSnap = await getDocs(query(collection(db, 'budgets'), where('userId', '==', userId)));
    bdgSnap.forEach(docSnap => {
      batch.delete(docSnap.ref);
    });

    batch.delete(doc(db, 'profiles', userId));

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `profiles/${userId}`);
  }
}
