import {Firestore, getDoc, doc, DocumentData} from "firebase/firestore";
import {firestore} from "./firebase";

/**
 * Queries for a document in a Firestore collection by ID.
 *
 * @param db The Firestore database instance.
 * @param collectionName The name of the collection.
 * @param docId The ID of the document to retrieve.
 * @returns A promise that resolves with the document data or rejects with an error.
 */
export async function queryDocumentById(
  db: Firestore,
  collectionName: string,
  docId: string
): Promise<DocumentData | Error> {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnapshot = await getDoc(docRef);

    if (docSnapshot.exists()) {
      return docSnapshot.data() as DocumentData;
    } else {
      throw new Error("Document not found");
    }
  } catch (error) {
    return new Error(
      `Failed to retrieve document: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
export async function queryMainDatabaseById(
  collectionName: string,
  docId: string
): Promise<DocumentData | Error> {
  try {
    const docRef = doc(firestore, collectionName, docId);
    const docSnapshot = await getDoc(docRef);

    if (docSnapshot.exists()) {
      return docSnapshot.data() as DocumentData;
    } else {
      const error = new Error("Document not found");
      (error as any).code = 401;
      throw error;
    }
  } catch (error) {
    return new Error(
      `Failed to retrieve document: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
