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

function RenameBlueprintModal({
  data: { blueprint, onRenamed },
  onClose
}: {
  data: {
    blueprint: SavedBlueprint
    onRenamed: (name: string) => void
  }
  onClose: () => void
}) {
  const { t } = useModuleTranslation()

  const form = useForm({
    defaultValues: {
      ...createDefaultValues(schema),
      name: blueprint.name
    },
    resolver: zodResolver(schema)
  })

  const mutation = useForgeMutation(
    forgeAPI.blueprints.update.input({ id: blueprint.id }),
    {
      action: 'update',
      queryKey: forgeAPI.blueprints.key
    }
  )

  const handleSubmit = async (values: z.infer<typeof schema>) => {
    const entry = await mutation.mutateAsync({ name: values.name })

    onRenamed(entry.name)
    toast.success(t('messages.blueprintRenamed'))
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
        icon: 'tabler:pencil',
        title: 'renameBlueprint',
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

export default RenameBlueprintModal
