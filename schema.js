const FIELD_MAP = {
    "Product Name": "fname",
    "Men Style Code": "mname",
    "Ladies Style Code": "lname",
    "Kids Style Code": "dob",
    "Brand": "gender",
    "Manufacturer": "nationality",
    "Product Price": "mstatus",
    "Product Features": "passport",
    "No. of Colors Available": "hobbies",
    "Product": "lknown",
    "Country of Origin": "address",
    "Department": "landmark",
    "Care Instruction": "city",
    "Net Quantity": "state",
    "Available Stock": "pincode",
    "Manufacturing Date": "mobile",
    "Item Number": "email",
    "Discount In %": "sscresult",
    "Neckline": "sscboard",
    "Sleeve Style": "sscyear",
    "Returns Days Policy": "hscresult",
    "Minimum Order Qty": "hscboard",
    "Maximum Order Qty": "hscyear",
    "Product Details": "diploma",
    "Occasion Type": "graduate",
    "Product Dimensions": "gresult",
    "Men Product Price": "gboard",
    "Ladies Product Price": "gyear",
    "Kids Product Price": "pgdegree",
    "Fabric/Materials": "pgresult",
    "No. Of Sizes Available": "pgboard",
    "Length": "pgyear",
    "Generic Name": "highedu",
    "Packers": "twexpyear",
    "Payment Mode": "twexpmonth",
    "Purchase Code": "lastemp"
};

const REQUIRED_FIELDS = Object.keys(FIELD_MAP);

function validateData(data) {

    const errors = [];

    // Check every required field exists
    for (const field of REQUIRED_FIELDS) {

        if (!(field in data)) {
            errors.push(`Missing field: ${field}`);
            continue;
        }

        if (data[field] === null) {
            errors.push(`NULL value: ${field}`);
        }

        if (typeof data[field] !== "string") {
            errors.push(`Not a string: ${field}`);
        }
    }

    // Purchase Code safety rule
    if (
        data["Purchase Code"] !== "N/A" &&
        !data["Purchase Code"]
    ) {
        errors.push("Invalid Purchase Code");
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

function convertToWebsiteFields(data) {

    const result = {};

    for (const [pdfField, websiteField] of Object.entries(FIELD_MAP)) {
        result[websiteField] = data[pdfField];
    }

    // The form contains a second "No. of Colors Available" field.
    result.totalcomp = data["No. of Colors Available"];

    return result;
}

module.exports = {
    FIELD_MAP,
    REQUIRED_FIELDS,
    validateData,
    convertToWebsiteFields
};