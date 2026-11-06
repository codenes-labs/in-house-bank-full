/** Detected Pix key kinds (RN-09). */
export const PixKeyType = {
  Cpf: 'CPF',
  Cnpj: 'CNPJ',
  Email: 'EMAIL',
  Phone: 'PHONE',
  Random: 'RANDOM',
} as const;

export type PixKeyType = (typeof PixKeyType)[keyof typeof PixKeyType];
