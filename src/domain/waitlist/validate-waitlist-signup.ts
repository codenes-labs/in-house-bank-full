import { isWaitlistInterestId } from './waitlist-interests';

export const WAITLIST_MESSAGE_MAX_LENGTH = 500;
export const WAITLIST_NAME_MIN_LENGTH = 2;
export const WAITLIST_NAME_MAX_LENGTH = 120;

export type WaitlistSignupInput = {
  name: string;
  email: string;
  interest: string;
  message?: string;
  consentGiven: boolean;
  source?: string;
};

export type ValidatedWaitlistSignup = {
  name: string;
  email: string;
  interest: string;
  message: string | null;
  consentGiven: true;
  source: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateWaitlistSignup(input: WaitlistSignupInput):
  | { ok: true; value: ValidatedWaitlistSignup }
  | { ok: false; error: string } {
  const name = input.name.trim();
  if (name.length < WAITLIST_NAME_MIN_LENGTH || name.length > WAITLIST_NAME_MAX_LENGTH) {
    return { ok: false, error: 'Informe seu nome (entre 2 e 120 caracteres).' };
  }

  const email = input.email.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(email)) {
    return { ok: false, error: 'Informe um e-mail válido.' };
  }

  const interest = input.interest.trim();
  if (!isWaitlistInterestId(interest)) {
    return { ok: false, error: 'Selecione o que você mais busca.' };
  }

  const rawMessage = input.message?.trim() ?? '';
  if (rawMessage.length > WAITLIST_MESSAGE_MAX_LENGTH) {
    return { ok: false, error: `A mensagem pode ter no máximo ${WAITLIST_MESSAGE_MAX_LENGTH} caracteres.` };
  }

  if (!input.consentGiven) {
    return { ok: false, error: 'Marque que autoriza o contato sobre o In House Bank.' };
  }

  const source = (input.source?.trim() || 'direct').slice(0, 40);

  return {
    ok: true,
    value: {
      name,
      email,
      interest,
      message: rawMessage.length > 0 ? rawMessage : null,
      consentGiven: true,
      source,
    },
  };
}