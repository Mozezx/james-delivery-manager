// Compressão e upload de fotos de prato. Camada de dados pura, sem estado de
// UI — o cache de leitura (signed URL) fica em src/components/pratos/FotoPrato.tsx.
import { supabase } from './supabase'

const LADO_MAXIMO = 1280
const TAMANHO_MAXIMO_BYTES = 500 * 1024
const QUALIDADES = [0.85, 0.7, 0.55, 0.5]

/**
 * Redimensiona (maior lado ≤1280px) e comprime para JPEG até ficar ≤500KB,
 * tentando qualidades decrescentes. Se a original já for pequena e já for
 * jpeg/webp, retorna ela direto sem reprocessar.
 */
export async function comprimirFoto(arquivo: File): Promise<Blob> {
  const jaComprimida = arquivo.type === 'image/jpeg' || arquivo.type === 'image/webp'
  if (jaComprimida && arquivo.size <= TAMANHO_MAXIMO_BYTES) {
    return arquivo
  }

  const bitmap = await createImageBitmap(arquivo)
  const escala = Math.min(1, LADO_MAXIMO / Math.max(bitmap.width, bitmap.height))
  const largura = Math.round(bitmap.width * escala)
  const altura = Math.round(bitmap.height * escala)

  const canvas = document.createElement('canvas')
  canvas.width = largura
  canvas.height = altura
  const contexto = canvas.getContext('2d')
  if (!contexto) throw new Error('Não foi possível criar contexto de canvas para comprimir a foto')
  contexto.drawImage(bitmap, 0, 0, largura, altura)

  let ultimoBlob: Blob | null = null
  for (const qualidade of QUALIDADES) {
    const blob = await canvasParaBlob(canvas, qualidade)
    ultimoBlob = blob
    if (blob.size <= TAMANHO_MAXIMO_BYTES) return blob
  }
  // Nenhuma qualidade atingiu o limite: retorna a menor obtida (mais comprimida).
  return ultimoBlob as Blob
}

function canvasParaBlob(canvas: HTMLCanvasElement, qualidade: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Falha ao gerar JPEG da foto'))),
      'image/jpeg',
      qualidade
    )
  })
}

/** Comprime e envia a foto do prato ao bucket; retorna o caminho salvo (não a URL). */
export async function enviarFotoPrato(arquivo: File): Promise<string> {
  const blob = await comprimirFoto(arquivo)
  const caminho = `pratos/${crypto.randomUUID()}.jpg`
  const { error } = await supabase.storage
    .from('fotos-pratos')
    .upload(caminho, blob, { contentType: 'image/jpeg' })
  if (error) throw error
  return caminho
}

/** Remove a foto do bucket; falha aqui não é crítica (só avisa no console). */
export async function removerFotoPrato(caminho: string): Promise<void> {
  const { error } = await supabase.storage.from('fotos-pratos').remove([caminho])
  if (error) console.warn('Falha ao remover foto do prato:', error)
}
