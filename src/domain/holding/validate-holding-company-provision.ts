export type HoldingCompanyProvisionInput = {
  companyName: string;
  email: string;
  password: string;
  city: string;
};

export type HoldingCompanyProvisionValidation =
  | { ok: true; data: HoldingCompanyProvisionInput }
  | { error: string };

export function validateHoldingCompanyProvision(body: {
  companyName?: string;
  email?: string;
  password?: string;
  city?: string;
}): HoldingCompanyProvisionValidation {
  const companyName = String(body.companyName ?? '').trim();
  const email = String(body.email ?? '').trim();
  const password = String(body.password ?? '');
  const city = String(body.city ?? '').trim();

  if (companyName.length < 2) {
    return { error: 'Informe o nome da empresa (mínimo 2 caracteres).' };
  }
  if (!email.includes('@')) {
    return { error: 'Informe um e-mail válido.' };
  }
  if (password.length < 6) {
    return { error: 'A senha precisa ter pelo menos 6 caracteres.' };
  }

  return {
    ok: true,
    data: { companyName, email, password, city },
  };
}