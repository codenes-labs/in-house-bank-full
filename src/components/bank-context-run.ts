import type { BankRepository, BankSnapshot } from '../repositories/bank-repository';
import { createMemoryBankRepository } from '../repositories/memory-bank-repository';

/** Mesmo fluxo do BankProvider após mutação: grava e recarrega o snapshot. */
export async function runBankMutation(
  snapshot: BankSnapshot,
  isDemo: boolean,
  httpRepository: BankRepository,
  work: (repo: BankRepository) => Promise<void>,
): Promise<BankSnapshot> {
  const writer = isDemo ? createMemoryBankRepository(snapshot) : httpRepository;
  await work(writer);
  return writer.load();
}