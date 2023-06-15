import { ifosConfig } from 'config/constants'
import CurrentIfo from './CurrentIfo'
import SoonIfo from './SoonIfo'

/**
 * Note: currently there should be only 1 active IFO at a time
 */
const activeIfo = ifosConfig.find((ifo) => ifo.isActive)
console.log('🚀 ~ file: Ifo.tsx:9 ~ activeIfo:', activeIfo)
console.log('activeIfo', activeIfo)

const Ifo = () => {
  return activeIfo ? <CurrentIfo activeIfo={activeIfo} /> : <SoonIfo />
}

export default Ifo
