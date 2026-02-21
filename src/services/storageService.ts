import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, getDocs, query, where, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { storage, db } from '../lib/firebase';

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface DocumentData {
    id?: string;
    userId: string;
    fileUrl: string;
    fileName: string;
    fileType: string;
    uploadDate: string;
    category: 'prescription' | 'report' | 'scan' | 'other';
    ocrText?: string;
    ocrConfidence?: number;
    processed: boolean;
    metadata?: Record<string, unknown>;
}

// ─── Storage Service ────────────────────────────────────────────────────────

/**
 * Upload a file to Firebase Cloud Storage.
 */
export async function uploadFile(file: File, userId: string): Promise<string> {
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `prescriptions/${userId}/${timestamp}_${safeName}`;
    const storageRef = ref(storage, path);

    await uploadBytes(storageRef, file, {
        contentType: file.type,
        customMetadata: {
            uploadedBy: userId,
            originalName: file.name,
        },
    });

    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
}

// ─── Data Management ────────────────────────────────────────────────────────

/**
 * Get all processed documents for a user from Firestore.
 */
export async function getUserDocuments(userId: string): Promise<DocumentData[]> {
    try {
        const q = query(
            collection(db, 'documents'),
            where('userId', '==', userId),
            orderBy('uploadDate', 'desc')
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as DocumentData));
    } catch (error) {
        console.error('Error fetching documents:', error);
        return [];
    }
}

/**
 * Delete a file from Storage and its record from Firestore.
 */
export async function deleteDocument(docId: string, fileUrl: string): Promise<void> {
    try {
        // 1. Delete from Firestore
        await deleteDoc(doc(db, 'documents', docId));

        // 2. Delete from Storage
        const storageRef = ref(storage, fileUrl);
        await deleteObject(storageRef);
    } catch (error) {
        console.warn('Failed to delete document:', error);
        throw error;
    }
}

/**
 * Save document metadata to Firestore.
 */
export async function saveDocumentMetadata(data: DocumentData): Promise<string> {
    try {
        const { addDoc, collection } = await import('firebase/firestore');
        const docRef = await addDoc(collection(db, 'documents'), data);
        return docRef.id;
    } catch (error) {
        console.error('Failed to save document metadata:', error);
        throw error;
    }
}

/**
 * Update document metadata in Firestore.
 */
export async function updateDocument(docId: string, data: Partial<DocumentData>): Promise<void> {
    try {
        const docRef = doc(db, 'documents', docId);
        await import('firebase/firestore').then(({ updateDoc }) => updateDoc(docRef, data));
    } catch (error) {
        console.error('Failed to update document:', error);
        throw error;
    }
}

/**
 * Delete a file from Firebase Cloud Storage by its download URL.
 * (Backward compatibility)
 */
export async function deleteFile(downloadURL: string): Promise<void> {
    try {
        const storageRef = ref(storage, downloadURL);
        await deleteObject(storageRef);
    } catch (error) {
        console.warn('Failed to delete file from storage:', error);
    }
}
