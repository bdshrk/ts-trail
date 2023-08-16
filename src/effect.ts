// stores an effect
interface Effect {
    name: string
    desc: string

    start: (char : Character) => void
    each_turn: (char : Character) => void
    end: (char : Character) => void
}

// define character effects
var char_effects: {[key: string]: Effect} = {
    hunger: {
        name: "Hunger",
        desc: "I need to eat food, or I will start to starve!",
        start: (char) => {
            addLine(char.name + " is hungry.", 2)
        },
        each_turn: (char) => {},
        end: (char) => {
            addLine(char.name + " is no longer hungry.", 2)
        },
    },
    starving: {
        name: "Starving",
        desc: "I am starving!",
        start: (char) => {
            addLine(char.name + " is now starving.", 2)
        },
        each_turn: (char) => {
            addLine(char.name + " suffers from starvation. (1 damage)", 2)
            char.hurt(1)
        },
        end: (char) => {
            addLine(char.name + " is no longer starving.", 2)
        },
    },
}

// handle player and other effects (hunger, etc...)
function handleEffects(): void {
    for (let player of players) {
        for (let effect of player.effects) {
            effect.each_turn(player)
        }
    }

    for (let other of others) {
        for (let effect of other.effects) {
            effect.each_turn(other)
        }
    }
}

// turn a list of effect names into effect objects
function lookupEffects(names: string[]): Effect[] {
    let effects: Effect[] = []

    for (let effect_name of names) {
        if (Object.keys(char_effects).indexOf(effect_name) != -1) {
            effects.push(char_effects[effect_name])
        }
    }

    return effects
}
