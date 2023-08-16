// enemy class additionals
interface EnemyClass {
    inventory: CharacterInv
}

// define enemies
var enemies: {[key: string]: () => void} = {
    rat: () => {
        addCharacter("other", new Character("Rat", 2).asEnemy({
            inventory: new CharacterInv({
                gold: 5,
                wpn_claws: 1,
            })
        }))
    },
    giant_rat: () => {
        addCharacter("other", new Character("Giant Rat", 4).asEnemy({
            inventory: new CharacterInv({
                gold: 25,
                wpn_claws: 1,
            })
        }))
    },
    wizard: () => {
        addCharacter("other", new Character("Wizard", 3).asEnemy({
            inventory: new CharacterInv({
                gold: 5,
                skill_consumable: 1,
                wpn_claws: 1,
            })
        }))
    },
}

// define encounters as collection of enemies
// name format:
// "_value_commonname"
// where value is the recommended party value for that encounter
var combat_encounters: {[key: string]: () => void} = {
    _0_rat: () => {
        enemies.rat()
    },
    _10_rat: () => {
        enemies.rat()
    },
    _20_rats: () => {
        enemies.rat()
        enemies.rat()
    },
    _30_rats: () => {
        enemies.rat()
        enemies.rat()
        enemies.rat()
    },
    _30_rat_spellcaster: () => {
        enemies.wizard()
        enemies.rat()
    },
    _40_rats_king: () => {
        enemies.giant_rat()
        enemies.rat()
        enemies.rat()
    },
    _40_rat_kings: () => {
        enemies.giant_rat()
        enemies.giant_rat()
    },
    _40_rat_king_caster: () => {
        enemies.giant_rat()
        enemies.wizard()
    },
    _50_rats_king_casters: () => {
        enemies.giant_rat()
        enemies.wizard()
        enemies.wizard()
    }
}