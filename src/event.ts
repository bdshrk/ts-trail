// stores a gameevent
interface GameEvent {
    next_event: (() => [id: number, turns: number] | null) | null
    text: string
    effect: (() => void) | null
}

// store queued events for events system
// on turn "turn", play event "index" of id "id".
var queued_events: {[turn: number]: [index: number, id: number]} = {}

// declare event chains
var event_chains: ({[key: number]: GameEvent})[] = [
    {
        0: {
            next_event: () => {return [1, 1]},
            text: "{0} chatted to {1} about food 1.",
            effect: null,
        },
        1: {
            next_event: null,
            text: "{0} chatted to {1} about food 2. Get food.",
            effect: () => {
                modifyPartyInv("food", 4)
            },
        },
    },
    {
        0: {
            next_event: null,
            text: "The party is attacked by some enemies!",
            effect: () => {
                startRandomCombat()
            },
        },
    },
]

// returns a random event chain
function getEventChainRandom(): number {
    return Math.floor(Math.random() * event_chains.length)
}

// handle events each turn.
// handles creating, playing and deleting events from the queue
function handleEvents(): void {
    if (queued_events[turn_count]) {
        let [index, id] = queued_events[turn_count]
        playEvent(index, id)
        delete queued_events[turn_count]
        return
    }
    if (Object.keys(queued_events).length < 3) {
        createEvent()
    }
}

// plays an event of index and stage id.
function playEvent(index: number, id: number): void {
    let event = event_chains[index][id]
    
    let text: string = event.text

    let o: Character[] = getRandomCharOrder("player")
    text = formatText(text, {
        characters: {
            0: o[0],
            1: o[1],
            2: o[2],
            3: o[3],
        }
    })

    addLine(text, 1)

    // process next event in chain
    if (event.next_event) {
        let result = event.next_event()
        if (result != null) {
            let [id, turns] = result
            addQueuedEvent(index, id, turns)
        }
    }

    if (event.effect) {
        event.effect()
    }
}

// creates a random event
function createEvent(): void {
    let event_index: number = getEventChainRandom()
    playEvent(event_index, 0)
}

// queues an event to occur in x turns
function addQueuedEvent(index: number, id: number, turns: number): void {
    let insertion_index = turn_count + turns

    while (Object.keys(queued_events).indexOf(insertion_index.toString()) != -1) {
        insertion_index += 1
    }

    queued_events[insertion_index] = [index, id]
}