import { PassThrough } from 'node:stream'

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
