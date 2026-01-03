import { createResource, createSignal } from 'solid-js'
import { trpc, useQuery } from '~/utils/trpc-client'

const fetchUser = (name: string) => {
  return trpc.hello.query({ name })
}

const WelcomeComponent = () => {
  const [name, setName] = createSignal('TEST')

  const [welcome] = createResource(() => name(), fetchUser)
  return (
    <>
      <h2 class="max-6-xs text-6xl text-sky-700 font-thin uppercase my-16">{welcome()}</h2>
      <input
        class="border-gray-600 border-2 rounded-md p-1 block"
        value={name()}
        onChange={(event) => setName(event.currentTarget.value)}
      />
    </>
  )
}

export default function About() {
  const [hello] = useQuery('hello', { name: 'Frank ' })
  return (
    <main class="text-center mx-auto text-gray-700 p-4">
      <h1 class="max-6-xs text-6xl text-sky-700 font-thin uppercase my-16">{hello()}</h1>
      <WelcomeComponent />
    </main>
  )
}
