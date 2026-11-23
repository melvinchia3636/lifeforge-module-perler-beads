import { createForgeContractBuilder } from '@lifeforge/server-utils'

import * as schema from './schema.drizzle'

export type PerlerBeadsSchema = typeof schema

const forge = createForgeContractBuilder({ schema })

export default forge
