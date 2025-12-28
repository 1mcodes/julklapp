# View Implementation Plan Create New Draw

## 1. Overview
The Create New Draw view allows a draw author to name a Secret Santa event and enter 3–32 participants with their details (name, surname, email, gift preferences). It validates input client-side and server-side, shows inline errors, disables inputs while submitting, and displays a spinner.

## 2. View Routing
Path: `/dashboard/create`

## 3. Component Structure
- CreateDrawPage (Astro page wrapper)
  - DashboardLayout (wraps TabNav)
  - DrawForm
    - ParticipantFieldGroup (for each participant)
      - NameInput
      - SurnameInput
      - EmailInput
      - GiftPreferencesTextarea
      - RemoveParticipantButton (if >3)
    - AddParticipantButton (if <32)
    - SpinnerButton (submit)

## 4. Component Details

### CreateDrawPage
- Description: Astro page at `/dashboard/create` that renders the DrawForm inside the dashboard layout.
- Elements: `<DashboardLayout>` (with TabNav active on “Create New Draw”), contains `<DrawForm />`.
- Props: none.
- Events: none.

### DrawForm
- Description: Manages form state for draw name and participants, handles submission.
- Main elements:  
  - Text input for draw name  
  - Dynamic list of `<ParticipantFieldGroup />`  
  - `<AddParticipantButton />`  
  - `<SpinnerButton />` (submits form)
- Handled events:  
  - onChange for draw name  
  - onAddParticipant (adds blank participant)  
  - onRemoveParticipant(index)  
  - onChangeParticipantField(index, field, value)  
  - onSubmit
- Validation:  
  - Draw name non-empty  
  - Participants array length 3–32  
  - Each participant.name and .surname non-empty  
  - email matches `/^\S+@\S+\.\S+$/`  
  - giftPreferences length ≤10000  
- Types:  
  - Props: none  
  - Local VM:  
    ```ts
    interface ParticipantVM {
      id: string; // uuid or index key
      name: string;
      surname: string;
      email: string;
      giftPreferences: string;
      errors?: Record<keyof Omit<ParticipantVM,"id">, string>;
    }
    interface DrawFormVM {
      name: string;
      nameError?: string;
      participants: ParticipantVM[];
      formError?: string;
      isSubmitting: boolean;
    }
    ```
- API DTO mapping: VM ⇒ CreateDrawCommand  
  - `giftPreferences` ⇒ `gift_preferences`

### ParticipantFieldGroup
- Description: Renders inputs for one participant and remove button.
- Elements:
  - `<Input>` for name, surname, email  
  - `<Textarea>` for gift preferences  
  - `<Button>` remove (if >3 participants)
- Handled events:  
  - onChange for each field calls parent callback  
  - onClick remove calls parent callback
- Validation: inline per-field error from props.errors
- Props:
  ```ts
  interface ParticipantFieldGroupProps {
    participant: ParticipantVM;
    canRemove: boolean;
    onChange(field: keyof Omit<ParticipantVM,"id">, value: string): void;
    onRemove(): void;
  }
  ```

### AddParticipantButton
- Description: Button to append a new participant.
- Elements: `<Button>` labeled “Add Participant”
- Events: onClick calls parent
- Props: `disabled: boolean`

### SpinnerButton
- Description: Submit button with spinner when submitting.
- Elements: `<Button>` that shows spinner icon and disables form inputs.
- Events: onClick triggers submit
- Props:
  ```ts
  interface SpinnerButtonProps {
    isLoading: boolean;
    disabled: boolean;
    label: string;
  }
  ```

## 5. Types
- CreateDrawRequest (DTO to API)
  ```ts
  interface CreateDrawRequest {
    name: string;
    participants: {
      name: string;
      surname: string;
      email: string;
      gift_preferences: string;
    }[];
  }
  ```
- DrawDTO (response)
  ```ts
  interface DrawDTO {
    id: string;
    name: string;
    created_at: string;
  }
  ```

- ViewModel types defined above in DrawFormVM & ParticipantVM.

## 6. State Management
- Use a `useDrawForm` custom hook:
  - State: `DrawFormVM`
  - Actions: `setName`, `addParticipant`, `removeParticipant`, `updateParticipantField`, `submitForm`
  - Hook returns state and action handlers.
- Form resets errors on field change.  

## 7. API Integration
- Endpoint: `POST /api/draws`
- Request: `CreateDrawRequest` JSON.
- Response: `DrawDTO` on 201.
- On 400: parse JSON `{ details: [{ field, message }] }`, map to field-level errors.
- On network or 500: show formError toast/message.

## 8. User Interactions
1. Load page: focus cursor on Draw Name input.
2. Edit draw name.
3. Fill participant fields.
4. Click “Add Participant” until desired number (max 32).
5. Click remove on groups when allowed (min 3).
6. Click “Create Draw”:
   - Disables inputs, shows spinner.
   - On success: navigate to `/dashboard/created` or show success toast.
   - On validation error: show inline errors, re-enable inputs.
   - On unexpected error: show global error message.

## 9. Conditions and Validation
- Participants count: disable Add button at 32, disable Remove when only 3.
- Inline validation on blur or on submit.
- Submit disabled if any validation errors exist in local state.
- Email field uses HTML `type="email"` for basic browser validation.

## 10. Error Handling
- Field errors: rendered under inputs in red text.
- Global form error: banner or toast for unexpected errors.
- Network failures: retry option via a “Try Again” button.
- Clear errors on new submission attempt.

## 11. Implementation Steps
1. Create `/src/pages/dashboard/create.astro` wrapping `<DrawForm>` in layout.  
2. Implement `useDrawForm` hook in `/src/hooks/useDrawForm.ts`.  
3. Build `DrawForm.tsx` under `/src/components/CreateDraw`: form layout, state integration.  
4. Implement `ParticipantFieldGroup.tsx` with inputs and remove button.  
5. Add `AddParticipantButton.tsx` and `SpinnerButton.tsx` (or use Shadcn/ui variants).  
6. Define and export VM and DTO types in `/src/types.ts` or a `create-draw.types.ts`.  
7. Integrate API call in `useDrawForm` via `fetch("/api/draws", ...)`.  
8. Handle response statuses, map errors to state.  
9. Style form using Tailwind & Shadcn/ui components in two-column grid responsive layout.  
10. Add focus management and accessibility attributes.  
11. Write unit tests (Vitest) for `useDrawForm` logic and validation.  
12. Manually QA form for edge cases (min/max participants, invalid inputs, network errors).
