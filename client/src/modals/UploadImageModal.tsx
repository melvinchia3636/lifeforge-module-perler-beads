import { useForgeMutation } from '@lifeforge/api'
import { useModuleTranslation } from '@lifeforge/localization'
import {
  type FileValue,
  FileInput,
  Flex,
  Icon,
  ModalHeader,
  Stack,
  Text,
  useModalStore
} from '@lifeforge/ui'

import { forgeAPI } from '@/manifest'

import ImageGridModal from './ImageGridModal'

function UploadImageModal({ onClose }: { onClose: () => void }) {
  const { t } = useModuleTranslation()
  const { open } = useModalStore()

  const processMutation = useForgeMutation(forgeAPI.images.process, {
    action: 'create',
    queryKey: forgeAPI.images.key
  })

  const handleSelect = async (value: FileValue) => {
    if (value.type !== 'upload') {
      return
    }

    try {
      const ref = await processMutation.mutateAsync({ image: value.file })

      onClose()
      open(ImageGridModal, {
        key: ref.key,
        src: forgeAPI.getMedia({ key: ref.key })
      })
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <Stack minWidth={{ base: '90vw', md: '40vw' }}>
      <ModalHeader
        icon="tabler:photo-up"
        title="uploadImage"
        onClose={onClose}
      />
      <FileInput
        disabled={processMutation.isPending}
        icon="tabler:photo"
        label="Image"
        mimeTypes={{
          image: ['png', 'jpeg', 'webp', 'gif', 'bmp']
        }}
        value={{ type: 'empty' }}
        onChange={handleSelect}
      />
      {processMutation.isPending && (
        <Flex align="center" gap="sm">
          <Icon icon="svg-spinners:ring-resize" />
          <Text color="muted">{t('messages.processing')}</Text>
        </Flex>
      )}
    </Stack>
  )
}

export default UploadImageModal
