import { PassThrough } from 'node:stream'
import { Anthropic } from '@anthropic-ai/sdk'

type Fetch = typeof fetch

export namespace mock {
  let $response: any

  export const fetch: Fetch = async (url, opts) => {
    const { stream } = JSON.parse(opts?.body as string)

    return stream ?
      sse($response) :
      new Response(JSON.stringify($response), {
        headers: {
          'Content-Type': 'application/json',
        }
      })
  }

  export const response = (res: any) => $response = res

  function sse(iter: AsyncGenerator<any>): Response {
    const stream = new PassThrough();
    (async () => {
      for await (const chunk of iter) {
        stream.write(`event: ${chunk.type}\n`)
        stream.write(`data: ${JSON.stringify(chunk)}\n\n`)
      }
      stream.end(`done: [DONE]\n\n`)
    })();

    // @ts-ignore
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Transfer-Encoding': 'chunked',
      }
    })
  }
}

export async function* anthropicAsyncGen(message: Anthropic.Message): AsyncGenerator<Anthropic.MessageStreamEvent> {
  yield { type: 'message_start', message: { ...message, content: [], stop_reason: null, stop_sequence: null } }
  
  for (let idx = 0; idx < message.content.length; idx++) {
    const content = message.content[idx]!;
    yield { type: 'content_block_start', index: idx, content_block: { type: content.type, text: '' } }
    for (let chunk = 0; chunk * 5 < content.text.length; chunk++) {
      yield { type: 'content_block_delta', index: idx, delta: { type: 'text_delta', text: content.text.slice(chunk * 5, (chunk + 1) * 5) } }
    }
    yield { type: 'content_block_stop', index: idx }
  }

  yield { type: 'message_delta', delta: { stop_reason: message.stop_reason, stop_sequence: message.stop_sequence }, usage: { output_tokens: 6 } }
  yield { type: 'message_stop' }
}