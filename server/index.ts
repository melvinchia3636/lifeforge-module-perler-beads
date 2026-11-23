import { forgeRouter, writeContractFileToClient } from '@lifeforge/server-utils'

import * as blueprintRoutes from './routes/blueprints'
import * as imageRoutes from './routes/images'

const routes = forgeRouter({
  blueprints: blueprintRoutes,
  images: imageRoutes
})

writeContractFileToClient(routes, import.meta.dirname)

export default routes
