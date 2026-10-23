export const operatorLabels: Record<RuleOperator, string> = {
  exists: 'existe',
  notExists: 'não existe',
  equals: 'é igual a',
  notEquals: 'é diferente de',
  contains: 'contém',
  notContains: 'não contém',
  startsWith: 'começa com',
  endsWith: 'termina com',
  in: 'está em (lista)',
  regex: 'casa com regex',
  gt: 'maior que',
  gte: 'maior ou igual a',
  lt: 'menor que',
  lte: 'menor ou igual a',
  isEmpty: 'está vazio',
  isNotEmpty: 'não está vazio'
}

export const operatorItems = RULE_OPERATORS.map(value => ({ value, label: operatorLabels[value] }))

export function describeCondition(condition: RuleCondition) {
  const value = operatorNeedsValue(condition.operator) ? ` “${condition.value ?? ''}”` : ''
  return `${condition.path} ${operatorLabels[condition.operator]}${value}`
}
