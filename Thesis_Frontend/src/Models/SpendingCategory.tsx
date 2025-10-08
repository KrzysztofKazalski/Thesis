class SpendingCategory {
    /**
     * SpendingCategory model
     * @class SpendingCategory
     *
     * @property {string} id - SpendingCategory id
     * @property {string} name - SpendingCategory name
     * @property {string} userId - ID of the user to which the SpendingCategory belongs to
     */
    id: number;
    name: string;
    userId: number;

    constructor(id: number, name: string, userId: number,) {
        this.id = id;
        this.name = name;
        this.userId = userId;
    }
}

export default SpendingCategory;