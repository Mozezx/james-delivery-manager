// Gera os PNGs do PWA (ícone normal + maskable + apple-touch-icon) a partir do
// SVG escolhido em design/icones/icone-1-pote.svg.
//
// Rodar uma vez com: node scripts/gerar-icones.mjs
// (sharp é devDependency só para isso, não entra no bundle do app)

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import sharp from 'sharp'

const raizProjeto = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const svgOrigem = path.join(raizProjeto, 'design/icones/icone-1-pote.svg')
const pastaPublic = path.join(raizProjeto, 'public')

mkdirSync(pastaPublic, { recursive: true })

const svgBase = readFileSync(svgOrigem, 'utf-8')

// Conteúdo do pote (tudo exceto o fundo <rect> arredondado), reaproveitado
// dentro de um novo fundo quadrado "full bleed" para a versão maskable —
// o SO aplica sua própria máscara (círculo/squircle), então o fundo não
// deve ter cantos arredondados nem margem própria.
const conteudoPote = svgBase
  .replace(/<svg[^>]*>/, '')
  .replace('</svg>', '')
  .replace(/<rect x="0" y="0" width="512" height="512" rx="96" ry="96" fill="#C4552D"\/>\s*/, '')

// Encolhe e recentra o conteúdo para caber dentro da "safe zone" (~80% central)
// exigida pelo spec de ícones maskable.
const svgMaskable = `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" width="512" height="512">
  <rect x="0" y="0" width="512" height="512" fill="#C4552D"/>
  <g transform="translate(256 256) scale(0.72) translate(-248 -215)">
    ${conteudoPote}
  </g>
</svg>`

const tarefas = [
  { origem: svgBase, arquivo: 'pwa-192x192.png', tamanho: 192 },
  { origem: svgBase, arquivo: 'pwa-512x512.png', tamanho: 512 },
  { origem: svgBase, arquivo: 'apple-touch-icon.png', tamanho: 180 },
  { origem: svgMaskable, arquivo: 'pwa-maskable-192x192.png', tamanho: 192 },
  { origem: svgMaskable, arquivo: 'pwa-maskable-512x512.png', tamanho: 512 },
]

for (const { origem, arquivo, tamanho } of tarefas) {
  const destino = path.join(pastaPublic, arquivo)
  await sharp(Buffer.from(origem))
    .resize(tamanho, tamanho)
    .png()
    .toFile(destino)
  console.log(`gerado: public/${arquivo} (${tamanho}x${tamanho})`)
}

// favicon.svg: mesmo ícone, vetorial (escala bem em qualquer tamanho de aba)
writeFileSync(path.join(pastaPublic, 'favicon.svg'), svgBase)
console.log('gerado: public/favicon.svg')
