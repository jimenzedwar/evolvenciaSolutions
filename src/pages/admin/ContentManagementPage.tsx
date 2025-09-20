import { useCallback, useEffect, useMemo, useState, type FormEventHandler } from 'react'
import { supabase } from '../../supabaseClient'

interface SettingRecord {
  key: string
  value: Record<string, unknown>
  description: string | null
}

interface MediaRecord {
  id: string
  product_id: string | null
  path: string
  media_type: string
  alt_text: string | null
  created_at: string
}

export default function ContentManagementPage() {
  const client = supabase
  const [settings, setSettings] = useState<SettingRecord[]>([])
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [settingDraft, setSettingDraft] = useState('')
  const [mediaAssets, setMediaAssets] = useState<MediaRecord[]>([])
  const [uploadProductId, setUploadProductId] = useState('')
  const [uploadAltText, setUploadAltText] = useState('')
  const [uploading, setUploading] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchContent = useCallback(async () => {
    if (!client) {
      setError('Supabase client is not configured')
      return
    }

    const [{ data: settingsData, error: settingsError }, { data: mediaData, error: mediaError }] = await Promise.all([
      client.from('settings').select('key, value, description').order('key', { ascending: true }),
      client
        .from('media')
        .select('id, product_id, path, media_type, alt_text, created_at')
        .order('created_at', { ascending: false })
        .limit(10),
    ])

    if (settingsError || mediaError) {
      setError(settingsError?.message ?? mediaError?.message ?? 'Unable to load content records')
      return
    }

    setError(null)
    setSettings((settingsData ?? []) as SettingRecord[])
    setMediaAssets((mediaData ?? []) as MediaRecord[])
    if (!selectedKey && settingsData && settingsData.length > 0) {
      setSelectedKey(settingsData[0].key)
      setSettingDraft(JSON.stringify(settingsData[0].value, null, 2))
    }
  }, [client, selectedKey])

  useEffect(() => {
    void fetchContent()
  }, [fetchContent])

  const selectedSetting = useMemo(() => settings.find((item) => item.key === selectedKey) ?? null, [selectedKey, settings])

  useEffect(() => {
    if (selectedSetting) {
      setSettingDraft(JSON.stringify(selectedSetting.value, null, 2))
    }
  }, [selectedSetting])

  const handleSettingSave = useCallback(async () => {
    if (!client || !selectedKey) return
    let payload: Record<string, unknown>
    try {
      payload = JSON.parse(settingDraft)
    } catch (parseError) {
      setError('Setting JSON is invalid')
      return
    }

    setError(null)
    const confirmed = window.confirm(`Update setting ${selectedKey}? This action impacts the storefront content.`)
    if (!confirmed) return

    const { error: updateError } = await client.from('settings').upsert({
      key: selectedKey,
      value: payload,
      updated_at: new Date().toISOString(),
    })

    if (updateError) {
      setError(updateError.message)
      return
    }

    setFeedback('Setting saved successfully')
    await fetchContent()
  }, [client, fetchContent, selectedKey, settingDraft])

  const handleUpload: FormEventHandler<HTMLFormElement> = useCallback(
    async (event) => {
      event.preventDefault()
      if (!client) return

      const input = event.currentTarget.elements.namedItem('media-file') as HTMLInputElement | null
      const file = input?.files?.[0]
      if (!file) {
        setError('Select a file to upload')
        return
      }
      if (!uploadProductId) {
        setError('Provide a product ID to associate the media with')
        return
      }

      const confirmed = window.confirm('Generate an upload URL and attach this asset to the catalog?')
      if (!confirmed) return

      setUploading(true)
      setError(null)
      setFeedback(null)

      const { data, error: invokeError } = await client.functions.invoke('admin-upload-media', {
        body: {
          productId: uploadProductId,
          fileName: file.name,
          contentType: file.type || 'application/octet-stream',
          altText: uploadAltText.trim() || null,
        },
      })

      if (invokeError) {
        setError(invokeError.message)
        setUploading(false)
        return
      }

      const uploadUrl = data?.uploadUrl as string | undefined
      if (!uploadUrl) {
        setError('Upload URL was not returned from the server')
        setUploading(false)
        return
      }

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      })

      if (!uploadResponse.ok) {
        setError('File upload failed. Check Supabase storage configuration.')
        setUploading(false)
        return
      }

      setFeedback('Media asset uploaded and registered')
      setUploading(false)
      setUploadAltText('')
      setUploadProductId('')
      if (input) {
        input.value = ''
      }
      await fetchContent()
    },
    [client, fetchContent, uploadAltText, uploadProductId],
  )

  if (!client) {
    return (
      <div className="rounded-md border border-amber-500/60 bg-amber-500/10 p-4 text-sm text-amber-200">
        Configure Supabase credentials to manage content.
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-slate-50">Content & media</h1>
        <p className="text-sm text-slate-400">Publish homepage copy, tweak merchandising blocks, and manage media assets.</p>
      </header>

      {error ? (
        <div className="rounded-md border border-rose-500/60 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>
      ) : null}
      {feedback ? (
        <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-200">{feedback}</div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[1fr,1fr]">
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4">
          <h2 className="text-lg font-semibold text-slate-100">Storefront settings</h2>
          <div className="mt-3 flex gap-3 text-sm">
            <div className="w-48 space-y-2 text-slate-300">
              {settings.map((setting) => (
                <button
                  key={setting.key}
                  type="button"
                  onClick={() => setSelectedKey(setting.key)}
                  className={`w-full rounded-md border px-3 py-2 text-left text-xs transition ${
                    selectedKey === setting.key
                      ? 'border-emerald-500/70 bg-emerald-500/10 text-emerald-100'
                      : 'border-slate-800/70 bg-slate-900/40 text-slate-300 hover:border-emerald-500/40'
                  }`}
                >
                  <span className="font-semibold uppercase tracking-wide">{setting.key}</span>
                  <p className="mt-1 text-[10px] text-slate-500">{setting.description ?? 'No description'}</p>
                </button>
              ))}
            </div>
            <div className="flex-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">JSON payload</label>
              <textarea
                value={settingDraft}
                onChange={(event) => setSettingDraft(event.target.value)}
                className="mt-2 h-72 w-full rounded-md border border-slate-700/70 bg-slate-900 px-3 py-2 font-mono text-xs text-emerald-100 focus:border-emerald-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  void handleSettingSave()
                }}
                className="mt-3 rounded-md border border-emerald-500/60 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/20"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4">
          <h2 className="text-lg font-semibold text-slate-100">Upload media</h2>
          <form className="mt-3 space-y-3" onSubmit={handleUpload}>
            <div>
              <label htmlFor="product-id" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Product ID
              </label>
              <input
                id="product-id"
                value={uploadProductId}
                onChange={(event) => setUploadProductId(event.target.value)}
                placeholder="00000000-0000-0000-0000-000000000101"
                className="mt-1 w-full rounded-md border border-slate-700/70 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="alt-text" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Alt text
              </label>
              <input
                id="alt-text"
                value={uploadAltText}
                onChange={(event) => setUploadAltText(event.target.value)}
                placeholder="Lifestyle hero image"
                className="mt-1 w-full rounded-md border border-slate-700/70 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="media-file" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Asset file
              </label>
              <input
                id="media-file"
                name="media-file"
                type="file"
                className="mt-1 w-full text-sm text-slate-200"
              />
            </div>
            <button
              type="submit"
              disabled={uploading}
              className="rounded-md border border-emerald-500/60 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploading ? 'Uploading…' : 'Generate upload URL'}
            </button>
          </form>
          <div className="mt-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Recent assets</h3>
            <ul className="mt-3 space-y-2 text-xs text-slate-300">
              {mediaAssets.map((asset) => (
                <li key={asset.id} className="rounded-md border border-slate-800/60 bg-slate-900/40 px-3 py-2">
                  <p className="font-semibold text-slate-100">{asset.path}</p>
                  <p className="text-[10px] text-slate-500">{new Date(asset.created_at).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}
