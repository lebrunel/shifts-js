# Shifts (js)

![License](https://img.shields.io/github/license/lebrunel/shifts-js?color=informational)
![Build Status](https://img.shields.io/github/actions/workflow/status/lebrunel/shifts-js/bun.yml?branch=main)

Shifts is a framework for composing autonomous **agent** workflows, using a mixture of LLM backends.

- 🤖 **Automate your chores** - have AI agents handle the mundane so you can focus on the things you care about.
- 💪🏻 **Agents with superpowers** - create tools, so your agents can interact with the Web or internal APIs and systems.
- 🧩 **Flexible and adaptable** - easily compose and modify workflows to suit your specific needs.
- 🤗 **Delightful simplicity** - pipe instructions together using just plain English and intuitive APIs.
- 🎨 **Mix and match** - Plug into different LLMs even within the same workflow so you are always using the right tool for job.

## Status

This is currently experimental whilst I simultaneously work on an [Elixir implementation of Shifts](https://github.com/lebrunel/shifts). I probably won't commit to building both versions to maturity, but it's helpful to build out two versions at this early stage to help find the right DX.

Feel free to follow for progress, but no promises this will ever be finished.

### Usage:

```ts
import { defineShift, dd } from 'shifts'
import { useAnthropic } from 'shifts/llms/anthropic'
import { scraperTool } from '@shifts/tools'

const newsShift = defineShift<{
  summarizeNews: string[];
}>(({ defineChore, defineJob, afterExec }) => {
  defineChore<string>('summarize', (job, url) => {
    return {
      task: `Scrape the following url and write a summary of its contents: ${url}`,
      output: dd`
      Format the summary as follows:
      Title
      URL
      1 paragraph synopsis
      3 key takeaways bullet list
      `,
      llm: useAnthropic({ model: 'claude-3-haiku-20240307' })
    }
  })

  defineChore('analyze', (job) => {
    const summaries = job.findAll('summarize')
    return {
      task: 'Analyze the given news summaries and write a concise report rounding up the days important news and events.'
      output: 'A markdown formated article.',
      context: summaries,
      llm: useAnthropic({ model: 'claude-3-opus-20240229' })
    }
  })

  defineJob('analyzeNews', async job => {
    for (const url of job.input) {
      await job.exec('summarize', url)
    }
    await job.exec('analyze')
  })
})

const job = newsShift.startJob('analyseNews', [
  'http://some.blog/article1',
  'http://some.blog/article2',
  'http://some.blog/article3'
])

job.on('success', (job) => {
  console.log(job.output)
})
```

## Licence

This package is open source and released under the [Apache-2 Licence](https://github.com/lebrunel/shifts/blob/master/LICENSE).

© Copyright 2024 [Push Code Ltd](https://www.pushcode.com/).