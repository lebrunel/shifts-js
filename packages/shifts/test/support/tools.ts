import { defineTool } from '@tool'

export const sumTool = defineTool<{
  a: number;
  b: number;
}>({
  name: 'sum',
  description: 'returns the sum of the two input numbers',
  params: {
    a: { type: 'number', description: 'first input number' },
    b: { type: 'number', description: 'second input number' },
  },
  handler({ a, b }) {
    return (a + b).toString()
  }
})