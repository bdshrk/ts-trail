class CharacterInv {
    public inv: {[key: string]: number} = {}

    // create an inventory using existing data
    public constructor(data : {[key: string]: number}) {
        this.inv = data
    }

    // get the amount if an item in the inventory
    public getCount(item: string): number {
        if (item in this.inv) {
            return this.inv[item]
        }
        return 0
    }

    // add or remove items from the inventory.
    // pass a inv_name to adjust print out.
    public modifyInv(item: string, change: number, inv_name: string) {
        // if an unacquirable item
        if (!items[item].party_can_acquire) {
            return
        }
    
        let quantity = change
        let lost = 0
    
        // calc changed
        if (!(item in this.inv)) {
            this.inv[item] = change
        } else {
            lost = this.inv[item]
            this.inv[item] += change
        }
    
        if (this.inv[item] <= 0) {
            delete this.inv[item]
            quantity = lost
        }
    
        // print relevant text
        if (change > 0) {
            addLine(inv_name + " gained " + quantity.toString() + " x " + items[item].getName() + "!", 1)
        } else {
            addLine(inv_name + " lost " + Math.abs(quantity).toString() + " x " + items[item].getName() + "!", 1)
        }
    }
}