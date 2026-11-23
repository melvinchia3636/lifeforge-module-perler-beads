import { useModuleTranslation } from '@lifeforge/localization'
import { Button, ModuleHeader, useModalStore } from '@lifeforge/ui'

import UploadImageModal from '@/modals/UploadImageModal'

function PerlerBeads() {
  const { t } = useModuleTranslation()
  const { open } = useModalStore()

  return (
    <ModuleHeader
      trailing={
        <Button
          icon="tabler:photo-up"
          onClick={() => open(UploadImageModal, {})}
        >
          {t('buttons.uploadImage')}
        </Button>
      }
    />
  )
}

export default PerlerBeads
