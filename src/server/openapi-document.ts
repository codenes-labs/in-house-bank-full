export const OPENAPI_VERSION = '3.0.3';

export function buildOpenApiDocument(serverUrl = '/'): Record<string, unknown> {
  const bearer = [{ bearerAuth: [] as string[] }];
  return {
    openapi: OPENAPI_VERSION,
    info: {
      title: 'In House Bank API',
      version: '1.0.0',
      description:
        'API HTTP do In House Bank. Rotas de banco exigem JWT Bearer (resposta de `POST /api/auth/sign-in`). O app não movimenta dinheiro.',
    },
    servers: [{ url: serverUrl }],
    tags: [
      { name: 'Sistema', description: 'Saúde e documentação' },
      { name: 'Auth', description: 'Sessão e credenciais' },
      { name: 'Bank', description: 'Dados da conta autenticada' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token retornado em `accessToken` no sign-in.',
        },
      },
      schemas: {
        ErrorBody: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
        OkBody: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
          },
        },
      },
    },
    paths: {
      '/api/health': {
        get: {
          tags: ['Sistema'],
          summary: 'Verifica configuração do servidor',
          responses: {
            '200': {
              description: 'Status de database e JWT',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      configured: { type: 'boolean' },
                      database: { type: 'boolean' },
                      jwt: { type: 'boolean' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/openapi.json': {
        get: {
          tags: ['Sistema'],
          summary: 'Documento OpenAPI desta API',
          responses: {
            '200': {
              description: 'OpenAPI 3.0',
              content: { 'application/json': { schema: { type: 'object' } } },
            },
          },
        },
      },
      '/api/auth/session': {
        get: {
          tags: ['Auth'],
          summary: 'Sessão atual',
          security: bearer,
          responses: {
            '200': {
              description: 'Usuário ou null',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      configured: { type: 'boolean' },
                      user: { type: 'object', nullable: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/auth/sign-in': {
        post: {
          tags: ['Auth'],
          summary: 'Entrar',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 6 },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Token e usuário',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      user: { type: 'object' },
                      accessToken: { type: 'string' },
                    },
                  },
                },
              },
            },
            '400': { description: 'Credenciais inválidas', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorBody' } } } },
          },
        },
      },
      '/api/auth/sign-out': {
        post: {
          tags: ['Auth'],
          summary: 'Sair (stateless; descarta token no cliente)',
          responses: {
            '200': { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/OkBody' } } } },
          },
        },
      },
      '/api/auth/recover': {
        post: {
          tags: ['Auth'],
          summary: 'Recuperar senha',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: { type: 'string' },
                    newPassword: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { '200': { description: 'OK ou silencioso se e-mail não existe' } },
        },
      },
      '/api/auth/password': {
        post: {
          tags: ['Auth'],
          summary: 'Alterar senha (logado)',
          security: bearer,
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { newPassword: { type: 'string' } },
                },
              },
            },
          },
          responses: { '200': { description: 'Novo token' }, '401': { description: 'Não autorizado' } },
        },
      },
      '/api/auth/sign-up': {
        post: {
          tags: ['Auth'],
          summary: 'Cadastro (fechado)',
          responses: { '403': { description: 'Cadastro fechado' } },
        },
      },
      '/api/bank': {
        get: {
          tags: ['Bank'],
          summary: 'Carregar snapshot completo',
          security: bearer,
          responses: { '200': { description: 'BankSnapshot', content: { 'application/json': { schema: { type: 'object' } } } } },
        },
      },
      '/api/bank/settings': {
        put: {
          tags: ['Bank'],
          summary: 'Salvar settings',
          security: bearer,
          requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
          responses: { '200': { content: { 'application/json': { schema: { $ref: '#/components/schemas/OkBody' } } } } },
        },
      },
      '/api/bank/plans': {
        put: {
          tags: ['Bank'],
          summary: 'Salvar plano de parcelamento',
          security: bearer,
          requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
          responses: { '200': { content: { 'application/json': { schema: { $ref: '#/components/schemas/OkBody' } } } } },
        },
      },
      '/api/bank/plans/{planId}': {
        delete: {
          tags: ['Bank'],
          summary: 'Excluir plano',
          security: bearer,
          parameters: [{ name: 'planId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { '200': { content: { 'application/json': { schema: { $ref: '#/components/schemas/OkBody' } } } } },
        },
      },
      '/api/bank/installments': {
        put: {
          tags: ['Bank'],
          summary: 'Salvar parcela',
          security: bearer,
          requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
          responses: { '200': { content: { 'application/json': { schema: { $ref: '#/components/schemas/OkBody' } } } } },
        },
      },
      '/api/bank/installments/{installmentId}': {
        delete: {
          tags: ['Bank'],
          summary: 'Excluir parcela',
          security: bearer,
          parameters: [{ name: 'installmentId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { '200': { content: { 'application/json': { schema: { $ref: '#/components/schemas/OkBody' } } } } },
        },
      },
      '/api/bank/cash-boxes': {
        put: {
          tags: ['Bank'],
          summary: 'Salvar caixinha',
          security: bearer,
          requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
          responses: { '200': { content: { 'application/json': { schema: { $ref: '#/components/schemas/OkBody' } } } } },
        },
      },
      '/api/bank/cash-boxes/{cashBoxId}': {
        delete: {
          tags: ['Bank'],
          summary: 'Excluir caixinha',
          security: bearer,
          parameters: [{ name: 'cashBoxId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { '200': { content: { 'application/json': { schema: { $ref: '#/components/schemas/OkBody' } } } } },
        },
      },
      '/api/bank/movements': {
        put: {
          tags: ['Bank'],
          summary: 'Salvar movimento de caixinha',
          security: bearer,
          requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
          responses: { '200': { content: { 'application/json': { schema: { $ref: '#/components/schemas/OkBody' } } } } },
        },
      },
      '/api/bank/movements/{movementId}': {
        delete: {
          tags: ['Bank'],
          summary: 'Excluir movimento',
          security: bearer,
          parameters: [{ name: 'movementId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { '200': { content: { 'application/json': { schema: { $ref: '#/components/schemas/OkBody' } } } } },
        },
      },
      '/api/bank/free-balance-deposits': {
        put: {
          tags: ['Bank'],
          summary: 'Registrar entrada no saldo livre',
          security: bearer,
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    deposit: { type: 'object' },
                    settings: { type: 'object' },
                  },
                },
              },
            },
          },
          responses: { '200': { content: { 'application/json': { schema: { $ref: '#/components/schemas/OkBody' } } } } },
        },
      },
      '/api/bank/free-balance-withdrawals': {
        put: {
          tags: ['Bank'],
          summary: 'Registrar resgate do saldo livre',
          security: bearer,
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    withdrawal: { type: 'object' },
                    settings: { type: 'object' },
                  },
                },
              },
            },
          },
          responses: { '200': { content: { 'application/json': { schema: { $ref: '#/components/schemas/OkBody' } } } } },
        },
      },
      '/api/bank/import': {
        post: {
          tags: ['Bank'],
          summary: 'Importar backup JSON',
          security: bearer,
          requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
          responses: { '200': { content: { 'application/json': { schema: { $ref: '#/components/schemas/OkBody' } } } } },
        },
      },
    },
  };
}
