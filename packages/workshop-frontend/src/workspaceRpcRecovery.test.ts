import { describe, expect, it, vi } from 'vitest'
import { RpcStub, RpcTarget } from 'capnweb'
import { observeWorkspaceRpcStub } from './workspaceRpcRecovery'

class WorkspaceTarget extends RpcTarget {
  async setChatTitle(): Promise<void> {
    throw new Error('Durable Object reset because its code was updated.')
  }

  async listChats(): Promise<string[]> {
    return ['chat']
  }
}

describe('observeWorkspaceRpcStub', () => {
  it('observes a rejected RPC from an arbitrary workspace button without consuming the error', async () => {
    const onError = vi.fn<(error: unknown, site?: string) => boolean>(() => true)
    const stub = observeWorkspaceRpcStub(new RpcStub(new WorkspaceTarget()), onError, 'workspace')

    await expect(stub.setChatTitle()).rejects.toThrow('Durable Object reset')
    expect(onError).toHaveBeenCalledOnce()
    expect(onError).toHaveBeenCalledWith(expect.any(Error), 'workspace.setChatTitle')
  })

  it('preserves successful RPC results', async () => {
    const onError = vi.fn<(error: unknown, site?: string) => boolean>(() => false)
    const stub = observeWorkspaceRpcStub(new RpcStub(new WorkspaceTarget()), onError, 'workspace')

    await expect(stub.listChats()).resolves.toEqual(['chat'])
    expect(onError).not.toHaveBeenCalled()
  })
})
