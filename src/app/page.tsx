import { createClient } from '@/utils/supabase/server'
import SightlineClient from '@/components/SightlineClient'
import LoginOverlay from '@/components/LoginOverlay'

export default async function Home() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return <LoginOverlay />
  }

  return <SightlineClient user={session.user} />
}
