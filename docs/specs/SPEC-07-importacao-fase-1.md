# SPEC-07 Importação da fase 1

Status: concluída.

Importar um backup `version: 1` substitui os dados da conta logada, gravando cada registro. Uso normal continua por registro.

Aceite: version diferente ou JSON inválido é recusado; depois da importação a conta só contém o conteúdo do arquivo.
