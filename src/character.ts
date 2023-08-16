// store current players and others (enemies)
var players: Character[] = []
var others: Character[] = []

class Character {
    // TODO: getters and setters
    public name: string
    public health: number
    public max_health: number
    public effects: Effect[]
    public inventory: CharacterInv
    public equipment: Equipment

    // create a character
    public constructor(name: string, health: number) {
        this.name = name
        this.max_health = health
        this.health = this.max_health
        this.effects = []
        this.inventory = new CharacterInv({})
        this.equipment = new Equipment
    }

    // hurt a character by "damage"
    // also handles death and ui redrawing showing new health
    public hurt(damage: number): void {
        this.health = Math.max(this.health - damage, 0)
        if (this.health == 0) {
            this.onDeath()
            return
        }

        this.drawUI()
    }

    // get the character type and index in appropriate list.
    public getTypeAndIndex(): [string, number] {
        let type = "player"
        let index = players.indexOf(this)
        if (others.indexOf(this) != -1) {
            type = "other"
            index = others.indexOf(this)
        }
        return [type, index]
    }

    // remove all associate ui relating to this character
    public eraseUI(): number {
        let [type, index] = this.getTypeAndIndex()
        let child_index = 9999
        let test_elem = document.getElementById(type + "-" + index)
        if (test_elem) {
            let parent_elem = test_elem.parentNode
            child_index = Array.prototype.indexOf.call(parent_elem!.children, test_elem)
            test_elem.remove()
        }

        return child_index
    }

    // draw this characters ui info
    public drawUI(): void {
        let [type, index] = this.getTypeAndIndex()

        // remove prev ui and save index
        let child_index = this.eraseUI()
    
        let area = (type == "player") ? document.getElementById("player-area") : document.getElementById("other-area")

        // create div container
        let div = document.createElement("div")
        div.id = type + "-" + index
        div.classList.add("character")
        
        // if dead, reflect in ui
        if (this.health <= 0) {
            div.classList.add("char-dead")
        }
    
        // add name
        let p_name = document.createElement("p")
        let span_name = document.createElement("span")
        span_name.classList.add("char-name")
        span_name.innerHTML = this.name
    
        // add health
        let span_health = document.createElement("span")
        span_health.classList.add("char-health")
        span_health.innerHTML = "(" + this.health + " / " + this.max_health + ")"
    
        // calculate colour based on health percentage left
        let health_percent = this.health / this.max_health
        if (health_percent >= 0.666) {
            span_health.classList.add("char-health-high")
        } else if (health_percent >= 0.333) {
            span_health.classList.add("char-health-mid")
        } else {
            span_health.classList.add("char-health-low")
        }
    
        // add effects
        let span_effects = document.createElement("span")
        span_effects.classList.add("char-effects")

        let effectNames = this.effects.map(effect => effect.name)
        let effectsString = "(" + effectNames.join(", ") + ")"
        span_effects.innerHTML = effectsString
    
        // combine elems
        p_name.appendChild(span_name)
        p_name.appendChild(span_health)
        if (Object.keys(this.effects).length != 0) {
            p_name.appendChild(span_effects)
        }

        // tooltip text
        let tt_text = `${this.name}<br>
            Health: ${this.health} / ${this.max_health}<br>
            Effects: ${this.effects.length !== 0 ?
                '<ul>' + this.effects.map(effect => `<li>${effect.name}</li>`).join('') + '</ul>' :
                'None<br>'}`

        // tooltip equipment readout
        tt_text += `Equipped: <ul>
            <li>Main: ${this.equipment.getItemInSlot("main").getName()}</li>
            <li>Offhand: ${this.equipment.getItemInSlot("off").getName()}</li>
            <li>Head: ${this.equipment.getItemInSlot("head").getName()}</li>
            <li>Body: ${this.equipment.getItemInSlot("body").getName()}</li>
            <li>Legs: ${this.equipment.getItemInSlot("legs").getName()}</li>
            </ul>`
        
        // mouse over tool tip
        p_name.addEventListener("mouseenter", () => {
            ttText(tt_text)
        })
        p_name.addEventListener("mouseleave", () => {
            ttText("")
        })
    
        div.appendChild(p_name)
    
        // insert at correct location
        area!.insertBefore(div, area!.children[child_index])
    }

    // add a list of effects (as strings) to the character
    public addEffects(effects_string: string[]): void {
        // turn string to effect objects
        let effects = lookupEffects(effects_string)

        for (let effect of effects) {
            if (!(this.effects.indexOf(effect) != -1)) {
                this.effects.push(effect)
                // apply effect
                effect.start(this)
            }
        }
    
        this.drawUI()
    }

    // remove a list of effects
    public removeEffects(effects_string: string[]): void {
        // turn string to effect objects
        let effects = lookupEffects(effects_string)

        for (let effect of effects) {
            if (this.effects.indexOf(effect) != -1) {
                // end effect condition
                effect.end(this)
                this.effects.splice(this.effects.indexOf(effect), 1)
            }
        }
    
        this.drawUI()
    }

    // this character takes a combat action on a target
    public takeCombatAction(action: string, target: Character): void {
        // check action type
        if (action.startsWith("attack")) {
            // get weapon
            let weapon = this.equipment.getItemInSlot("main") as Weapon
    
            // get damage and text
            let damage: number = weapon.damage
            let damage_text: string =
                weapon.strings_attack[Math.floor(Math.random() * weapon.strings_attack.length)]
            
            // format text
            damage_text = formatText(damage_text, {
                characters: {
                    0: this,
                    1: target,
                },
                damage: damage
            })

            addLine(damage_text, 3)
            
            // target takes damage
            target.hurt(damage)
    
        } else if (action == "defend") {
            addLine(this.name + " defends from incoming damage!", 3)
            // TODO: defending
        }
    
        // progress to next turn
        nextCombatTurn()
    }

    // heal the character by some amount
    public heal(amount: number): void {
        let cap_amount: number = this.max_health - this.health
        let actual: number = Math.min(amount, cap_amount)

        this.health += actual
        this.drawUI()
        addLine(this.name + " was healed for " + actual.toString() + " points!", 2)
    }

    // when this character is an enemy, handle autoequipping best items in inventory.
    public asEnemy(obj: EnemyClass): Character {
        this.inventory = obj.inventory
        this.equipment.equipAuto(this.inventory)
        return this
    }

    // called when the character has died!
    public onDeath(): void {
        addLine(this.name + " is dead!", 2)

        // if there are objects in inventory...
        if (Object.keys(this.inventory.inv).length != 0) {
            for (let key in this.inventory.inv) {
                // ...add them back to party inventory
                let quantity = this.inventory.getCount(key)
                modifyPartyInv(key, quantity)
            }

            // redraw party inv
            drawInv()
        }

        this.drawUI()
    }

    // equip an item from party inv to character inv
    public equip(item_name: string): void {
        // transfer item from inventory to equipment
        this.inventory.modifyInv(item_name, 1, this.name)
        this.equipment.equipAuto(this.inventory)

        // get currently equipped items
        let used_items = this.equipment.getUniqueEquippedItems()
        let names: string[] = []
        for (let item of used_items) {
            names.push(item.id)
        }

        // remove items from equipped and put them back in inventory.
        // items are only removed if they were replaced by what was equipped.
        for (let key in this.inventory.inv) {
            let amt_to_remove = Math.max(this.inventory.getCount(key) - 1, 0)
            if (names.indexOf(key) != -1) {
                if (amt_to_remove != 0) {
                    this.inventory.modifyInv(key, -amt_to_remove, this.name)
                    modifyPartyInv(key, amt_to_remove)
                }
                continue
            }
            let count = this.inventory.getCount(key)
            this.inventory.modifyInv(key, -count, this.name)
            modifyPartyInv(key, count)
        }

        this.drawUI()
    }
}

// get all character of type that are alive
function getAlive(type: string): Character[] {
    let alive: Character[] = []
    let array: Character[] = (type == "player") ? players : others

    for (let char of array) {
        if (char.health > 0) {
            alive.push(char)
        }
    }

    return alive
}

// handle consuming ration (automatic)
function handleConsume(): void {
    // only alive characters will eat...
    let alive_party: Character[] = getAlive("player")

    // if enough food for everyone..
    if (party_inv.getCount("food") >= alive_party.length) {
        modifyPartyInv("food", -alive_party.length)
        // addLine("All of the party eat.", 1)
        for (let player of alive_party) {
            player.removeEffects(["hunger", "starving"])
        }

    // if not enough food, but there is some
    } else if (party_inv.getCount("food") > 0) {
        for (let player of alive_party) {
            // each character will eat one-by-one until no food left!
            if (party_inv.getCount("food") != 0) {
                modifyPartyInv("food", -1)
                player.removeEffects(["hunger", "starving"])
                addLine(player.name + " eats.", 1)
            } else {
                if (player.effects.indexOf(lookupEffects(["starving"])[0]) != -1) {
                    // remove appropriate hunger effect and add progress hunger to starving
                } else if (player.effects.indexOf(lookupEffects(["hunger"])[0]) != -1) {
                    player.removeEffects(["hunger"])
                    player.addEffects(["starving"])
                } else {
                    player.addEffects(["hunger"])
                }
                addLine(player.name + " did not eat. (not enough food)", 1)
            }
        }
    // not food at all!
    } else {
        for (let player of alive_party) {
            if (player.effects.indexOf(lookupEffects(["starving"])[0]) != -1) {
                // remove appropriate hunger effect and add progress hunger to starving
            } else if (player.effects.indexOf(lookupEffects(["hunger"])[0]) != -1) {
                player.removeEffects(["hunger"])
                player.addEffects(["starving"])
            } else {
                player.addEffects(["hunger"])
            }
        }
        addLine("None of the party eat. (not enough food)", 1)
    }
}

// remove others ui if no longer needed (all dead)
function removeOthersUI(): void {
    let area = document.getElementById("other-area")
    area!.innerHTML = ""
}

// add a new character to the game of type "type"
// either player or other.
function addCharacter(type: string, char: Character) {
    // debug when char name is just "a"
    if (char.name == "a" && type == "player") {
        debugAddPlayers()
        return
    }

    if (type == "player") {
        players.push(char)
    } else {
        others.push(char)
    }

    // draw character ui
    char.drawUI()
}

// get a random order of character of type.
function getRandomCharOrder(type: string): Character[] {
    let chars: Character[] = []
    let array: Character[] = (type == "player") ? players : others

    for (let char of array) {
        chars.push(char)
    }

    // random sort
    chars.sort(function (a, b) {
        return Math.random() - 0.5
    })

    return chars
}

// debug, quick add players for testing
function debugAddPlayers() {
    addCharacter("player", new Character("Alice", 6))
    addCharacter("player", new Character("Bob", 6))
    addCharacter("player", new Character("Charlie", 6))
    addCharacter("player", new Character("Dylan", 6))
    uiState("ooc")
}

// convert type and index to a character object
function typeAndIndexToCharacter(type: string, index: number): Character {
    let array: Character[] = players
    if (type == "other") {
        array = others
    }

    return array[index]
}

// show possible targets for an attack or action (use healing, equip item, etc...)
// takes a callback on click function when a target is selected
function showTargetUI(type: string, alive_only: boolean, func: (char : Character) => void): void {
    let area = document.getElementById("btn-area-targets")
    let array: Character[] = (type == "player") ? players : others

    // clear prev
    area!.innerHTML = ""

    // create a back button
    let back = document.createElement("p")
    back.innerHTML = "Back"
    back.addEventListener("mousedown", () => {
        if (isInCombat()) {
            uiState("combat-attack")
        } else {
            uiState("ooc")
        }
    })
    area!.appendChild(back)

    // find valid targets
    for (let x in array) {
        let char: Character = array[x]

        if (alive_only) {
            if (char.health <= 0) {
                continue
            }
        }

        let p = document.createElement("p")
        p.innerText = char.name + " (" + char.health + " / " + char.max_health + ")"

        // call func on click
        p.addEventListener("mousedown", () => {
            func(char)
        })

        area!.appendChild(p)
    }
}