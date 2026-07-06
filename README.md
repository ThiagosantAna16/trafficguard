# TrafficGuard — pacote de redesenho (React Native)

Este pacote contém as telas e componentes já reescritos no novo estilo (editorial,
sóbrio, sem emoji, ícones lineares simples). A estrutura espelha exatamente o
repositório original — copie cada arquivo por cima do correspondente em `frontend/`.

## O que mudou
- `src/theme/colors.ts` — paleta nova (ink escuro, sem glow/gradiente).
- `src/theme/typography.ts` **(novo)** — Piazzolla (serifa, títulos/números),
  Archivo (sans, corpo/UI), Space Mono (dados/horários).
- `src/components/Icon.tsx` **(novo)** — ícones lineares em SVG (casa, rota, sino,
  perfil, busca, editar, check, e-mail, cadeado, sair). Substituem todos os emojis.
- `src/components/Button.tsx`, `Card.tsx`, `StatusBadge.tsx` — reestilizados: sem
  sombra/glow, cantos retos, bordas finas.
- Todas as telas em `app/` — reescritas visualmente, mantendo a lógica original
  (chamadas de API, navegação, validação) intacta.
- `assets/logo-mark.png` **(novo)** — o brasão da logo enviada, com fundo removido.

## Passo a passo para aplicar

1. **Copie os arquivos.** Cada arquivo neste pacote tem o mesmo caminho relativo
   de `frontend/` no seu repositório — sobrescreva os existentes.

2. **Instale as novas dependências** (fontes + ícones):
   ```
   npx expo install react-native-svg
   npm install @expo-google-fonts/piazzolla @expo-google-fonts/archivo @expo-google-fonts/space-mono
   ```

3. **Rode o app** normalmente (`npm start`). O `app/_layout.tsx` novo já carrega as
   fontes antes de exibir qualquer tela (com splash screen controlada).

## Observações
- A tela `routes/[id]/edit` (link "Editar configurações") não existia no código
  original nem foi criada agora — o botão aponta para essa rota como já apontava antes.
- Removi todo uso de emoji e ícone de biblioteca de terceiros (ex: nenhuma dependência
  de ícone tipo FontAwesome) — os ícones são só os SVGs simples em `Icon.tsx`.
- Paleta e tipos batem com o protótipo HTML que revisamos juntos
  (`TrafficGuard Redesign.dc.html` neste projeto).
