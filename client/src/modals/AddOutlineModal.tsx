import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import z from 'zod'

import {
  CheckboxField,
  FormModal,
  ListboxField,
  NumberField,
  createDefaultValues
} from '@lifeforge/ui'

import { MARD_COLORS } from '@/constants/mardColors'

const schema = z.object({
  width: z.number().int().min(1).max(50),
  color: z.string().min(1),
  skipCorners: z.boolean()
})

type AddOutlineForm = z.infer<typeof schema>

interface AddOutlineModalProps {
  data: {
    defaultColor: string
    onSubmit: (values: AddOutlineForm) => void
  }
  onClose: () => void
}

function AddOutlineModal({
  data: { defaultColor, onSubmit },
  onClose
}: AddOutlineModalProps) {
  const form = useForm<AddOutlineForm>({
    defaultValues: {
      ...createDefaultValues(schema),
      width: 1,
      color: defaultColor,
      skipCorners: false
    },
    resolver: zodResolver(schema)
  })

  return (
    <FormModal
      form={form}
      submissionConfig={{
        handler: onSubmit,
        icon: 'tabler:border-outer',
        label: 'addOutline'
      }}
      uiConfig={{
        icon: 'tabler:border-outer',
        title: 'addOutline',
        onClose
      }}
    >
      <NumberField
        required
        control={form.control}
        icon="tabler:arrows-horizontal"
        label="Outline Width"
        max={50}
        min={1}
        name="width"
        placeholder="1"
      />
      <ListboxField
        required
        control={form.control}
        icon="tabler:palette"
        label="Color"
        name="color"
        options={MARD_COLORS.map(({ code, hex }) => ({
          value: code,
          text: code,
          color: hex
        }))}
      />
      <CheckboxField
        control={form.control}
        icon="tabler:corner-down-right"
        label="Skip Corner Beads"
        name="skipCorners"
      />
    </FormModal>
  )
}

export default AddOutlineModal
