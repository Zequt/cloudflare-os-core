// @vitest-environment jsdom
/* eslint-disable react/react-in-jsx-scope */

import { act, type ReactElement, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { RpcStub } from 'capnweb'
import type { AuthenticatedApi } from '@gadgets/workshop-shared/api'

vi.mock('@cloudflare/kumo', () => {
  const Dialog = Object.assign(
    ({ children }: { children: ReactNode }) => <div>{children}</div>,
    {
      Root: ({ children }: { children: ReactNode }) => <>{children}</>,
      Title: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
      Close: ({ render }: { render: (props: object) => ReactElement }) => render({}),
    },
  )
  const Select = Object.assign(
    ({ label, onValueChange, children }: {
      label: string
      onValueChange: (value: string) => void
      children: ReactNode
    }) => (
      <div>
        <span>{label}</span>
        <button type="button" onClick={() => onValueChange('other-openai')}>Choose OpenAI</button>
        {children}
      </div>
    ),
    { Option: ({ children }: { children: ReactNode }) => <span>{children}</span> },
  )
  const Collapsible = {
    Root: ({ open, children }: { open: boolean, children: ReactNode }) => (
      <section data-testid="advanced" data-open={String(open)}>{children}</section>
    ),
    DefaultTrigger: ({ children }: { children: ReactNode }) => <span>{children}</span>,
    DefaultPanel: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  }
  const Input = ({ label, value, onChange, error }: {
    label: string
    value: string
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
    error?: string
  }) => (
    <label>
      {label}
      <input aria-label={label} value={value} onChange={onChange} />
      {error && <span role="alert">{error}</span>}
    </label>
  )
  return {
    Button: ({ children, onClick }: { children: ReactNode, onClick?: () => void }) => (
      <button type="button" onClick={onClick}>{children}</button>
    ),
    Collapsible,
    Dialog,
    Input,
    Select,
    SensitiveInput: ({ label, value, onValueChange, error }: {
      label: string
      value: string
      onValueChange: (value: string) => void
      error?: string
    }) => (
      <label>
        {label}
        <input aria-label={label} value={value} onChange={event => onValueChange(event.target.value)} />
        {error && <span role="alert">{error}</span>}
      </label>
    ),
    useKumoToastManager: () => ({ add: vi.fn<(toast: unknown) => void>() }),
  }
})

import AddModelModal from './AddModelModal'

function setInput(container: HTMLElement, label: string, value: string) {
  const input = container.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`)!
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
  return act(async () => {
    setter.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

function click(container: HTMLElement, label: string) {
  const button = [...container.querySelectorAll('button')]
    .find(candidate => candidate.textContent?.trim() === label)!
  return act(async () => {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
}

describe('AddModelModal direct model validation', () => {
  let root: Root | undefined
  let container: HTMLDivElement | undefined

  afterEach(() => {
    act(() => root?.unmount())
    container?.remove()
  })

  it('opens advanced settings and shows the required direct API URL error', async () => {
    const addModel = vi.fn<(...args: unknown[]) => Promise<void>>(async () => {})
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)

    await act(async () => {
      root!.render(
        <AddModelModal
          visible
          onCancel={() => {}}
          onSuccess={() => {}}
          authenticatedApi={{ addModel } as unknown as RpcStub<AuthenticatedApi>}
          aiConfig={{ enabled: true, enabledProviders: ['openai'] }}
        />,
      )
    })

    await click(container, 'Choose OpenAI')
    await setInput(container, 'Model ID', 'custom-model')
    await setInput(container, 'Display Name', 'Custom model')
    await setInput(container, 'API Token', 'secret')

    expect(container.querySelector('[data-testid="advanced"]')?.getAttribute('data-open')).toBe('false')
    await click(container, 'Add Model')

    expect(addModel).not.toHaveBeenCalled()
    expect(container.querySelector('[data-testid="advanced"]')?.getAttribute('data-open')).toBe('true')
    expect(container.textContent).toContain('Please enter the direct API URL')
  })
})
