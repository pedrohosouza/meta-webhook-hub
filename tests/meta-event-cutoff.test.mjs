import assert from 'node:assert/strict'
import test from 'node:test'
import {
  extractMetaEventTimestamps,
  parseMetaEventsBefore,
  processVerifiedMetaWebhook
} from '../server/utils/meta-event-cutoff.ts'

const cutoff = Date.parse('2026-09-14T14:30:00-04:00')

function payloadWithTimestamp(timestamp) {
  return { entry: [{ changes: [{ value: { messages: [{ timestamp }] } }] }] }
}

test('desabilita o cutoff quando a variável está ausente ou vazia', () => {
  assert.equal(parseMetaEventsBefore(undefined), null)
  assert.equal(parseMetaEventsBefore(''), null)
  assert.equal(parseMetaEventsBefore('   '), null)
})

test('aceita RFC 3339 com timezone e rejeita configurações inválidas', () => {
  assert.equal(parseMetaEventsBefore('2026-09-14T14:30:00-04:00'), cutoff)
  assert.equal(parseMetaEventsBefore('2026-09-14T18:30:00Z'), cutoff)
  assert.throws(() => parseMetaEventsBefore('2026-09-14T14:30:00'), /timezone/)
  assert.throws(() => parseMetaEventsBefore('2026-02-30T14:30:00Z'), /inválido/)
  assert.throws(() => parseMetaEventsBefore('data-inválida'), /RFC 3339/)
})

test('normaliza timestamps Unix em segundos e milissegundos', () => {
  assert.deepEqual(extractMetaEventTimestamps(payloadWithTimestamp('1789410599')), [1789410599000])
  assert.deepEqual(extractMetaEventTimestamps(payloadWithTimestamp(1789410599)), [1789410599000])
  assert.deepEqual(extractMetaEventTimestamps(payloadWithTimestamp('1789410599000')), [1789410599000])
  assert.deepEqual(extractMetaEventTimestamps(payloadWithTimestamp(1789410599000)), [1789410599000])
})

test('extrai timestamps de todos os caminhos suportados', () => {
  const payload = {
    entry: [{
      time: '1789410600',
      messaging: [{ timestamp: '1789410600001' }],
      changes: [{ value: {
        messages: [{ timestamp: '2026-09-14T18:30:00.002Z' }],
        statuses: [{ timestamp: 1789410600003 }]
      } }]
    }]
  }

  assert.deepEqual(extractMetaEventTimestamps(payload), [
    1789410600000,
    1789410600001,
    1789410600002,
    1789410600003
  ])
})

test('ignora evento anterior ao cutoff sem chamar a fila', async () => {
  let enqueueCalls = 0
  const infoLogs = []
  const payload = {
    entry: [{ changes: [{ value: { messages: [{
      timestamp: '1789410599',
      text: { body: 'conteúdo privado' }
    }] } }] }]
  }
  const response = await processVerifiedMetaWebhook({
    payload,
    cutoff,
    enqueue: async () => { enqueueCalls++ },
    logger: { info: (...args) => infoLogs.push(args), warn: () => undefined }
  })

  assert.equal(response?.status, 200)
  assert.equal(await response?.text(), 'EVENT_IGNORED')
  assert.equal(enqueueCalls, 0)
  assert.deepEqual(infoLogs, [[{
    event: 'meta_webhook_ignored_before_cutoff',
    cutoff: '2026-09-14T18:30:00.000Z',
    timestamps: ['2026-09-14T18:29:59.000Z']
  }]])
  assert.doesNotMatch(JSON.stringify(infoLogs), /conteúdo privado/)
})

test('processa eventos exatamente no cutoff e posteriores', async () => {
  for (const timestamp of ['1789410600', '1789410601']) {
    let enqueueCalls = 0
    const response = await processVerifiedMetaWebhook({
      payload: payloadWithTimestamp(timestamp),
      cutoff,
      enqueue: async () => { enqueueCalls++ }
    })
    assert.equal(response, null)
    assert.equal(enqueueCalls, 1)
  }
})

test('processa payload sem timestamp e emite warning sem dados do payload', async () => {
  let enqueueCalls = 0
  const warnings = []
  const payload = { entry: [{ changes: [{ value: { message: 'segredo' } }] }] }
  const response = await processVerifiedMetaWebhook({
    payload,
    cutoff,
    enqueue: async () => { enqueueCalls++ },
    logger: { info: () => undefined, warn: (...args) => warnings.push(args) }
  })

  assert.equal(response, null)
  assert.equal(enqueueCalls, 1)
  assert.deepEqual(warnings, [['Meta webhook recebido sem timestamp reconhecido']])
  assert.doesNotMatch(JSON.stringify(warnings), /segredo/)
})

test('processa integralmente payload com eventos antigos e novos', async () => {
  let enqueuedPayload
  const payload = {
    entry: [{ changes: [{ value: { messages: [
      { timestamp: '1789410599', text: { body: 'antiga' } },
      { timestamp: '1789410601', text: { body: 'nova' } }
    ] } }] }]
  }

  const response = await processVerifiedMetaWebhook({
    payload,
    cutoff,
    enqueue: async () => { enqueuedPayload = payload }
  })

  assert.equal(response, null)
  assert.strictEqual(enqueuedPayload, payload)
})

test('cutoff desabilitado preserva o processamento atual', async () => {
  let enqueueCalls = 0
  await processVerifiedMetaWebhook({
    payload: payloadWithTimestamp('1000000000'),
    cutoff: null,
    enqueue: async () => { enqueueCalls++ }
  })
  assert.equal(enqueueCalls, 1)
})
