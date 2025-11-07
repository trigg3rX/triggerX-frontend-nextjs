# Safe Wallet Token Template Addition

This guide explains how to introduce a new Safe Wallet job template for specific token so it is visible in the UI, mapped to supported tokens, and executed from the creation modal. The process touches three main areas:

1. `src/components/safe-wallet/` – UI for templates and the job creation modal
2. `src/hooks/useCreateJob.ts` – hooks that submit jobs usign SDK
3. `src/utils/tokenTemplateMap.ts` – maps token symbols to template IDs for filtering

---

## 1. Define template metadata (`src/data/templates.json`)

- Set `tokenTemplateTitle` to the concise label you want displayed in Safe Wallet modals
- Ensure the `id` matches the files you create in later steps (e.g. `"balance-maintainer"`).

## 2. Provide the template UI (`src/components/safe-wallet/token-templates/`)

- Create a component that renders the template specific preview or configuration UI (see `balanceMaintainer.tsx`).
- Confirm that `ExpandableTemplateSection` or `renderTemplate.tsx` renders your component when the template is expanded. The header text reads `template.tokenTemplateTitle`, so verify the metadata provides it or intentionally relies on the fallback.

## 3. Implement the job handler (`src/components/safe-wallet/token-templates/handlers/`)

- Add a handler module that builds the SDK payload and invokes `createJob`. You can follow `createBalanceMaintainerJob.ts`: accept a context object (includes `createJob`, `tokenSymbol`, `chainId`, `safeAddress`, `autotopupTG`, etc.) and return `{ success, error }`.
- Register the handler in `handlers/index.ts` by extending `handlerMap`. The modal consults `hasTemplateHandler` and `runTemplateHandler` to execute handlers.

## 4. Map tokens to the template (`src/utils/tokenTemplateMap.ts`)

- Update the `TOKEN_TEMPLATE_MAP` entry for the tokens you want to support. The helper `filterTemplatesForToken` is used by `CreateJobModal` to display only allowed templates for the selected token.
- Use the wildcard `"*"` entry to make a template available for every token.

## 5. Surface the template in the modal (`src/components/safe-wallet/safe-tokens/CreateJobModal.tsx`)

- The modal pulls template metadata from `templates.json`, filters via `filterTemplatesForToken`, and relies on the handler registry to execute template-specific flows.
- No code changes are required in the modal when a handler is present; it will call your handler automatically.
- Ensure any additional state your handler requires can be derived from the existing context or consider extending the context signature.

## 6. Trigger job creation (`src/hooks/useCreateJob.ts`)

- The `useCreateJob` hook encapsulates API mutation logic. Handlers should call `createJob` from this hook and handle the result.
- If your template needs new API parameters, update the hook and shared types (`src/types/sdk-job.ts`) accordingly.

Following the steps above keeps template logic modular: UI lives with Safe Wallet components, execution flow is captured by handlers, all job creation goes through `useCreateJob` means SDK, and token-to-template visibility is centralized in `tokenTemplateMap.ts`.
