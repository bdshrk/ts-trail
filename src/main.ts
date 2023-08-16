// tooltip position offset when mouseover in px
const TT_OFFSET: [number, number] = [8, 8]

var turn_count: number = 0

// lookup for text formatting
interface LookUp {
    characters?: {[key: number]: Character},
    damage?: number,
}

// format a text string and replace templates with actual.
// {0}, {1}, etc will be characters of index 0, 1 in LookUp.
// {dmg} with be the current damage in the LookUp object.
function formatText(text: string, look_up: LookUp): string {
    if (look_up.characters) {
        for (let x in look_up.characters) {
            let character = look_up.characters[x]
            let reg = new RegExp("\\{" + x + "}", "g")
            text = text.replace(reg, character.name)
        }
    }
    if (look_up.damage) {
        text = text.replace(new RegExp("\\{dmg}", "g"), look_up.damage.toString())
    }

    return text
}

// print a line to the text area
function addLine(line: string, indent_level: number): void {
    let area = document.getElementById("text-area")
    let p = document.createElement("p")
    p!.innerHTML = "&emsp;".repeat(indent_level) + line
    p!.classList.add("line-" + indent_level)
    p!.classList.add("line")

    area!.appendChild(p)
    area!.scrollTop = area!.scrollHeight
}

// handle next turn logic
function nextTurn() {
    turn_count += 1
    addLine("--- Day " + turn_count + " ---", 0)
    handleEvents()
    handleConsume()
    handleEffects()

    drawInv()
}

// move back to different UI state
function returnToPrevState() {
    if (isInCombat()) {
        uiState("combat-attack")
    } else {
        uiState("ooc")
    }
}

// change which ui buttons are shown base on state
function uiState(state: string): void {
    // ensure all elems exist...
    const areas: {[key: string]: HTMLElement | null} = {
        area_targets: document.getElementById("btn-area-targets"),
        area_player: document.getElementById("add-player-area"),
        area_combat: document.getElementById("btn-area-c"),
        area_ooc: document.getElementById("btn-area-ooc"),
        area_other: document.getElementById("other-area")
    }

    for (const area in areas) {
        if (!areas[area]) {
            return
        }
    }

    // hide all by default
    let hiddenClass = "btn-area-hidden"
    for (const area in areas) {
        if (areas[area]) {
            areas[area]!.classList.add(hiddenClass)
        }
    }

    // unhide relative to current state
    switch (state) {
        case "combat-attack":
            areas.area_combat!.classList.remove(hiddenClass)
            areas.area_other!.classList.remove(hiddenClass)
            break
        case "targets":
            areas.area_targets!.classList.remove(hiddenClass)
            areas.area_other!.classList.remove(hiddenClass)
            break
        case "ooc":
            areas.area_ooc!.classList.remove(hiddenClass)
            break
        case "create-character":
            areas.area_player!.classList.remove(hiddenClass)
            break
    }
}

// set the tooltip text to the text given
function ttText(text: string): void {
    let tt_text = document.getElementById("tt-text")
    tt_text!.innerHTML = text
    ttQuery(null) // call to display tooltip without updating position
}

// update tooltip position and handle visibility
// if event is null, the position is not updated but visibility checks are made.
function ttQuery(event: MouseEvent|null): void {
    let tt = document.getElementById("tt")
    let tt_text = document.getElementById("tt-text")

    // hide if text is empty
    if (tt_text!.innerHTML == "") {
        tt!.classList.add("tt-hidden")
        return
    } else {
        tt!.classList.remove("tt-hidden")
    }

    // update position based on mouse event pos
    if (event != null) {
        tt!.style.top = (event.clientY - tt!.clientHeight - TT_OFFSET[0]).toString() + "px"
        tt!.style.left = (event.clientX + TT_OFFSET[1]).toString() + "px"
    }
}

// inital game setup function
function setUp(): void {
    // get elems
    let next_turn = document.getElementById("next-turn")
    let attack_0 = document.getElementById("attack-0")
    let attack_1 = document.getElementById("attack-1")
    let defend = document.getElementById("defend")
    let add_player = <HTMLInputElement|null>document.getElementById("add-player-text")

    // next turn btn
    next_turn!.addEventListener("mousedown", () => {
        nextTurn()
    })

    // attack 0, weak attack handling
    attack_0!.addEventListener("mousedown", () => {
        combat_selected_action = "attack-0"
        showTargetUI("other", true, (char : Character) => {
            combat_turn_order[combat_turn].takeCombatAction(combat_selected_action, char)
        })
        uiState("targets")
    })

    // TODO: defend handling
    defend!.addEventListener("mousedown", () => {
        combat_selected_action = "defend"
        // combatAction(combat_selected_action)
    })

    // handle adding player characters at page load
    add_player!.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            addCharacter("player", new Character(add_player!.value, 6))
            add_player!.value = ""
    
            // limit of 4 player characters
            if (players.length >= 4) {
                uiState("ooc")
                nextTurn()
            }
        }
    })

    // move tooltip of mouse movement
    document.addEventListener("mousemove", (event: MouseEvent) => {
        ttQuery(event)
    })

    // begin by loading character creation ui...
    uiState("create-character")
}