import { createTRPCProxyClient, httpLink } from '@trpc/client'
import { createResource } from 'solid-js'

import type { AnyProcedure, AnyRouter, ProcedureArgs, ProcedureType } from '@trpc/server'
import type { AppRouter } from '~/server/trpc/router/_app'
import { inferTransformedProcedureOutput } from '@trpc/server/shared'
import { clientEnv } from '~/env/client'

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpLink({
      url: `${clientEnv.START_BASE_URL}/api/trpc`,
    }),
  ],
})

type InferProcedureTypeKey<TProcedureType extends ProcedureType, TRouter extends AnyRouter> = {
  [Key in keyof TRouter['_def']['procedures']]: TRouter['_def']['procedures'][Key]['_type'] extends TProcedureType
    ? Key
    : never
}[keyof TRouter['_def']['procedures']]

type InferProcedureType<TProcedureType extends ProcedureType, TRouter extends AnyRouter> = {
  [Key in InferProcedureTypeKey<TProcedureType, TRouter>]: TRouter['_def']['procedures'][Key]
}

type Queries = InferProcedureType<'query', AppRouter>
// type Mutations = InferProcedureType<'mutation', AppRouter>
// type Subscriptions = InferProcedureType<'subscription', AppRouter>

const queries: Queries = null as any
// const mutations: Mutations = null as any
// const subscriptions: Subscriptions = null as any

type QueryKeys = keyof Queries & string
// type MutationKeys = keyof Mutations & string
// type SubscriptionKeys = keyof Subscriptions & string

type Resolver<TProcedure extends AnyProcedure> = (
  ...args: ProcedureArgs<TProcedure['_def']>
) => Promise<inferTransformedProcedureOutput<TProcedure>>

export const useQuery = <TPath extends QueryKeys>(path: TPath, ...params: ProcedureArgs<Queries[TPath]['_def']>) => {
  // extract query and define the correct type
  const query = trpc[path].query as Resolver<Queries[TPath]>
  const fetchData = async () => query(...params)
  return createResource(fetchData)
}
