import { forgeRouter, writeContractFileToClient } from '@lifeforge/server-utils'

import * as imageRoutes from './routes/images'

const routes = forgeRouter({
  images: imageRoutes
})

writeContractFileToClient(routes, import.meta.dirname)

export default routes
