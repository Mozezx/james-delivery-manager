// Exibe a foto do prato a partir do caminho salvo no bucket privado
// 'fotos-pratos' (via signed URL) ou um placeholder quando não há foto.
import { useQuery } from '@tanstack/react-query'
import { UtensilsCrossed } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

const UMA_HORA_EM_SEGUNDOS = 60 * 60
const TRINTA_MINUTOS_EM_MS = 30 * 60 * 1000

async function buscarUrlAssinada(caminho: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('fotos-pratos')
    .createSignedUrl(caminho, UMA_HORA_EM_SEGUNDOS)
  if (error) throw error
  return data.signedUrl
}

export default function FotoPrato({
  caminho,
  nome,
  className,
}: {
  caminho: string | null
  nome: string
  className?: string
}) {
  const { data: url, isError } = useQuery({
    queryKey: ['foto-prato', caminho],
    queryFn: () => buscarUrlAssinada(caminho as string),
    enabled: caminho !== null,
    staleTime: TRINTA_MINUTOS_EM_MS,
  })

  if (!caminho || isError || !url) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-accent rounded',
          className
        )}
      >
        <UtensilsCrossed className="size-1/3 text-accent-foreground/60" aria-hidden />
      </div>
    )
  }

  return (
    <img
      src={url}
      alt={nome}
      className={cn('object-cover rounded', className)}
    />
  )
}
