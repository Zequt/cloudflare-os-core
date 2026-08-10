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

  getGadget(): GadgetTarget {
    return new GadgetTarget()
  }
}

class GadgetTarget extends RpcTarget {
  async setTitle(): Promise<void> {
    throw new Error('Durable Object reset because its code was updated.')
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

  it('reports a pipelined child capability failure only at the child operation', async () => {
    const sites: string[] = []
    const onError = vi.fn<(error: unknown, site?: string) => boolean>((_error, site) => {
      if (site) sites.push(site)
      return true
    })
    const workspace = observeWorkspaceRpcStub(
      new RpcStub(new WorkspaceTarget()),
      onError,
      'workspace',
      ['getGadget'],
    )
    const gadget = observeWorkspaceRpcStub(workspace.getGadget(), onError, 'gadget')

    await expect(gadget.setTitle()).rejects.toThrow('Durable Object reset')
    expect(sites).toEqual(['gadget.setTitle'])
  })
})
