import { createClient } from 'npm:@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
  }

  try {
    const { notification_id } = await req.json()
    if (!notification_id) return new Response('missing notification_id', { status: 400 })

    const { data: notif, error } = await supabase
      .from('notifications')
      .select(`
        *,
        user:profiles!user_id(push_token),
        actor:profiles!actor_id(username, display_name),
        drop:drops!drop_id(title)
      `)
      .eq('id', notification_id)
      .eq('sent_push', false)
      .maybeSingle()

    if (error || !notif) return new Response('not found', { status: 200 })

    const pushToken = (notif.user as any)?.push_token
    if (!pushToken || !pushToken.startsWith('ExponentPushToken')) {
      return new Response('no push token', { status: 200 })
    }

    const actorName: string =
      (notif.actor as any)?.display_name ??
      ((notif.actor as any)?.username ? `@${(notif.actor as any).username}` : 'Someone')
    const dropTitle: string = (notif.drop as any)?.title ?? 'a drop'

    let title = 'Memoria'
    let body = ''

    switch (notif.type) {
      case 'drop_invited':
        title = 'New drop invitation'
        body = `${actorName} invited you to "${dropTitle}"`
        break
      case 'drop_opened':
        title = 'Drop opened!'
        body = `"${dropTitle}" is now open — see the photos`
        break
      case 'friend_request':
        title = 'Friend request'
        body = `${actorName} sent you a friend request`
        break
      case 'friend_accepted':
        title = 'Friend request accepted'
        body = `${actorName} accepted your friend request`
        break
      default:
        return new Response('unhandled type', { status: 200 })
    }

    const expoRes = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        to: pushToken,
        title,
        body,
        sound: 'default',
        data: {
          type: notif.type,
          drop_id: notif.drop_id ?? undefined,
          notification_id,
        },
      }),
    })

    if (!expoRes.ok) {
      console.error('[send-push] Expo API error:', await expoRes.text())
    }

    await supabase.from('notifications').update({ sent_push: true }).eq('id', notification_id)

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[send-push] error:', err)
    return new Response('internal error', { status: 500 })
  }
})
