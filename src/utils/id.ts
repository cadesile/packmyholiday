import { randomUUID } from 'expo-crypto';

export type IdGenerator = () => string;

export const defaultIdGenerator: IdGenerator = () => randomUUID();
