import type { Prisma } from '../../generated/prisma/client'

function matchModeOf(value: unknown): MatchMode {
  if (value !== 'ALL' && value !== 'ANY') throw createError({ statusCode: 422, statusMessage: 'Modo de combinação inválido' })
  return value
}

function conditionsOf(value: unknown) {
  const result = validateConditions(value)
  if ('error' in result) throw createError({ statusCode: 422, statusMessage: result.error })
  return result.conditions as unknown as Prisma.InputJsonValue
}

/** Campos de uma regra vindos do corpo da requisição. Em criação todos têm padrão; em edição só os enviados entram. */
export function parseRuleFields(body: unknown, { partial }: { partial: boolean }) {
  const { name, matchMode, conditions } = (body ?? {}) as Record<string, unknown>
  return {
    ...(!partial || name !== undefined ? { name: requiredString(name, 'Nome') } : {}),
    ...(!partial || matchMode !== undefined ? { matchMode: matchModeOf(matchMode ?? 'ALL') } : {}),
    ...(!partial || conditions !== undefined ? { conditions: conditionsOf(conditions ?? []) } : {})
  }
}

type RuleDb = Pick<Prisma.TransactionClient, 'routingRule'>

/**
 * Resolve a regra do destino a partir do corpo: `ruleId` (regra do mesmo app), `null` (receber tudo),
 * `newRule` (cria a regra agora) ou nenhum dos dois (sem mudança). Chame dentro da transação que grava
 * o destino, para que uma regra nova não sobre se o destino falhar.
 */
export async function resolveEndpointRule(db: RuleDb, appId: string, body: unknown): Promise<{ ruleId?: string | null }> {
  const { ruleId, newRule } = (body ?? {}) as Record<string, unknown>
  if (newRule !== undefined && ruleId !== undefined) {
    throw createError({ statusCode: 422, statusMessage: 'Informe ruleId ou newRule, não os dois' })
  }
  if (newRule !== undefined) {
    const created = await db.routingRule.create({ data: { appId, ...parseRuleFields(newRule, { partial: false }) } as Prisma.RoutingRuleUncheckedCreateInput, select: { id: true } })
    return { ruleId: created.id }
  }
  if (ruleId === undefined || ruleId === null) return ruleId === null ? { ruleId: null } : {}
  if (typeof ruleId !== 'string' || !await db.routingRule.findFirst({ where: { id: ruleId, appId }, select: { id: true } })) {
    throw createError({ statusCode: 422, statusMessage: 'Regra não pertence a este app' })
  }
  return { ruleId }
}

/** Todos os destinos informados precisam existir e pertencer ao app. */
export async function validEndpointIds(appId: string, value: unknown) {
  if (!Array.isArray(value) || value.some(id => typeof id !== 'string')) {
    throw createError({ statusCode: 422, statusMessage: 'Destinos inválidos' })
  }
  const ids = [...new Set(value as string[])]
  if (await prisma.endpoint.count({ where: { appId, id: { in: ids } } }) !== ids.length) {
    throw createError({ statusCode: 422, statusMessage: 'Destino não pertence a este app' })
  }
  return ids
}
