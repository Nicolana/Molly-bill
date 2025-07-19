import mitt from 'mitt'

type Events = {
    'bill:delete': number
}

const emitter = mitt<Events>()

export default emitter
