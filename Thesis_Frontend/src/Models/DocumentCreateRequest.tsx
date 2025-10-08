class DocumentCreateRequest {
    /**
     * SpendingCategory model
     * @class Document
     *
     * @property {string} timestamp - Document creation timestamp.
     * @property {string} name - Document name.
     * @property {string} description - Document description.
     * @property {string} imageLink - Link to the image associated with the document.
     * @property {string} imageContent - Text retrieved from the image via OCR.
     * @property {number} amountSpent - Amount of money spent.
     * @property {string} company - Company where the purchase was made.
     * @property {boolean} hasWarranty - Whether the purchased items have warranty.
     * @property {number} warrantyDuration - Duration of the warranty in months. If hasWarranty is false, the value will be equal to zero
     * @property {number} userId - ID of the user to which this document belongs to.
     * @property {number[]} spendingCategoryIds - List of spendingCategories associated with the document.
     */
    timeStamp: Date;
    name: string;
    description: string;
    imageLink: string;
    imageContent: string;
    amountSpent: number;
    company: string;
    hasWarranty: boolean;
    warrantyDuration: number;
    userId: number;
    spendingCategoryIds: number[];

    constructor(
        timeStamp: Date,
        name: string,
        description: string,
        imageLink: string,
        imageContent: string,
        amountSpent: number,
        company: string,
        hasWarranty: boolean,
        warrantyDuration: number,
        userId: number,
        spendingCategoryIds: number[],
    ) {
        this.timeStamp = timeStamp;
        this.name = name;
        this.description = description;
        this.imageLink = imageLink;
        this.imageContent = imageContent;
        this.amountSpent = amountSpent;
        this.company = company;
        this.hasWarranty = hasWarranty;
        this.warrantyDuration = warrantyDuration;
        this.userId = userId;
        this.spendingCategoryIds = spendingCategoryIds;
    }
}

export default DocumentCreateRequest;