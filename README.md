# CareHub — App (fed-carehub)

Aplicativo mobile do **CareHub**, plataforma de apoio ao cuidado de entes queridos/pacientes.
Atende três perfis — **familiar**, **cuidador** e **administrador** — com rotina (tarefas e
medicamentos), diário de cuidados, histórico médico, vínculos por código, busca de cuidadores
e painel administrativo.

> API correspondente: **[bff-carehub](../bff-carehub)** (Node + Express + MySQL).

---

## 🧱 Stack

- **React Native 0.83** + **Expo ~55** + **React 19**
- **TypeScript**
- **React Navigation** (native-stack + bottom-tabs)
- **axios** (cliente HTTP)
- **AsyncStorage** (token e sessão)
- **dayjs** / **date-fns** (datas)
- **expo-notifications** (lembretes), **expo-image-picker** (fotos)
- **react-native-reanimated**, **react-native-calendars**, **@expo/vector-icons**

---

## 📁 Estrutura

```
fed-carehub/
├── App.tsx                 # ponto de entrada
├── app.json                # configuração Expo (nome, ícone, permissões, EAS)
├── eas.json                # perfis de build (preview = APK, production = AAB)
└── src/
    ├── assets/             # imagens e ícones
    ├── components/         # componentes reutilizáveis (Text, AnimatedPressable, ...)
    ├── config/
    │   └── api.ts          # instância axios + baseURL da API
    ├── context/            # ThemeContext (tema/cores) e ToastContext
    ├── navigation/
    │   ├── NavegadorRaiz.tsx   # stack raiz (login → abas)
    │   ├── Abas.tsx           # abas do familiar/cuidador
    │   └── AbasAdmin.tsx      # abas do administrador
    ├── screens/            # telas (Home, Tarefas, Medicamentos, Diario, Perfil, admin/, ...)
    ├── ferramentas/        # utilidades (máscaras, lógica de data)
    └── utils/              # autenticação, terminologia, onboarding
```

---

## ⚙️ Configuração da API

A URL base fica em **`src/config/api.ts`**:

```ts
export const API_URL = 'https://legacyofthevaliant.com/api';
```

Para apontar para o **backend local**, troque por (use o IP da máquina ao testar em celular físico):

```ts
export const API_URL = 'http://192.168.x.x:3000/api';
```

O token JWT é guardado no AsyncStorage (`@CareHub:token`) e injetado automaticamente no header
`Authorization` de cada requisição.

---

## ▶️ Como rodar (desenvolvimento)

```bash
npm install

# inicia o Metro/Expo
npx expo start
```

- Leia o QR code com o app **Expo Go** (ou rode em emulador Android/iOS).
- Confira que a API (`bff-carehub`) está acessível pela URL configurada em `api.ts`.

---

## 📦 Build (EAS)

O projeto usa **EAS Build**. Perfis definidos em `eas.json`:

| Perfil       | Saída            | Uso                          |
|--------------|------------------|------------------------------|
| `preview`    | APK              | Instalar e testar no celular |
| `production` | AAB (app-bundle) | Publicar na Play Store       |

```bash
# autenticar (uma vez)
npx eas-cli login

# gerar APK de teste
npx eas-cli build -p android --profile preview

# gerar bundle para a loja
npx eas-cli build -p android --profile production
```

O build roda na nuvem do EAS; ao final, a página do build oferece o download do artefato.

> O `owner` e o `projectId` em `app.json` apontam para a conta EAS dona do projeto. Para buildar
> em outra conta, faça login nessa conta e ajuste/relinke o projeto (`eas init`).

---

## 👥 Perfis e terminologia

- **Familiar** — cadastra o ente querido, monta a rotina, acompanha e vincula cuidadores.
- **Cuidador** — vincula-se a pacientes por código, monta perfil profissional e aparece na busca.
- **Administrador** — painel com métricas, gestão de usuários/familiares e validação de cuidadores.

O termo do paciente muda conforme o perfil (ver `src/utils/terminologia.ts`):
- Familiar → **Ente Querido**
- Cuidador → **Pessoa Cuidada**

---

## ✨ Principais funcionalidades

- **Home**: resumo do dia (tarefas/medicamentos), acesso rápido e **lembretes** de dados pendentes.
- **Rotina**: tarefas e medicamentos com agenda e repetição.
- **Diário de cuidados**: registros categorizados (humor, sintomas, ocorrências, etc.).
- **Histórico médico**: condições, alergias, plano de saúde, contatos de emergência, etc.
- **Vínculo por código**: convite de 6 dígitos entre familiar e cuidador.
- **Busca de cuidadores**: pesquisa por texto + filtros por especialidade (somente aprovados).
- **Painel admin**: dashboard, familiares com pacientes vinculados, validação de cuidadores.
