import assert from 'node:assert/strict'
import test from 'node:test'
import { summarizeMetaWebhook } from '../server/utils/meta-webhook-summary.ts'

test('extrai mensagens de texto do WhatsApp com nome do contato', () => {
  const [item] = summarizeMetaWebhook({
    object: 'whatsapp_business_account',
    entry: [{ changes: [{ field: 'messages', value: {
      contacts: [{ wa_id: '5511', profile: { name: 'Ana' } }],
      messages: [{ id: 'wamid.1', from: '5511', type: 'text', text: { body: 'olá' } }]
    } }] }]
  })
  assert.deepEqual(item, { id: 'wamid.1', object: 'whatsapp_business_account', field: 'messages', type: 'text', senderName: 'Ana', senderId: '5511', body: 'olá' })
})

test('extrai mensagens de Messenger e Instagram', () => {
  const [item] = summarizeMetaWebhook({ object: 'instagram', entry: [{ messaging: [{ sender: { id: '42' }, message: { mid: 'm1', text: 'oi' } }] }] })
  assert.equal(item.type, 'text')
  assert.equal(item.senderId, '42')
  assert.equal(item.body, 'oi')
})

test('exibe status de entrega', () => {
  const [item] = summarizeMetaWebhook({ object: 'whatsapp_business_account', entry: [{ changes: [{ field: 'messages', value: { statuses: [{ id: 's1', status: 'delivered', recipient_id: '5511' }] } }] }] })
  assert.equal(item.type, 'status')
  assert.equal(item.body, 'delivered')
})

test('devolve um evento genérico quando nada é reconhecido', () => {
  const items = summarizeMetaWebhook({ object: 'page', entry: [{ changes: [{ field: 'feed', value: {} }] }] })
  assert.equal(items.length, 1)
  assert.equal(items[0].type, 'event')
  assert.equal(items[0].field, 'feed')
  assert.deepEqual(summarizeMetaWebhook('x'), [])
})
