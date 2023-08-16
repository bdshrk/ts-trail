// store current combat turn order (combined players and enemies)
var combat_turn_order: Character[] = []
var combat_turn: number = -1

// change selected action based on button text
var combat_selected_action: string = ""
var combat_turn_count: number = 0

// start combat with a random encounter of an appropriate level.
function startRandomCombat(): void {
    let value = calculateValue()

    // find closest combat encounter level to current value 
    let closest = -9999
    for (let key in combat_encounters) {
        let level = parseInt(key.split("_")[1])
        if (Math.abs(level - value) < Math.abs(closest - value)) {
            closest = level
        }
    }

    // get all encounters at that level and put them in candidates
    let candidates: {(): void}[] = []
    for (let encounter_key in combat_encounters) {
        let encounter = combat_encounters[encounter_key]
        let encounter_level = parseInt(encounter_key.split("_")[1])

        if (Math.abs(encounter_level - closest) <= 5) {
            candidates.push(encounter)
        }
    }

    // start combat with random candidate
    candidates[Math.floor(Math.random() * candidates.length)]()
    startCombat()
}

// calculate a "value" for the current party for use in balancing combat.
// a higher value means more party members alive, more health, more items, etc...
// higher = harder combat encounters.
function calculateValue(): number {
    let item_value: number = 0
        // 0.05 * party_inv.gold +
        // 0.1 * party_inv.food +
        // 2.0 * party_inv.medicine +
        // 1.0 * party_inv.skill_consumable
    
    let party_value: number = 0
    for (let player of players) {
        if (player.health <= 0) {
            continue
        }

        party_value +=
            1.0 * player.health
    }

    return item_value + party_value
}

// prepare for combat state and progress to combat turns
function startCombat(): void {
    combat_turn_order = getRandomCharOrder("player")
    combat_turn_order = combat_turn_order.concat(getRandomCharOrder("other"))

    combat_turn = -1
    combat_turn_count = 0

    nextCombatTurn()
}

// end combat, change ui and revert variables to default
function endCombat(): void {
    combat_turn_order = []
    others = []
    combat_turn = -1
    combat_turn_count = 0

    addLine("The enemies are defeated!", 1)
    removeOthersUI()
    
    uiState("ooc")
}

// check if combat is occurring
function isInCombat(): boolean {
    return (combat_turn != -1)
}

// check if it is the enemy's turn in combat
function combatIsOtherTurn(): boolean {
    if (players.indexOf(combat_turn_order[combat_turn]) == -1) {
        return true
    }
    return false
}

// process next combat turn
function nextCombatTurn(): void {
    // check if all one side dead...
    let players_dead = 0
    for (let player of players) {
        if (player.health <= 0) {
            players_dead += 1
        }
    }

    // end combat if all players are dead
    if (players_dead == players.length) {
        endCombat()
        return
    }

    // check if all enemies are dead
    let others_dead = 0
    for (let other of others) {
        if (other.health <= 0) {
            others_dead += 1
        }
    }

    // end combat
    if (others_dead == others.length) {
        endCombat()
        return
    }

    // process combat looping
    if (combat_turn + 1 >= combat_turn_order.length) {
        combat_turn = 0
    } else {
        combat_turn += 1
    }

    if (combat_turn == 0) {
        combat_turn_count += 1
        addLine("Turn " + combat_turn_count + ":", 1)
    }

    // if current turn character is dead
    if (combat_turn_order[combat_turn].health <= 0) {
        nextCombatTurn()
        return
    }

    // other's turn
    if (combatIsOtherTurn()) {
        addLine(combat_turn_order[combat_turn].name + " approaches the party!", 2)
        enemyCombatTurn()
    } else {
        addLine(combat_turn_order[combat_turn].name + " approaches the enemy!", 2)
    }

    // change ui state
    uiState("combat-attack")
}

// process enemy attacking
function enemyCombatTurn() {
    let self = combat_turn_order[combat_turn]
    let target: Character|null = null
    let targets: Character[] = getRandomCharOrder("player")

    // basic ai, target a random player character above 0 health.
    for (let player of targets) {
        if (player.health > 0) {
            target = player
            break
        }
    }

    // cannot attack! (failsafe)
    if (!target) {
        addLine(self.name + " has no targets to attack!", 3)
        nextCombatTurn()
        return
    }

    // perform the attack
    self.takeCombatAction("attack-0", target)
}