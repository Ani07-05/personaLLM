import Dexie, { type EntityTable } from 'dexie';
import type { Conversation, Branch, Persona, FileAttachment, PersistedMessage } from '@/types/conversation';

class PersonaLLMDB extends Dexie {
  conversations!: EntityTable<Conversation, 'id'>;
  messages!: EntityTable<PersistedMessage, 'id'>;
  branches!: EntityTable<Branch, 'id'>;
  personas!: EntityTable<Persona, 'id'>;
  files!: EntityTable<FileAttachment, 'id'>;

  constructor() {
    super('personaLLM');
    this.version(1).stores({
      conversations: 'id, updatedAt, pinnedAt, archivedAt',
      messages: 'id, conversationId, branchId, createdAt',
      branches: 'id, conversationId, parentBranchId',
      personas: 'id, isDefault',
      files: 'id, conversationId, messageId',
    });
  }
}

let db: PersonaLLMDB;

function getDB(): PersonaLLMDB {
  if (typeof window === 'undefined') {
    throw new Error('Dexie DB can only be used in the browser');
  }
  if (!db) {
    db = new PersonaLLMDB();
  }
  return db;
}

export { getDB };
export type { PersonaLLMDB };
