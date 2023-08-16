type EquipSlot = 
    "main" | "off" | "head" | "body" | "legs"

type InventoryItem =
    (Item | ItemUsable | Weapon | Armour)

type EquipableItem =
    Weapon | Armour

type EquipSlotArray = EquipSlot[]

class Equipment {
    // starting equipment is set to default
    main: EquipableItem = EQUIPMENT_DEFAULT["main"]
    off: EquipableItem = EQUIPMENT_DEFAULT["off"]
    head: EquipableItem = EQUIPMENT_DEFAULT["head"]
    body: EquipableItem = EQUIPMENT_DEFAULT["body"]
    legs: EquipableItem = EQUIPMENT_DEFAULT["legs"]

    // try to equip an item to a slot.
    // return whether it was successfully equipped.
    // also used for unequipping when item is null
    public tryEquip(slots: EquipSlotArray, item: InventoryItem | null): boolean {
        // if item cannot be equipped...
        if (!((item instanceof Weapon) || (item instanceof Armour))) {
            return false
        }

        // first unequip items (set to default)
        // this two-for loop is needed to make sure to reset twohanded second hand if 
        // equipping one handed item
        let current_slot_items: Equippable[] = []
        for (let slot of slots) {
            if (this[slot] == EQUIPMENT_DEFAULT[slot]) {
                continue
            }
            current_slot_items.push(this[slot])
        }

        for (let current_slot_item of current_slot_items) {
            for (let slot of current_slot_item.slot) {
                this[slot] = EQUIPMENT_DEFAULT[slot]
            }
        }
        
        // if just unequipping, exit here
        if (item == null) {
            return true
        }

        // then equip item in appropriate slots (for 2h weapon)
        for (let slot of slots) {
            this[slot] = item
        }

        return true
    }

    // automatically equip items in inventory.
    public equipAuto(inventory: CharacterInv) {
        for (let _item of Object.keys(inventory.inv)) {
            let obj = items[_item]
            if (obj instanceof Equippable) {
                this.tryEquip(obj.slot, obj)
            }
        }
    }

    // get all unique equipped items
    // if an item is equipped in multiple slots, it will only return once.
    public getUniqueEquippedItems() {
        let items = []
        let slots: EquipSlotArray = ["main", "off", "head", "body", "legs"]
        for (let slot of slots) {
            if (this[slot] != EQUIPMENT_DEFAULT[slot]) {
                if (items.indexOf(this[slot]) == -1) {
                    items.push(this[slot])
                }
            }
        }

        return items
    }

    // get the given slot
    public getItemInSlot(slot: EquipSlot): EquipableItem {
        return this[slot] as EquipableItem
    }

    // check if a given item is equipped
    public isItemEquipped(item: string): boolean {
        let slots = (items[item] as Equippable).slot

        for (let slot of slots) {
            if (this[slot] == items[item]) {
                return true
            }
        }
        return false
    }
}

class Item {
    // default item info
    id: string = "unknown"
    name: string = "Unknown Item"
    desc: string = "This is an unknown item!"
    style: string = "text_regular"
    party_can_acquire: boolean = true

    // create a new item from given data
    public constructor(data: {[key: string]: any}) {
        this.id = data.id
        this.name = data.name
        this.desc = data.desc
        if ("party_can_acquire" in data) this.party_can_acquire = data.party_can_acquire
        if ("style" in data) this.style = data.style
    }

    // get the item name with appropriate style.
    public getName(): string {
        let span = document.createElement("span")

        span.innerHTML = this.name
        span.classList.add("style_" + this.style)

        return span.outerHTML
    }
}

// an itemusable is an item that has a "use" function
class ItemUsable extends Item {
    use: (() => void) = () => {}

    public constructor(data: {[key: string]: any}) {
        super(data)
        if ("use" in data) this.use = data.use
    }
}

// an equippable is an ItemUsable that can be equipped by a character
class Equippable extends ItemUsable {
    slot: EquipSlotArray = ["body"]
    equipped: number = 0

    // default use method will equip the item
    use: () => void = () => {
        addLine("Who should equip the " + this.name + "?", 1)
        showTargetUI("player", true, (char: Character) => {
            char.equip(this.id)
            modifyPartyInv(this.id, -1)
            drawInv()
            if (isInCombat()) {
                uiState("combat-attack")
            } else {
                uiState("ooc")
            }
        })
        uiState("targets")
    }

    public constructor(data: {[key: string]: any}) {
        super(data)
        this.slot = data.slot
        if ("equipped" in data) this.equipped = data.equipped
    }
}

// a weapon is an equippable that has a damage number.
class Weapon extends Equippable {
    damage: number = 0
    strings_attack: string[] = []

    public constructor(data: {[key: string]: any}) {
        super(data)
        this.damage = data.damage
        this.strings_attack = data.strings_attack
    }
}

// an armour is an equippable that has a rating.
class Armour extends Equippable {
    rating: number = 0

    public constructor(data: {[key: string]: any}) {
        super(data)
        this.rating = data.rating
    }
}

// define items
const ITEMS_ARRAY: InventoryItem[] = [
    new Item({
        id: "gold",
        name: "Gold",
        desc: "Default item description",
        style: "gold",
    }),
    new Item({
        id: "food",
        name: "Rations",
        desc: "Some rations. Each party member eats 1 food per turn.",
        style: "food",
    }),
    new ItemUsable({
        id: "medicine",
        name: "Medicine",
        desc: "Medicine that restores a party member's health by 2 points.",
        style: "medicine",
        use: () => {
            addLine("Who should the medicine be used on?", 2)
            showTargetUI("player", true, (char: Character) => {
                char.heal(3)
                modifyPartyInv("medicine", -1)
                returnToPrevState()
            })
            uiState("targets")
        },
    }),
    new Item({
        id: "skill_consumable",
        name: "Catalyst",
        desc: "A catalyst used for performing special attacks.",
        style: "consumable",
    }),
    new Weapon({
        id: "wpn_sword",
        name: "Sword",
        desc: "A one-handed sword.",
        slot: ["main"],
        damage: 2,
        strings_attack: [
            "{0} stabs {1}, dealing {dmg} damage!",
            "{0} slices {1}, dealing {dmg} damage!",
            "{0} strikes {1}, dealing {dmg} damage!",
            "{0} cuts {1}, dealing {dmg} damage!",
        ],
        style: "iron",
    }),
    new Weapon({
        id: "wpn_2h_sword",
        name: "Greatsword",
        desc: "A two-handed sword.",
        slot: ["main", "off"],
        damage: 4,
        strings_attack: [
            "{0} swings the greatsword at {1}, dealing {dmg} damage!",
        ],
        style: "iron",
    }),
    new Weapon({
        id: "wpn_fists",
        name: "Fists",
        desc: "The character is unarmed.",
        party_can_acquire: false,
        slot: ["main", "off"],
        damage: 1,
        strings_attack: [
            "{0} beats {1} with their fists, dealing {dmg} damage!",
        ],
    }),
    new Weapon({
        id: "wpn_claws",
        name: "Claws",
        desc: "Default item description",
        party_can_acquire: false,
        slot: ["main", "off"],
        damage: 1,
        strings_attack: [
            "{0} scratches {1} with their claws, dealing {dmg} damage!",
        ],
    }),
    new Armour({
        id: "amr_nothing",
        name: "Nothing",
        desc: "Nothing.",
        party_can_acquire: false,
        slot: ["body", "head", "legs"],
        rating: 0,
    }),
    new Armour({
        id: "amr_head_leather",
        name: "Leather Cap",
        desc: "Default item description",
        slot: ["head"],
        rating: 1,
        style: "leather",
    }),
    new Armour({
        id: "amr_body_leather",
        name: "Leather Vest",
        desc: "Default item description",
        slot: ["body"],
        rating: 1,
        style: "leather",
    }),
    new Armour({
        id: "amr_legs_leather",
        name: "Leather Leggings",
        desc: "Default item description",
        slot: ["legs"],
        rating: 1,
        style: "leather",
    }),
    new Armour({
        id: "off_shield_basic",
        name: "Wooden Shield",
        desc: "Default item description",
        slot: ["off"],
        rating: 1,
        style: "wood",
    }),
    new Armour({
        id: "off_shield_2",
        name: "Shield 2",
        desc: "Default item description",
        slot: ["off"],
        rating: 3,
        style: "offwhite_yellow",
    }),
    new Weapon({
        id: "wpn_knuckles",
        name: "Knuckles",
        desc: "Default item description",
        slot: ["main"],
        damage: 2,
        strings_attack: [
            "{0} punches {1}, dealing {dmg} damage!",
        ],
        style: "brown_metal",
    }),
    new Weapon({
        id: "wpn_sword_2",
        name: "Sword 2",
        desc: "Default item description",
        slot: ["main"],
        damage: 4,
        strings_attack: [
            "{0} strikes {1}, dealing {dmg} damage!",
        ],
        style: "legendary_red",
    }),
]

// populate item array
var items: {[key: string]: InventoryItem} = {}
for (let item of ITEMS_ARRAY) {
    items[item.id] = item
}

// store default equipment for when equipment is removed.
// i.e., when a weapon is unequiped, it should be replaced with "wpn_fists".
const EQUIPMENT_DEFAULT: {[key: string]: (Weapon | Armour)} = {
    "main": items.wpn_fists as Weapon,
    "off": items.wpn_fists as Weapon,
    "head": items.amr_nothing as Armour,
    "body": items.amr_nothing as Armour,
    "legs": items.amr_nothing as Armour,
}

// store party inventory 
// populated with starting items.
var party_inv: CharacterInv = new CharacterInv({
    gold: 25,
    food: 48,
    medicine: 4,
    wpn_sword: 2,
    wpn_2h_sword: 2,
    off_shield_basic: 2,
})

// add an item to the party shared inventory.
function modifyPartyInv(item: string, change: number): void {
    party_inv.modifyInv(item, change, "The party")

    drawInv()
}

// get an item as a html element for ui display.
// optional character if used to display on character ui rather than party inv.
function drawItem(inv: CharacterInv, item: InventoryItem, char?: Character): HTMLElement | null {
    // if no item, return null
    let quantity = inv.getCount(item.id)
    if (quantity == 0) {
        return null
    }

    // if character, check if equipped
    let equipped = false
    if (char) {
        equipped = char.equipment.isItemEquipped(item.id)
    }

    // calculate text string for the tooltip
    let tt_text = item.getName() + "<br>" + item.desc + "<br>"
    if (item instanceof Equippable) {
        if (char) {
            tt_text += "Carried by " + char.name + "<br>"
        }
        if (equipped && char) {
            tt_text += "Equipped by " + char.name + "<br>"
        }
        if (item instanceof Weapon) {
            tt_text += "Damage: " + item.damage + "<br>"
        }
        if (item instanceof Armour) {
            tt_text += "Rating: " + item.rating + "<br>"
        }
        tt_text += "Equip regions:<ul>"
        for (let slot of item.slot) {
            tt_text += "<li>" + slot + "</li>"
        }
        tt_text += "</ul>"
    }

    // create a li element using the item name
    let li = document.createElement("li")
    li.innerHTML = quantity + " x " + item.getName()
    if (equipped) {
        li.innerHTML += " (Equipped)"
    }

    // attach tooltip mouse enter and exit
    li.addEventListener("mouseenter", () => {
        ttText(tt_text)
    })
    li.addEventListener("mouseleave", () => {
        ttText("")
    })

    // display use or equip button in party inventory
    if (item instanceof ItemUsable && !equipped) {
        let use_btn = document.createElement("span")
        if (item instanceof ItemUsable) use_btn.innerHTML = "Use"
        if (item instanceof Equippable) use_btn.innerHTML = "Equip"
        li.innerHTML += " - "
        use_btn.classList.add("inv-use")

        // handle clicking button
        use_btn.addEventListener("mousedown", () => {
            if (item instanceof ItemUsable) item.use()
        })

        li.appendChild(use_btn)
    }

    // return the element
    return li
}

// draw all inventories
function drawInv(): void {
    let area = document.getElementById("inv")

    // first, reset to blank
    area!.innerHTML = ""

    // party inventory
    for (let x in party_inv.inv) {
        let item: InventoryItem = items[x]
        let elem = drawItem(party_inv, item)
        if (elem) area!.appendChild(elem)
    }

    // equipped item inventories.
    for (let char of players) {
        for (let x in char.inventory.inv) {
            let item: InventoryItem = items[x]
            let elem = drawItem(char.inventory, item, char)
            if (elem) area!.appendChild(elem)
        }
    }
}

// debug, give all items
function debugAllItems() {
    for (let item in items) {
        modifyPartyInv(item, 1)
    }
}