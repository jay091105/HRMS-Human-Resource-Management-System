import { Document } from 'mongoose';

export const toPlainObject = <T>(doc: Document | null): T | null => {
  if (!doc) return null;
  return doc.toObject() as T;
};

export const toPlainObjectArray = <T>(docs: Document[]): T[] => {
  return docs.map(doc => doc.toObject() as T);
};

