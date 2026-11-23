import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import z from 'zod'

import { useForgeMutation } from '@lifeforge/api'
import { useModuleTranslation } from '@lifeforge/localization'
import {
  FormModal,
  TextField,
  createDefaultValues,
  toast
} from '@lifeforge/ui'

import { forgeAPI } from '@/manifest'
import type { SavedBlueprint } from '@/pages/Editor/types'

const schema = z.object({
  name: z.string().trim().min(1, 'Required')
})

function SaveBlueprintModal({
  data: { grid, width, height, onSaved },
  onClose
}: {
  data: {
    grid: string[][]
    width: number
    height: number
    onSaved: (blueprint: SavedBlueprint) => void
  }
  onClose: () => void
}) {
  const { t } = useModuleTranslation()

  const form = useForm({
    defaultValues: createDefaultValues(schema),
    resolver: zodResolver(schema)
  })

  const mutation = useForgeMutation(forgeAPI.blueprints.create, {
    action: 'create',
    queryKey: forgeAPI.blueprints.key
  })

  const handleSubmit = async (values: z.infer<typeof schema>) => {
    const entry = await mutation.mutateAsync({
      name: values.name,
      width,
      height,
      grid
    })

    onSaved({ id: entry.id, name: entry.name })
    toast.success(t('messages.blueprintSaved'))
  }

  return (
    <FormModal
      form={form}
      submissionConfig={{
        handler: handleSubmit,
        icon: 'tabler:device-floppy',
        label: 'save'
      }}
      uiConfig={{
        icon: 'tabler:device-floppy',
        title: 'saveBlueprint',
        onClose
      }}
    >
      <TextField
        required
        autoFocus
        control={form.control}
        icon="tabler:pencil"
        label="inputs.name"
        name="name"
        placeholder={t('inputs.namePlaceholder')}
      />
    </FormModal>
  )
}

export default SaveBlueprintModal
