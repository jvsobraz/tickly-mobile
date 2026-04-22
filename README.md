# Tickly Mobile

App nativo para iOS e Android da plataforma Tickly, construído com **React Native + Expo SDK 54**. Paridade completa de funcionalidades com o frontend web, incluindo compra de ingressos, QR code offline, scanner de check-in, revenda, transferência, fila virtual, mapa de assentos, programa de fidelidade e painel do organizador.

**Repositório:** [github.com/jvsobraz/tickly-mobile](https://github.com/jvsobraz/tickly-mobile)  
**Teste rápido:** Expo Go no iPhone/Android — sem conta de desenvolvedor necessária

---

## Sumário

- [Stack](#stack)
- [Arquitetura](#arquitetura)
- [Funcionalidades](#funcionalidades)
- [Pré-requisitos](#pré-requisitos)
- [Instalação e execução](#instalação-e-execução)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Testando no dispositivo físico (Expo Go)](#testando-no-dispositivo-físico-expo-go)

---

## Stack

| Tecnologia | Uso |
|---|---|
| React Native 0.81 | Framework mobile cross-platform |
| Expo SDK 54 | Toolchain, câmera, secure store, file system |
| Expo Router 6 | Navegação file-based (igual ao Next.js) |
| TypeScript 5.9 | Tipagem estática |
| TanStack Query 5 | Cache, fetching e sincronização de dados |
| Zustand 5 | Estado global (autenticação) |
| Axios 1.x | Cliente HTTP com interceptors JWT |
| expo-secure-store | Persistência segura dos tokens |
| expo-camera | Scanner de QR code para check-in |

---

## Arquitetura

O app usa **Expo Router** com roteamento baseado em sistema de arquivos (file-based routing). A estrutura de `app/` espelha as URLs de navegação.

```
mobile/
├── app/
│   ├── _layout.tsx              # Root layout (QueryClient + AuthProvider)
│   ├── index.tsx                # Redirect para tabs ou login
│   ├── (tabs)/                  # Tabs principais (Bottom Tab Navigator)
│   │   ├── events.tsx           # Listagem e busca de eventos
│   │   ├── my-tickets.tsx       # Meus ingressos com QR code
│   │   ├── loyalty.tsx          # Programa de fidelidade
│   │   ├── scan.tsx             # Scanner QR para check-in
│   │   ├── notifications.tsx    # Notificações in-app
│   │   └── profile.tsx          # Perfil do usuário
│   ├── (auth)/                  # Fluxo de autenticação
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── event/[id].tsx           # Detalhe do evento (compra, avaliações, waitlist, split)
│   ├── admin/                   # Painel do organizador
│   │   ├── index.tsx            # Dashboard admin
│   │   ├── create-event.tsx
│   │   ├── my-events.tsx
│   │   ├── analytics.tsx
│   │   ├── coupons.tsx
│   │   ├── flash-sales.tsx
│   │   ├── payment-links.tsx
│   │   └── financial.tsx
│   ├── resale/index.tsx         # Mercado de revenda
│   ├── transfer/[id].tsx        # Transferir ingresso
│   ├── split/
│   │   ├── [token].tsx          # Pagar parcela do split
│   │   └── my.tsx               # Meus splits
│   ├── seat-map/[id].tsx        # Mapa de assentos do evento
│   └── queue/[id].tsx           # Fila virtual do evento
├── src/
│   ├── api/                     # Clientes HTTP por domínio
│   │   ├── auth.ts
│   │   ├── events.ts
│   │   ├── tickets.ts
│   │   ├── resale.ts
│   │   ├── transfer.ts
│   │   ├── loyalty.ts
│   │   ├── notifications.ts
│   │   ├── split.ts
│   │   └── ...
│   ├── notifications.ts         # Setup push notifications (permissão + registro de token)
│   └── store/
│       └── auth.ts              # Zustand store (JWT + refresh token)
├── .env                         # EXPO_PUBLIC_API_URL
└── app.json                     # Configuração Expo (scheme, plugins, intentFilters)
```

**Padrões:**

| Padrão | Detalhe |
|---|---|
| File-based routing | Cada arquivo em `app/` vira uma rota automaticamente |
| TanStack Query | `useQuery` + `useMutation` para todos os dados remotos; cache invalidado por chave após mutations |
| Zustand + SecureStore | Token JWT e refresh armazenados com `expo-secure-store`; hidratados na inicialização |
| Axios interceptor | Injeta `Authorization: Bearer` automaticamente; faz refresh automático em 401 |
| `PagedResult<T>` | Backend retorna `{ items, total, page, pageSize, totalPages }` para listagens paginadas |
| QR code base64 | Backend entrega QR code pré-renderizado como PNG base64 — exibido com `Image` nativo |
| Deep links | `scheme: tickly://` + `intentFilters` Android; `_layout.tsx` intercepta e navega para a rota correta |
| Push notifications | `expo-notifications` solicita permissão, registra token no backend e exibe alertas nativos |

---

## Funcionalidades

### Para compradores

| Feature | Descrição |
|---|---|
| Login / Cadastro | JWT com refresh token rotativo, persistido via SecureStore |
| Listagem de eventos | Busca por texto e filtro por categoria |
| Detalhe do evento | Tipos de ingresso, flash sales, avaliações, fila de espera |
| Compra de ingressos | Seleção de tipo + quantidade; criação de pedido via API |
| Pagamento split | Dividir ingresso entre amigos via link de pagamento |
| Meus ingressos | QR code PNG exibido por `Image` + badge "USADO" |
| Revender ingresso | Modal nativo com campo de preço — funciona em iOS e Android (sem `Alert.prompt`) |
| Transferência | Enviar ingresso para outro usuário por e-mail; aceitar via deep link |
| Mercado de revenda | Buscar por evento ID; comprar ingresso de terceiros |
| Push notifications | Recebe notificação nativa ao ter ingresso confirmado; toque navega para a tela correta |
| Fila virtual | Entrar na fila de espera de eventos esgotados |
| Mapa de assentos | Visualizar e selecionar assentos disponíveis |
| Programa de fidelidade | Saldo de pontos, tier Bronze/Silver/Gold/Platinum, histórico |
| Avaliações | Nota de 1–5 estrelas + comentário pós-evento |
| Notificações | Lista com badge de não lidas; marcar como lida / todas |

### Para organizadores

| Feature | Descrição |
|---|---|
| Scanner QR | Câmera traseira para check-in; validação via API; exibe titular + status |
| Criar evento | Nome, data, local, tipos de ingresso |
| Meus eventos | Listagem e gestão dos eventos criados |
| Analytics | Vendas, receita e taxa de check-in |
| Cupons | Criar e listar cupons de desconto |
| Flash sales | Promoções por tempo limitado |
| Payment links | Links avulsos de pagamento |
| Financeiro | Extrato financeiro do organizador |

---

## Pré-requisitos

- Node.js 18+
- npm 9+
- [Expo CLI](https://docs.expo.dev/get-started/installation/): `npm install -g expo-cli`
- App **Expo Go** instalado no celular ([iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
- Backend rodando (local ou Railway)

---

## Instalação e execução

```bash
# 1. Instalar dependências
cd mobile
npm install

# 2. Configurar a URL da API (ver seção abaixo)

# 3. Iniciar o servidor de desenvolvimento
npx expo start

# 4. Escanear o QR code com o app Expo Go no celular
```

Para limpar o cache do Metro Bundler (útil após trocar variáveis de ambiente):

```bash
npx expo start --clear
```

---

## Estrutura de pastas

Ver seção [Arquitetura](#arquitetura) acima para o mapa completo de pastas.

---

## Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto `mobile/`:

```env
# URL base da API (sem barra no final)
EXPO_PUBLIC_API_URL=https://tickly-backend-production.up.railway.app

# Para desenvolvimento local (backend rodando na máquina):
# EXPO_PUBLIC_API_URL=http://SEU_IP_LOCAL:5000
```

> Para usar com backend local no celular físico, use o IP da sua máquina na rede (ex: `192.168.1.x`) — `localhost` não funciona no dispositivo físico.

Após alterar o `.env`, reinicie com `npx expo start --clear`.

---

## Deep Links

O app responde ao scheme `tickly://` e a URLs HTTPS do domínio de produção.

| URL | Ação |
|---|---|
| `tickly://transfer/accept/{token}` | Abre tela para aceitar transferência de ingresso |
| `tickly://split/{token}` | Abre tela para pagar parcela de split |
| `https://tickly-frontend-rho.vercel.app/ticket-transfers/*` | Redireciona para o app no Android via App Links |

O link de aceitação de transferência é enviado por e-mail pelo backend. Com o app instalado, o link abre diretamente na tela correta.

---

## Push Notifications

O fluxo completo de push notifications funciona assim:

1. No primeiro acesso, `registerForPushNotificationsAsync()` solicita permissão ao usuário
2. Obtém o token Expo do dispositivo e envia para `PUT /Auth/push-token` no backend
3. O backend armazena o token em `users.ExpoPushToken`
4. Quando um pagamento é confirmado via Stripe webhook, o backend dispara push via Expo Push API
5. O app exibe a notificação nativamente; ao tocar, navega para a tela indicada

> **Nota:** Push notifications remotas requerem um build nativo (EAS Build). Em Expo Go, apenas notificações locais funcionam.

---

## Testando no dispositivo físico (Expo Go)

A forma mais rápida de testar sem conta de desenvolvedor Apple/Google:

1. Instale o **Expo Go** no celular
2. Rode `npx expo start` no terminal
3. Escaneie o QR code exibido no terminal com a câmera do celular (iOS) ou dentro do Expo Go (Android)

O app carrega diretamente no seu celular em tempo real. Qualquer alteração no código é refletida instantaneamente via hot reload.

> **Limitação:** Expo Go não suporta módulos nativos customizados. Para publicar na App Store / Play Store com todas as permissões nativas, é necessário gerar um **build nativo** com `eas build` (requer conta Expo + conta de desenvolvedor Apple/Google).

---

## Deploy

| Plataforma | Comando | Observação |
|---|---|---|
| Expo Go | `npx expo start` | Teste rápido — sem build nativo |
| Preview (APK/IPA) | `eas build --profile preview` | Requer conta Expo EAS |
| Produção | `eas build --profile production` | Requer conta Apple Developer / Google Play |

Para configurar EAS Build:

```bash
npm install -g eas-cli
eas login
eas build:configure
```
