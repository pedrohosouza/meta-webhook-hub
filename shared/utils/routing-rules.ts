export const RULE_OPERATORS = [
  'exists', 'notExists', 'equals', 'notEquals', 'contains', 'notContains',
  'startsWith', 'endsWith', 'in', 'regex', 'gt', 'gte', 'lt', 'lte', 'isEmpty', 'isNotEmpty'
] as const

export type RuleOperator = typeof RULE_OPERATORS[number]

export interface RuleCondition {
  path: string
  operator: RuleOperator
  value?: string
}

export type MatchMode = 'ALL' | 'ANY'

export interface RuleFilter {
  matchMode: MatchMode
  conditions: RuleCondition[]
}

export interface RoutableEndpoint {
  id: string
  rule: RuleFilter | null
}

const MAX_REGEX_LENGTH = 200
const NO_VALUE_OPERATORS: readonly RuleOperator[] = ['exists', 'notExists', 'isEmpty', 'isNotEmpty']
const NEGATIVE_OPERATORS: readonly RuleOperator[] = ['notExists', 'notEquals', 'notContains']

export function operatorNeedsValue(operator: RuleOperator) {
  return !NO_VALUE_OPERATORS.includes(operator)
}

/** `entry[*].changes[*].value.statuses[*].status` → ['entry', '*', 'changes', '*', ...]. `null` se inválido. */
export function parsePath(path: string): string[] | null {
  const trimmed = path.trim()
  if (!trimmed) return null
  const segments: string[] = []
  for (const part of trimmed.split('.')) {
    const match = /^([^.[\]]+)((?:\[(?:\*|\d+)\])*)$/.exec(part)
    if (!match) return null
    segments.push(match[1]!)
    for (const index of match[2]!.matchAll(/\[(\*|\d+)\]/g)) segments.push(index[1]!)
  }
  return segments
}

/** Monta o caminho a partir de chaves e índices; todo índice numérico vira `[*]`. */
export function formatPath(keys: Array<string | number>): string {
  return keys.reduce<string>((path, key) => {
    if (typeof key === 'number') return `${path}[*]`
    return path ? `${path}.${key}` : key
  }, '')
}

/** Todos os valores alcançados pelo caminho. Arrays são percorridos por `[*]` ou por índice numérico. */
export function resolvePath(payload: unknown, path: string): unknown[] {
  const segments = parsePath(path)
  if (!segments) return []
  let current: unknown[] = [payload]
  for (const segment of segments) {
    const next: unknown[] = []
    for (const value of current) {
      if (Array.isArray(value)) {
        if (segment === '*') next.push(...value)
        else if (/^\d+$/.test(segment) && Number(segment) < value.length) next.push(value[Number(segment)])
      } else if (typeof value === 'object' && value !== null && segment !== '*' && Object.hasOwn(value, segment)) {
        next.push((value as Record<string, unknown>)[segment])
      }
    }
    current = next
    if (!current.length) return []
  }
  return current.filter(value => value !== undefined)
}

function isEmptyValue(value: unknown) {
  return value === null || value === ''
    || (Array.isArray(value) && value.length === 0)
    || (typeof value === 'object' && value !== null && !Array.isArray(value) && Object.keys(value).length === 0)
}

function asText(value: unknown) {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return null
}

function matchesValue(operator: RuleOperator, value: unknown, expected: string) {
  const text = asText(value)
  switch (operator) {
    case 'equals':
    case 'notEquals':
      return text === expected
    case 'contains':
    case 'notContains':
      return text !== null && text.includes(expected)
    case 'startsWith':
      return text !== null && text.startsWith(expected)
    case 'endsWith':
      return text !== null && text.endsWith(expected)
    case 'in':
      return text !== null && expected.split(',').map(item => item.trim()).includes(text)
    case 'regex':
      try {
        return text !== null && new RegExp(expected).test(text)
      } catch {
        return false
      }
    case 'gt':
    case 'gte':
    case 'lt':
    case 'lte': {
      const left = Number(text)
      const right = Number(expected)
      if (text === null || text.trim() === '' || !Number.isFinite(left) || !Number.isFinite(right)) return false
      return operator === 'gt' ? left > right : operator === 'gte' ? left >= right : operator === 'lt' ? left < right : left <= right
    }
    default:
      return false
  }
}

/**
 * Operadores positivos casam se ALGUM valor do caminho satisfaz a condição;
 * `not*` casam se NENHUM valor a satisfaz (e, em `notExists`, se o caminho não existe).
 */
export function evaluateCondition(condition: RuleCondition, payload: unknown): boolean {
  const values = resolvePath(payload, condition.path)
  const { operator } = condition
  if (operator === 'exists') return values.length > 0
  if (operator === 'notExists') return values.length === 0
  if (operator === 'isEmpty') return values.some(isEmptyValue)
  if (operator === 'isNotEmpty') return values.some(value => !isEmptyValue(value))

  const expected = condition.value ?? ''
  const anyMatch = values.some(value => matchesValue(operator, value, expected))
  return NEGATIVE_OPERATORS.includes(operator) ? !anyMatch : anyMatch
}

/** Sem condições nada casa; quem decide se isso significa "receber tudo" é `endpointAccepts`. */
export function evaluateRule(rule: RuleFilter, payload: unknown): boolean {
  if (!rule.conditions.length) return false
  const check = (condition: RuleCondition) => evaluateCondition(condition, payload)
  return rule.matchMode === 'ANY' ? rule.conditions.some(check) : rule.conditions.every(check)
}

/** Destino sem regra, ou com regra sem condições, recebe tudo, como antes dos filtros existirem. */
export function endpointAccepts(rule: RuleFilter | null, payload: unknown): boolean {
  return !rule || !rule.conditions.length || evaluateRule(rule, payload)
}

export function selectEndpoints(endpoints: RoutableEndpoint[], payload: unknown): string[] {
  return endpoints.filter(endpoint => endpointAccepts(endpoint.rule, payload)).map(endpoint => endpoint.id)
}

/** Valida condições vindas da API. Devolve a mensagem de erro ou `null`. */
export function validateConditions(input: unknown): { conditions: RuleCondition[] } | { error: string } {
  if (!Array.isArray(input)) return { error: 'Condições devem ser uma lista' }
  if (input.length > 50) return { error: 'Máximo de 50 condições por regra' }

  const conditions: RuleCondition[] = []
  for (const [index, item] of input.entries()) {
    const label = `Condição ${index + 1}`
    if (typeof item !== 'object' || item === null) return { error: `${label} inválida` }
    const { path, operator, value } = item as Record<string, unknown>
    if (typeof path !== 'string' || !parsePath(path)) return { error: `${label}: caminho inválido` }
    if (typeof operator !== 'string' || !(RULE_OPERATORS as readonly string[]).includes(operator)) {
      return { error: `${label}: operador inválido` }
    }
    const op = operator as RuleOperator
    let text: string | undefined
    if (operatorNeedsValue(op)) {
      if (typeof value !== 'string') return { error: `${label}: informe o valor` }
      text = value
      if (['gt', 'gte', 'lt', 'lte'].includes(op) && !Number.isFinite(Number(text))) {
        return { error: `${label}: o valor deve ser numérico` }
      }
      if (op === 'regex') {
        if (text.length > MAX_REGEX_LENGTH) return { error: `${label}: regex muito longa` }
        try {
          new RegExp(text)
        } catch {
          return { error: `${label}: regex inválida` }
        }
      }
    }
    conditions.push({ path: path.trim(), operator: op, ...(text !== undefined ? { value: text } : {}) })
  }
  return { conditions }
}
