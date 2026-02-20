import { getDB } from '../database';
import type { Persona } from '@/types/conversation';
import { nanoid } from 'nanoid';

export async function createPersona(
  partial: Omit<Persona, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Persona> {
  const db = getDB();
  const now = Date.now();
  const persona: Persona = {
    id: nanoid(),
    name: partial.name,
    systemPrompt: partial.systemPrompt,
    isDefault: partial.isDefault,
    createdAt: now,
    updatedAt: now,
  };
  await db.personas.add(persona);
  return persona;
}

export async function getPersona(id: string): Promise<Persona | undefined> {
  const db = getDB();
  return db.personas.get(id);
}

export async function listPersonas(): Promise<Persona[]> {
  const db = getDB();
  return db.personas.orderBy('createdAt').toArray();
}

export async function updatePersona(id: string, updates: Partial<Persona>): Promise<void> {
  const db = getDB();
  await db.personas.update(id, { ...updates, updatedAt: Date.now() });
}

export async function deletePersona(id: string): Promise<void> {
  const db = getDB();
  await db.personas.delete(id);
}

export async function getDefaultPersona(): Promise<Persona | undefined> {
  const db = getDB();
  return db.personas.where('isDefault').equals(1).first();
}

export async function setDefaultPersona(id: string): Promise<void> {
  const db = getDB();
  await db.transaction('rw', db.personas, async () => {
    // Clear existing default
    const current = await db.personas.where('isDefault').equals(1).first();
    if (current) {
      await db.personas.update(current.id, { isDefault: false });
    }
    await db.personas.update(id, { isDefault: true });
  });
}
