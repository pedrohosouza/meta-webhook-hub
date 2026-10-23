import assert from 'node:assert/strict'
import test from 'node:test'
import {
  evaluateCondition,
  endpointAccepts,
  evaluateRule,
  formatPath,
  parsePath,
  resolvePath,
  selectEndpoints,
  validateConditions
} from '../shared/utils/routing-rules.ts'

const whatsappMessage = {
  object: 'whatsapp_business_account',
  entry: [{
    id: 'waba-1',
    changes: [{
      field: 'messages',
      value: {
        metadata: { phone_number_id: '111' },
        contacts: [{ wa_id: '5511999999999', profile: { name: 'Ana' } }],
        messages: [{ id: 'wamid.1', from: '5511999999999', type: 'text', text: { body: 'oi' } }]
      }
    }]
  }]
}

const whatsappStatus = {
  object: 'whatsapp_business_account',
  entry: [{
    changes: [{
      field: 'messages',
      value: {
        metadata: { phone_number_id: '111' },
        statuses: [{ id: 'wamid.1', status: 'read', recipient_id: '5511999999999' }, { id: 'wamid.2', status: 'sent' }]
      }
    }]
  }]
}

const instagram = {
  object: 'instagram',
  entry: [{ id: 'ig-1', messaging: [{ sender: { id: 's1' }, message: { mid: 'm1', text: 'olá' } }] }]
}

const lead = {
  object: 'page',
  entry: [{ id: 'page-1', changes: [{ field: 'leadgen', value: { leadgen_id: '999', form_id: '42' } }] }]
}

test('parsePath e formatPath convertem caminhos com arrays', () => {
  assert.deepEqual(parsePath('entry[*].changes[*].value.statuses[*].status'), ['entry', '*', 'changes', '*', 'value', 'statuses', '*', 'status'])
  assert.deepEqual(parsePath('entry[0].id'), ['entry', '0', 'id'])
  assert.equal(parsePath(''), null)
  assert.equal(parsePath('entry..id'), null)
  assert.equal(parsePath('entry[abc]'), null)
  assert.equal(formatPath(['entry', 0, 'changes', 2, 'field']), 'entry[*].changes[*].field')
})

test('resolvePath percorre arrays aninhados e devolve vazio para caminhos inexistentes', () => {
  assert.deepEqual(resolvePath(whatsappStatus, 'entry[*].changes[*].value.statuses[*].status'), ['read', 'sent'])
  assert.deepEqual(resolvePath(whatsappStatus, 'entry[0].changes[0].value.statuses[1].id'), ['wamid.2'])
  assert.deepEqual(resolvePath(whatsappMessage, 'entry[*].changes[*].value.statuses[*].status'), [])
  assert.deepEqual(resolvePath(whatsappMessage, 'object'), ['whatsapp_business_account'])
  assert.deepEqual(resolvePath(whatsappMessage, 'entry[5].id'), [])
})

test('operadores de existência e vazio', () => {
  const statusPath = 'entry[*].changes[*].value.statuses'
  assert.equal(evaluateCondition({ path: statusPath, operator: 'exists' }, whatsappStatus), true)
  assert.equal(evaluateCondition({ path: statusPath, operator: 'exists' }, whatsappMessage), false)
  assert.equal(evaluateCondition({ path: statusPath, operator: 'notExists' }, whatsappMessage), true)
  assert.equal(evaluateCondition({ path: 'a', operator: 'isEmpty' }, { a: '' }), true)
  assert.equal(evaluateCondition({ path: 'a', operator: 'isEmpty' }, { a: [] }), true)
  assert.equal(evaluateCondition({ path: 'a', operator: 'isNotEmpty' }, { a: 'x' }), true)
  assert.equal(evaluateCondition({ path: 'a', operator: 'isNotEmpty' }, { b: 1 }), false)
})

test('operadores de texto seguem "algum valor" nos positivos e "nenhum valor" nos negativos', () => {
  const statuses = 'entry[*].changes[*].value.statuses[*].status'
  assert.equal(evaluateCondition({ path: statuses, operator: 'equals', value: 'read' }, whatsappStatus), true)
  assert.equal(evaluateCondition({ path: statuses, operator: 'equals', value: 'failed' }, whatsappStatus), false)
  assert.equal(evaluateCondition({ path: statuses, operator: 'notEquals', value: 'read' }, whatsappStatus), false)
  assert.equal(evaluateCondition({ path: statuses, operator: 'notEquals', value: 'failed' }, whatsappStatus), true)
  assert.equal(evaluateCondition({ path: statuses, operator: 'contains', value: 'ea' }, whatsappStatus), true)
  assert.equal(evaluateCondition({ path: statuses, operator: 'notContains', value: 'ea' }, whatsappStatus), false)
  assert.equal(evaluateCondition({ path: statuses, operator: 'startsWith', value: 'se' }, whatsappStatus), true)
  assert.equal(evaluateCondition({ path: statuses, operator: 'endsWith', value: 'nt' }, whatsappStatus), true)
  assert.equal(evaluateCondition({ path: statuses, operator: 'in', value: 'failed, read' }, whatsappStatus), true)
  assert.equal(evaluateCondition({ path: statuses, operator: 'regex', value: '^(read|delivered)$' }, whatsappStatus), true)
  assert.equal(evaluateCondition({ path: statuses, operator: 'regex', value: '(' }, whatsappStatus), false)
})

test('operadores numéricos e comparação de números/booleanos como texto', () => {
  assert.equal(evaluateCondition({ path: 'n', operator: 'gt', value: '5' }, { n: 10 }), true)
  assert.equal(evaluateCondition({ path: 'n', operator: 'lte', value: '10' }, { n: '10' }), true)
  assert.equal(evaluateCondition({ path: 'n', operator: 'lt', value: '10' }, { n: 10 }), false)
  assert.equal(evaluateCondition({ path: 'n', operator: 'gte', value: '1' }, { n: 'abc' }), false)
  assert.equal(evaluateCondition({ path: 'n', operator: 'gt', value: '1' }, { n: '' }), false)
  assert.equal(evaluateCondition({ path: 'n', operator: 'equals', value: '42' }, { n: 42 }), true)
  assert.equal(evaluateCondition({ path: 'ok', operator: 'equals', value: 'true' }, { ok: true }), true)
})

test('ALL exige todas as condições e ANY exige qualquer uma', () => {
  const conditions = [
    { path: 'object', operator: 'equals', value: 'whatsapp_business_account' },
    { path: 'entry[*].changes[*].value.statuses', operator: 'exists' }
  ]
  assert.equal(evaluateRule({ matchMode: 'ALL', conditions }, whatsappStatus), true)
  assert.equal(evaluateRule({ matchMode: 'ALL', conditions }, whatsappMessage), false)
  assert.equal(evaluateRule({ matchMode: 'ANY', conditions }, whatsappMessage), true)
  assert.equal(evaluateRule({ matchMode: 'ANY', conditions }, instagram), false)
  assert.equal(evaluateRule({ matchMode: 'ALL', conditions: [] }, whatsappMessage), false)
})

const rule = (matchMode, conditions) => ({ matchMode, conditions })
const endpoint = (id, filter = null) => ({ id, rule: filter })
const statusRule = rule('ALL', [{ path: 'entry[*].changes[*].value.statuses', operator: 'exists' }])
const instagramRule = rule('ALL', [{ path: 'object', operator: 'equals', value: 'instagram' }])
const leadRule = rule('ALL', [{ path: 'entry[*].changes[*].field', operator: 'equals', value: 'leadgen' }])

test('destino sem regra recebe todos os payloads', () => {
  assert.equal(endpointAccepts(null, whatsappMessage), true)
  assert.equal(endpointAccepts(null, instagram), true)
  assert.deepEqual(selectEndpoints([endpoint('archive')], lead), ['archive'])
})

test('regra sem condições também aceita tudo', () => {
  assert.equal(endpointAccepts(rule('ALL', []), lead), true)
})

test('cada regra direciona seu tipo de payload', () => {
  const all = [endpoint('analytics', statusRule), endpoint('crm', instagramRule), endpoint('leads', leadRule)]
  assert.deepEqual(selectEndpoints(all, whatsappStatus), ['analytics'])
  assert.deepEqual(selectEndpoints(all, instagram), ['crm'])
  assert.deepEqual(selectEndpoints(all, lead), ['leads'])
})

test('uma mesma regra leva o payload a todos os destinos ligados a ela', () => {
  const all = [endpoint('crm', leadRule), endpoint('email', leadRule), endpoint('sheet', leadRule), endpoint('analytics', statusRule)]
  assert.deepEqual(selectEndpoints(all, lead), ['crm', 'email', 'sheet'])
  assert.deepEqual(selectEndpoints(all, whatsappStatus), ['analytics'])
})

test('payload que nenhuma regra aceita não vai para ninguém', () => {
  const all = [endpoint('analytics', statusRule), endpoint('crm', instagramRule), endpoint('leads', leadRule)]
  assert.deepEqual(selectEndpoints(all, whatsappMessage), [])
})

test('destinos sem regra continuam recebendo ao lado dos filtrados', () => {
  const all = [endpoint('crm', instagramRule), endpoint('analytics', statusRule), endpoint('archive')]
  assert.deepEqual(selectEndpoints(all, instagram), ['crm', 'archive'])
})

test('ANY e ALL dentro da regra', () => {
  const conditions = [
    { path: 'object', operator: 'equals', value: 'instagram' },
    { path: 'entry[*].changes[*].field', operator: 'equals', value: 'leadgen' }
  ]
  assert.equal(endpointAccepts(rule('ANY', conditions), lead), true)
  assert.equal(endpointAccepts(rule('ALL', conditions), lead), false)
})

test('validateConditions aceita condições válidas e normaliza o valor', () => {
  const result = validateConditions([
    { path: ' object ', operator: 'equals', value: 'instagram' },
    { path: 'entry[*].id', operator: 'exists', value: 'ignorado' }
  ])
  assert.deepEqual(result, {
    conditions: [
      { path: 'object', operator: 'equals', value: 'instagram' },
      { path: 'entry[*].id', operator: 'exists' }
    ]
  })
})

test('validateConditions rejeita entradas inválidas', () => {
  assert.match(validateConditions('x').error, /lista/)
  assert.match(validateConditions([{ path: '', operator: 'exists' }]).error, /caminho/)
  assert.match(validateConditions([{ path: 'a', operator: 'foo' }]).error, /operador/)
  assert.match(validateConditions([{ path: 'a', operator: 'equals' }]).error, /valor/)
  assert.match(validateConditions([{ path: 'a', operator: 'gt', value: 'abc' }]).error, /numérico/)
  assert.match(validateConditions([{ path: 'a', operator: 'regex', value: '(' }]).error, /regex inválida/)
  assert.match(validateConditions([{ path: 'a', operator: 'regex', value: 'a'.repeat(201) }]).error, /muito longa/)
  assert.match(validateConditions(Array.from({ length: 51 }, () => ({ path: 'a', operator: 'exists' }))).error, /Máximo/)
})
