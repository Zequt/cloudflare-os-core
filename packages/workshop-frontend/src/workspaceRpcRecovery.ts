type WorkspaceRpcErrorObserver = (error: unknown, site?: string) => boolean

const LOCAL_STUB_METHODS = new Set<PropertyKey>([
  'catch',
  'dup',
  'finally',
  'map',
  'onRpcBroken',
  'then',
  'toString',
  Symbol.dispose,
])

/**
 * Observe every remote method call made through a workspace capability without changing the
 * returned Cap'n Web promise. This keeps pipelining intact while ensuring a Durable Object reset
 * schedules a workspace reopen even when the first failing call comes from a less common button.
 */
export function observeWorkspaceRpcStub<T extends object>(
  stub: T,
  onError: WorkspaceRpcErrorObserver,
  scope: string,
  ignoredRemoteMethods: readonly PropertyKey[] = [],
): T {
  const ignored = new Set(ignoredRemoteMethods)
  return new Proxy(stub, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver)
      if (typeof value !== 'function' || LOCAL_STUB_METHODS.has(property) || ignored.has(property)) {
        return value
      }

      return (...args: unknown[]) => {
        const result = Reflect.apply(value, target, args) as unknown
        if (result && typeof (result as PromiseLike<unknown>).then === 'function') {
          void Promise.resolve(result).catch(error => {
            onError(error, `${scope}.${String(property)}`)
          })
        }
        return result
      }
    },
  })
}
