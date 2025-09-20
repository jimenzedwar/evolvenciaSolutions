import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4'

type UploadRequest = {
  productId: string
  fileName: string
  contentType: string
  bucket?: string
  altText?: string | null
  metadata?: Record<string, unknown>
}

type ErrorResponse = {
  message: string
  details?: unknown
}

const respond = (status: number, payload: Record<string, unknown> | ErrorResponse) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return respond(405, { message: 'Method not allowed' })
  }

  const authHeader = req.headers.get('Authorization') ?? ''
  const token = authHeader.replace('Bearer ', '').trim()

  if (!token) {
    return respond(401, { message: 'Missing Bearer token' })
  }

  let body: UploadRequest
  try {
    body = await req.json()
  } catch (error) {
    return respond(400, { message: 'Invalid JSON payload', details: error instanceof Error ? error.message : String(error) })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !serviceRoleKey) {
    return respond(500, { message: 'Supabase credentials are not configured for the edge function' })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: { Authorization: `Bearer ${token}` },
    },
  })

  const { data: authResult, error: authError } = await supabase.auth.getUser(token)

  if (authError || !authResult?.user) {
    return respond(401, { message: 'Invalid or expired token', details: authError?.message })
  }

  const { user } = authResult

  const { data: roleRecord, error: roleError } = await supabase
    .from('app_user_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (roleError) {
    return respond(500, { message: 'Unable to verify user role', details: roleError.message })
  }

  if (roleRecord?.role !== 'admin') {
    return respond(403, { message: 'Only administrators can upload media' })
  }

  const bucket = body.bucket ?? 'product-assets'
  const fileName = body.fileName.trim()
  const productId = body.productId

  if (!productId || !fileName) {
    return respond(400, { message: 'productId and fileName are required' })
  }

  const safeFileName = fileName.replace(/[^A-Za-z0-9_.-]+/g, '-')
  const filePath = `${productId}/${crypto.randomUUID()}-${safeFileName}`

  const { data: signedUpload, error: uploadError } = await supabase.storage
    .from(bucket)
    .createSignedUploadUrl(filePath, {
      contentType: body.contentType,
      upsert: true,
    })

  if (uploadError || !signedUpload) {
    return respond(500, { message: 'Unable to create upload URL', details: uploadError?.message })
  }

  const { data: mediaRecord, error: mediaError } = await supabase.rpc('admin_register_media_asset', {
    p_product_id: productId,
    p_bucket: bucket,
    p_path: filePath,
    p_media_type: body.contentType,
    p_alt_text: body.altText,
    p_metadata: body.metadata ?? {},
  })

  if (mediaError) {
    return respond(500, { message: 'Unable to register media asset', details: mediaError.message })
  }

  return respond(200, {
    uploadUrl: signedUpload.signedUrl,
    token: signedUpload.token,
    path: filePath,
    media: mediaRecord,
  })
})
